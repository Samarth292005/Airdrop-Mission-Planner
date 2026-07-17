# run-backend.ps1
# Automates downloading Maven and running the Spring Boot backend

$ErrorActionPreference = "Stop"

# 1. Check if Maven is already present locally
$mavenDir = Join-Path $PSScriptRoot "apache-maven-3.9.6"
$mvnCmd = Join-Path $mavenDir "bin\mvn.cmd"

if (-not (Test-Path $mavenDir)) {
    Write-Host "Portable Maven not found. Downloading Maven 3.9.6..." -ForegroundColor Cyan
    $zipPath = Join-Path $PSScriptRoot "maven.zip"
    $url = "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
    
    # Download
    Invoke-WebRequest -Uri $url -OutFile $zipPath
    
    Write-Host "Extracting Maven..." -ForegroundColor Cyan
    # Extract
    Expand-Archive -Path $zipPath -DestinationPath $PSScriptRoot
    
    # Clean up zip file
    Remove-Item $zipPath
    Write-Host "Maven set up successfully." -ForegroundColor Green
}

# 2. Compile and run the Spring Boot Application
Write-Host "Starting Spring Boot backend on http://localhost:8080..." -ForegroundColor Green
& $mvnCmd spring-boot:run
