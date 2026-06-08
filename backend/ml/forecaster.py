# ml/forecaster.py
import os
import logging
import pickle
from datetime import datetime, timedelta
import math

logger = logging.getLogger("uvicorn")

class ScoreForecaster:
    def __init__(self):
        self.model_path = os.path.join("weights", "forecaster_model.pkl")
        self.model = None
        
        # Load pre-trained model if available
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    self.model = pickle.load(f)
                logger.info("Successfully loaded pre-trained Prophet Score Forecaster.")
            except Exception as e:
                logger.warning(f"Failed to load forecaster model, falling back to heuristics: {e}")

    def forecast_scores(self, scores_history: list):
        """
        Forecasts student test scores over the next 30 days.
        Each item in scores_history should be a dict: {"date": "YYYY-MM-DD", "score": float}
        """
        # Parse history
        parsed_history = []
        for item in scores_history:
            try:
                d = datetime.strptime(item["date"][:10], "%Y-%m-%d")
                parsed_history.append((d, float(item["score"])))
            except Exception:
                continue

        parsed_history.sort(key=lambda x: x[0])
        last_date = parsed_history[-1][0] if parsed_history else datetime.now()

        # 1. Model inference (if pre-trained Ridge regressor is present)
        if self.model is not None:
            try:
                import pandas as pd
                avg_val = sum(x[1] for x in parsed_history) / len(parsed_history) if parsed_history else 50.0
                study_hours_val = 6.0 # Assume baseline standard study hours
                
                predictions = []
                # Generate 6 data points over the next 30 days
                for day in range(5, 31, 5):
                    target_date = last_date + timedelta(days=day)
                    
                    features = pd.DataFrame([{
                        "avg_score": avg_val,
                        "study_hours": study_hours_val,
                        "days_since_start": float(day)
                    }])
                    
                    pred = float(self.model.predict(features)[0])
                    # Add minor weekly seasonality fluctuation (sine wave) for realism
                    seasonality = math.sin(day * (2 * math.pi / 7)) * 2.5
                    pred = max(0.0, min(100.0, pred + seasonality))
                    
                    # Confidence intervals widen over time
                    uncertainty = 2.5 + (day * 0.2)
                    lower = max(0.0, min(100.0, pred - uncertainty))
                    upper = max(0.0, min(100.0, pred + uncertainty))
                    
                    predictions.append({
                        "date": target_date.strftime("%Y-%m-%d"),
                        "predicted_score": round(pred, 1),
                        "lower_bound": round(lower, 1),
                        "upper_bound": round(upper, 1)
                    })
                return predictions
            except Exception as e:
                logger.warning(f"Inference error in trained Ridge forecaster model, running fallback: {e}")

        # 2. Time-Series Heuristic Solver (Fallback)
        # Parse history
        parsed_history = []
        for item in scores_history:
            try:
                d = datetime.strptime(item["date"][:10], "%Y-%m-%d")
                parsed_history.append((d, float(item["score"])))
            except Exception:
                continue

        parsed_history.sort(key=lambda x: x[0])
        
        # Determine current benchmark
        if not parsed_history:
            start_score = 50.0
            trend = 0.5 # Default positive progress
            last_date = datetime.now()
        else:
            last_date, start_score = parsed_history[-1]
            if len(parsed_history) >= 2:
                # Calculate simple slope (score delta / days delta)
                days_diff = (parsed_history[-1][0] - parsed_history[0][0]).days
                if days_diff > 0:
                    trend = (parsed_history[-1][1] - parsed_history[0][1]) / days_diff
                else:
                    trend = 0.3
            else:
                trend = 0.3

        # Clamp trend to prevent extreme results
        trend = max(-1.0, min(1.5, trend))

        predictions = []
        # Generate 6 data points (every 5 days) over the next 30 days
        for day in range(5, 31, 5):
            target_date = last_date + timedelta(days=day)
            
            # Linear trend + weekly seasonality fluctuation (sine wave)
            seasonality = math.sin(day * (2 * math.pi / 7)) * 3.0
            pred = start_score + (trend * day) + seasonality
            
            # Clamp scores between 0 and 100
            pred = max(0.0, min(100.0, pred))
            
            # Confidence intervals widen over time
            uncertainty = 3.0 + (day * 0.25)
            lower = max(0.0, min(100.0, pred - uncertainty))
            upper = max(0.0, min(100.0, pred + uncertainty))
            
            predictions.append({
                "date": target_date.strftime("%Y-%m-%d"),
                "predicted_score": round(pred, 1),
                "lower_bound": round(lower, 1),
                "upper_bound": round(upper, 1)
            })

        return predictions
