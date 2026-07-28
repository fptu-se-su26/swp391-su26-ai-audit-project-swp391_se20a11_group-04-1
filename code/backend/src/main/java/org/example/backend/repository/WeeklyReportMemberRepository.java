package org.example.backend.repository;

import org.example.backend.entity.WeeklyReportMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WeeklyReportMemberRepository extends JpaRepository<WeeklyReportMember, Long> {

    @Query("SELECT m FROM WeeklyReportMember m WHERE m.user.id = :userId")
    List<WeeklyReportMember> findByUserId(@Param("userId") Long userId);
}
