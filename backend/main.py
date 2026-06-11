# main.py
# This is where your entire backend starts.
# It's like the reception desk —
# every request comes here first,
# then gets directed to the right route.

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, courses, students, ml, doubts, tests
from dependencies import get_current_user

app = FastAPI(
    title="EduMind API",
    description="AI-powered education platform for Class 11-12 Science",
    version="1.0.0"
)

# CORS = Cross Origin Resource Sharing
# Without this, your React frontend (localhost:5173)
# CANNOT talk to your FastAPI backend (localhost:8000)
# The browser blocks it for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes with prefixes
# /auth/signup, /auth/login, /auth/me
app.include_router(auth.router, prefix="/auth", tags=["Auth"])

# Protected routes
app.include_router(courses.router, prefix="/courses", tags=["Courses"], dependencies=[Depends(get_current_user)])
app.include_router(students.router, prefix="/students", tags=["Students"], dependencies=[Depends(get_current_user)])
app.include_router(ml.router, prefix="/ml", tags=["Machine Learning"], dependencies=[Depends(get_current_user)])
app.include_router(doubts.router, prefix="/doubts", tags=["Doubts"], dependencies=[Depends(get_current_user)])
app.include_router(tests.router, prefix="/tests", tags=["Tests"], dependencies=[Depends(get_current_user)])

@app.get("/")
async def root():
    return {"message": "EduMind API is running! 🚀"}