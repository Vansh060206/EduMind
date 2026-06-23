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

    def predict_risk(self, avg_score: float, study_hours: float, doubts_asked: int, quizzes_done: int, streak: int, student_id: str = None, subject: str = None):
        """
        Predicts whether a student is 'At-Risk', 'On-Track', or 'Advanced'.
        Uses pre-trained model if loaded, otherwise falls back to deterministic educational heuristics.
        """
        # Retrieve actual weak topics for personalized tips
        weak_topics = []
        if student_id and student_id != "guest":
            try:
                from database import supabase
                res = supabase.table("mistake_analysis").select("question_id").eq("student_id", student_id).execute()
                if res.data:
                    from routes.tests import build_flat_question_lookup
                    flat_questions = build_flat_question_lookup()
                    wrong_topics = set()
                    for row in res.data:
                        q_id = row.get("question_id")
                        if q_id in flat_questions:
                            q_subj = flat_questions[q_id].get("subject", "")
                            if not subject or q_subj.lower() == subject.lower():
                                wrong_topics.add(flat_questions[q_id]["topic"])
                    weak_topics = list(wrong_topics)
            except Exception as ex:
                logger.warning(f"Could not load mistakes for performance suggestions: {ex}")

        # Compute status and probabilities
        status = "On-Track"
        risk_prob = 0.2
        importances = {"avg_score": 0.50, "study_hours": 0.30, "doubts_asked": 0.15, "streak": 0.05}

        # 1. Model inference (if model weights are present)
        if self.model is not None:
            try:
                import pandas as pd
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
                
                importances = {
                    "avg_score": round(float(self.model.feature_importances_[0]), 2),
                    "study_hours": round(float(self.model.feature_importances_[1]), 2),
                    "doubts_asked": round(float(self.model.feature_importances_[2]), 2),
                    "quizzes_done": round(float(self.model.feature_importances_[3]), 2),
                    "streak": round(float(self.model.feature_importances_[4]), 2)
                }
            except Exception as e:
                logger.warning(f"Inference error in trained RandomForest model, running fallback: {e}")

        # 2. Rule-Based Fallback Heuristics (if no model weights, or to validate status)
        if self.model is None:
            if avg_score < 55.0 or study_hours < 5.0:
                status = "At-Risk"
                risk_prob = round(max(0.55, 1.0 - (avg_score / 100.0) - (study_hours / 20.0)), 2)
            elif avg_score >= 80.0:
                status = "Advanced"
                risk_prob = 0.05
            else:
                status = "On-Track"
                risk_prob = round(max(0.10, 0.40 - (avg_score / 200.0)), 2)

        # 3. Dynamic LLM Recommendation Generation
        api_key = os.getenv("GROQ_API_KEY")
        if api_key and weak_topics:
            try:
                import requests
                import json
                topics_str = ", ".join(weak_topics[:3])
                prompt = f"""You are Professor ARIA, a supportive, genius AI Science Tutor.
Generate exactly 2 action-oriented study recommendations for a Class 11-12 student based on their learning telemetry:
- Average Quiz Score: {avg_score}%
- Study Hours: {study_hours} hrs
- Doubts Asked: {doubts_asked}
- Active Streak: {streak} days
- Weak Chapters/Topics: {topics_str}

Ensure each recommendation is a short, concise, single-sentence tip (maximum 15 words) offering a highly actionable study action targeting their weak topics.
Format your output as a raw JSON list of strings:
[
  "Recommendation 1",
  "Recommendation 2"
]
Do NOT write any preamble, intro, explanation, or markdown formatting (no ```json). Output only valid JSON list.
"""
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": "You are a specialized JSON generator. You output only raw, valid JSON list of strings. No intro, no comments."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 150
                }
                res = requests.post(url, json=payload, headers=headers, timeout=6)
                if res.status_code == 200:
                    text_ans = res.json()["choices"][0]["message"]["content"].strip()
                    text_ans = text_ans.replace("```json", "").replace("```", "").strip()
                    recs_json = json.loads(text_ans)
                    if isinstance(recs_json, list) and len(recs_json) >= 2:
                        recs = [str(r) for r in recs_json[:3]]
                        return self._generate_response(status, risk_prob, importances, avg_score, study_hours, recs)
            except Exception as e:
                logger.warning(f"Groq failed to compile risk recommendations: {e}")

        # Fallback to local custom heuristics mapping actual weak topics
        return self._generate_response(status, risk_prob, importances, avg_score, study_hours, None, weak_topics)

    def _generate_response(self, status: str, risk_prob: float, importances: dict, avg_score: float, study_hours: float, custom_recs: list = None, weak_topics: list = None):
        if custom_recs:
            return {
                "status": status,
                "risk_probability": risk_prob,
                "feature_importances": importances,
                "recommendations": custom_recs
            }

        # Generate structured fallback advice incorporating weak topics if available
        recommendations = []
        topics_text = f" in: {', '.join(weak_topics[:2])}" if weak_topics else ""

        if status == "At-Risk":
            if avg_score < 55.0:
                recommendations.append(f"Review weak concept logs{topics_text}. Your test scores are currently below target baseline.")
            if study_hours < 5.0:
                recommendations.append("Increase your daily self-study time. We recommend at least 3-4 hours of consistent study.")
            recommendations.append("Attempt short chapter-wise concept check quizzes to re-build your confidence.")
        elif status == "Advanced":
            recommendations.append("Excellent consistency! Start attempting Mock Tests under real-time exam conditions.")
            if weak_topics:
                recommendations.append(f"Refine minor computational slip-ups in: {weak_topics[0]}. Try practicing high-difficulty questions.")
            else:
                recommendations.append("Try practicing high-difficulty questions (Level 3 challenges) in the Physics/Chem Labs.")
        else:
            recommendations.append("You are making steady progress! Continue maintaining your current study streak.")
            if weak_topics:
                recommendations.append(f"Focus study review sessions on: {', '.join(weak_topics[:2])}.")
            if study_hours < 8.0:
                recommendations.append("Gradually scale study hours to 5-6 hours/day to prepare for the upcoming mock tests.")

        return {
            "status": status,
            "risk_probability": risk_prob,
            "feature_importances": importances,
            "recommendations": recommendations
        }
