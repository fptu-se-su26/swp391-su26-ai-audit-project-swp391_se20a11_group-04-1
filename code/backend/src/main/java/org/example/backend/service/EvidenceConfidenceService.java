package org.example.backend.service;

import org.example.backend.entity.EvidenceConfidenceLevel;
import org.example.backend.entity.Task;

public interface EvidenceConfidenceService {
    EvidenceConfidenceLevel calculate(Task task);
    EvidenceConfidenceLevel calculateForCodeTask(Task task);
    EvidenceConfidenceLevel calculateForNonCodeTask(Task task);
}
