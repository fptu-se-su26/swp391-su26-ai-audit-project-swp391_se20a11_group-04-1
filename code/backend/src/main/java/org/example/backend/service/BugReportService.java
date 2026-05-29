package org.example.backend.service;

import org.example.backend.entity.BugReport;
import java.util.List;
import java.util.Map;

/**
 * Service managing the local lifecycle and workflows of BugReports.
 */
public interface BugReportService {

    /**
     * Retrieves a single BugReport by ID after verifying project membership.
     *
     * @param id     the BugReport ID
     * @param userId the current user's ID
     * @return the BugReport entity
     */
    BugReport getBugReport(Long id, Long userId);

    /**
     * Retrieves all BugReports belonging to a specific project.
     *
     * @param projectId the Project ID
     * @param userId    the current user's ID
     * @return a list of BugReport entities
     */
    List<BugReport> getProjectBugReports(Long projectId, Long userId);

    /**
     * Creates a new draft BugReport.
     *
     * @param projectId the Project ID
     * @param request   the request body payload map (to avoid redundant DTO classes)
     * @param userId    the reporter's user ID
     * @return the newly created BugReport entity
     */
    BugReport createBugReport(Long projectId, Map<String, Object> request, Long userId);

    /**
     * Approves and converts a draft BugReport into an active Task (type BUG_FIX),
     * and triggers synchronization to create a corresponding GitHub Issue.
     *
     * @param bugId  the BugReport ID
     * @param userId the approving leader's user ID
     * @return the updated BugReport entity
     */
    BugReport approveAndConvertBug(Long bugId, Long userId);
}
