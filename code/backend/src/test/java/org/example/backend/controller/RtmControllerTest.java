package org.example.backend.controller;

import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.RtmMatrixResponse;
import org.example.backend.dto.RtmSnapshotRequest;
import org.example.backend.dto.RtmSnapshotResponse;
import org.example.backend.dto.RtmSummaryResponse;
import org.example.backend.exception.CustomException;
import org.example.backend.service.RtmService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RTM Controller")
class RtmControllerTest {

    @Mock
    RtmService rtmService;

    @InjectMocks
    RtmController rtmController;

    MockHttpSession authenticatedSession;

    @BeforeEach
    void setUp() {
        authenticatedSession = new MockHttpSession();
        authenticatedSession.setAttribute("userId", 1L);
    }

    @Test
    @DisplayName("Load matrix with session returns RTM response")
    void getMatrix_withSession_returnsResponse() {
        RtmSummaryResponse summary = emptySummary();
        RtmMatrixResponse matrix = new RtmMatrixResponse(100L, LocalDateTime.now(), summary, List.of());
        when(rtmService.getMatrix(100L, 1L)).thenReturn(matrix);

        ResponseEntity<ApiResponse<RtmMatrixResponse>> response = rtmController.getMatrix(100L, authenticatedSession);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData().projectId()).isEqualTo(100L);
        verify(rtmService).getMatrix(100L, 1L);
    }

    @Test
    @DisplayName("Load matrix without session throws 401")
    void getMatrix_withoutSession_throwsUnauthorized() {
        MockHttpSession emptySession = new MockHttpSession();

        assertThatThrownBy(() -> rtmController.getMatrix(100L, emptySession))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("Please log in");

        verifyNoInteractions(rtmService);
    }

    @Test
    @DisplayName("Save snapshot passes optional sprint id to service")
    void saveSnapshot_withSprintId_returnsCreated() {
        RtmSnapshotResponse snapshot = new RtmSnapshotResponse(7L, 100L, 3L, LocalDateTime.now(), emptySummary(), 4);
        when(rtmService.saveSnapshot(100L, 3L, 1L)).thenReturn(snapshot);

        ResponseEntity<ApiResponse<RtmSnapshotResponse>> response =
                rtmController.saveSnapshot(100L, new RtmSnapshotRequest(3L), authenticatedSession);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().id()).isEqualTo(7L);
        verify(rtmService).saveSnapshot(100L, 3L, 1L);
    }

    private RtmSummaryResponse emptySummary() {
        return new RtmSummaryResponse(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
}
