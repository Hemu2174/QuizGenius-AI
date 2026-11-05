from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class QuestionOption(BaseModel):
    id: str
    text: str

class QuestionBase(BaseModel):
    id: str
    question_text: str
    question_type: str = "mcq" # mcq or short_answer
    options: Optional[List[QuestionOption]] = None
    explanation: Optional[str] = None

class QuizBase(BaseModel):
    title: str
    difficulty: str = "medium"
    document_id: Optional[str] = None
    question_count: int = 0

class QuizResponse(QuizBase):
    id: str
    created_at: datetime
    status: str = "draft"
    questions: List[QuestionBase] = []

    class Config:
        from_attributes = True

