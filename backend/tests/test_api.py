import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data
    assert data["name"] == "QuizGenius AI"
    print("[PASS] Root endpoint test passed:", data)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["status"] == "online"
    assert data["name"] == "QuizGenius AI"
    assert "version" in data
    print("[PASS] Health endpoint test passed:", data)

def test_documents_protected():
    response = client.get("/api/documents")
    assert response.status_code == 401
    print("[PASS] Documents route correctly enforces 401 Unauthorized for unauthenticated requests")

def test_quizzes_protected():
    response = client.get("/api/quizzes")
    assert response.status_code == 401
    print("[PASS] Quizzes route correctly enforces 401 Unauthorized for unauthenticated requests")

def test_analytics_stub():
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["documents_uploaded"] == 0
    assert data["quizzes_generated"] == 0
    print("[PASS] Analytics stub test passed: zero state verified")

def test_post_quizzes_generate_protected():
    response = client.post("/api/quizzes/generate", json={})
    assert response.status_code == 401
    print("[PASS] POST /api/quizzes/generate correctly enforces 401 Unauthorized")

def test_ai_status():
    response = client.get("/api/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "model" in data
    assert "is_configured" in data
    print("[PASS] GET /api/ai/status test passed:", data)

if __name__ == "__main__":
    print("--- Running QuizGenius AI Backend Tests ---")
    test_root()
    test_health()
    test_documents_protected()
    test_quizzes_protected()
    test_post_quizzes_generate_protected()
    test_analytics_stub()
    test_ai_status()
    print("--- ALL BACKEND TESTS PASSED SUCCESSFULLY! ---")
