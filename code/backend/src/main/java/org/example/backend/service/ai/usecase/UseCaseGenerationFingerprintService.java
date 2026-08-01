package org.example.backend.service.ai.usecase;

import org.example.backend.dto.ai.UseCaseGenerationContext;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;
import java.nio.charset.StandardCharsets;

@Service
public class UseCaseGenerationFingerprintService {

    public static final String PROMPT_VERSION = "module-use-case-v2";

    public String generateFingerprint(UseCaseGenerationContext context, String generationMode, boolean allowProposedActors, boolean regenerateMissingOnly) {
        StringBuilder sb = new StringBuilder();
        
        sb.append(context.getProject().getId()).append(":");
        sb.append(generationMode).append(":");
        sb.append(context.getTargetModule() != null ? context.getTargetModule().getId() : "null").append(":");
        sb.append(context.getTargetModule() != null ? context.getTargetModule().getUpdatedAt() : "null").append(":");
        
        // Hash requirements
        StringBuilder reqSb = new StringBuilder();
        context.getModuleRequirements().stream().sorted(java.util.Comparator.comparing(org.example.backend.entity.Requirement::getId))
            .forEach(r -> reqSb.append(r.getId()).append("-").append(r.getUpdatedAt()).append("|"));
        sb.append(DigestUtils.md5DigestAsHex(reqSb.toString().getBytes(StandardCharsets.UTF_8))).append(":");
        
        // Hash actors
        StringBuilder actorSb = new StringBuilder();
        context.getExistingActors().stream().sorted(java.util.Comparator.comparing(org.example.backend.entity.ProjectActor::getId))
            .forEach(a -> actorSb.append(a.getId()).append("-").append(a.getUpdatedAt()).append("|"));
        sb.append(DigestUtils.md5DigestAsHex(actorSb.toString().getBytes(StandardCharsets.UTF_8))).append(":");
        
        // Hash existing use cases
        StringBuilder ucSb = new StringBuilder();
        context.getExistingUseCases().stream().sorted(java.util.Comparator.comparing(org.example.backend.entity.UseCase::getId))
            .forEach(u -> ucSb.append(u.getId()).append("-").append(u.getUpdatedAt()).append("|"));
        sb.append(DigestUtils.md5DigestAsHex(ucSb.toString().getBytes(StandardCharsets.UTF_8))).append(":");
        
        sb.append(allowProposedActors).append(":");
        sb.append(regenerateMissingOnly).append(":");
        sb.append(PROMPT_VERSION);
        
        return DigestUtils.md5DigestAsHex(sb.toString().getBytes(StandardCharsets.UTF_8));
    }
}
