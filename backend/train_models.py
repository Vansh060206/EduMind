# train_models.py
import os
import pickle
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import Ridge

# Set seed for reproducibility
np.random.seed(42)

def generate_performance_data(n_samples=500):
    print("Generating synthetic student performance data...")
    # Features
    avg_score = np.random.uniform(30.0, 95.0, n_samples)
    study_hours = np.random.uniform(1.0, 15.0, n_samples)
    doubts_asked = np.random.randint(0, 30, n_samples)
    quizzes_done = np.random.randint(0, 40, n_samples)
    streak = np.random.randint(0, 15, n_samples)
    
    # Logic to assign labels: 0=At-Risk, 1=On-Track, 2=Advanced
    y = []
    for i in range(n_samples):
        score, hours = avg_score[i], study_hours[i]
        if score < 55.0 or hours < 5.0:
            y.append(0) # At-Risk
        elif score >= 80.0:
            y.append(2) # Advanced
        else:
            y.append(1) # On-Track
            
    # Add minor noise (flip ~5% of labels to simulate real noisy data)
    y = np.array(y)
    noise_indices = np.random.choice(n_samples, size=int(n_samples * 0.05), replace=False)
    for idx in noise_indices:
        y[idx] = np.random.choice([0, 1, 2])
        
    df = pd.DataFrame({
        "avg_score": avg_score,
        "study_hours": study_hours,
        "doubts_asked": doubts_asked,
        "quizzes_done": quizzes_done,
        "streak": streak
    })
    
    return df, y

def generate_forecast_data(n_samples=500):
    print("Generating synthetic time-series forecasting data...")
    # Features representing history
    avg_score = np.random.uniform(40.0, 95.0, n_samples)
    study_hours = np.random.uniform(2.0, 14.0, n_samples)
    days_since_start = np.random.uniform(1.0, 30.0, n_samples)
    
    # Target score: score improves with more days and study hours
    target_score = avg_score + (study_hours * 0.6) + (days_since_start * 0.15)
    # Add normal noise
    target_score += np.random.normal(0, 2.0, n_samples)
    # Clamp target score to 0-100
    target_score = np.clip(target_score, 0.0, 100.0)
    
    df = pd.DataFrame({
        "avg_score": avg_score,
        "study_hours": study_hours,
        "days_since_start": days_since_start
    })
    
    return df, target_score



def main():
    os.makedirs("weights", exist_ok=True)
    
    # 1. Train Performance Risk Classifier
    X_perf, y_perf = generate_performance_data()
    perf_clf = RandomForestClassifier(n_estimators=50, max_depth=6, random_state=42)
    perf_clf.fit(X_perf, y_perf)
    
    perf_path = os.path.join("weights", "performance_model.pkl")
    with open(perf_path, "wb") as f:
        pickle.dump(perf_clf, f)
    print(f"Saved performance classifier to {perf_path}")
    
    # 2. Train Score Forecasting Regressor
    X_fore, y_fore = generate_forecast_data()
    fore_reg = Ridge(alpha=1.0)
    fore_reg.fit(X_fore, y_fore)
    
    fore_path = os.path.join("weights", "forecaster_model.pkl")
    with open(fore_path, "wb") as f:
        pickle.dump(fore_reg, f)
    print(f"Saved forecaster regressor to {fore_path}")
    

    
    print("\n--- Training Pipeline Completed Successfully! ---")

if __name__ == "__main__":
    main()
