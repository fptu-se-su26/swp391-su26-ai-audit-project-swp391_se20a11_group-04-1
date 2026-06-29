"""Recovery plan endpoints: POST /recovery/similar"""
import logging
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.rag.faiss_store import search_similar

log = logging.getLogger(__name__)
router = APIRouter(prefix="/recovery", tags=["Recovery"])


class SimilarPlansRequest(BaseModel):
    risk_level: str = Field("WARNING", description="ON_TRACK / AT_RISK / WARNING / BREACH")
    categories: list[str] = Field(default_factory=list)
    days_until_deadline: float = Field(7.0, ge=0)
    sla_score: int = Field(50, ge=0, le=100)
    k: int = Field(3, ge=1, le=10)


class SimilarPlansResponse(BaseModel):
    query_context: str
    similar_plans: list[dict]
    total_found: int


@router.post("/similar", response_model=SimilarPlansResponse)
def find_similar_plans(req: SimilarPlansRequest):
    cats  = ", ".join(req.categories) if req.categories else "unknown"
    query = (
        f"{req.risk_level} {cats} "
        f"days_left={req.days_until_deadline:.0f} "
        f"score={req.sla_score}"
    )

    plans = search_similar(query, k=req.k)
    log.info("RAG query: '%s' → %d plans found", query, len(plans))

    return SimilarPlansResponse(
        query_context=query,
        similar_plans=plans,
        total_found=len(plans),
    )
