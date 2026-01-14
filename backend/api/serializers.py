from rest_framework import serializers
from .models import NFCUser, Transaction, Seller

class NFCUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = NFCUser
        fields = ['id', 'name', 'phone', 'band_id', 'balance', 'is_blocked', 'pin', 'wallet_address', 'created_at']
        read_only_fields = ['id', 'band_id', 'balance', 'is_blocked', 'wallet_address', 'created_at']
        extra_kwargs = {
            'pin': {'write_only': True}
        }

    def validate_pin(self, value):
        if not value.isdigit() or len(value) != 4:
            raise serializers.ValidationError("PIN must be exactly 4 digits.")
        return value

class SellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = ['id', 'name', 'business_name', 'phone', 'pin', 'wallet_address', 'created_at']
        read_only_fields = ['id', 'wallet_address', 'created_at']
        extra_kwargs = {
            'pin': {'write_only': True}
        }
    
    def validate_pin(self, value):
        if not value.isdigit() or len(value) != 4:
            raise serializers.ValidationError("PIN must be exactly 4 digits.")
        return value

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
