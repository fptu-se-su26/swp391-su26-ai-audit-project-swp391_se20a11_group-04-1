from app.schemas import GeneratePlanRequest, CandidatePlan
from typing import Dict, Any

class PlanRanker:
    @staticmethod
    def score(candidate: CandidatePlan, context: GeneratePlanRequest, diagnosis: Dict[str, Any]) -> float:
        score = 0.0
        
        if context.remaining_hours and context.working_hours_until_deadline:
            if context.working_hours_until_deadline >= context.remaining_hours:
                score += 20
            else:
                score -= 10
                
        has_reassign = any(a.action_type == "SUGGEST_REASSIGN" for a in candidate.actions)
        if has_reassign:
            score += 15 
            
        primary_cause = diagnosis.get("primary", {})
        if primary_cause:
            ctype = primary_cause.get("type")
            action_types = [a.action_type for a in candidate.actions]
            
            if ctype == "ASSIGNEE_OVERLOADED" and ("SUGGEST_REASSIGN" in action_types or "SUGGEST_SPLIT_TASK" in action_types):
                score += 30
            elif ctype == "DEPENDENCY_BLOCKED" and "ASK_BLOCKER_UPDATE" in action_types:
                score += 30
            elif ctype == "SCOPE_TOO_LARGE" and ("CREATE_RECOVERY_CHECKLIST" in action_types or "SUGGEST_SPLIT_TASK" in action_types):
                score += 30
            elif ctype == "EVIDENCE_OR_TEST_GAP":
                if "CREATE_RECOVERY_CHECKLIST" in action_types:
                    score += 30
                if "NOTIFY_ASSIGNEE" in action_types or "ASK_BLOCKER_UPDATE" in action_types:
                    score += 15
                if action_types == ["SCHEDULE_FOLLOW_UP"]:
                    score -= 40
            else:
                score += 10 
                
        if context.previous_plan_outcomes:
            failed_actions = set()
            for p in context.previous_plan_outcomes:
                if p.get('status') == 'failed':
                    failed_actions.update(p.get('actions', []))
            for a in candidate.actions:
                if a.action_type in failed_actions:
                    score -= 20
                    
        return score
