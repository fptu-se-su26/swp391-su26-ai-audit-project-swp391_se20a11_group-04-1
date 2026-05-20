package org.example.backend.service;

import org.example.backend.dto.ProjectResponse;
import org.example.backend.dto.PaginatedResponse;

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
     * Tạo mới một dự án và tự động gán quyền PROJECT_LEADER cho người tạo
     */
    ProjectResponse createProject(ProjectResponse.CreateProjectRequest request, Long userId);

    /**
     * Mời một thành viên mới vào dự án bằng Email (Yêu cầu tài khoản đã tồn tại)
     */
    ProjectResponse.MemberDto inviteMember(Long projectId, String email, Long invitedByUserId);

    /**
     * Thay đổi quyền Leader của dự án (Hạ leader cũ thành MEMBER, ứng cử thành viên mới thành PROJECT_LEADER)
     */
    void changeProjectLeader(Long projectId, Long newLeaderUserId, Long currentLeaderUserId);
}

