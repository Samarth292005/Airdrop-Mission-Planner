package com.adrde.airdrop.service;

import com.adrde.airdrop.model.SimulationResult;
import org.springframework.stereotype.Service;

@Service
public class PhysicsService {

    public SimulationResult calculateSimulation(double altitude, double windSpeed, double windDir, double mass, double diameter, String canopyType) {
        double g = 9.81;
        // Exponential air density formula based on altitude
        double rho = 1.225 * Math.exp(-altitude / 8500.0);
        
        // Canopy Drag Coefficient: Round = 0.8, Ram-air = 0.5
        double cd = "round".equalsIgnoreCase(canopyType) ? 0.8 : 0.5;
        
        // Area of the parachute canopy
        double area = Math.PI * Math.pow(diameter / 2.0, 2);
        
        // Terminal velocity equation
        double vTerm = Math.sqrt((2.0 * mass * g) / (rho * cd * area));
        
        // Descent time calculation
        double descentTime = altitude / vTerm;
        
        // Wind penetration factor based on canopy steering capabilities:
        // Round canopies are non-steerable and drift fully (1.0).
        // Ram-air canopies are steerable gliding wings allowing active wind penetration/navigation (0.65).
        double windPenetration = "round".equalsIgnoreCase(canopyType) ? 1.0 : 0.65;
        
        // Drift distance calculation
        double drift = windSpeed * descentTime * windPenetration;
        
        // Computed Air Release Point (CARP) Heading:
        // Defined as the Run-in / Approach Heading (into the wind to minimize ground speed drift)
        // or the direction from the Target (PI) to the CARP (upwind).
        // For a wind coming from windDir, this heading is equal to windDir.
        double carpHeading = windDir % 360.0;
        
        // Landing impact g-force (deceleration) estimation
        double gForce = Math.pow(vTerm, 2) / (2.0 * 0.5 * 9.81);

        return new SimulationResult(vTerm, descentTime, drift, carpHeading, gForce);
    }
}
