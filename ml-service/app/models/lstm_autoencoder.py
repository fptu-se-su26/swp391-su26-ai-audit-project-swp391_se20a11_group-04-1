"""
LSTM Autoencoder for Anomaly Detection on AuditLog sequences.
Trained only on NORMAL sequences — detects anything unusual via reconstruction error.
"""
import torch
import torch.nn as nn


class LSTMAutoencoder(nn.Module):

    def __init__(self, vocab_size: int, embed_dim: int = 16,
                 hidden_dim: int = 64, latent_dim: int = 32):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim)

        self.encoder_lstm = nn.LSTM(
            embed_dim, hidden_dim, num_layers=2,
            batch_first=True, dropout=0.2
        )
        self.enc_to_latent = nn.Linear(hidden_dim, latent_dim)

        self.latent_to_dec = nn.Linear(latent_dim, hidden_dim)
        self.decoder_lstm = nn.LSTM(
            hidden_dim, hidden_dim, num_layers=2,
            batch_first=True, dropout=0.2
        )
        self.output_proj = nn.Linear(hidden_dim, vocab_size)

    def encode(self, x):
        emb = self.embed(x)
        _, (h_n, _) = self.encoder_lstm(emb)
        return self.enc_to_latent(h_n[-1])

    def decode(self, z, seq_len: int):
        h0 = self.latent_to_dec(z).unsqueeze(0).repeat(2, 1, 1)
        c0 = torch.zeros_like(h0)
        dec_input = h0[-1].unsqueeze(1).repeat(1, seq_len, 1)
        out, _ = self.decoder_lstm(dec_input, (h0, c0))
        return self.output_proj(out)

    def forward(self, x):
        z = self.encode(x)
        logits = self.decode(z, x.size(1))
        return logits, z

    def reconstruction_error(self, x):
        """Returns per-sample mean cross-entropy reconstruction error."""
        logits, _ = self.forward(x)
        B, T, V = logits.shape
        loss_fn = nn.CrossEntropyLoss(reduction="none")
        err = loss_fn(logits.view(B * T, V), x.view(B * T))
        return err.view(B, T).mean(dim=1)
