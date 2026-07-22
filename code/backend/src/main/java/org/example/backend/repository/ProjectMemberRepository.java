package org.example.backend.repository;

import org.example.backend.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByProjectId(Long projectId);
    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    @Query("SELECT pm FROM ProjectMember pm JOIN FETCH pm.user WHERE pm.project.id = :projectId")
    List<ProjectMember> findByProjectIdWithUsers(@Param("projectId") Long projectId);

    @Query("select pm from ProjectMember pm join pm.role r where pm.project.id = :projectId and upper(r.name) = upper(:roleName)")
    List<ProjectMember> findByProjectIdAndRoleName(@Param("projectId") Long projectId, @Param("roleName") String roleName);

    @Query("SELECT pm FROM ProjectMember pm JOIN FETCH pm.project JOIN FETCH pm.role WHERE pm.user.id = :userId")
    List<ProjectMember> findByUserIdWithProjectAndRole(@Param("userId") Long userId);

    @Query("SELECT other.user.id, other.user.username, other.user.email, profile.fullName, profile.avatarUrl, COUNT(other.project.id) " +
           "FROM ProjectMember pm, ProjectMember other " +
           "LEFT JOIN other.user.profile profile " +
           "WHERE pm.project.id = other.project.id " +
           "AND pm.user.id = :userId " +
           "AND other.user.id <> :userId " +
           "GROUP BY other.user.id, other.user.username, other.user.email, profile.fullName, profile.avatarUrl " +
           "ORDER BY COUNT(other.project.id) DESC, profile.fullName ASC")
    List<Object[]> findCoWorkersByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(pm.id) > 0 " +
           "FROM ProjectMember pm, ProjectMember other " +
           "WHERE pm.project.id = other.project.id " +
           "AND pm.user.id = :viewerId " +
           "AND other.user.id = :targetUserId")
    boolean existsSharedProjectMembership(
            @Param("viewerId") Long viewerId,
            @Param("targetUserId") Long targetUserId);
}
