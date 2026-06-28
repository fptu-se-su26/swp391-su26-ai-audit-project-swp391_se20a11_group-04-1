"""
DevTrack ML Microservice — FastAPI
Port: 8001

Endpoints:
  POST /predict/sla-risk      -> SLA risk level + penalty prob + recovery priority
  POST /predict/sprint-health -> Sprint success probability + completion rate
  POST /detect/anomaly        -> Anomaly detection on AuditLog sequences
  POST /feedback              -> RLHF feedback (approve/reject prediction)
  GET  /health                -> Service health + model status
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.model_loader import get_registry
from app.routers import sla, sprint, anomaly
from app.schemas import MlFeedbackRequest, MlFeedbackResponse, HealthResponse

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Loading ML models...")
    reg = get_registry()
    log.info("Models ready: sla=%s sprint=%s anomaly=%s",
             reg.sla_model is not None,
             reg.sprint_bundle is not None,
             reg.anomaly_model is not None)
    yield
    log.info("ML service shutting down.")


app = FastAPI(
    title="DevTrack ML Microservice",
    description="SLA Risk Prediction | Sprint Health | Anomaly Detection",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sla.router)
app.include_router(sprint.router)
app.include_router(anomaly.router)


@app.get("/health", response_model=HealthResponse, tags=["System"])
def health():
    reg = get_registry()
    return HealthResponse(
        status="ok",
        models_loaded={
            "sla_multitask_v2":       reg.sla_model is not None,
            "sprint_predictor_v1":    reg.sprint_bundle is not None,
            "lstm_autoencoder_v1":    reg.anomaly_model is not None,
        },
    )


@app.post("/feedback", response_model=MlFeedbackResponse, tags=["RLHF"])
def receive_feedback(req: MlFeedbackRequest):
    reg = get_registry()
    reg.feedback_buffer.append(req.model_dump())
    log.info("Feedback received: task=%s type=%s correct=%s",
             req.task_id, req.prediction_type, req.is_correct)
    return MlFeedbackResponse(
        accepted=True,
        message=f"Feedback recorded. Buffer size: {len(reg.feedback_buffer)}",
    )


@app.get("/", tags=["System"])
def root():
    return {"service": "DevTrack ML Microservice", "version": "2.0.0", "docs": "/docs"}
