"""
Train LSTM Autoencoder for Anomaly Detection.
Only trains on NORMAL sequences. Detects anomalies via reconstruction error threshold.
Output: saved_models/lstm_autoencoder_v1.pt + anomaly_meta.pkl
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import torch
import torch.nn as nn
import numpy as np
import joblib
from app.models.lstm_autoencoder import LSTMAutoencoder
from app.training.data_generator import generate_audit_sequences

EPOCHS = 40
BATCH_SIZE = 32
LR = 1e-3
SAVE_DIR = os.path.join(os.path.dirname(__file__), "../../saved_models")


def train():
    os.makedirs(SAVE_DIR, exist_ok=True)
    print("Generating synthetic Audit Log sequences...")
    normal_seqs, anomaly_seqs, action_to_idx, vocab_size = generate_audit_sequences(300)

    split = int(len(normal_seqs) * 0.85)
    train_seqs = torch.tensor(normal_seqs[:split], dtype=torch.long)
    val_seqs   = torch.tensor(normal_seqs[split:], dtype=torch.long)
    anom_seqs  = torch.tensor(anomaly_seqs, dtype=torch.long)

    model = LSTMAutoencoder(vocab_size=vocab_size)
    opt = torch.optim.Adam(model.parameters(), lr=LR)
    ce = nn.CrossEntropyLoss()
    n = len(train_seqs)

    print(f"Training on {n} normal sequences, vocab={vocab_size}, epochs={EPOCHS}...")
    best_val = float("inf")

    for epoch in range(1, EPOCHS + 1):
        model.train()
        perm = torch.randperm(n)
        total = 0.0

        for i in range(0, n, BATCH_SIZE):
            xb = train_seqs[perm[i:i + BATCH_SIZE]]
            opt.zero_grad()
            logits, _ = model(xb)
            B, T, V = logits.shape
            loss = ce(logits.view(B * T, V), xb.view(B * T))
            loss.backward()
            opt.step()
            total += loss.item()

        if epoch % 10 == 0:
            model.eval()
            with torch.no_grad():
                vl, _ = model(val_seqs)
                B, T, V = vl.shape
                val_loss = ce(vl.view(B*T, V), val_seqs.view(B*T)).item()

                train_errors = model.reconstruction_error(train_seqs).numpy()
                val_errors   = model.reconstruction_error(val_seqs).numpy()
                anom_errors  = model.reconstruction_error(anom_seqs).numpy()

            threshold = np.percentile(train_errors, 95)
            anom_detected = (anom_errors > threshold).mean()

            print(f"  Epoch {epoch:3d} | val_loss={val_loss:.4f} | "
                  f"threshold={threshold:.3f} | anomaly_detection={anom_detected:.1%}")

            if val_loss < best_val:
                best_val = val_loss
                torch.save(model.state_dict(), os.path.join(SAVE_DIR, "lstm_autoencoder_v1.pt"))

    # Final threshold on full training set
    model.eval()
    model.load_state_dict(torch.load(os.path.join(SAVE_DIR, "lstm_autoencoder_v1.pt"), weights_only=True))
    with torch.no_grad():
        all_errors = model.reconstruction_error(train_seqs).numpy()

    threshold = float(np.percentile(all_errors, 95))
    meta = {
        "threshold": threshold,
        "vocab_size": vocab_size,
        "action_to_idx": action_to_idx,
        "seq_len": normal_seqs.shape[1],
        "mean_error": float(all_errors.mean()),
        "std_error": float(all_errors.std()),
    }
    joblib.dump(meta, os.path.join(SAVE_DIR, "anomaly_meta.pkl"))

    print(f"\nFinal threshold (p95): {threshold:.4f}")
    print(f"Model saved -> saved_models/lstm_autoencoder_v1.pt")
    print(f"Meta  saved -> saved_models/anomaly_meta.pkl")


if __name__ == "__main__":
    train()
