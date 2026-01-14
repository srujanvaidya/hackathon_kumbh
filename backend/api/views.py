from rest_framework.decorators import api_view, authentication_classes, permission_classes
from decimal import Decimal, InvalidOperation
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from .models import NFCUser, Transaction, Seller
from .serializers import NFCUserSerializer, TransactionSerializer, SellerSerializer
from django.db.models import Sum
from datetime import datetime
from django.utils import timezone
from .web3_utils import Web3Manager, OWNER_ADDRESS

@api_view(['GET'])
def get_stats(request):
    users = NFCUser.objects.all()
    total_users = users.count()
    total_balance = users.aggregate(Sum('balance'))['balance__sum'] or 0
    active_bands = users.filter(is_blocked=False).count()
    blocked_bands = users.filter(is_blocked=True).count()
    
    today = timezone.now().date()
    today_transactions = Transaction.objects.filter(timestamp__date=today)
    today_txns_count = today_transactions.count()
    today_volume = today_transactions.aggregate(Sum('amount'))['amount__sum'] or 0

    return Response({
        'totalUsers': total_users,
        'totalBalance': total_balance,
        'activeBands': active_bands,
        'blockedBands': blocked_bands,
        'todayTransactions': today_txns_count,
        'todayVolume': today_volume,
    })

@api_view(['GET'])
def get_users(request):
    users = NFCUser.objects.all().order_by('-created_at')
    serializer = NFCUserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_user(request, band_id):
    try:
        user = NFCUser.objects.get(band_id__iexact=band_id)
        serializer = NFCUserSerializer(user)
        return Response(serializer.data)
    except NFCUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def create_user(request):
    try:
        # Generate Wallet
        web3_manager = Web3Manager()
        wallet_address, private_key = web3_manager.create_wallet()
        
        data = request.data.copy()
        data['wallet_address'] = wallet_address
        data['private_key'] = private_key
        
        serializer = NFCUserSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def register_seller(request):
    try:
        # Generate Wallet
        web3_manager = Web3Manager()
        wallet_address, private_key = web3_manager.create_wallet()
        
        data = request.data.copy()
        data['wallet_address'] = wallet_address
        data['private_key'] = private_key
        
        serializer = SellerSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def seller_login(request):
    phone = request.data.get('phone')
    pin = request.data.get('pin')
    try:
        seller = Seller.objects.get(phone=phone)
        if seller.pin == pin:
            serializer = SellerSerializer(seller)
            return Response(serializer.data)
        return Response({'error': 'Invalid PIN'}, status=status.HTTP_401_UNAUTHORIZED)
    except Seller.DoesNotExist:
        return Response({'error': 'Seller not found'}, status=status.HTTP_404_NOT_FOUND)

@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def fund_band(request):
    band_id = request.data.get('bandId')
    amount = request.data.get('amount')
    try:
        user = NFCUser.objects.get(band_id__iexact=band_id)
        amount_decimal = Decimal(str(amount)).quantize(Decimal('0.01'))
        if amount_decimal <= 0:
             return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Blockchain Interaction
        web3_manager = Web3Manager()
        
        # Lazy generation of wallet for legacy users
        if not user.wallet_address:
            wallet_address, private_key = web3_manager.create_wallet()
            user.wallet_address = wallet_address
            user.private_key = private_key
            user.save()

        # Check and Fund Gas (MATIC) if needed
        # Need gas to make payments later
        matic_balance = web3_manager.get_matic_balance(user.wallet_address)
        if matic_balance < 0.05:
            print("Low MATIC balance. Sending gas...")
            gas_tx_hash = web3_manager.send_matic(user.wallet_address, 0.1)
            if gas_tx_hash:
                web3_manager.wait_for_receipt(gas_tx_hash)

        tx_hash = web3_manager.mint_token(user.wallet_address, float(amount_decimal))
        
        if not tx_hash:
             return Response({'error': 'Blockchain transaction failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        user.balance = (user.balance + amount_decimal).quantize(Decimal('0.01'))
        user.save()
        
        Transaction.objects.create(
            user=user,
            amount=amount_decimal,
            transaction_type='CREDIT',
            description='Top-up via Mint',
            tx_hash=tx_hash
        )
        
        return Response({'message': 'Fund added successfully', 'current_balance': user.balance, 'tx_hash': tx_hash})
    except NFCUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except (ValueError, TypeError, InvalidOperation):
         return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def block_band(request):
    band_id = request.data.get('bandId')
    try:
        user = NFCUser.objects.get(band_id__iexact=band_id)
        user.is_blocked = not user.is_blocked
        user.save()
        status_msg = "blocked" if user.is_blocked else "unblocked"
        return Response({'message': f'Band {status_msg} successfully', 'isBlocked': user.is_blocked})
    except NFCUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def process_payment(request):
    band_id = request.data.get('bandId')
    amount = request.data.get('amount')
    pin = request.data.get('pin')
    description = request.data.get('description', 'Payment')
    # Seller info is context in a real app, assuming default seller or passed in request
    # For now transferring to Owner or a specific seller address needs Seller resolution
    # Let's assume the request sends sellerId or we use a fixed address for demo,
    # OR better, if logged in seller context is available.
    # PROTOTYPE: Transfer to OWNER_ADDRESS for now if Seller not resolved, OR use the logged in Seller logic.
    # Since this is "Seller Terminal", we should theoretically know the seller.
    # But for now, let's just use the user's balance update logic + Blockchain transfer to Owner as placeholder if seller not sent.
    
    # Actually, let's look for a seller phone/pin in headers or just use a default/random seller for the blockchain transfer 
    # if it's not authenticated. But let's assume we want to transfer to a specific target.
    # For simplicity in this step, I will transfer to the Owner Address as a placeholder for the "Store Wallet" unless provided.
    
    target_address = OWNER_ADDRESS # Default fallback
    
    seller_id = request.data.get('sellerId')
    if seller_id:
        try:
            seller = Seller.objects.get(id=seller_id)
            if seller.wallet_address:
                target_address = seller.wallet_address
        except Seller.DoesNotExist:
            pass # Fallback to owner

    try:
        user = NFCUser.objects.get(band_id__iexact=band_id)
        amount_decimal = Decimal(str(amount)).quantize(Decimal('0.01'))
        
        if user.is_blocked:
            return Response({'error': 'Band is blocked'}, status=status.HTTP_403_FORBIDDEN)

        if str(user.pin) != str(pin):
            return Response({'error': 'Invalid User PIN'}, status=status.HTTP_401_UNAUTHORIZED)
            
        if user.balance < amount_decimal:
            return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)

        # Blockchain Interaction
        web3_manager = Web3Manager()
        
        # Lazy generation of wallet for legacy users
        if not user.private_key or not user.wallet_address:
             wallet_address, private_key = web3_manager.create_wallet()
             user.wallet_address = wallet_address
             user.private_key = private_key
             user.save()

        # Check and Fund Gas (MATIC) if needed (Self-healing for payments)
        matic_balance = web3_manager.get_matic_balance(user.wallet_address)
        if matic_balance < 0.05:
            print(f"Payment: Low MATIC ({matic_balance}). Sending gas...")
            gas_tx_hash = web3_manager.send_matic(user.wallet_address, 0.1)
            if gas_tx_hash:
                web3_manager.wait_for_receipt(gas_tx_hash)
             
        tx_hash = web3_manager.transfer_token(user.private_key, target_address, float(amount_decimal))
        
        if not tx_hash:
             return Response({'error': 'Blockchain transaction failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        user.balance = (user.balance - amount_decimal).quantize(Decimal('0.01'))
        user.save()
        
        Transaction.objects.create(
            user=user,
            amount=amount_decimal,
            transaction_type='DEBIT',
            description=description,
            tx_hash=tx_hash
        )
        
        return Response({'message': 'Payment processed', 'current_balance': user.balance, 'tx_hash': tx_hash})
    except NFCUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except (ValueError, TypeError, InvalidOperation):
         return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

from .models import ScannedBand
import time
import json
from django.http import StreamingHttpResponse

@csrf_exempt
@api_view(['GET', 'POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def scan_handler(request):
    if request.method == 'POST':
        # Handle receiving scan from ESP32
        band_id = request.data.get('bandId')
        if not band_id:
            return Response({'error': 'Band ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        ScannedBand.objects.create(band_id=band_id)
        return Response({'message': 'Scan received'}, status=status.HTTP_201_CREATED)

    elif request.method == 'GET':
        # Handle streaming scan to Frontend (SSE)
        def event_stream():
            last_id = 0
            # Initialize: get the latest ID so we don't send old data
            try:
                latest = ScannedBand.objects.latest('id')
                last_id = latest.id
            except ScannedBand.DoesNotExist:
                pass
                
            while True:
                try:
                    latest = ScannedBand.objects.latest('id')
                    # Only yield if it's a NEW scan (ID > last seen)
                    if latest.id > last_id:
                        last_id = latest.id
                        # Send ONLY the bandId as requested, keep it simple
                        data = json.dumps({'bandId': latest.band_id})
                        yield f"data: {data}\n\n"
                except ScannedBand.DoesNotExist:
                    pass
                except Exception:
                    pass
                    
                time.sleep(0.5)

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response

@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def delete_user(request):
    band_id = request.data.get('bandId')
    try:
        user = NFCUser.objects.get(band_id__iexact=band_id)
        user.delete()
        return Response({'message': 'User deleted successfully'})
    except NFCUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
