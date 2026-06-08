# schemas/models.py
# Pydantic models define the SHAPE of data
# coming IN to your API (request bodies)
# FastAPI automatically validates these —
# if email is missing, it returns an error instantly

from pydantic import BaseModel, EmailStr
from typing import Optional, List

# --- AUTH ---
class SignupRequest(BaseModel):
    name: str
    email: EmailStr      # automatically validates email format
    password: str
    role: str = "student"  # default is student

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SurveySaveRequest(BaseModel):
    student_id: str
    email: str
    name: str
    survey_data: dict

# --- COURSE ---
class CourseCreate(BaseModel):
    title: str
    subject: str         # Physics, Chemistry, Maths
    description: Optional[str] = None

# --- QUIZ RESULT ---
class QuizResultCreate(BaseModel):
    course_id: str
    subject: str
    topic: str
    score: float
    total_questions: int
    correct_answers: int
    time_taken_seconds: int

# --- STUDY SESSION ---
class StudySessionCreate(BaseModel):
    course_id: Optional[str] = None
    topic: str
    duration_minutes: int

# --- MISTAKE ANALYSIS & ADAPTIVE RETEST ---
class MistakeAnalysisCreate(BaseModel):
    student_id: str
    test_id: Optional[str] = None
    question_id: str
    explanation_text: str
    ai_classification: str
    manual_override: Optional[str] = None
    confidence_score: Optional[float] = None

class RetrySimilarRequest(BaseModel):
    student_id: str
    subject: str
    topics: List[str]