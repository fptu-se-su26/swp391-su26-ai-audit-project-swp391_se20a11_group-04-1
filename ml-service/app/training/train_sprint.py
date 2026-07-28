"""
Train Sprint Health Predictor (XGBoost).
Output: saved_models/sprint_predictor_v1.pkl
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error
from xgboost import XGBClassifier, XGBRegressor
from app.training.data_generator import generate_sprint_completion_data

SAVE_DIR = os.path.join(os.path.dirname(__file__), "../../saved_models")

FEATURE_COLS = [
    "tasks_done_pct", "on_time_rate_so_far", "overdue_count",
    "avg_spi", "blocker_count", "penalty_count", "team_size",
    "capacity_used_pct", "high_risk_tasks", "avg_assignee_load",
]


def train():
    os.makedirs(SAVE_DIR, exist_ok=True)
    print("Generating synthetic Sprint data...")
    df = generate_sprint_completion_data(1000)

    X = df[FEATURE_COLS].values
    y_class = df["will_succeed"].values
    y_reg = df["completion_rate"].values

    X_tr, X_val, yc_tr, yc_val, yr_tr, yr_val = train_test_split(
        X, y_class, y_reg, test_size=0.2, random_state=42)

    print("Training XGBoost classifier (will_succeed)...")
    clf = XGBClassifier(n_estimators=200, max_depth=5, learning_rate=0.05,
                        use_label_encoder=False, eval_metric="logloss",
                        random_state=42, verbosity=0)
    clf.fit(X_tr, yc_tr, eval_set=[(X_val, yc_val)], verbose=False)
    acc = accuracy_score(yc_val, clf.predict(X_val))
    print(f"  Classifier accuracy: {acc:.3f}")

    print("Training XGBoost regressor (completion_rate)...")
    reg = XGBRegressor(n_estimators=200, max_depth=5, learning_rate=0.05,
                       random_state=42, verbosity=0)
    reg.fit(X_tr, yr_tr, eval_set=[(X_val, yr_val)], verbose=False)
    mae = mean_absolute_error(yr_val, reg.predict(X_val))
    print(f"  Regressor MAE: {mae:.4f}")

    bundle = {
        "classifier": clf,
        "regressor": reg,
        "feature_cols": FEATURE_COLS,
    }
    joblib.dump(bundle, os.path.join(SAVE_DIR, "sprint_predictor_v1.pkl"))
    print(f"\nModel saved -> saved_models/sprint_predictor_v1.pkl")


if __name__ == "__main__":
    train()
