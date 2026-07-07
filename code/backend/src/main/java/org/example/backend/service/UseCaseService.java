package org.example.backend.service;

import org.example.backend.dto.UseCaseRequest;
import org.example.backend.dto.UseCaseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface UseCaseService {
    UseCaseResponse createUseCase(UseCaseRequest request, Long userId);
    UseCaseResponse getUseCaseById(Long id);
    List<UseCaseResponse> getAllUseCases(Long projectId);
    UseCaseResponse updateUseCase(Long id, Long projectId, UseCaseRequest request);
    UseCaseResponse updateUseCaseStatus(Long id, Long projectId, org.example.backend.entity.UseCaseStatus status);
    UseCaseResponse deleteUseCase(Long id, Long projectId);
    Page<UseCaseResponse> searchUseCases(Long projectId, String keyword, String status, Boolean isDraft, Pageable pageable);

    UseCaseResponse approveUseCase(Long id, Long projectId, Long requirementId);
}
