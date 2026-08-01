package org.example.backend.dto.ai;

import lombok.Data;
import java.util.List;

@Data
public class ModuleDiscoveryResult {
    private List<GeneratedModuleDraft> modules;
    private List<Long> unassignedRequirementIds;
    private List<String> warnings;
}
