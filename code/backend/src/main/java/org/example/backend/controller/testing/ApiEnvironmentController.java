package org.example.backend.controller.testing;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.apitest.ApiEnvironmentRequest;
import org.example.backend.dto.apitest.ApiEnvironmentResponse;
import org.example.backend.entity.ApiEnvironment;
import org.example.backend.entity.Project;
import org.example.backend.dto.ApiResponse;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.ApiEnvironmentRepository;
import org.example.backend.repository.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/api-environments")
@RequiredArgsConstructor
public class ApiEnvironmentController {

    private final ApiEnvironmentRepository apiEnvironmentRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ApiResponse<List<ApiEnvironmentResponse>> getEnvironments(@PathVariable Long projectId) {
        List<ApiEnvironment> environments = apiEnvironmentRepository.findByProjectId(projectId);
        List<ApiEnvironmentResponse> responses = environments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ApiResponse.success(responses, "Environments retrieved successfully");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ApiEnvironmentResponse> createEnvironment(
            @PathVariable Long projectId,
            @RequestBody ApiEnvironmentRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        ApiEnvironment environment = new ApiEnvironment();
        environment.setProject(project);
        environment.setName(request.getName());
        try {
            if (request.getVariables() != null) {
                environment.setVariables(objectMapper.writeValueAsString(request.getVariables()));
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize variables", e);
        }

        environment = apiEnvironmentRepository.save(environment);
        return ApiResponse.success(mapToResponse(environment), "Environment created successfully");
    }

    @PutMapping("/{id}")
    public ApiResponse<ApiEnvironmentResponse> updateEnvironment(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @RequestBody ApiEnvironmentRequest request) {
        ApiEnvironment environment = apiEnvironmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Environment not found"));

        if (!environment.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Environment does not belong to project");
        }

        environment.setName(request.getName());
        try {
            if (request.getVariables() != null) {
                environment.setVariables(objectMapper.writeValueAsString(request.getVariables()));
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize variables", e);
        }

        environment = apiEnvironmentRepository.save(environment);
        return ApiResponse.success(mapToResponse(environment), "Environment updated successfully");
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEnvironment(
            @PathVariable Long projectId,
            @PathVariable Long id) {
        ApiEnvironment environment = apiEnvironmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Environment not found"));

        if (!environment.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Environment does not belong to project");
        }

        apiEnvironmentRepository.delete(environment);
    }

    private ApiEnvironmentResponse mapToResponse(ApiEnvironment environment) {
        ApiEnvironmentResponse response = new ApiEnvironmentResponse();
        response.setId(environment.getId());
        response.setProjectId(environment.getProject().getId());
        response.setName(environment.getName());
        try {
            if (environment.getVariables() != null) {
                response.setVariables(objectMapper.readValue(environment.getVariables(), new TypeReference<>() {}));
            }
        } catch (JsonProcessingException e) {
            // Ignore parse errors on read
        }
        return response;
    }
}
