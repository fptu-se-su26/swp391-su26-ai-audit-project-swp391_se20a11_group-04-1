"""Recovery plan endpoints."""
import json
import logging
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.llm.llm_gateway import call_gemini, call_ollama
from app.rag.faiss_store import search_similar
from app.schemas import GeneratePlanRequest, GeneratePlanResponse
from app.recovery.diagnosis import RootCauseClassifier

log = logging.getLogger(__name__)
router = APIRouter(prefix="/recovery", tags=["Recovery"])
ENABLE_RECOVERY_RAG = os.getenv("ENABLE_RECOVERY_RAG", "false").lower() == "true"


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
    cats = ", ".join(req.categories) if req.categories else "unknown"
    query = (
        f"{req.risk_level} {cats} "
        f"days_left={req.days_until_deadline:.0f} "
        f"score={req.sla_score}"
    )

    if ENABLE_RECOVERY_RAG:
        try:
            plans = search_similar(query, k=req.k)
        except Exception as exc:
            log.warning("RAG search unavailable: %s", exc)
            plans = []
    else:
        plans = []
    log.info("RAG query: '%s' -> %d plans found", query, len(plans))

    return SimilarPlansResponse(
        query_context=query,
        similar_plans=plans,
        total_found=len(plans),
    )


def build_member_section(req: GeneratePlanRequest) -> str:
    if not req.member_candidates:
        return "No member candidate data provided."

    lines = []
    for member in req.member_candidates:
        lines.append(
            "- userId={user_id}, name={name}, role={role}, activeTasks={active}, "
            "overdueTasks={overdue}, currentAssignee={current}".format(
                user_id=member.get("userId") or member.get("user_id"),
                name=member.get("displayName") or member.get("display_name") or "",
                role=member.get("roleName") or member.get("role_name") or "",
                active=member.get("activeTaskCount") or member.get("active_task_count") or 0,
                overdue=member.get("overdueTaskCount") or member.get("overdue_task_count") or 0,
                current=member.get("currentAssignee")
                if "currentAssignee" in member
                else member.get("current_assignee"),
            )
        )
    return "\n".join(lines)


def build_rag_section(req: GeneratePlanRequest) -> str:
    query = f"{req.risk_level} score={req.sla_score}"
    if not ENABLE_RECOVERY_RAG:
        return ""
    try:
        similar_plans = search_similar(query, k=3)
    except Exception as exc:
        log.warning("Skipping RAG context because search failed: %s", exc)
        similar_plans = []
    if not similar_plans:
        return ""

    lines = ["", "Relevant successful historical recovery plans:"]
    for i, plan in enumerate(similar_plans, 1):
        cats = ", ".join(plan.get("categories", []))
        acts = ", ".join(plan.get("actions", []))
        lines.append(
            f"[Plan {i}] Risk: {plan.get('risk_level', '?')} | Issue: {cats} | "
            f"Actions: {acts} | Score: {plan.get('score_before', '?')}->{plan.get('score_after', '?')} "
            f"(+{plan.get('improvement', '?')})"
        )
    lines.append("Use these examples only as guidance. Keep the new plan specific to the current task.")
    return "\n".join(lines)


from app.recovery.verifier import PlanVerifier
from app.recovery.ranker import PlanRanker
from app.schemas import CandidatePlan, VerifierResult, RootCauseResponse, AiRecoveryAction

@router.post("/generate-plan", response_model=GeneratePlanResponse)
def generate_recovery_plan(req: GeneratePlanRequest):
    rag_section = build_rag_section(req)
    member_section = build_member_section(req)
    
    diagnosis = RootCauseClassifier.diagnose(req)
    diagnosis_json = json.dumps(diagnosis, ensure_ascii=False)

    prompt = f"""You are an Agile Coach inside a student software project management system.
Write concise English ASCII recovery-plan content for a task with SLA risk.
Tone: supportive, practical, non-judgmental. Do not compute SLA score.
Use ONLY facts from the provided context and diagnosis. Do not invent deadlines, user names, URLs, APIs, or nonexistent effort.

Diagnosis (JSON):
{diagnosis_json}

Task context:
- Task title: {req.task_title or ''}
- Task description: {req.task_description or ''}
- Task type: {req.task_type or ''}
- Task priority: {req.task_priority or ''}
- Task status: {req.task_status or ''}
- Start date: {req.start_date or ''}
- Deadline: {req.deadline or ''}
- Blocked reason: {req.blocked_reason or ''}
- Estimated hours: {req.estimated_hours or ''}
- Actual hours: {req.actual_hours or ''}
- Remaining hours: {req.remaining_hours}
- Evidence gaps: {", ".join(req.evidence_gaps)}
- GitHub issue URL: {req.github_issue_url or ''}
- Current checklist items: {"; ".join(req.current_checklist_items)}
- Open checklist items: {"; ".join(req.open_checklist_items)}
- Subtasks: {"; ".join(req.sub_task_titles)}
- Risk level: {req.risk_level or ''}
- Current SLA score: {req.sla_score}
- SLA categories: {", ".join(req.categories)}
- Overdue days: {req.overdue_days}
- Assignee active task count: {req.assignee_active_task_count}
- Reasons: {"; ".join(req.reasons)}
- Is follow-up after failed plan: {req.follow_up}
- Previous plan count for this task: {req.previous_plan_count}
- Previous actions: {", ".join(req.previous_actions)}
- Previous effectiveness: {req.previous_effectiveness or ''}
- Last score before/after execution: {req.last_score_before} -> {req.last_score_after}

Member candidates for reassignment suggestion:
{member_section}

Choose 1 to 4 actions from this exact whitelist only:
[NOTIFY_ASSIGNEE, ESCALATE_LEADER, ASK_BLOCKER_UPDATE,
 CREATE_RECOVERY_CHECKLIST, SCHEDULE_FOLLOW_UP, SUGGEST_SPLIT_TASK, SUGGEST_REASSIGN]

Decision guidance:
- Based on the Diagnosis JSON, formulate your actions and rationale to address the primary root cause.
- Treat this task as a unique case. The plan must be useful only for this task, not a reusable template for any task.
- Use the task title, description, evidence gaps, checklist, subtasks, assignee capacity, and previous actions whenever they are present.
- Do not output generic advice such as "schedule a follow-up", "get back on track", "make progress", or "escalate to leader" unless it is paired with a concrete task-specific evidence/test/blocker step.
- Generate 2 to 3 candidate plans, each with a different strategy.
- If data is missing (evidence gaps), mention it in dataNeeded. DO NOT invent effort or numbers.
- For CREATE_RECOVERY_CHECKLIST, include 2 to 5 checklistItems based on real task facts.
- If the primary root cause is EVIDENCE_OR_TEST_GAP, prefer CREATE_RECOVERY_CHECKLIST plus NOTIFY_ASSIGNEE or ASK_BLOCKER_UPDATE. Do not use SCHEDULE_FOLLOW_UP as the only action.
- For evidence/test gaps, checklistItems must name the missing proof to collect, the test/result to attach, or the acceptance evidence to verify.
- For SUGGEST_REASSIGN, choose a member from Member candidates only.

Output language and format rules:
- Return plain JSON only, no markdown.
- Every human-facing string value must be English ASCII text.
- Do not use Chinese, Vietnamese diacritics, markdown, smart quotes, or non-ASCII punctuation.
- Keep actions concrete and tied to the task facts above; avoid generic leadership/checklist advice unless the facts justify it.

Return this JSON shape exactly:
{{
  "dataNeeded": ["..."],
  "candidates": [
    {{
      "strategy": "...",
      "summary": "...",
      "successCondition": "...",
      "fallbackCondition": "...",
      "confidence": 0.8,
      "actions": [
        {{
          "actionType": "CREATE_RECOVERY_CHECKLIST",
          "actionDetails": "...",
          "rationale": "...",
          "priority": "HIGH",
          "checklistItems": ["...", "..."],
          "recommendedAssigneeId": null,
          "recommendedAssigneeName": null
        }}
      ]
    }}
  ]
}}
{rag_section}"""

    raw_text = None
    if req.ai_provider == "gemini":
        raw_text = call_gemini(prompt)
    else:
        raw_text = call_ollama(prompt, model=req.ai_model)

    if not raw_text:
        log.error("LLM generation returned empty or timed out.")
        raise HTTPException(status_code=503, detail="LLM generation failed")

    raw_text = raw_text.strip()
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]
    elif raw_text.startswith("```"):
        raw_text = raw_text[3:]
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]
    raw_text = raw_text.strip()

    try:
        data = json.loads(raw_text)
        
        # Parse candidates
        candidates_data = data.get("candidates", [])
        if not candidates_data:
            raise ValueError("No candidates generated")
            
        candidates = [CandidatePlan(**c) for c in candidates_data]
        
        best_candidate = None
        best_score = -9999
        best_verifier_result = None
        
        for cand in candidates:
            v_res = PlanVerifier.verify(cand, req)
            if v_res.valid:
                score = PlanRanker.score(cand, req, diagnosis)
                if score > best_score:
                    best_score = score
                    best_candidate = cand
                    best_verifier_result = v_res
                    
        if not best_candidate:
            # Fallback to the first one with its violations
            best_candidate = candidates[0]
            best_verifier_result = PlanVerifier.verify(best_candidate, req)

        root_cause_data = diagnosis.get("primary") or {"type": "UNKNOWN", "evidenceRefs": []}
        rc = RootCauseResponse(type=root_cause_data["type"], evidence_refs=root_cause_data.get("evidenceRefs", []))
        
        return GeneratePlanResponse(
            rootCause=rc,
            selectedPlan=best_candidate,
            dataNeeded=data.get("dataNeeded", []),
            verifier=best_verifier_result
        )
    except Exception as exc:
        log.error("Failed to parse JSON from LLM: %s", raw_text)
        raise HTTPException(status_code=500, detail="Failed to parse LLM response") from exc
