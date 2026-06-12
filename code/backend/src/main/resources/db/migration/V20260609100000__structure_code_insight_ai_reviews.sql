ALTER TABLE code_insight_ai_reviews
    ADD COLUMN IF NOT EXISTS model VARCHAR(120),
    ADD COLUMN IF NOT EXISTS prompt_input_json TEXT,
    ADD COLUMN IF NOT EXISTS prompt_preview TEXT,
    ADD COLUMN IF NOT EXISTS input_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS risk_details_json TEXT,
    ADD COLUMN IF NOT EXISTS questions_for_leader_json TEXT,
    ADD COLUMN IF NOT EXISTS evidence_assessment_json TEXT,
    ADD COLUMN IF NOT EXISTS review_notes_json TEXT,
    ADD COLUMN IF NOT EXISTS provider_error_json TEXT;

UPDATE code_insight_ai_reviews
SET model = COALESCE(model, provider)
WHERE model IS NULL;

UPDATE code_insight_ai_reviews
SET recommendation = CASE recommendation
    WHEN 'LIKELY_READY' THEN 'LIKELY_READY'
    WHEN 'NEEDS_CHANGES' THEN 'BLOCKED_RISK'
    WHEN 'REVIEW_CAREFULLY' THEN 'NEEDS_REVIEW'
    WHEN 'BLOCKED_RISK' THEN 'BLOCKED_RISK'
    WHEN 'NEEDS_REVIEW' THEN 'NEEDS_REVIEW'
    WHEN 'INSUFFICIENT_EVIDENCE' THEN 'INSUFFICIENT_EVIDENCE'
    ELSE 'NEEDS_REVIEW'
END;

UPDATE code_insight_ai_reviews
SET risk_details_json = COALESCE(
    risk_details_json,
    (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'severity', 'MEDIUM',
            'category', 'QUALITY',
            'title', value,
            'detail', value
        ))::text, '[]')
        FROM jsonb_array_elements_text(COALESCE(NULLIF(risks_json, ''), '[]')::jsonb) AS value
    )
)
WHERE risk_details_json IS NULL;

UPDATE code_insight_ai_reviews
SET questions_for_leader_json = COALESCE(questions_for_leader_json, COALESCE(NULLIF(review_questions_json, ''), '[]'))
WHERE questions_for_leader_json IS NULL;

UPDATE code_insight_ai_reviews
SET evidence_assessment_json = COALESCE(evidence_assessment_json, jsonb_build_object(
    'requirementLinked', false,
    'githubIssueLinked', false,
    'hasCommitEvidence', false,
    'hasPullRequestEvidence', false,
    'ciPassed', false,
    'authorMatchesAssignee', false,
    'changedFilesReviewed', 0,
    'binaryFilesSkipped', 0,
    'truncatedFiles', 0
)::text)
WHERE evidence_assessment_json IS NULL;

UPDATE code_insight_ai_reviews
SET review_notes_json = COALESCE(review_notes_json, '[]')
WHERE review_notes_json IS NULL;
