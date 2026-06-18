package org.example.backend.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TaskRequestTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void missingRequirementIdIsNotTreatedAsClearIntent() throws Exception {
        TaskRequest request = objectMapper.readValue("{\"title\":\"Update checklist\"}", TaskRequest.class);

        assertThat(request.getRequirementId()).isNull();
        assertThat(request.isRequirementIdPresent()).isFalse();
    }

    @Test
    void nullRequirementIdIsTreatedAsExplicitClearIntent() throws Exception {
        TaskRequest request = objectMapper.readValue("{\"requirementId\":null}", TaskRequest.class);

        assertThat(request.getRequirementId()).isNull();
        assertThat(request.isRequirementIdPresent()).isTrue();
    }

    @Test
    void numericRequirementIdIsTreatedAsExplicitUpdateIntent() throws Exception {
        TaskRequest request = objectMapper.readValue("{\"requirementId\":11}", TaskRequest.class);

        assertThat(request.getRequirementId()).isEqualTo(11L);
        assertThat(request.isRequirementIdPresent()).isTrue();
    }
}
