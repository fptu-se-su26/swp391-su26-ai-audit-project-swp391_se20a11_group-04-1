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

    @Query("select pm from ProjectMember pm join pm.role r where pm.project.id = :projectId and upper(r.name) = upper(:roleName)")
    List<ProjectMember> findByProjectIdAndRoleName(@Param("projectId") Long projectId, @Param("roleName") String roleName);
}
