package org.example.backend.repository;

import org.example.backend.entity.UserAppeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserAppealRepository extends JpaRepository<UserAppeal, Long> {
    
    /**
     * Tìm đơn kháng cáo mới nhất của một người dùng.
     */
    Optional<UserAppeal> findFirstByUserIdOrderByIdDesc(Long userId);

    /**
     * Tìm đơn kháng cáo có trạng thái cụ thể mới nhất của một người dùng (ví dụ: PENDING).
     */
    Optional<UserAppeal> findFirstByUserIdAndStatusOrderByIdDesc(Long userId, String status);
}
