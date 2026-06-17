package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ClassroomResponse;
import org.example.backend.dto.CreateClassroomRequest;
import org.example.backend.dto.PaginatedResponse;
import org.example.backend.entity.AcademicContext;
import org.example.backend.entity.AcademicSeason;
import org.example.backend.entity.UserAccount;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.AcademicContextRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.ClassroomService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClassroomServiceImpl implements ClassroomService {

    private final AcademicContextRepository academicContextRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    @Transactional
    public ClassroomResponse createClassroom(CreateClassroomRequest request, Long userId) {
        UserAccount owner = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));

        if (owner.getVerifyStatus() != org.example.backend.entity.VerifyStatus.VERIFIED && !"ADMIN".equals(owner.getSystemRole().getName())) {
            throw new BadRequestException("Chỉ những tài khoản đã được xác thực (Verified) mới có thể tạo Lớp học.");
        }

        AcademicSeason semester;
        try {
            semester = AcademicSeason.valueOf(request.getSemester().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Học kỳ không hợp lệ.");
        }

        int maxMembers = request.getMaxMembers();
        if (maxMembers > 50 || maxMembers < 5) {
            throw new BadRequestException("Số lượng thành viên tối đa phải từ 5 đến 50.");
        }

        AcademicContext classroom = AcademicContext.builder()
                .subject(request.getSubject().trim())
                .semester(semester)
                .academicYear(request.getAcademicYear() != null ? request.getAcademicYear() : "")
                .owner(owner)
                .maxMembers(maxMembers)
                .startDate(LocalDate.now())
                .build();

        AcademicContext savedClassroom = academicContextRepository.save(classroom);

        return mapToResponse(savedClassroom);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<ClassroomResponse> getMyClassrooms(Long userId, int page, int size, String semesterFilter, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        AcademicSeason seasonFilter = null;
        if (semesterFilter != null && !semesterFilter.isEmpty() && !semesterFilter.equalsIgnoreCase("all")) {
            try {
                // Front-end sends SP26, SU26, FA25 etc. 
                // We map them to the corresponding ENUM if possible, or frontend should send SPRING/SUMMER
                // For simplicity, let's assume frontend sends SPRING, SUMMER, FALL, PERSONAL
                seasonFilter = AcademicSeason.valueOf(semesterFilter.toUpperCase());
            } catch (Exception e) {
                // Ignore invalid semester filter
            }
        }

        Page<AcademicContext> classroomPage;
        if (seasonFilter != null || (search != null && !search.isEmpty())) {
            String searchQ = search == null ? "" : search;
            classroomPage = academicContextRepository.findByOwnerIdWithFilters(userId, seasonFilter, searchQ, pageable);
        } else {
            classroomPage = academicContextRepository.findByOwnerId(userId, pageable);
        }

        List<ClassroomResponse> content = classroomPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<ClassroomResponse>builder()
                .items(content)
                .currentPage(classroomPage.getNumber())
                .pageSize(classroomPage.getSize())
                .totalItems(classroomPage.getTotalElements())
                .totalPages(classroomPage.getTotalPages())
                .hasMore(!classroomPage.isLast())
                .build();
    }

    private ClassroomResponse mapToResponse(AcademicContext ac) {
        return ClassroomResponse.builder()
                .id(ac.getId())
                .subject(ac.getSubject())
                .semester(ac.getSemester().name())
                .academicYear(ac.getAcademicYear())
                .status(ac.getStatus().name())
                .maxMembers(ac.getMaxMembers())
                .startDate(ac.getStartDate())
                .endDate(ac.getEndDate())
                .memberCount(0) // Logic to count actual members if needed later
                .projectCount(0) // Logic to count projects if needed later
                .owner(ClassroomResponse.OwnerDto.builder()
                        .id(ac.getOwner().getId())
                        .fullName(ac.getOwner().getProfile() != null ? ac.getOwner().getProfile().getFullName() : ac.getOwner().getUsername())
                        .email(ac.getOwner().getEmail())
                        .build())
                .build();
    }
}
