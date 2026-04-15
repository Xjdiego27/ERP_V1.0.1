"""Test 2: Check token verification and running server."""
import sys
sys.path.insert(0, '.')

from main import app
from fastapi.testclient import TestClient

# Test 1: WITHOUT any token
print('=== Test WITHOUT token ===')
client = TestClient(app, raise_server_exceptions=False)
resp = client.get('/red')
print(f'Status: {resp.status_code}')
print(f'Body: {resp.text[:300]}')

# Test 2: WITH bad token
print()
print('=== Test WITH bad token ===')
resp2 = client.get('/red', headers={'Authorization': 'Bearer bad_token_here'})
print(f'Status: {resp2.status_code}')
print(f'Body: {resp2.text[:300]}')

# Test 3: WITH valid token
print()
print('=== Test WITH valid generated token ===')
from auth_token import crear_token_acceso
token = crear_token_acceso({"sub": "test_user", "id_accs": 1, "id_emp": 1, "rol": "ADMINISTRADOR"})
print(f'Token created OK')
resp3 = client.get('/red', headers={'Authorization': f'Bearer {token}'})
print(f'Status: {resp3.status_code}')
if resp3.status_code == 500:
    print(f'500 Body: {resp3.text[:500]}')
    print()
    print('=== Retry with exceptions raised ===')
    try:
        client2 = TestClient(app, raise_server_exceptions=True)
        client2.get('/red', headers={'Authorization': f'Bearer {token}'})
    except Exception:
        import traceback
        traceback.print_exc()
else:
    print(f'Body (first 200): {resp3.text[:200]}')
    print('SUCCESS')

# Test 4: Check if actual server is running
print()
print('=== Check running server ===')
import urllib.request, urllib.error
try:
    req = urllib.request.Request('http://localhost:4000/ping')
    with urllib.request.urlopen(req, timeout=3) as r:
        body = r.read().decode()
        print(f'Server IS running: {body[:100]}')
        req2 = urllib.request.Request('http://localhost:4000/red',
                                      headers={'Authorization': f'Bearer {token}'})
        try:
            with urllib.request.urlopen(req2, timeout=5) as r2:
                print(f'/red on live server: {r2.status}')
        except urllib.error.HTTPError as he:
            print(f'/red on live server: HTTP {he.code}')
            print(f'Error body: {he.read().decode()[:500]}')
except urllib.error.URLError:
    print('Server NOT running on localhost:4000')
except Exception as ex:
    print(f'Error: {type(ex).__name__}: {ex}')
