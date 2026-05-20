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
}
