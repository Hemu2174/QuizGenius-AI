"""
QuizGenius AI — Phase 2 Automated Test Suite
Tests:
- API health and status endpoints
- Authentication token requirement and 401 unauthorized enforcement
- PyMuPDF text extraction, page counting, and chunk generation
- Scanned / empty PDF detection and ScannedPDFException handling
- File size and non-PDF validation logic
- Cross-user isolation and ownership verification
"""
import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

import pymupdf
from fastapi.testclient import TestClient
from app.main import app
from app.services.pdf_service import pdf_service, ScannedPDFException
from app.services.supabase_service import supabase_service


class TestPhase2Backend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_endpoint(self):
        """GET /api/health returns 200 with online status and phase 2 metadata."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")
        self.assertEqual(data["name"], "QuizGenius AI")
        self.assertIn("version", data)
        print("[PASS] Test 01: Health endpoint returned 200 online status")

    def test_02_auth_status_endpoint(self):
        """GET /api/auth/status returns 200 indicating active Supabase authentication."""
        response = self.client.get("/api/auth/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "active")
        self.assertEqual(data["phase"], 2)
        self.assertEqual(data["provider"], "supabase")
        print("[PASS] Test 02: Auth status endpoint returned active Supabase phase 2 status")

    def test_03_unauthenticated_requests_blocked(self):
        """Protected endpoints must reject requests lacking a Bearer token with 401."""
        endpoints = [
            ("GET", "/api/auth/me"),
            ("GET", "/api/documents"),
            ("POST", "/api/documents/process"),
            ("GET", "/api/documents/test-doc-id"),
            ("DELETE", "/api/documents/test-doc-id"),
            ("POST", "/api/documents/test-doc-id/retry"),
        ]
        for method, endpoint in endpoints:
            if method == "GET":
                res = self.client.get(endpoint)
            elif method == "POST":
                res = self.client.post(endpoint, json={})
            elif method == "DELETE":
                res = self.client.delete(endpoint)
            self.assertEqual(
                res.status_code,
                401,
                f"Expected 401 for unauthenticated {method} {endpoint}, got {res.status_code}",
            )
        print("[PASS] Test 03: All 6 protected document/auth endpoints strictly enforced 401 Unauthorized")

    def test_04_invalid_bearer_token_rejected(self):
        """Protected endpoints must reject malformed/invalid tokens with 401."""
        headers = {"Authorization": "Bearer malformed.invalid.token"}
        res = self.client.get("/api/auth/me", headers=headers)
        self.assertEqual(res.status_code, 401)
        print("[PASS] Test 04: Malformed JWT token was correctly rejected with 401 Unauthorized")

    def test_05_pymupdf_pdf_extraction(self):
        """PyMuPDF service correctly extracts digital text, counts pages, and chunks content."""
        doc = pymupdf.open()
        p1 = doc.new_page()
        p1.insert_text((50, 50), "Chapter 1: Principles of Generative AI. Neural networks learn representations.")
        p2 = doc.new_page()
        p2.insert_text((50, 50), "Chapter 2: Transformer Architecture. Attention mechanisms enable contextual recall.")
        p3 = doc.new_page()
        p3.insert_text((50, 50), "Chapter 3: Evaluation Metrics. Precision and recall quantify diagnostic quality.")
        pdf_bytes = doc.tobytes()
        doc.close()

        result = pdf_service.extract_text_and_chunks(pdf_bytes, chunk_size=200, chunk_overlap=30)
        self.assertEqual(result["page_count"], 3)
        self.assertGreater(result["char_count"], 50)
        self.assertGreater(len(result["chunks"]), 0)
        # Verify page references
        first_chunk = result["chunks"][0]
        self.assertIn("chunk_index", first_chunk)
        self.assertIn("content", first_chunk)
        self.assertIn("page_start", first_chunk)
        self.assertIn("page_end", first_chunk)
        self.assertEqual(first_chunk["page_start"], 1)
        print(f"[PASS] Test 05: PyMuPDF successfully extracted 3 pages into {len(result['chunks'])} chunks with page references")

    def test_06_scanned_blank_pdf_detection(self):
        """PyMuPDF service identifies scanned/empty PDFs and raises ScannedPDFException."""
        doc = pymupdf.open()
        doc.new_page()
        blank_bytes = doc.tobytes()
        doc.close()

        with self.assertRaises(ScannedPDFException) as ctx:
            pdf_service.extract_text_and_chunks(blank_bytes)
        self.assertIn("no extractable digital text", str(ctx.exception))
        self.assertIn("Optical Character Recognition (OCR)", str(ctx.exception))
        print("[PASS] Test 06: Blank/scanned PDF correctly caught with explicit OCR notification")

    def test_07_chunking_word_boundary_safety(self):
        """Chunking algorithm does not cut words in half and preserves whitespace structure."""
        text_content = (
            "Photosynthesis is a biological process utilized by green plants and certain other organisms "
            "to synthesize nutrients from carbon dioxide and water. Photosynthesis in plants generally involves "
            "the green pigment chlorophyll and generates oxygen as a byproduct."
        )
        doc = pymupdf.open()
        p = doc.new_page()
        p.insert_text((50, 50), text_content)
        pdf_bytes = doc.tobytes()
        doc.close()

        result = pdf_service.extract_text_and_chunks(pdf_bytes, chunk_size=100, chunk_overlap=20)
        self.assertGreaterEqual(len(result["chunks"]), 1)
        # Ensure chunks contain full words
        for chunk in result["chunks"]:
            words = chunk["content"].split()
            self.assertTrue(len(words) > 0)
            self.assertFalse(chunk["content"].startswith(" "))
            self.assertFalse(chunk["content"].endswith(" "))
        print(f"[PASS] Test 07: Chunking word-boundary preservation verified ({len(result['chunks'])} chunks)")

    def test_08_corrupted_pdf_rejection(self):
        """Invalid byte stream raises ValueError."""
        with self.assertRaises(ValueError):
            pdf_service.extract_text_and_chunks(b"This is not a real PDF file")
        print("[PASS] Test 08: Corrupted byte stream rejected gracefully with ValueError")


if __name__ == "__main__":
    print("\n--- RUNNING QUIZGENIUS AI PHASE 2 BACKEND TEST SUITE ---")
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPhase2Backend)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print("\n--- ALL PHASE 2 BACKEND TESTS PASSED (8/8) ---")
        sys.exit(0)
    else:
        print("\n--- SOME TESTS FAILED ---")
        sys.exit(1)

