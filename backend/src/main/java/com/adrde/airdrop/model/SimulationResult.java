package com.adrde.airdrop.model;

import jakarta.persistence.*;

@Entity
@Table(name = "simulation_results")
public class SimulationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double terminalVelocity;
    private double descentTime;
    private double driftDistance;
    private double carpHeading;
    private double gForce;

    public SimulationResult() {}

    public SimulationResult(double terminalVelocity, double descentTime, double driftDistance, double carpHeading, double gForce) {
        this.terminalVelocity = terminalVelocity;
        this.descentTime = descentTime;
        this.driftDistance = driftDistance;
        this.carpHeading = carpHeading;
        this.gForce = gForce;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public double getTerminalVelocity() {
        return terminalVelocity;
    }

    public void setTerminalVelocity(double terminalVelocity) {
        this.terminalVelocity = terminalVelocity;
    }

    public double getDescentTime() {
        return descentTime;
    }

    public void setDescentTime(double descentTime) {
        this.descentTime = descentTime;
    }

    public double getDriftDistance() {
        return driftDistance;
    }

    public void setDriftDistance(double driftDistance) {
        this.driftDistance = driftDistance;
    }

    public double getCarpHeading() {
        return carpHeading;
    }

    public void setCarpHeading(double carpHeading) {
        this.carpHeading = carpHeading;
    }

    public double getgForce() {
        return gForce;
    }

    public void setgForce(double gForce) {
        this.gForce = gForce;
    }
}
