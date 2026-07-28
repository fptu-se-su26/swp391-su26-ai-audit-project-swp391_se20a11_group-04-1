"""
Train Multi-Task SLA Neural Network v2.
37 features, 50k samples, 80 epochs.
Output: saved_models/sla_multitask_v2.pt + sla_scaler_v2.pkl
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import torch
import torch.nn as nn
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from app.models.sla_multitask import MultiTaskSLAModel
from app.training.data_generator import generate_sla_decision_logs

EPOCHS     = 150
BATCH_SIZE = 512
LR         = 1e-3
N_SAMPLES  = 200000
N_USERS    = 10000
N_SPRINTS  = 1000
SAVE_DIR   = os.path.join(os.path.dirname(__file__), "../../saved_models")


def train():
    os.makedirs(SAVE_DIR, exist_ok=True)

    print("Generating synthetic SLA training data...")
    df = generate_sla_decision_logs(N_SAMPLES, n_users=N_USERS, n_sprints=N_SPRINTS)

    dist = df["risk_level"].value_counts().to_dict()
    print(f"  Risk distribution: {dist}")

    X        = df[MultiTaskSLAModel.FEATURE_COLS].values.astype(np.float32)
    y_risk   = df["risk_level_idx"].values.astype(np.int64)
    y_penalty = df["penalty_label"].values.astype(np.float32)
    y_recovery = df["recovery_priority"].values.astype(np.int64)

    (X_train, X_val,
     yr_train, yr_val,
     yp_train, yp_val,
     yrc_train, yrc_val) = train_test_split(
        X, y_risk, y_penalty, y_recovery,
        test_size=0.20, random_state=42, stratify=y_risk)

    scaler  = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_val   = scaler.transform(X_val)
    joblib.dump(scaler, os.path.join(SAVE_DIR, "sla_scaler_v2.pkl"))
    print("  Scaler saved -> sla_scaler_v2.pkl")

    def to_t(*arrays):
        return [torch.tensor(a) for a in arrays]

    Xtr,  yr_tr,  yp_tr,  yrc_tr  = to_t(X_train, yr_train, yp_train, yrc_train)
    Xv,   yr_v,   yp_v,   yrc_v   = to_t(X_val,   yr_val,   yp_val,   yrc_val)

    model    = MultiTaskSLAModel()
    opt      = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=1e-5)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=EPOCHS)
    ce       = nn.CrossEntropyLoss()
    bce      = nn.BCELoss()

    n           = len(Xtr)
    best_val    = float("inf")
    best_acc    = 0.0

    print(f"\nTraining on {n} samples | val={len(Xv)} | epochs={EPOCHS} | batch={BATCH_SIZE}")
    print("-" * 65)

    for epoch in range(1, EPOCHS + 1):
        model.train()
        perm       = torch.randperm(n)
        total_loss = 0.0
        batches    = 0

        for i in range(0, n, BATCH_SIZE):
            idx  = perm[i:i + BATCH_SIZE]
            xb, yrb, ypb, yrcb = Xtr[idx], yr_tr[idx], yp_tr[idx], yrc_tr[idx]

            opt.zero_grad()
            risk_logits, penalty_prob, recovery_logits = model(xb)
            loss = ce(risk_logits, yrb) + bce(penalty_prob, ypb) + ce(recovery_logits, yrcb)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            total_loss += loss.item()
            batches    += 1

        scheduler.step()

        if epoch % 10 == 0:
            model.eval()
            with torch.no_grad():
                vr, vp, vrc = model(Xv)
                val_loss    = (ce(vr, yr_v) + bce(vp, yp_v) + ce(vrc, yrc_v)).item()
                risk_acc    = (vr.argmax(1) == yr_v).float().mean().item()
                penalty_acc = ((vp > 0.5).long() == yp_v.long()).float().mean().item()
                rec_acc     = (vrc.argmax(1) == yrc_v).float().mean().item()

            tag = " <-- best" if val_loss < best_val else ""
            print(f"  Epoch {epoch:3d} | loss={total_loss/batches:.4f} "
                  f"| val={val_loss:.4f} | risk_acc={risk_acc:.3f} "
                  f"| penalty_acc={penalty_acc:.3f} | rec_acc={rec_acc:.3f}{tag}")

            if val_loss < best_val:
                best_val = val_loss
                best_acc = risk_acc
                torch.save(model.state_dict(),
                           os.path.join(SAVE_DIR, "sla_multitask_v2.pt"))

    print("-" * 65)
    print(f"Best val_loss : {best_val:.4f}")
    print(f"Best risk_acc : {best_acc:.3f}")
    print(f"Model saved   -> saved_models/sla_multitask_v2.pt")
    print(f"Scaler saved  -> saved_models/sla_scaler_v2.pkl")


if __name__ == "__main__":
    train()
