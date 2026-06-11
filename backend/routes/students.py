# routes/students.py
from fastapi import APIRouter
from database import supabase
from schemas.models import QuizResultCreate, StudySessionCreate, MistakeAnalysisCreate
import logging

logger = logging.getLogger("uvicorn")

router = APIRouter()

@router.post("/quiz-result")
async def save_quiz_result(data: QuizResultCreate, student_id: str):
    # Save quiz result — this feeds the ML model later!
    if not student_id or student_id in ["guest", "undefined"]:
        return {
            "id": "mock_guest_result",
            "student_id": student_id,
            "course_id": data.course_id,
            "subject": data.subject,
            "topic": data.topic,
            "score": data.score,
            "total_questions": data.total_questions,
            "correct_answers": data.correct_answers,
            "time_taken_seconds": data.time_taken_seconds
        }
    try:
        result = supabase.table("quiz_results").insert({
            "student_id": student_id,
            "course_id": data.course_id,
            "subject": data.subject,
            "topic": data.topic,
            "score": data.score,
            "total_questions": data.total_questions,
            "correct_answers": data.correct_answers,
            "time_taken_seconds": data.time_taken_seconds
        }).execute()
        if result.data:
            return result.data[0]
        return {}
    except Exception as e:
        logger.warning(f"Failed to insert quiz result: {e}")
        return {
            "id": "fallback_result",
            "student_id": student_id,
            "course_id": data.course_id,
            "subject": data.subject,
            "topic": data.topic,
            "score": data.score,
            "total_questions": data.total_questions,
            "correct_answers": data.correct_answers,
            "time_taken_seconds": data.time_taken_seconds
        }

@router.get("/performance/{student_id}")
async def get_performance(student_id: str):
    try:
        result = supabase.table("quiz_results")\
            .select("*")\
            .eq("student_id", student_id)\
            .order("attempted_at", desc=True)\
            .execute()
        return result.data
    except Exception as e:
        logger.warning(f"Failed to fetch performance: {e}")
        return []

@router.get("/study-sessions/{student_id}")
async def get_study_sessions(student_id: str):
    try:
        result = supabase.table("study_sessions")\
            .select("*")\
            .eq("student_id", student_id)\
            .execute()
        return result.data
    except Exception as e:
        logger.warning(f"Failed to fetch study sessions: {e}")
        return []

@router.post("/study-session")
async def log_study_session(data: StudySessionCreate, student_id: str):
    if not student_id or student_id in ["guest", "undefined"]:
        return {
            "id": "mock_guest_session",
            "student_id": student_id,
            "course_id": data.course_id,
            "topic": data.topic,
            "duration_minutes": data.duration_minutes
        }
    try:
        result = supabase.table("study_sessions").insert({
            "student_id": student_id,
            "course_id": data.course_id,
            "topic": data.topic,
            "duration_minutes": data.duration_minutes
        }).execute()
        if result.data:
            return result.data[0]
        return {}
    except Exception as e:
        logger.warning(f"Failed to log study session: {e}")
        return {
            "id": "fallback_session",
            "student_id": student_id,
            "course_id": data.course_id,
            "topic": data.topic,
            "duration_minutes": data.duration_minutes
        }

@router.post("/mistake-analysis")
async def save_mistake_analysis(data: MistakeAnalysisCreate):
    try:
        res = supabase.table("mistake_analysis").insert({
            "student_id": data.student_id,
            "test_id": data.test_id,
            "question_id": data.question_id,
            "explanation_text": data.explanation_text,
            "ai_classification": data.ai_classification,
            "manual_override": data.manual_override,
            "confidence_score": data.confidence_score
        }).execute()
        return {"status": "success", "data": res.data[0]}
    except Exception as e:
        logger.warning(f"Could not save mistake analysis to DB (table might not exist): {e}")
        return {"status": "fallback_local", "message": str(e), "data": data.dict()}

@router.get("/mistake-analysis/{student_id}")
async def get_mistake_analysis(student_id: str):
    try:
        res = supabase.table("mistake_analysis").select("*").eq("student_id", student_id).execute()
        return res.data
    except Exception as e:
        logger.warning(f"Could not fetch mistake analysis from DB (table might not exist): {e}")
        return []