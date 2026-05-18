package org.example.backend.repository;

import org.example.backend.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByUsername(String username);

    Optional<UserAccount> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    /**
     * Tìm kiếm tài khoản bằng Username hoặc Email bằng Named Parameter an toàn chống SQL Injection tuyệt đối.
     */
    @Query("SELECT u FROM UserAccount u WHERE u.username = :usernameOrEmail OR u.email = :usernameOrEmail")
    Optional<UserAccount> findByUsernameOrEmail(@Param("usernameOrEmail") String usernameOrEmail);
}
