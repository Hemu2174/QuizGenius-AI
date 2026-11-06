"""
QuizGenius AI — Quiz & Question Schemas (Phase 3)
Defines strict Pydantic models for Groq LLM generated outputs,
quiz creation requests, database models, and response serialization.
"""
from datetime import datetime
from typing import List, Dict, Optional, Literal, Union, Any
from pydantic import BaseModel, Field, field_validator, model_validator


# =============================================================================
# 1. LLM GENERATED QUESTION MODELS (Strict Validation)
# =============================================================================

class MCQGenerated(BaseModel):
    question_type: Literal["mcq"] = "mcq"
    question: str = Field(..., min_length=5, description="Non-empty question text")
    options: Dict[str, str] = Field(..., description="Exactly four options: A, B, C, D")
    correct_answer: str = Field(..., description="The correct option key: A, B, C, or D")
    explanation: str = Field(..., min_length=5, description="Detailed explanation of the correct answer")
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    topic: str = Field(default="General", min_length=1)
    source_pages: List[int] = Field(default_factory=list)
    source_chunk_ids: List[str] = Field(default_factory=list)

    @field_validator("options")
    @classmethod
    def validate_options(cls, v: Dict[str, str]) -> Dict[str, str]:
        if not isinstance(v, dict):
            raise ValueError("options must be a dictionary")
        # Normalize uppercase keys
        normalized = {str(k).strip().upper(): str(val).strip() for k, val in v.items()}
        required_keys = {"A", "B", "C", "D"}
        if set(normalized.keys()) != required_keys:
            # If keys are 1, 2, 3, 4 or similar, attempt map
            if set(normalized.keys()) == {"1", "2", "3", "4"}:
                key_map = {"1": "A", "2": "B", "3": "C", "4": "D"}
                normalized = {key_map[k]: val for k, val in normalized.items()}
            elif len(normalized) >= 4:
                # Take first 4
                keys = list(normalized.keys())[:4]
                mapped = {}
                for idx, letter in enumerate(["A", "B", "C", "D"]):
                    mapped[letter] = normalized[keys[idx]]
                normalized = mapped
            else:
                raise ValueError(f"MCQ options must contain exactly keys A, B, C, D. Got: {list(normalized.keys())}")
        
        # Check non-empty values
        for k, val in normalized.items():
            if not val:
                raise ValueError(f"Option {k} cannot be empty")
        return normalized

    @field_validator("correct_answer")
    @classmethod
    def validate_correct_answer(cls, v: str) -> str:
        clean = str(v).strip().upper()
        # Handle formats like "Option A" or "A)" or "A."
        if len(clean) > 1 and clean[0] in {"A", "B", "C", "D"}:
            clean = clean[0]
        elif clean.startswith("OPTION "):
            clean = clean.replace("OPTION ", "").strip()
        if clean not in {"A", "B", "C", "D"}:
            raise ValueError(f"correct_answer must be one of 'A', 'B', 'C', 'D'. Got: {v}")
        return clean

    @model_validator(mode="after")
    def verify_correct_answer_in_options(self):
        if self.correct_answer not in self.options:
            raise ValueError(f"correct_answer '{self.correct_answer}' not present in options {list(self.options.keys())}")
        return self


class ShortAnswerGenerated(BaseModel):
    question_type: Literal["short_answer"] = "short_answer"
    question: str = Field(..., min_length=5, description="Non-empty question text")
    expected_answer: str = Field(..., min_length=3, description="Model answer or ideal student response")
    key_points: List[str] = Field(default_factory=list, description="Key concepts or keywords expected in the answer")
    explanation: str = Field(..., min_length=5, description="Detailed explanation/rubric for grading")
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    topic: str = Field(default="General", min_length=1)
    source_pages: List[int] = Field(default_factory=list)
    source_chunk_ids: List[str] = Field(default_factory=list)

    @field_validator("key_points")
    @classmethod
    def validate_key_points(cls, v: Any) -> List[str]:
        if isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]
        if isinstance(v, str) and v.strip():
            return [line.strip("- *").strip() for line in v.split("\n") if line.strip()]
        return []


# Union type for generated question
GeneratedQuestion = Union[MCQGenerated, ShortAnswerGenerated]


class RawLLMQuizOutput(BaseModel):
    """Container for parsing JSON returned by Groq"""
    quiz_title: Optional[str] = None
    questions: List[Dict[str, Any]] = Field(default_factory=list)


# =============================================================================
# 2. API REQUEST & RESPONSE SCHEMAS
# =============================================================================

class QuizGenerateRequest(BaseModel):
    document_id: str = Field(..., description="UUID of the processed source document")
    question_type: Literal["mcq", "short_answer", "mixed"] = Field(
        default="mcq", description="Type of questions to synthesize"
    )
    difficulty: Literal["easy", "medium", "hard"] = Field(
        default="medium", description="Target quiz difficulty"
    )
    number_of_questions: int = Field(
        default=5, description="Number of questions to generate (5, 10, 15, 20)"
    )
    topics: Optional[List[str]] = Field(
        default=None, description="Optional filter of document topics to focus question generation on"
    )

    @field_validator("number_of_questions")
    @classmethod
    def validate_count(cls, v: int) -> int:
        if v not in (5, 10, 15, 20):
            # Allow fallback within bounds if user customizes
            if 1 <= v <= 25:
                return v
            raise ValueError("number_of_questions must be 5, 10, 15, or 20")
        return v


class QuestionResponse(BaseModel):
    id: str
    quiz_id: str
    question_type: str
    question_text: str
    options: Optional[Dict[str, str]] = None
    correct_answer: Optional[str] = None
    expected_answer: Optional[str] = None
    key_points: Optional[List[str]] = None
    explanation: str
    difficulty: str
    topic: str
    source_chunk_ids: List[str] = []
    source_pages: List[int] = []
    created_at: datetime

    class Config:
        from_attributes = True


class QuizSummaryResponse(BaseModel):
    id: str
    document_id: str
    document_title: Optional[str] = "Source Document"
    title: str
    description: Optional[str] = None
    question_type: str
    difficulty: str
    total_questions: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class QuizDetailResponse(QuizSummaryResponse):
    questions: List[QuestionResponse] = []


class DocumentTopicsResponse(BaseModel):
    document_id: str
    topics: List[str]


class AIStatusResponse(BaseModel):
    status: str
    model: str
    is_configured: bool
    message: str
