package com.adrde.airdrop.controller;

import com.adrde.airdrop.dto.SimulationRequest;
import com.adrde.airdrop.model.SimulationResult;
import com.adrde.airdrop.service.PhysicsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/simulate")
public class SimulationController {

    private final PhysicsService physicsService;

    public SimulationController(PhysicsService physicsService) {
        this.physicsService = physicsService;
    }

    @PostMapping
    public ResponseEntity<SimulationResult> simulate(@Valid @RequestBody SimulationRequest request) {
        SimulationResult result = physicsService.calculateSimulation(
                request.getAltitude(),
                request.getWindSpeed(),
                request.getWindDir(),
                request.getMass(),
                request.getDiameter(),
                request.getCanopyType()
        );
        return ResponseEntity.ok(result);
    }
}
