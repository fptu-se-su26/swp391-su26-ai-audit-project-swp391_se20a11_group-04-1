package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ProjectResponse;
import org.example.backend.dto.PaginatedResponse;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectMember;
import org.example.backend.entity.ProjectStatus;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.service.ProjectService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<ProjectResponse> getProjectsForUser(
            Long userId, 
            int page, 
            int size, 
            String status, 
            String search, 
            String sortBy) {
        
        log.info("🔍 Querying projects for user ID: {} | Page: {}, Size: {}, Status: {}, Search: {}, Sort: {}", 
                userId, page, size, status, search, sortBy);

        // 1. Ánh xạ trạng thái nếu có lọc
        ProjectStatus projectStatus = null;
        if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) {
            try {
                // Hỗ trợ cả trường hợp UI gửi "active" -> map thành danh sách trạng thái hoặc check chi tiết
                projectStatus = ProjectStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("⚠️ Invalid status string received: {}. Ignoring status filter.", status);
            }
        }

        // 2. Thiết lập đối tượng sắp xếp (Sorting)
        Sort sort = Sort.by(Sort.Direction.DESC, "updatedAt"); // Mặc định: Mới nhất lên đầu (recent)
        if ("name".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "name");
        } else if ("deadline".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "deadline");
        }

        Pageable pageable = PageRequest.of(page, size, sort);

        // 3. Thực hiện truy vấn chuyên biệt tương ứng để đạt hiệu năng tối đa và tránh lỗi PostgreSQL
        Page<Project> projectPage;
        boolean hasStatus = (projectStatus != null);
        boolean hasSearch = (search != null && !search.trim().isEmpty());

        if (hasStatus && hasSearch) {
            projectPage = projectRepository.findProjectsByUserIdAndStatusAndSearch(userId, projectStatus, search.trim(), pageable);
        } else if (hasStatus) {
            projectPage = projectRepository.findProjectsByUserIdAndStatus(userId, projectStatus, pageable);
        } else if (hasSearch) {
            projectPage = projectRepository.findProjectsByUserIdAndSearch(userId, search.trim(), pageable);
        } else {
            projectPage = projectRepository.findProjectsByUserId(userId, pageable);
        }
        List<ProjectResponse> responses = new ArrayList<>();

        // 4. Lặp map dữ liệu. Nhờ @BatchSize(size = 20) trên Project.members,
        // Hibernate sẽ nạp toàn bộ thành viên của trang này chỉ với 1 câu lệnh SQL duy nhất!
        for (Project project : projectPage.getContent()) {
            
            // Tìm vai trò của chính user này trên RAM (không truy vấn DB thêm lần nào nữa!)
            String localRole = "Member";
            List<ProjectResponse.MemberDto> memberDtos = new ArrayList<>();

            if (project.getMembers() != null) {
                for (ProjectMember member : project.getMembers()) {
                    String name = member.getUser().getUsername();
                    if (member.getUser().getProfile() != null && member.getUser().getProfile().getFullName() != null) {
                        name = member.getUser().getProfile().getFullName();
                    }

                    // Tìm kiếm vai trò của người dùng hiện tại đang đăng nhập
                    if (member.getUser().getId().equals(userId)) {
                        String roleName = member.getRole().getName();
                        if ("PROJECT_LEADER".equalsIgnoreCase(roleName)) {
                            localRole = "Project Leader";
                        } else if ("MENTOR".equalsIgnoreCase(roleName)) {
                            localRole = "Mentor";
                        }
                    }

                    memberDtos.add(ProjectResponse.MemberDto.builder()
                            .id(member.getUser().getId())
                            .name(name)
                            .build());
                }
            }

            // Xây dựng ProjectResponse thô (không dính tới CSS của Frontend)
            responses.add(ProjectResponse.builder()
                    .id(project.getId().toString())
                    .title(project.getName())
                    .major(project.getAcademicContext() != null ? project.getAcademicContext().getSubject() : project.getType().name())
                    .status(project.getStatus().name())
                    .semester(project.getAcademicContext() != null ? project.getAcademicContext().getSemester() : "Fall 2023")
                    .role(localRole)
                    .atRiskReqCount(project.getAtRiskReqCount())
                    .deadline(project.getDeadline())
                    .progress(project.getProgress())
                    .aiInsight(project.getAiInsight() != null ? project.getAiInsight() : "On Track")
                    .members(memberDtos)
                    .build());
        }

        log.info("✨ Successfully loaded {} projects on page {} (Total items: {}) for user ID: {}", 
                responses.size(), page, projectPage.getTotalElements(), userId);

        return PaginatedResponse.<ProjectResponse>builder()
                .items(responses)
                .currentPage(projectPage.getNumber())
                .pageSize(projectPage.getSize())
                .totalItems(projectPage.getTotalElements())
                .totalPages(projectPage.getTotalPages())
                .hasMore(projectPage.hasNext())
                .build();
    }
}
