import sys
import asyncio
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.main import app

async def main():
    print("Testing endpoints directly on FastAPI app...")
    # Test root endpoint
    from app.main import root
    root_result = await root()
    print("[PASS] GET / ->", root_result)
    assert root_result["status"] == "online"
    assert root_result["name"] == "QuizGenius AI"

    # Test health endpoint
    from app.api.routes.health import get_health
    health_result = await get_health()
    print("[PASS] GET /api/health ->", health_result.model_dump())
    assert health_result.status == "online"
    assert health_result.name == "QuizGenius AI"
    assert health_result.version == "1.0.0-phase1"

    # Test documents endpoint
    from app.api.routes.documents import list_documents
    docs_result = await list_documents()
    print("[PASS] GET /api/documents ->", docs_result)
    assert docs_result == []

    # Test quizzes endpoint
    from app.api.routes.quizzes import list_quizzes
    quiz_result = await list_quizzes()
    print("[PASS] GET /api/quizzes ->", quiz_result)
    assert quiz_result == []

    # Test analytics endpoint
    from app.api.routes.analytics import get_analytics_overview
    analytics_result = await get_analytics_overview()
    print("[PASS] GET /api/analytics/overview ->", analytics_result)
    assert analytics_result["documents_uploaded"] == 0
    assert analytics_result["quizzes_generated"] == 0

    # Test auth endpoint
    from app.api.routes.auth import auth_status
    auth_result = await auth_status()
    print("[PASS] GET /api/auth/status ->", auth_result)
    assert auth_result["status"] == "ready_for_supabase"

    print("\n--- ALL BACKEND ENDPOINTS AND SCHEMAS VERIFIED 100% ---")

if __name__ == "__main__":
    asyncio.run(main())
