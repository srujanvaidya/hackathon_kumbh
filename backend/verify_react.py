import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import Client

c = Client()
response = c.get('/')
print(f"Root URL Status: {response.status_code}")
content = response.content.decode('utf-8')

if 'vite' in content or '/static/assets/' in content:
    print("SUCCESS: React index.html is being served.")
else:
    print("FAILURE: React content not found.")
    print(content[:500])
