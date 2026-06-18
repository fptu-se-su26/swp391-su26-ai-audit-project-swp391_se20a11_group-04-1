package org.example.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.dto.*;
import org.example.backend.entity.*;
import org.example.backend.exception.DuplicateResourceException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.EvidenceLinkRepository;
import org.example.backend.repository.EvidenceRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EvidenceServiceImplTest {

    @Mock
    private EvidenceRepository evidenceRepository;

    @Mock
    private EvidenceLinkRepository evidenceLinkRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private EvidenceServiceImpl evidenceService;

    private UserAccount mockUser;
    private Evidence mockEvidence;

    @BeforeEach
    void setUp() {
        mockUser = new UserAccount();
        mockUser.setId(1L);
        mockUser.setUsername("testuser");

        mockEvidence = new Evidence();
        mockEvidence.setId(10L);
        mockEvidence.setProjectId(1L);
        mockEvidence.setTitle("Test Evidence");
        mockEvidence.setDescription("Test Description");
        mockEvidence.setType(EvidenceType.SCREENSHOT);
        mockEvidence.setStatus(EvidenceStatus.PENDING);
        mockEvidence.setUploadedBy(mockUser);
        mockEvidence.setEvidenceLinks(new ArrayList<>());
    }

    @Test
    void searchEvidence_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Evidence> page = new PageImpl<>(List.of(mockEvidence));

        when(evidenceRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        Page<EvidenceResponse> result = evidenceService.searchEvidence(1L, "keyword", "SCREENSHOT", "PENDING", 1L, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(mockEvidence.getId(), result.getContent().get(0).getId());
        verify(evidenceRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void getEvidenceById_Success() {
        when(evidenceRepository.findById(10L)).thenReturn(Optional.of(mockEvidence));

        EvidenceResponse response = evidenceService.getEvidenceById(10L);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Test Evidence", response.getTitle());
    }

    @Test
    void getEvidenceById_NotFound_ThrowsException() {
        when(evidenceRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> evidenceService.getEvidenceById(99L));
    }

    @Test
    void createEvidence_Success() throws IOException {
        EvidenceRequest request = new EvidenceRequest();
        request.setTitle("New Evidence");
        request.setType("SCREENSHOT");
        request.setFile(new MockMultipartFile("file", "test.png", "image/png", "test data".getBytes()));

        when(userAccountRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(fileStorageService.storeFile(any())).thenReturn("http://url/test.png");
        when(evidenceRepository.save(any(Evidence.class))).thenAnswer(invocation -> {
            Evidence e = invocation.getArgument(0);
            e.setId(11L);
            return e;
        });

        EvidenceResponse response = evidenceService.createEvidence(request);

        assertNotNull(response);
        assertEquals(11L, response.getId());
        assertEquals("New Evidence", response.getTitle());
        assertEquals("http://url/test.png", response.getFileUrl());
        verify(evidenceRepository).save(any(Evidence.class));
        verify(fileStorageService).storeFile(any());
    }

    @Test
    void updateEvidence_Success() throws IOException {
        EvidenceRequest request = new EvidenceRequest();
        request.setTitle("Updated Title");
        request.setType("DOCUMENT");
        request.setFile(new MockMultipartFile("file", "updated.pdf", "application/pdf", "data".getBytes()));

        mockEvidence.setFileUrl("old_url.png");

        when(evidenceRepository.findById(10L)).thenReturn(Optional.of(mockEvidence));
        when(fileStorageService.storeFile(any())).thenReturn("http://url/updated.pdf");
        when(evidenceRepository.save(any(Evidence.class))).thenReturn(mockEvidence);

        EvidenceResponse response = evidenceService.updateEvidence(10L, request);

        assertNotNull(response);
        assertEquals("Updated Title", response.getTitle());
        assertEquals("DOCUMENT", response.getType());
        assertEquals("http://url/updated.pdf", response.getFileUrl());
        
        verify(fileStorageService).deleteFile("old_url.png");
        verify(fileStorageService).storeFile(any());
        verify(evidenceRepository).save(any(Evidence.class));
    }

    @Test
    void updateEvidenceStatus_Success() {
        EvidenceStatusUpdateRequest request = new EvidenceStatusUpdateRequest();
        request.setStatus("ACCEPTED");

        when(evidenceRepository.findById(10L)).thenReturn(Optional.of(mockEvidence));
        when(userAccountRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(evidenceRepository.save(any(Evidence.class))).thenReturn(mockEvidence);

        EvidenceResponse response = evidenceService.updateEvidenceStatus(10L, request);

        assertNotNull(response);
        assertEquals("ACCEPTED", response.getStatus());
        assertEquals(mockUser.getId(), response.getReviewedById());
        verify(evidenceRepository).save(any(Evidence.class));
    }

    @Test
    void deleteEvidence_Success() {
        mockEvidence.setFileUrl("http://url/test.png");
        when(evidenceRepository.findById(10L)).thenReturn(Optional.of(mockEvidence));

        evidenceService.deleteEvidence(10L);

        verify(fileStorageService).deleteFile("http://url/test.png");
        verify(evidenceRepository).delete(mockEvidence);
    }

    @Test
    void deleteEvidence_NotFound_ThrowsException() {
        when(evidenceRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> evidenceService.deleteEvidence(99L));
        verify(evidenceRepository, never()).delete(any(Evidence.class));
    }

    @Test
    void linkEntity_Success() {
        EvidenceLinkRequest request = new EvidenceLinkRequest();
        request.setEntityType("BUG_REPORT");
        request.setEntityId(100L);

        when(evidenceRepository.findById(10L)).thenReturn(Optional.of(mockEvidence));
        when(evidenceRepository.save(any(Evidence.class))).thenReturn(mockEvidence);

        EvidenceResponse response = evidenceService.linkEntity(10L, request);

        assertNotNull(response);
        verify(evidenceRepository).save(mockEvidence);
    }

    @Test
    void linkEntity_Duplicate_ThrowsException() {
        EvidenceLinkRequest request = new EvidenceLinkRequest();
        request.setEntityType("BUG_REPORT");
        request.setEntityId(100L);

        EvidenceLink existingLink = new EvidenceLink();
        existingLink.setEntityType(EvidenceEntityType.BUG_REPORT);
        existingLink.setEntityId(100L);
        mockEvidence.getEvidenceLinks().add(existingLink);

        when(evidenceRepository.findById(10L)).thenReturn(Optional.of(mockEvidence));

        assertThrows(DuplicateResourceException.class, () -> evidenceService.linkEntity(10L, request));
        verify(evidenceRepository, never()).save(any());
    }

    @Test
    void unlinkEntity_Success() {
        EvidenceLink existingLink = new EvidenceLink();
        existingLink.setId(50L);
        mockEvidence.getEvidenceLinks().add(existingLink);

        when(evidenceRepository.findById(10L)).thenReturn(Optional.of(mockEvidence));
        when(evidenceRepository.save(any(Evidence.class))).thenReturn(mockEvidence);

        evidenceService.unlinkEntity(10L, 50L);

        assertTrue(mockEvidence.getEvidenceLinks().isEmpty());
        verify(evidenceRepository).save(mockEvidence);
    }

    @Test
    void unlinkEntity_NotFound_ThrowsException() {
        when(evidenceRepository.findById(10L)).thenReturn(Optional.of(mockEvidence));

        assertThrows(ResourceNotFoundException.class, () -> evidenceService.unlinkEntity(10L, 99L));
        verify(evidenceRepository, never()).save(any());
    }
}
