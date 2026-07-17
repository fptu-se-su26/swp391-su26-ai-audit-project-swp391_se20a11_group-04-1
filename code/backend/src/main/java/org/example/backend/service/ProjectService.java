package org.example.backend.service;

import org.example.backend.dto.ProjectClosureCheckResponse;
import org.example.backend.dto.ProjectCloseRequest;
import org.example.backend.dto.ProjectReopenRequest;
import org.example.backend.dto.ProjectResponse;
import org.example.backend.dto.PaginatedResponse;
import org.example.backend.dto.ProjectDashboardResponse;

public interface ProjectService {
    /**
     * Lấy danh sách phân trang các dự án của một tài khoản cụ thể kèm vai trò và thành viên
     */
    PaginatedResponse<ProjectResponse> getProjectsForUser(
        Long userId, 
        int page, 
        int size, 
        String status, 
        String search, 
        String sortBy
    );

    /**
     * Lấy chi tiết dự án theo ID (bao gồm cả danh sách thành viên)
     */
    ProjectResponse getProjectById(Long projectId, Long userId);

    /**
     * Lấy thống kê Dashboard cho project
     */
    ProjectDashboardResponse getProjectDashboard(Long projectId, Long userId);

    /**
     * Tạo mới một dự án và tự động gán quyền PROJECT_LEADER cho người tạo
     */
    ProjectResponse createProject(ProjectResponse.CreateProjectRequest request, Long userId);

    /**
     * Mời một thành viên mới vào dự án bằng Email (Yêu cầu tài khoản đã tồn tại)
     * Gửi lời mời và email, tạo ProjectInvitation.
     */
    void inviteMember(Long projectId, String email, Long invitedByUserId);

    /**
     * Đồng ý tham gia dự án từ lời mời (hỗ trợ cả token từ email hoặc invitationId từ in-app)
     */
    void acceptInvitation(Long invitationId, String token, Long userId);

    /**
     * Từ chối lời mời (hỗ trợ cả token từ email hoặc invitationId từ in-app)
     */
    void rejectInvitation(Long invitationId, String token, Long userId);

    /**
     * Xóa một thành viên khỏi dự án
     */
    void removeMember(Long projectId, Long memberUserId, Long callingUserId);

    /**
     * Thay đổi quyền Leader của dự án (Hạ leader cũ thành MEMBER, ứng cử thành viên mới thành PROJECT_LEADER)
     */
    void changeProjectLeader(Long projectId, Long newLeaderUserId, Long currentLeaderUserId);

    /**
     * Thay đổi vai trò của thành viên trong dự án (ví dụ lên MENTOR)
     */
    void changeMemberRole(Long projectId, Long memberUserId, String newRoleName, Long callingUserId);

    /**
     * Xóa nhóm thủ công (chỉ dành cho người tạo ra nhóm đó)
     */
    void deleteProject(Long projectId, Long userId);

    /**
     * Cho phép một sinh viên tự tham gia vào dự án
     */
    void joinProject(Long projectId, Long userId);

    /**
     * Kiểm tra các hạng mục chưa hoàn thành trước khi đóng project
     */
    ProjectClosureCheckResponse checkProjectClosure(Long projectId, Long userId);

    /**
     * Đóng project: xử lý task/bug còn mở, chuyển status → ARCHIVED, ghi audit log
     */
    void closeProject(Long projectId, ProjectCloseRequest request, Long userId);

    /**
     * Mở lại project đã đóng (ARCHIVED → ACTIVE)
     */
    void reopenProject(Long projectId, ProjectReopenRequest request, Long userId);

    /**
     * Cập nhật thông tin cơ bản và appearance của project (General Settings)
     */
    ProjectResponse updateProject(Long projectId, ProjectResponse.UpdateProjectRequest request, Long userId);

    /**
     * Lấy số lượng dự án theo từng trạng thái của một người dùng
     */
    java.util.Map<String, Long> getProjectCountsForUser(Long userId);
}

