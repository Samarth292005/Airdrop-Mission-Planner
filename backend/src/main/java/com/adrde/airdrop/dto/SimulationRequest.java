package com.adrde.airdrop.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class SimulationRequest {

    @NotNull
    @Min(value = 1, message = "Altitude must be greater than zero")
    private Double altitude;

    @NotNull
    @Min(value = 1, message = "Aircraft speed must be greater than zero")
    private Double speed;

    @NotNull
    @Min(value = 0, message = "Wind speed must be non-negative")
    private Double windSpeed;

    @NotNull
    private Double windDir;

    @NotNull
    @Min(value = 1, message = "Mass must be greater than zero")
    private Double mass;

    @NotNull
    @Min(value = 0, message = "Canopy diameter must be greater than zero")
    private Double diameter;

    @NotNull
    private String canopyType;

    public SimulationRequest() {}

    public Double getAltitude() {
        return altitude;
    }

    public void setAltitude(Double altitude) {
        this.altitude = altitude;
    }

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public Double getWindSpeed() {
        return windSpeed;
    }

    public void setWindSpeed(Double windSpeed) {
        this.windSpeed = windSpeed;
    }

    public Double getWindDir() {
        return windDir;
    }

    public void setWindDir(Double windDir) {
        this.windDir = windDir;
    }

    public Double getMass() {
        return mass;
    }

    public void setMass(Double mass) {
        this.mass = mass;
    }

    public Double getDiameter() {
        return diameter;
    }

    public void setDiameter(Double diameter) {
        this.diameter = diameter;
    }

    public String getCanopyType() {
        return canopyType;
    }

    public void setCanopyType(String canopyType) {
        this.canopyType = canopyType;
    }
}
