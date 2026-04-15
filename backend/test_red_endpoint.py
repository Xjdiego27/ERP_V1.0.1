"""Diagnostic: test /red endpoint through full FastAPI HTTP stack."""
import sys
sys.path.insert(0, '.')

from main import app
from auth_token import verificar_token

def mock_token():
    return {'sub': 'test', 'id_accs': 1, 'id_emp': 1, 'rol': 'ADMINISTRADOR'}

app.dependency_overrides[verificar_token] = mock_token

from fastapi.testclient import TestClient

print('=== Testing GET /red (exceptions suppressed) ===')
client = TestClient(app, raise_server_exceptions=False)
resp = client.get('/red')
print(f'Status: {resp.status_code}')

if resp.status_code == 500:
    print(f'Body: {resp.text[:1000]}')
    print()
    print('=== Retrying with raise_server_exceptions=True ===')
    try:
        client2 = TestClient(app, raise_server_exceptions=True)
        resp2 = client2.get('/red')
        print(f'Status: {resp2.status_code}')
    except Exception as ex:
        import traceback
        traceback.print_exc()
else:
    print(f'Body (first 300): {resp.text[:300]}')
    print('SUCCESS - endpoint works via HTTP stack')

app.dependency_overrides.clear()
