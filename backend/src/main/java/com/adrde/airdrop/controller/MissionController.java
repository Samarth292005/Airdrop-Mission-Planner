package com.adrde.airdrop.controller;

import com.adrde.airdrop.dto.SimulationRequest;
import com.adrde.airdrop.model.Mission;
import com.adrde.airdrop.model.SimulationResult;
import com.adrde.airdrop.model.User;
import com.adrde.airdrop.repository.MissionRepository;
import com.adrde.airdrop.service.PhysicsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/missions")
public class MissionController {

    private final MissionRepository missionRepository;
    private final PhysicsService physicsService;

    public MissionController(MissionRepository missionRepository, PhysicsService physicsService) {
        this.missionRepository = missionRepository;
        this.physicsService = physicsService;
    }

    @PostMapping
    public ResponseEntity<Mission> saveMission(
            @Valid @RequestBody SimulationRequest request,
            @AuthenticationPrincipal User user
    ) {
        // Run physics simulator to calculate results
        SimulationResult result = physicsService.calculateSimulation(
                request.getAltitude(),
                request.getWindSpeed(),
                request.getWindDir(),
                request.getMass(),
                request.getDiameter(),
                request.getCanopyType()
        );

        // Populate Mission entity
        Mission mission = new Mission();
        mission.setAltitude(request.getAltitude());
        mission.setSpeed(request.getSpeed() != null ? request.getSpeed() : 0.0);
        mission.setMass(request.getMass());
        mission.setDiameter(request.getDiameter());
        mission.setWindSpeed(request.getWindSpeed());
        mission.setWindDir(request.getWindDir());
        mission.setCanopyType(request.getCanopyType());
        mission.setUser(user);
        mission.setSimulationResult(result);

        Mission savedMission = missionRepository.save(mission);
        return ResponseEntity.ok(savedMission);
    }

    @GetMapping
    public ResponseEntity<List<Mission>> getMissions(@AuthenticationPrincipal User user) {
        List<Mission> missions = missionRepository.findByUserOrderByCreatedAtDesc(user);
        return ResponseEntity.ok(missions);
    }
}
