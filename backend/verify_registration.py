import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import Client
from api.models import UserProfile

c = Client()
data = {
    'full_name': 'Test User',
    'mobile_number': '1234567890',
    'pin': '1234'
}

print("Attempting to register user...")
response = c.post('/', data)

print(f"Response status code: {response.status_code}")

if response.status_code == 302:
    print("Redirected (Success usually)")
elif response.status_code == 200:
    print("Returned 200 (Check for errors in template context)")
    # checking context if available or content
    if 'Registration Successful' in str(response.content):
         print("Found success message in content")
else:
    print("Unexpected status code")

# Check database
user_exists = UserProfile.objects.filter(mobile_number='1234567890').exists()
if user_exists:
    print("SUCCESS: UserProfile created in database.")
    user = UserProfile.objects.get(mobile_number='1234567890')
    print(f"User: {user.full_name}, PIN: {user.pin}")
else:
    print("FAILURE: UserProfile not found in database.")
