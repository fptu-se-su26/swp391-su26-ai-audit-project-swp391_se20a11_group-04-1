package org.example.backend.service;

import org.example.backend.dto.ProfileResponse;
import org.example.backend.dto.UpdateProfileRequest;
import org.example.backend.dto.ChangePasswordRequest;
import org.example.backend.dto.ProfileStatisticsResponse;
import org.example.backend.dto.CoWorkerResponse;
import java.util.List;

public interface ProfileService {
    ProfileResponse getProfile(Long userId);
    ProfileResponse updateProfile(Long userId, UpdateProfileRequest request);
    void changePassword(Long userId, ChangePasswordRequest request);
    ProfileStatisticsResponse getProfileStatistics(Long userId);
    List<CoWorkerResponse> getCoWorkers(Long userId);
}
