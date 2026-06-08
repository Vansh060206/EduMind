# routes/ml.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

from ml.performance import PerformancePredictor
from ml.forecaster import ScoreForecaster

router = APIRouter()

# Instantiate singletons of each predictor engine
predictor = PerformancePredictor()
forecaster = ScoreForecaster()

# --- Request Schemas ---
class RiskPredictionRequest(BaseModel):
    avg_score: float
    study_hours: float
    doubts_asked: int
    quizzes_done: int
    streak: int

class ScoreHistoryPoint(BaseModel):
    date: str
    score: float

class ScoreForecastRequest(BaseModel):
    scores_history: List[ScoreHistoryPoint]

# --- Endpoints ---
@router.post("/predict-risk")
async def predict_risk(data: RiskPredictionRequest):
    try:
        return predictor.predict_risk(
            avg_score=data.avg_score,
            study_hours=data.study_hours,
            doubts_asked=data.doubts_asked,
            quizzes_done=data.quizzes_done,
            streak=data.streak
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk prediction engine failure: {str(e)}")

@router.post("/forecast-score")
async def forecast_score(data: ScoreForecastRequest):
    try:
        # Convert Pydantic objects to dicts for downstream forecaster compat
        history_dicts = [{"date": p.date, "score": p.score} for p in data.scores_history]
        return forecaster.forecast_scores(history_dicts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Score forecasting engine failure: {str(e)}")
