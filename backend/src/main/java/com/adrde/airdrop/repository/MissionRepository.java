package com.adrde.airdrop.repository;

import com.adrde.airdrop.model.Mission;
import com.adrde.airdrop.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MissionRepository extends JpaRepository<Mission, Long> {
    List<Mission> findByUserOrderByCreatedAtDesc(User user);
}
