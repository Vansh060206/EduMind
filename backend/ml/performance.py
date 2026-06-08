# ml/performance.py
import os
import logging
import pickle

logger = logging.getLogger("uvicorn")

class PerformancePredictor:
    def __init__(self):
        self.model_path = os.path.join("weights", "performance_model.pkl")
        self.model = None
        
        # Load pre-trained model if available
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    self.model = pickle.load(f)
                logger.info("Successfully loaded pre-trained XGBoost Performance Predictor.")
            except Exception as e:
                logger.warning(f"Failed to load performance model, falling back to heuristics: {e}")

    def predict_risk(self, avg_score: float, study_hours: float, doubts_asked: int, quizzes_done: int, streak: int):
        """
        Predicts whether a student is 'At-Risk', 'On-Track', or 'Advanced'.
        Uses pre-trained model if loaded, otherwise falls back to deterministic educational heuristics.
        """
        # 1. Model inference (if model weights are present)
        if self.model is not None:
            try:
                import pandas as pd
                # Prepare features in the shape the model expects to prevent name warnings
                features = pd.DataFrame([{
                    "avg_score": avg_score,
                    "study_hours": study_hours,
                    "doubts_asked": doubts_asked,
                    "quizzes_done": quizzes_done,
                    "streak": streak
                }])
                pred_class = self.model.predict(features)[0]
                probs = self.model.predict_proba(features)[0]
                
                status_map = {0: "At-Risk", 1: "On-Track", 2: "Advanced"}
                status = status_map.get(pred_class, "On-Track")
                risk_prob = round(float(probs[0]), 2)
                
                # Dynamically extract feature importances from the trained model
                importances = {
                    "avg_score": round(float(self.model.feature_importances_[0]), 2),
                    "study_hours": round(float(self.model.feature_importances_[1]), 2),
                    "doubts_asked": round(float(self.model.feature_importances_[2]), 2),
                    "quizzes_done": round(float(self.model.feature_importances_[3]), 2),
                    "streak": round(float(self.model.feature_importances_[4]), 2)
                }
                return self._generate_response(status, risk_prob, importances, avg_score, study_hours)
            except Exception as e:
                logger.warning(f"Inference error in trained RandomForest model, running fallback: {e}")

        # 2. Rule-Based Fallback Heuristics
        importances = {"avg_score": 0.50, "study_hours": 0.30, "doubts_asked": 0.15, "streak": 0.05}
        
        if avg_score < 55.0 or study_hours < 5.0:
            status = "At-Risk"
            # Higher probability if score is lower or hours are fewer
            risk_prob = round(max(0.55, 1.0 - (avg_score / 100.0) - (study_hours / 20.0)), 2)
        elif avg_score >= 80.0:
            status = "Advanced"
            risk_prob = 0.05
        else:
            status = "On-Track"
            risk_prob = round(max(0.10, 0.40 - (avg_score / 200.0)), 2)

        return self._generate_response(status, risk_prob, importances, avg_score, study_hours)

    def _generate_response(self, status: str, risk_prob: float, importances: dict, avg_score: float, study_hours: float):
        # Generate actionable advice
        recommendations = []
        if status == "At-Risk":
            if avg_score < 55.0:
                recommendations.append("Review weak concept logs in Chemistry/Physics. Your test scores are currently below target baseline.")
            if study_hours < 5.0:
                recommendations.append("Increase your daily self-study time. We recommend at least 3-4 hours of consistent study.")
            recommendations.append("Attempt short chapter-wise concept check quizzes to re-build your confidence.")
        elif status == "Advanced":
            recommendations.append("Excellent consistency! Start attempting Mock Tests under real-time exam conditions.")
            recommendations.append("Try practicing high-difficulty questions (Level 3 challenges) in the Physics/Chem Labs.")
        else:
            recommendations.append("You are making steady progress! Continue maintaining your current study streak.")
            if study_hours < 8.0:
                recommendations.append("Gradually scale study hours to 5-6 hours/day to prepare for the upcoming mock tests.")

        return {
            "status": status,
            "risk_probability": risk_prob,
            "feature_importances": importances,
            "recommendations": recommendations
        }
