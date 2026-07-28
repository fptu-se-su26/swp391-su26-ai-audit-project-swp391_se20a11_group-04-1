from typing import Dict, Any
from app.schemas import GeneratePlanRequest

class RootCauseClassifier:
    
    @staticmethod
    def diagnose(context: GeneratePlanRequest) -> Dict[str, Any]:
        causes = []
        
        # 1. DEPENDENCY_BLOCKED
        if context.dependencies:
            blocking = [d for d in context.dependencies if d.get('status') != 'DONE' and d.get('blockingDirection') == 'BLOCKS']
            if blocking:
                causes.append({
                    "type": "DEPENDENCY_BLOCKED",
                    "score": 0.9,
                    "evidenceRefs": [f"fact:dependency_{b.get('taskId')}_not_done" for b in blocking]
                })

        # 2. ASSIGNEE_OVERLOADED
        if context.assignee_capacity:
            active = context.assignee_capacity.get("activeTasks", 0)
            overdue = context.assignee_capacity.get("overdueTasks", 0)
            if active + overdue >= 4:
                causes.append({
                    "type": "ASSIGNEE_OVERLOADED",
                    "score": 0.85,
                    "evidenceRefs": [f"fact:activeTasks={active}", f"fact:overdueTasks={overdue}"]
                })

        # 3. SCOPE_TOO_LARGE
        if context.remaining_hours is not None and context.working_hours_until_deadline is not None:
            if context.remaining_hours > context.working_hours_until_deadline:
                causes.append({
                    "type": "SCOPE_TOO_LARGE",
                    "score": 0.95,
                    "evidenceRefs": [f"fact:remainingHours={context.remaining_hours}", f"fact:workingHours={context.working_hours_until_deadline}"]
                })

        # 4. ESTIMATE_UNDERRUN
        if context.estimated_hours is not None and context.actual_hours is not None:
            try:
                est = float(context.estimated_hours)
                act = float(context.actual_hours)
                if act >= est * 0.9:
                    checklist_open = False
                    if context.checklist_completion and context.checklist_completion.get("open", 0) > 0:
                        checklist_open = True
                    if context.sub_task_titles and len(context.sub_task_titles) > 0:
                        open_sub = [s for s in context.sub_task_titles if not s.startswith("[DONE]")]
                        if open_sub:
                            checklist_open = True
                    if checklist_open:
                        causes.append({
                            "type": "ESTIMATE_UNDERRUN",
                            "score": 0.8,
                            "evidenceRefs": [f"fact:actualHours={act}", f"fact:estimatedHours={est}"]
                        })
            except ValueError:
                pass

        # 5. BLOCKER_UNRESOLVED
        if context.blocked_reason:
            causes.append({
                "type": "BLOCKER_UNRESOLVED",
                "score": 0.9,
                "evidenceRefs": [f"fact:blockedReason='{context.blocked_reason}'"]
            })

        # 6. EVIDENCE_OR_TEST_GAP
        if context.evidence_gaps and len(context.evidence_gaps) > 0:
            causes.append({
                "type": "EVIDENCE_OR_TEST_GAP",
                "score": 0.75,
                "evidenceRefs": [f"fact:evidenceGaps={len(context.evidence_gaps)}"]
            })

        # 7. PLAN_NOT_EFFECTIVE
        if context.previous_plan_outcomes:
            failed_plans = [p for p in context.previous_plan_outcomes if p.get('status') == 'failed' or (p.get('scoreAfter', 0) is not None and p.get('scoreBefore', 0) is not None and p.get('scoreAfter', 0) < p.get('scoreBefore', 0))]
            if failed_plans:
                causes.append({
                    "type": "PLAN_NOT_EFFECTIVE",
                    "score": 0.8,
                    "evidenceRefs": [f"fact:failedPlans={len(failed_plans)}"]
                })
                
        # Sort by score desc
        causes.sort(key=lambda x: x["score"], reverse=True)
        
        result = {
            "primary": None,
            "secondary": []
        }
        
        if causes:
            result["primary"] = causes[0]
            result["secondary"] = causes[1:3]
            
        return result
