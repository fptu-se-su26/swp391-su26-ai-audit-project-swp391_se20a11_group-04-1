from app.schemas import GeneratePlanRequest, CandidatePlan, VerifierResult

class PlanVerifier:
    @staticmethod
    def verify(candidate: CandidatePlan, context: GeneratePlanRequest) -> VerifierResult:
        violations = []
        context_facts = " ".join([
            context.task_title or "",
            context.task_description or "",
            " ".join(context.evidence_gaps or []),
            " ".join(context.current_checklist_items or []),
            " ".join(context.open_checklist_items or []),
            " ".join(context.sub_task_titles or []),
            " ".join(context.reasons or []),
        ]).lower()
        generic_phrases = [
            "schedule a follow-up",
            "back on track",
            "significant progress",
            "further action",
            "leader recovery action",
            "break down the remaining work",
        ]
        
        # 1. Duplicate action types unless different targets
        action_types = {}
        for action in candidate.actions:
            target = action.recommended_assignee_id if action.action_type == "SUGGEST_REASSIGN" else None
            key = (action.action_type, target)
            if key in action_types:
                violations.append(f"Duplicate action type: {action.action_type}")
            action_types[key] = True

            action_text = " ".join([
                action.action_details or "",
                action.rationale or "",
                " ".join(action.checklist_items or []),
            ]).lower()
            if any(phrase in action_text for phrase in generic_phrases):
                if not any(term in action_text for term in ["evidence", "test", "proof", "attachment", "checklist", "blocker", "assignee"]):
                    violations.append(f"Generic action wording: {action.action_type}")

        # 2. Reassign candidate must exist, not leader, and capacity better than owner
        for action in candidate.actions:
            if action.action_type == "SUGGEST_REASSIGN":
                candidate_id = action.recommended_assignee_id
                if candidate_id:
                    member_candidates = context.member_candidates or []
                    match = next((m for m in member_candidates if m.get("userId") == candidate_id), None)
                    if not match:
                        violations.append(f"Reassign candidate {candidate_id} not found in context.")
                    else:
                        role = match.get("roleName", "").upper()
                        if "LEADER" in role or "MENTOR" in role:
                            violations.append(f"Cannot reassign to leader/mentor {candidate_id}.")
                        
                        candidate_active = match.get("activeTaskCount", 0)
                        owner_active = context.assignee_active_task_count
                        if candidate_active >= owner_active:
                            violations.append(f"Candidate {candidate_id} is not less overloaded than current owner.")
                else:
                    violations.append("SUGGEST_REASSIGN missing recommendedAssigneeId.")

            # 3. Split task must have enough time
            if action.action_type == "SUGGEST_SPLIT_TASK":
                if context.working_hours_until_deadline is not None and context.working_hours_until_deadline < 4:
                    violations.append("Not enough working hours left to split task effectively.")
            
            # 4. Checklist not repeating done/open and not empty
            if action.action_type == "CREATE_RECOVERY_CHECKLIST":
                items = action.checklist_items
                if not items:
                    violations.append("CREATE_RECOVERY_CHECKLIST must have items.")
                if context.evidence_gaps:
                    joined_items = " ".join(items).lower()
                    if not any(term in joined_items for term in ["evidence", "test", "proof", "attachment", "result"]):
                        violations.append("Evidence gap checklist must mention evidence, test result, proof, or attachment.")
                
                existing_items = set(context.current_checklist_items + context.open_checklist_items)
                for item in items:
                    if any(item.lower() in ex.lower() for ex in existing_items):
                        violations.append(f"Checklist item '{item}' repeats existing work.")

        action_type_list = [a.action_type for a in candidate.actions]

        # 5. Evidence/test gaps need direct evidence repair, not only a meeting.
        if context.evidence_gaps:
            if action_type_list == ["SCHEDULE_FOLLOW_UP"]:
                violations.append("Evidence/test gap cannot be handled by SCHEDULE_FOLLOW_UP alone.")
            if not any(a in action_type_list for a in ["CREATE_RECOVERY_CHECKLIST", "NOTIFY_ASSIGNEE", "ASK_BLOCKER_UPDATE"]):
                violations.append("Evidence/test gap needs a direct evidence or test recovery action.")

        # 6. A plan must be tied to this task's facts when facts are available.
        if context_facts.strip():
            plan_text = " ".join([
                candidate.strategy or "",
                candidate.summary or "",
                candidate.success_condition or "",
                candidate.fallback_condition or "",
                " ".join(
                    " ".join([
                        action.action_details or "",
                        action.rationale or "",
                        " ".join(action.checklist_items or []),
                    ])
                    for action in candidate.actions
                ),
            ]).lower()
            task_terms = [
                term for term in ["evidence", "test", "proof", "attachment", "blocked", "overdue", "checklist", "github"]
                if term in context_facts
            ]
            if task_terms and not any(term in plan_text for term in task_terms):
                violations.append("Plan does not reference the task-specific risk facts.")

        # 7. Plan after failed plan cannot just be NOTIFY_ASSIGNEE
        if context.previous_plan_outcomes and len(context.previous_plan_outcomes) > 0:
            if len(candidate.actions) == 1 and candidate.actions[0].action_type == "NOTIFY_ASSIGNEE":
                violations.append("Previous plan failed; cannot only suggest NOTIFY_ASSIGNEE.")

        # 8. Must have >=1 success condition and follow-up milestone if risk WARNING/BREACH
        if context.risk_level in ["WARNING", "BREACH"]:
            if not candidate.success_condition or len(candidate.success_condition) < 5:
                violations.append("High risk plan must have clear success condition.")
            if not candidate.fallback_condition or len(candidate.fallback_condition) < 5:
                violations.append("High risk plan must have fallback condition.")

        return VerifierResult(
            valid=len(violations) == 0,
            violations=violations
        )
