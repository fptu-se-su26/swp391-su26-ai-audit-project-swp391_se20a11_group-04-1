package org.example.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.RtmMatrixResponse;
import org.example.backend.dto.RtmMatrixResponse.LinkedItemResponse;
import org.example.backend.dto.RtmMatrixResponse.RtmRowResponse;
import org.example.backend.dto.RtmSnapshotResponse;
import org.example.backend.dto.RtmSummaryResponse;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.service.RtmService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RtmServiceImpl implements RtmService {

    private final EntityManager entityManager;
    private final ProjectMemberRepository projectMemberRepository;
    private final ObjectMapper objectMapper;

    @Override
    public RtmMatrixResponse getMatrix(Long projectId, Long userId) {
        ensureProjectMember(projectId, userId);

        List<RtmRowResponse> rows = fetchRows(projectId);
        RtmSummaryResponse summary = buildSummary(rows);
        return new RtmMatrixResponse(projectId, LocalDateTime.now(), summary, rows);
    }

    @Override
    public RtmSummaryResponse getSummary(Long projectId, Long userId) {
        return getMatrix(projectId, userId).summary();
    }

    @Override
    @Transactional
    public RtmSnapshotResponse saveSnapshot(Long projectId, Long sprintId, Long userId) {
        RtmMatrixResponse matrix = getMatrix(projectId, userId);

        try {
            String snapshotJson = objectMapper.writeValueAsString(matrix);
            Query query = entityManager.createNativeQuery("""
                    INSERT INTO rtm_snapshots (project_id, sprint_id, snapshot_data)
                    VALUES (:projectId, CAST(:sprintId AS bigint), CAST(:snapshotData AS jsonb))
                    RETURNING id, project_id, sprint_id, created_at
                    """);
            query.setParameter("projectId", projectId);
            query.setParameter("sprintId", sprintId);
            query.setParameter("snapshotData", snapshotJson);

            Object[] row = (Object[]) query.getSingleResult();
            return new RtmSnapshotResponse(
                    asLong(row[0]),
                    asLong(row[1]),
                    asLong(row[2]),
                    asLocalDateTime(row[3]),
                    matrix.summary(),
                    matrix.rows().size()
            );
        } catch (Exception ex) {
            throw new CustomException("Unable to save RTM snapshot: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public List<RtmSnapshotResponse> getSnapshots(Long projectId, Long userId) {
        ensureProjectMember(projectId, userId);

        Query query = entityManager.createNativeQuery("""
                SELECT id,
                       project_id,
                       sprint_id,
                       snapshot_data::text,
                       created_at
                FROM rtm_snapshots
                WHERE project_id = :projectId
                ORDER BY created_at DESC
                """);
        query.setParameter("projectId", projectId);

        List<Object[]> result = query.getResultList();
        List<RtmSnapshotResponse> snapshots = new ArrayList<>();
        for (Object[] row : result) {
            JsonNode data = parseJson(row[3]);
            JsonNode summaryNode = data.path("summary");
            JsonNode rowsNode = data.path("rows");
            snapshots.add(new RtmSnapshotResponse(
                    asLong(row[0]),
                    asLong(row[1]),
                    asLong(row[2]),
                    asLocalDateTime(row[4]),
                    summaryFromJson(summaryNode),
                    rowsNode.isArray() ? rowsNode.size() : 0
            ));
        }
        return snapshots;
    }

    private List<RtmRowResponse> fetchRows(Long projectId) {
        Query query = entityManager.createNativeQuery("""
                WITH task_rollup AS (
                    SELECT t.requirement_id,
                           COUNT(*) AS task_total,
                           COUNT(*) FILTER (WHERE t.status::text = 'DONE') AS task_done,
                           COUNT(*) FILTER (WHERE t.status::text = 'BLOCKED') AS task_blocked,
                           COALESCE(json_agg(json_build_object(
                               'id', t.id,
                               'code', COALESCE(t.task_code, concat('TSK-', t.id)),
                               'title', t.title,
                               'status', t.status::text,
                               'owner', COALESCE(tup.full_name, tua.username, 'Unassigned'),
                               'meta', t.priority::text
                           ) ORDER BY t.id) FILTER (WHERE t.id IS NOT NULL), '[]'::json) AS tasks
                    FROM tasks t
                    LEFT JOIN user_accounts tua ON tua.id = t.primary_assignee_id
                    LEFT JOIN user_profiles tup ON tup.user_id = tua.id
                    WHERE t.project_id = :projectId
                    GROUP BY t.requirement_id
                ),
                test_rollup AS (
                    SELECT tc.requirement_id,
                           COUNT(*) AS test_total,
                           COUNT(*) FILTER (WHERE tc.status::text = 'PASS') AS test_passed,
                           COUNT(*) FILTER (WHERE tc.status::text = 'FAIL') AS test_failed,
                           COUNT(*) FILTER (WHERE tc.status::text = 'BLOCKED') AS test_blocked,
                           COUNT(*) FILTER (WHERE tc.status::text = 'NOT_RUN') AS test_not_run,
                           COALESCE(json_agg(json_build_object(
                               'id', tc.id,
                               'code', COALESCE(tc.tc_code, concat('TC-', tc.id)),
                               'title', tc.title,
                               'status', tc.status::text,
                               'owner', '',
                               'meta', tc.type::text
                           ) ORDER BY tc.id) FILTER (WHERE tc.id IS NOT NULL), '[]'::json) AS test_cases
                    FROM test_cases tc
                    WHERE tc.project_id = :projectId
                    GROUP BY tc.requirement_id
                ),
                bug_rollup AS (
                    SELECT linked.requirement_id,
                           COUNT(*) FILTER (WHERE linked.status NOT IN ('FIXED', 'VERIFIED', 'CLOSED')) AS open_bug_count,
                           COUNT(*) FILTER (WHERE linked.status NOT IN ('FIXED', 'VERIFIED', 'CLOSED')
                                             AND linked.severity IN ('CRITICAL', 'HIGH')) AS critical_bug_count,
                           COALESCE(json_agg(json_build_object(
                               'id', linked.id,
                               'code', concat('BUG-', linked.id),
                               'title', linked.title,
                               'status', linked.status,
                               'owner', linked.owner,
                               'meta', linked.severity
                           ) ORDER BY linked.id) FILTER (WHERE linked.id IS NOT NULL
                                                        AND linked.status NOT IN ('FIXED', 'VERIFIED', 'CLOSED')), '[]'::json) AS bugs
                    FROM (
                        SELECT DISTINCT b.id,
                               COALESCE(t.requirement_id, tc.requirement_id) AS requirement_id,
                               b.title,
                               b.status::text AS status,
                               b.severity::text AS severity,
                               COALESCE(bup.full_name, bua.username, 'Unassigned') AS owner
                        FROM bug_reports b
                        LEFT JOIN tasks t ON t.id = b.related_task_id
                        LEFT JOIN test_executions te ON te.id = b.test_execution_id
                        LEFT JOIN test_cases tc ON tc.id = te.test_case_id
                        LEFT JOIN user_accounts bua ON bua.id = b.assigned_to
                        LEFT JOIN user_profiles bup ON bup.user_id = bua.id
                        WHERE b.project_id = :projectId
                    ) linked
                    WHERE linked.requirement_id IS NOT NULL
                    GROUP BY linked.requirement_id
                ),
                evidence_rollup AS (
                    SELECT el.entity_id AS requirement_id,
                           COUNT(*) FILTER (WHERE e.status::text = 'ACCEPTED') AS evidence_count,
                           COALESCE(json_agg(json_build_object(
                               'id', e.id,
                               'code', concat('EVD-', e.id),
                               'title', e.title,
                               'status', e.status::text,
                               'owner', COALESCE(eup.full_name, eua.username, 'Unknown'),
                               'meta', e.type::text
                           ) ORDER BY e.id) FILTER (WHERE e.status::text = 'ACCEPTED'), '[]'::json) AS evidence
                    FROM evidence_links el
                    JOIN evidence e ON e.id = el.evidence_id
                    LEFT JOIN user_accounts eua ON eua.id = e.uploaded_by
                    LEFT JOIN user_profiles eup ON eup.user_id = eua.id
                    WHERE e.project_id = :projectId
                      AND el.entity_type::text = 'REQUIREMENT'
                    GROUP BY el.entity_id
                )
                SELECT r.id,
                       r.title,
                       r.description,
                       r.priority::text,
                       r.status::text,
                       r.evidence_required,
                       COALESCE(up.full_name, ua.username, 'Unassigned') AS owner_name,
                       ua.email AS owner_email,
                       COALESCE(tr.task_total, 0) AS task_total,
                       COALESCE(tr.task_done, 0) AS task_done,
                       COALESCE(tr.task_blocked, 0) AS task_blocked,
                       COALESCE(ts.test_total, 0) AS test_total,
                       COALESCE(ts.test_passed, 0) AS test_passed,
                       COALESCE(ts.test_failed, 0) AS test_failed,
                       COALESCE(ts.test_blocked, 0) AS test_blocked,
                       COALESCE(ts.test_not_run, 0) AS test_not_run,
                       COALESCE(br.open_bug_count, 0) AS open_bug_count,
                       COALESCE(br.critical_bug_count, 0) AS critical_bug_count,
                       COALESCE(er.evidence_count, 0) AS evidence_count,
                       COALESCE(tr.tasks, '[]'::json)::text AS tasks,
                       COALESCE(ts.test_cases, '[]'::json)::text AS test_cases,
                       COALESCE(br.bugs, '[]'::json)::text AS bugs,
                       COALESCE(er.evidence, '[]'::json)::text AS evidence,
                       r.req_code
                FROM requirements r
                LEFT JOIN user_accounts ua ON ua.id = r.owner_id
                LEFT JOIN user_profiles up ON up.user_id = ua.id
                LEFT JOIN task_rollup tr ON tr.requirement_id = r.id
                LEFT JOIN test_rollup ts ON ts.requirement_id = r.id
                LEFT JOIN bug_rollup br ON br.requirement_id = r.id
                LEFT JOIN evidence_rollup er ON er.requirement_id = r.id
                WHERE r.project_id = :projectId
                ORDER BY COALESCE(r.req_order, r.id), r.id
                """);
        query.setParameter("projectId", projectId);

        List<Object[]> result = query.getResultList();
        List<RtmRowResponse> rows = new ArrayList<>();
        for (Object[] row : result) {
            rows.add(mapRow(row));
        }
        return rows;
    }

    private RtmRowResponse mapRow(Object[] row) {
        Long requirementId = asLong(row[0]);
        String requirementStatus = asString(row[4]);
        boolean evidenceRequired = asBoolean(row[5]);
        int taskTotal = asInt(row[8]);
        int taskDone = asInt(row[9]);
        int taskBlocked = asInt(row[10]);
        int testTotal = asInt(row[11]);
        int testPassed = asInt(row[12]);
        int testFailed = asInt(row[13]);
        int testBlocked = asInt(row[14]);
        int testNotRun = asInt(row[15]);
        int openBugCount = asInt(row[16]);
        int criticalBugCount = asInt(row[17]);
        int evidenceCount = asInt(row[18]);

        List<String> riskReasons = buildRiskReasons(
                evidenceRequired, taskTotal, taskBlocked, testFailed, testBlocked, openBugCount, criticalBugCount, evidenceCount);
        String traceabilityStatus = deriveStatus(requirementStatus, taskTotal, taskDone, testTotal, testPassed, riskReasons);

        String reqCode = row.length > 23 && row[23] != null ? asString(row[23]) : "REQ-" + requirementId;

        return new RtmRowResponse(
                requirementId,
                reqCode,
                asString(row[1]),
                asString(row[2]),
                asString(row[3]),
                asString(row[6]),
                asString(row[7]),
                requirementStatus,
                traceabilityStatus,
                evidenceRequired,
                taskTotal,
                taskDone,
                taskBlocked,
                testTotal,
                testPassed,
                testFailed,
                testBlocked,
                testNotRun,
                openBugCount,
                criticalBugCount,
                evidenceCount,
                riskReasons,
                parseLinkedItems(row[19]),
                parseLinkedItems(row[20]),
                parseLinkedItems(row[21]),
                parseLinkedItems(row[22])
        );
    }

    private String deriveStatus(String requirementStatus, int taskTotal, int taskDone, int testTotal, int testPassed, List<String> riskReasons) {
        boolean hasBlockingRisk = riskReasons.stream()
                .anyMatch(reason -> !"No implementation tasks linked".equals(reason));
        if (hasBlockingRisk) {
            return "AT_RISK";
        }
        if ("DONE".equals(requirementStatus)
                && (taskTotal == 0 || taskDone == taskTotal)
                && (testTotal == 0 || testPassed == testTotal)) {
            return "DONE";
        }
        if (taskTotal == 0 && testTotal == 0 && !"DONE".equals(requirementStatus)) {
            return "NOT_STARTED";
        }
        return "IN_PROGRESS";
    }

    private List<String> buildRiskReasons(
            boolean evidenceRequired,
            int taskTotal,
            int taskBlocked,
            int testFailed,
            int testBlocked,
            int openBugCount,
            int criticalBugCount,
            int evidenceCount) {
        List<String> reasons = new ArrayList<>();
        if (taskTotal == 0) {
            reasons.add("No implementation tasks linked");
        }
        if (taskBlocked > 0) {
            reasons.add(taskBlocked + " blocked task(s)");
        }
        if (testFailed > 0) {
            reasons.add(testFailed + " failed test case(s)");
        }
        if (testBlocked > 0) {
            reasons.add(testBlocked + " blocked test case(s)");
        }
        if (criticalBugCount > 0) {
            reasons.add(criticalBugCount + " critical/high open bug(s)");
        } else if (openBugCount > 0) {
            reasons.add(openBugCount + " open bug(s)");
        }
        if (evidenceRequired && evidenceCount == 0) {
            reasons.add("Required evidence is missing");
        }
        return reasons;
    }

    private RtmSummaryResponse buildSummary(List<RtmRowResponse> rows) {
        long done = rows.stream().filter(row -> "DONE".equals(row.traceabilityStatus())).count();
        long atRisk = rows.stream().filter(row -> "AT_RISK".equals(row.traceabilityStatus())).count();
        long notStarted = rows.stream().filter(row -> "NOT_STARTED".equals(row.traceabilityStatus())).count();
        long inProgress = rows.stream().filter(row -> "IN_PROGRESS".equals(row.traceabilityStatus())).count();

        return new RtmSummaryResponse(
                rows.size(),
                done,
                inProgress,
                atRisk,
                notStarted,
                rows.stream().mapToLong(RtmRowResponse::taskTotal).sum(),
                rows.stream().mapToLong(RtmRowResponse::taskDone).sum(),
                rows.stream().mapToLong(RtmRowResponse::testTotal).sum(),
                rows.stream().mapToLong(RtmRowResponse::testPassed).sum(),
                rows.stream().mapToLong(RtmRowResponse::testFailed).sum(),
                rows.stream().mapToLong(RtmRowResponse::openBugCount).sum(),
                rows.stream().mapToLong(RtmRowResponse::evidenceCount).sum()
        );
    }

    private RtmSummaryResponse summaryFromJson(JsonNode node) {
        return new RtmSummaryResponse(
                node.path("totalRequirements").asLong(),
                node.path("doneCount").asLong(),
                node.path("inProgressCount").asLong(),
                node.path("atRiskCount").asLong(),
                node.path("notStartedCount").asLong(),
                node.path("totalTasks").asLong(),
                node.path("completedTasks").asLong(),
                node.path("totalTests").asLong(),
                node.path("passedTests").asLong(),
                node.path("failedTests").asLong(),
                node.path("openBugs").asLong(),
                node.path("acceptedEvidence").asLong()
        );
    }

    private List<LinkedItemResponse> parseLinkedItems(Object jsonValue) {
        if (jsonValue == null) {
            return List.of();
        }
        try {
            return objectMapper.readValue(jsonValue.toString(), new TypeReference<List<LinkedItemResponse>>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    private JsonNode parseJson(Object jsonValue) {
        try {
            return objectMapper.readTree(jsonValue == null ? "{}" : jsonValue.toString());
        } catch (Exception ex) {
            return objectMapper.createObjectNode();
        }
    }

    private void ensureProjectMember(Long projectId, Long userId) {
        projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You do not have access to this project.", HttpStatus.FORBIDDEN));
    }

    private Long asLong(Object value) {
        return value == null ? null : ((Number) value).longValue();
    }

    private int asInt(Object value) {
        return value == null ? 0 : ((Number) value).intValue();
    }

    private String asString(Object value) {
        return value == null ? "" : value.toString();
    }

    private boolean asBoolean(Object value) {
        return value instanceof Boolean bool && bool;
    }

    private LocalDateTime asLocalDateTime(Object value) {
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime;
        }
        return null;
    }

    @Override
    @Transactional
    public void migrateSnapshotsToProjectScopedCode() {
        List<Object[]> snapshots = entityManager.createNativeQuery(
                "SELECT id, snapshot_data::text FROM rtm_snapshots").getResultList();

        for (Object[] row : snapshots) {
            Long snapshotId = asLong(row[0]);
            JsonNode data = parseJson(row[1]);

            if (data.has("rows")) {
                for (JsonNode rtmRow : data.get("rows")) {
                    if (rtmRow.has("requirementId")) {
                        Long reqId = rtmRow.get("requirementId").asLong();
                        try {
                            String reqCode = (String) entityManager.createNativeQuery("SELECT req_code FROM requirements WHERE id = :id")
                                    .setParameter("id", reqId)
                                    .getSingleResult();
                            if (reqCode != null) {
                                ((com.fasterxml.jackson.databind.node.ObjectNode) rtmRow).put("requirementCode", reqCode);
                            }
                        } catch (Exception e) {
                            // ignore if not found
                        }
                    }

                    updateItemsCode(rtmRow, "tasks", "SELECT task_code FROM tasks WHERE id = :id");
                    updateItemsCode(rtmRow, "testCases", "SELECT tc_code FROM test_cases WHERE id = :id");
                }
            }

            try {
                String updatedJson = objectMapper.writeValueAsString(data);
                entityManager.createNativeQuery("UPDATE rtm_snapshots SET snapshot_data = CAST(:data AS jsonb) WHERE id = :id")
                        .setParameter("data", updatedJson)
                        .setParameter("id", snapshotId)
                        .executeUpdate();
            } catch (Exception e) {
                // log.error("Failed to update snapshot " + snapshotId, e);
            }
        }
    }

    private void updateItemsCode(JsonNode rtmRow, String fieldName, String query) {
        if (rtmRow.has(fieldName)) {
            for (JsonNode item : rtmRow.get(fieldName)) {
                if (item.has("id")) {
                    Long itemId = item.get("id").asLong();
                    try {
                        String code = (String) entityManager.createNativeQuery(query)
                                .setParameter("id", itemId)
                                .getSingleResult();
                        if (code != null) {
                            ((com.fasterxml.jackson.databind.node.ObjectNode) item).put("code", code);
                        }
                    } catch (Exception e) {
                        // ignore
                    }
                }
            }
        }
    }
}
