package org.example.backend.service;

import org.example.backend.dto.ClassroomResponse;
import org.example.backend.dto.CreateClassroomRequest;
import org.example.backend.dto.PaginatedResponse;

public interface ClassroomService {
    ClassroomResponse createClassroom(CreateClassroomRequest request, Long userId);
    PaginatedResponse<ClassroomResponse> getMyClassrooms(Long userId, int page, int size, String semester, String search);
}
