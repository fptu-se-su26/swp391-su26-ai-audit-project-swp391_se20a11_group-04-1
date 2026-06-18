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

    @Query("select pm from ProjectMember pm join fetch pm.project join fetch pm.role where pm.user.id = :userId")
    List<ProjectMember> findByUserIdWithProjectAndRole(@Param("userId") Long userId);

    @Query("SELECT u.id, u.username, u.email, p.fullName, p.avatarUrl, COUNT(DISTINCT pm.project.id) " +
           "FROM ProjectMember pm " +
           "JOIN pm.user u " +
           "LEFT JOIN u.profile p " +
           "WHERE pm.project.id IN (SELECT pm2.project.id FROM ProjectMember pm2 WHERE pm2.user.id = :userId) " +
           "AND u.id != :userId " +
           "GROUP BY u.id, u.username, u.email, p.fullName, p.avatarUrl")
    List<Object[]> findCoWorkersByUserId(@Param("userId") Long userId);
}
