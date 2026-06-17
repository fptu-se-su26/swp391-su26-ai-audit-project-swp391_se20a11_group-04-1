package org.example.backend.service;

import org.example.backend.dto.CodeInsightApprovalGateResponse;
import org.example.backend.entity.Task;

public interface CodeInsightApprovalGateService {
    CodeInsightApprovalGateResponse evaluate(Task task);

    void assertCanApprove(Task task);
}
