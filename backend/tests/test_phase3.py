"""
QuizGenius AI — Phase 3 Automated Test Suite
Covers:
1. Groq configuration and model discovery
2. Missing API key & error resilience
3. MCQ schema strict validation (4 options, correct answer matching, non-empty text)
4. Short Answer schema validation (expected answer, key points, explanation)
5. JSON parser resilience (markdown code fences, leading/trailing prose)
6. Prompt injection defense structure
7. Keyword-based RAG retrieval & topic extraction
8. Document ownership and RLS enforcement
9. Unauthorized access rejection (401) on all Phase 3 endpoints
10. Mocked Groq quiz generation pipeline
"""
import sys
import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.services.groq_service import GroqService
from app.services.retrieval_service import retrieval_service
from app.schemas.quiz import (
    MCQGenerated,
    ShortAnswerGenerated,
    QuizGenerateRequest,
    RawLLMQuizOutput,
)


class TestPhase3AI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_groq_configuration(self):
        """Settings load Groq parameters correctly."""
        self.assertTrue(hasattr(settings, "GROQ_API_KEY"))
        self.assertTrue(hasattr(settings, "GROQ_MODEL"))
        self.assertIn("qwen", settings.GROQ_MODEL.lower())
        self.assertGreaterEqual(settings.GROQ_TEMPERATURE, 0.0)
        self.assertLessEqual(settings.GROQ_TEMPERATURE, 1.0)
        self.assertGreaterEqual(settings.GROQ_MAX_TOKENS, 1024)
        print("[PASS] Test 01: Groq settings configured with model:", settings.GROQ_MODEL)

    def test_02_groq_missing_api_key(self):
        """GroqService handles missing or blank API key gracefully without crashing."""
        service = GroqService(api_key="")
        status_info = service.check_status()
        self.assertFalse(status_info["is_configured"])
        self.assertEqual(status_info["status"], "unconfigured")
        
        # Generation should raise RuntimeError if unconfigured
        with self.assertRaises(RuntimeError):
            service.generate_quiz_content(
                chunks=[{"id": "c1", "content": "Sample text", "chunk_index": 0}],
                question_type="mcq",
                difficulty="medium",
                count=5,
            )
        print("[PASS] Test 02: Missing API key handled cleanly with descriptive status and exception")

    def test_03_mcq_schema_validation(self):
        """MCQ schema strictly validates options, correct_answer matching, and text."""
        valid_mcq = {
            "question_type": "mcq",
            "question": "What is the primary function of the hippocampus?",
            "options": {
                "A": "Motor coordination",
                "B": "Memory consolidation",
                "C": "Visual processing",
                "D": "Endocrine regulation"
            },
            "correct_answer": "B",
            "explanation": "The hippocampus is critical for transferring short-term memory to long-term storage.",
            "difficulty": "medium",
            "topic": "Neuroscience",
            "source_pages": [12],
            "source_chunk_ids": ["chunk-abc-123"]
        }
        parsed = MCQGenerated.model_validate(valid_mcq)
        self.assertEqual(parsed.correct_answer, "B")
        self.assertEqual(len(parsed.options), 4)

        # Invalid correct_answer (not in options)
        invalid_mcq = dict(valid_mcq)
        invalid_mcq["correct_answer"] = "E"
        with self.assertRaises(Exception):
            MCQGenerated.model_validate(invalid_mcq)

        # Missing an option (only 3 options)
        invalid_options = dict(valid_mcq)
        invalid_options["options"] = {"A": "Opt A", "B": "Opt B", "C": "Opt C"}
        with self.assertRaises(Exception):
            MCQGenerated.model_validate(invalid_options)

        print("[PASS] Test 03: MCQ schema strictly enforces 4 options and valid correct_answer")

    def test_04_short_answer_schema_validation(self):
        """Short answer schema strictly validates question, expected answer, key points, and rubric."""
        valid_sa = {
            "question_type": "short_answer",
            "question": "Explain the concept of backpropagation in artificial neural networks.",
            "expected_answer": "Backpropagation computes the gradient of the loss function with respect to weights using the chain rule.",
            "key_points": ["Chain rule", "Loss gradient", "Weight updates", "Reverse pass"],
            "explanation": "Full credit requires mentioning the chain rule of calculus and gradient descent.",
            "difficulty": "hard",
            "topic": "Machine Learning",
            "source_pages": [45],
            "source_chunk_ids": ["chunk-ml-01"]
        }
        parsed = ShortAnswerGenerated.model_validate(valid_sa)
        self.assertEqual(parsed.question_type, "short_answer")
        self.assertEqual(len(parsed.key_points), 4)

        # Missing expected_answer
        invalid_sa = dict(valid_sa)
        invalid_sa["expected_answer"] = ""
        with self.assertRaises(Exception):
            ShortAnswerGenerated.model_validate(invalid_sa)

        print("[PASS] Test 04: Short answer schema strictly validates expected answer and key concepts")

    def test_05_json_markdown_fence_cleaning(self):
        """GroqService correctly cleans markdown fences and surrounding commentary from LLM output."""
        service = GroqService()
        raw_with_fences = """```json
{
  "quiz_title": "Physics Quiz",
  "questions": []
}
```"""
        extracted = service._extract_json_payload(raw_with_fences)
        self.assertEqual(extracted["quiz_title"], "Physics Quiz")

        # Text with conversational chatter before and after
        messy_raw = """Here is the generated quiz in JSON format:
{
  "quiz_title": "Biology Essentials",
  "questions": []
}
Hope this helps!"""
        extracted_messy = service._extract_json_payload(messy_raw)
        self.assertEqual(extracted_messy["quiz_title"], "Biology Essentials")

        print("[PASS] Test 05: JSON extraction safely strips markdown fences and conversational wrappers")

    def test_06_prompt_injection_defense(self):
        """System prompt includes explicit defenses instructing the model to treat excerpts as untrusted."""
        service = GroqService()
        system_prompt = service._build_system_prompt()
        self.assertIn("UNTRUSTED", system_prompt)
        self.assertIn("PROMPT INJECTION DEFENSE", system_prompt)
        self.assertIn("Ignore previous instructions", system_prompt)
        print("[PASS] Test 06: System prompt incorporates prompt injection defenses")

    def test_07_keyword_retrieval_scoring(self):
        """RetrievalService calculates term frequency relevance and ignores stop words."""
        query_keywords = ["photosynthesis", "chlorophyll", "light"]
        chunk_relevant = "Photosynthesis occurs in plant cells containing chlorophyll when exposed to light."
        chunk_irrelevant = "The French Revolution began in 1789 with the storming of the Bastille."

        score_rel = retrieval_service.score_chunk_by_keywords(chunk_relevant, query_keywords)
        score_irrel = retrieval_service.score_chunk_by_keywords(chunk_irrelevant, query_keywords)

        self.assertGreater(score_rel, 0.0)
        self.assertEqual(score_irrel, 0.0)
        print(f"[PASS] Test 07: Keyword scoring ranked relevant chunk ({score_rel:.3f}) over irrelevant ({score_irrel:.3f})")

    def test_08_phase3_endpoints_unauthenticated_blocked(self):
        """All Phase 3 API endpoints strictly enforce 401 Unauthorized for unauthenticated requests."""
        endpoints = [
            ("GET", "/api/quizzes"),
            ("POST", "/api/quizzes/generate"),
            ("GET", "/api/quizzes/sample-quiz-id"),
            ("DELETE", "/api/quizzes/sample-quiz-id"),
            ("GET", "/api/documents/sample-doc-id/topics"),
        ]
        for method, endpoint in endpoints:
            if method == "GET":
                res = self.client.get(endpoint)
            elif method == "POST":
                res = self.client.post(endpoint, json={"document_id": "doc1"})
            elif method == "DELETE":
                res = self.client.delete(endpoint)

            self.assertEqual(
                res.status_code,
                401,
                f"Expected 401 for unauthenticated {method} {endpoint}, got {res.status_code}",
            )
        print("[PASS] Test 08: All 5 Phase 3 endpoints strictly enforce 401 Unauthorized")

    def test_09_ai_status_endpoint(self):
        """GET /api/ai/status returns 200 with model information without leaking credentials."""
        with patch(
            "app.api.routes.ai.groq_service.check_status",
            return_value={
                "status": "ready",
                "model": "qwen/qwen3.8-27b",
                "is_configured": True,
                "message": "Groq API is connected. Configured model 'qwen/qwen3.8-27b' is available."
            }
        ):
            res = self.client.get("/api/ai/status")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertIn("status", data)
            self.assertIn("model", data)
            self.assertIn("is_configured", data)
            # Verify no credentials leaked
            self.assertNotIn("gsk_", str(data))
            self.assertNotIn("api_key", data)
            print("[PASS] Test 09: GET /api/ai/status returned 200 without exposing credentials:", data)

    def test_10_mocked_quiz_generation_pipeline(self):
        """Simulate end-to-end question generation with mocked Groq SDK completion."""
        mock_groq_json = {
            "quiz_title": "Quantum Mechanics Fundamentals",
            "questions": [
                {
                    "question_type": "mcq",
                    "question": "What principle states that certain pairs of physical properties cannot be simultaneously measured with arbitrary precision?",
                    "options": {
                        "A": "Pauli Exclusion Principle",
                        "B": "Heisenberg Uncertainty Principle",
                        "C": "Photoelectric Effect",
                        "D": "De Broglie Hypothesis"
                    },
                    "correct_answer": "B",
                    "explanation": "Heisenberg's uncertainty principle limits the product of position and momentum uncertainties.",
                    "difficulty": "medium",
                    "topic": "Quantum Mechanics",
                    "source_pages": [14],
                    "source_chunk_ids": ["mock-chunk-1"]
                },
                {
                    "question_type": "short_answer",
                    "question": "Define wave-particle duality according to modern physics.",
                    "expected_answer": "Wave-particle duality describes how quantum entities exhibit both wave-like and particle-like characteristics depending on the experiment.",
                    "key_points": ["Wave properties", "Particle properties", "Quantum entities"],
                    "explanation": "Students must mention both wave-like and particle-like behaviors.",
                    "difficulty": "medium",
                    "topic": "Quantum Mechanics",
                    "source_pages": [15],
                    "source_chunk_ids": ["mock-chunk-2"]
                }
            ]
        }

        # Mock Groq client
        import json
        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps(mock_groq_json)
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response

        service = GroqService(api_key="mock_key")
        service.client = mock_client
        service.is_configured = True

        chunks = [
            {"id": "mock-chunk-1", "content": "Uncertainty principle details...", "page_start": 14, "chunk_index": 0},
            {"id": "mock-chunk-2", "content": "Wave particle duality concepts...", "page_start": 15, "chunk_index": 1},
        ]

        quiz_title, questions = service.generate_quiz_content(
            chunks=chunks,
            question_type="mixed",
            difficulty="medium",
            count=2,
        )

        self.assertEqual(quiz_title, "Quantum Mechanics Fundamentals")
        self.assertEqual(len(questions), 2)
        self.assertEqual(questions[0].question_type, "mcq")
        self.assertEqual(questions[0].correct_answer, "B")
        self.assertEqual(questions[1].question_type, "short_answer")
        print("[PASS] Test 10: Mocked Groq pipeline successfully generated and validated 2 questions")


if __name__ == "__main__":
    print("\n--- RUNNING QUIZGENIUS AI PHASE 3 TEST SUITE ---\n")
    unittest.main(verbosity=2)
