package org.example.backend.repository;

import org.example.backend.entity.UserGithubToken;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserGithubTokenRepository extends JpaRepository<UserGithubToken, Long> {

    @Cacheable(value = "githubTokens", key = "#id")
    Optional<UserGithubToken> findById(Long id);

    @CachePut(value = "githubTokens", key = "#entity.id")
    <S extends UserGithubToken> S save(S entity);
    
    @CacheEvict(value = "githubTokens", key = "#id")
    void deleteById(Long id);
}
