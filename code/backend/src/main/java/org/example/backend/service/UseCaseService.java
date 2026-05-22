package org.example.backend.service;

import org.example.backend.dto.UseCaseRequest;
import org.example.backend.dto.UseCaseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface UseCaseService {
    UseCaseResponse createUseCase(UseCaseRequest request, String username);
    UseCaseResponse getUseCaseById(Long id);
    List<UseCaseResponse> getAllUseCases(Long projectId);
    UseCaseResponse updateUseCase(Long id, UseCaseRequest request);
    UseCaseResponse updateUseCaseStatus(Long id, String status);
    void deleteUseCase(Long id);
    Page<UseCaseResponse> searchUseCases(Long projectId, String keyword, String status, Pageable pageable);
}
