import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import Client
from api.models import NFCUser, Transaction

c = Client()

print("--- Testing Backend ---")

# 1. Register a User (API way)
print("\n1. Registering User...")
data = {
    'name': 'Backend Test User',
    'phone': '9998887776',
    'pin': '5678'
}
response = c.post('/api/users/create/', data, content_type='application/json')
print(f"Registration Response: {response.status_code}")
if response.status_code == 201:
    print("User registered successfully.")
else:
    print("Registration failed.")
    print(response.content)
    # If user already exists (from previous run), we can proceed
    if response.status_code == 400 and 'phone' in str(response.content):
         print("User already exists, proceeding...")

user = NFCUser.objects.get(phone='9998887776')
band_id = user.band_id
print(f"User Band ID: {band_id}")
print(f"Initial Balance: {user.balance}")

# 2. Fund Band
print("\n2. Funding Band...")
fund_data = {
    'bandId': band_id,
    'amount': 1000
}
response = c.post('/api/fund/', fund_data, content_type='application/json')
print(f"Fund Response: {response.status_code}")
print(response.json())
user.refresh_from_db()
print(f"New Balance: {user.balance}")

# 3. Process Payment
print("\n3. Processing Payment...")
pay_data = {
    'bandId': band_id,
    'amount': 200,
    'description': 'Test Purchase'
}
response = c.post('/api/payment/', pay_data, content_type='application/json')
print(f"Payment Response: {response.status_code}")
print(response.json())
user.refresh_from_db()
print(f"Balance after payment: {user.balance}")

# 4. Get Stats
print("\n4. Getting Stats...")
response = c.get('/api/stats/')
print('Stats:', response.json())

# 5. Block Band
print("\n5. Blocking Band...")
block_data = {'bandId': band_id}
response = c.post('/api/block/', block_data, content_type='application/json')
print(f"Block Response: {response.status_code}")
print(response.json())

# 6. Try Payment on Blocked Band
print("\n6. Try Payment on Blocked Band...")
response = c.post('/api/payment/', pay_data, content_type='application/json')
print(f"Blocked Payment Response: {response.status_code}") 
# Should be 403
if response.status_code == 403:
    print("SUCCESS: Payment blocked correctly.")
else:
    print(f"FAILURE: Expected 403, got {response.status_code}")
