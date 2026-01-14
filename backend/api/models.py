from django.db import models
import random
import string

# Create your models here.
class NFCUser(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, unique=True)
    band_id = models.CharField(max_length=20, unique=True, blank=True)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_blocked = models.BooleanField(default=False)
    pin = models.CharField(max_length=4)
    wallet_address = models.CharField(max_length=100, blank=True, null=True)
    private_key = models.CharField(max_length=100, blank=True, null=True) # Stored for custodial wallet
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.band_id:
            # Generate random band ID like NKM-XXXXXXX
            random_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=7))
            self.band_id = f"NKM-{random_id}"
        # Wallet generation is now handled in views using Web3Manager
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.band_id})"

class Seller(models.Model):
    name = models.CharField(max_length=100)
    business_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, unique=True)
    pin = models.CharField(max_length=4)
    wallet_address = models.CharField(max_length=100, blank=True, null=True)
    private_key = models.CharField(max_length=100, blank=True, null=True) # Stored for custodial wallet
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Wallet generation is now handled in views using Web3Manager
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.business_name} ({self.name})"

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('CREDIT', 'Credit'),
        ('DEBIT', 'Debit'),
    )
    user = models.ForeignKey(NFCUser, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    description = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    tx_hash = models.CharField(max_length=66, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.tx_hash:
             # Simulate transaction hash
            self.tx_hash = '0x' + ''.join(random.choices(string.hexdigits, k=64))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.transaction_type} - {self.amount} - {self.user.name}"

class ScannedBand(models.Model):
    band_id = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.band_id} at {self.timestamp}"
