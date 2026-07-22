package org.example.backend.service;

import org.example.backend.dto.BusinessModuleRequest;
import org.example.backend.dto.BusinessModuleResponse;
import java.util.List;

public interface BusinessModuleService {
    BusinessModuleResponse createModule(Long projectId, BusinessModuleRequest request, Long userId);
    BusinessModuleResponse updateModule(Long id, Long projectId, BusinessModuleRequest request, Long userId);
    void deleteModule(Long id, Long projectId, Long userId);
    List<BusinessModuleResponse> getModulesByProject(Long projectId);
    BusinessModuleResponse assignMember(Long id, Long projectId, Long assigneeId, Long userId);
}
