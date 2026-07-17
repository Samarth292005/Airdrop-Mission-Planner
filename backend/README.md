# Smart Airdrop Simulator - Backend Implementation Guide

This directory contains the Spring Boot backend implementation designed for the **Smart Airdrop Simulator**, aligned with your PS-II Weekly Diary Report. The backend includes REST API controllers, JPA database mapping, JWT authentication, and the core physics engine.

---

## 📁 Package & Directory Structure

Here is the structure of the maven project:
```
backend/
├── pom.xml
└── src/
    └── main/
        ├── java/com/adrde/airdrop/
        │   ├── AirdropBackendApplication.java (Main entry point)
        │   ├── config/
        │   │   ├── SecurityConfig.java (CORS, Endpoint rules, Password hashing)
        │   │   ├── JwtAuthenticationFilter.java (Secures requests with Bearer tokens)
        │   │   └── JwtService.java (JWT generation & validation engine)
        │   ├── controller/
        │   │   ├── AuthController.java (POST /api/auth/register & /api/auth/login)
        │   │   ├── SimulationController.java (POST /api/simulate - JWT secured)
        │   │   └── MissionController.java (POST /api/missions & GET /api/missions - JWT secured)
        │   ├── dto/
        │   │   ├── AuthRequest.java
        │   │   ├── AuthResponse.java
        │   │   └── SimulationRequest.java
        │   ├── model/
        │   │   ├── User.java (Users database entity)
        │   │   ├── Mission.java (Saved mission parameter entity)
        │   │   └── SimulationResult.java (Calculated outputs entity)
        │   ├── repository/
        │   │   ├── UserRepository.java (User SQL query layer)
        │   │   └── MissionRepository.java (Mission SQL query layer)
        │   └── service/
        │       └── PhysicsService.java (Calculates terminal velocity, drift, CARP, gForce)
        └── resources/
            └── application.properties (H2 & PostgreSQL configuration)
```

---

## 🛢️ Database Configuration & JPA Relationships

The database system supports both **H2 (in-memory, for immediate testing)** and **PostgreSQL**.

### 1. Database Connections (`application.properties`)
By default, the backend runs in **H2 Memory Mode** which requires no pre-configuration or local database servers:
* **H2 Console Link:** http://localhost:8080/h2-console
* **JDBC URL:** `jdbc:h2:mem:airdropdb`
* **Username:** `sa` | **Password:** `password`

To transition to PostgreSQL as specified in your PS-II diary report, uncomment the PostgreSQL config lines in `backend/src/main/resources/application.properties` and replace with your local credentials.

### 2. JPA Entities & SQL Foreign Key Relations
* **`User` (Many-to-One) `Mission`**: Each `User` can save multiple planning sheets.
* **`Mission` (One-to-One) `SimulationResult`**: Each saved mission config is linked to its calculated results.

---

## ⚙️ How to Import and Run in IntelliJ IDEA

Follow these steps to launch the backend in IntelliJ IDEA:

### Step 1: Open the Project in IntelliJ IDEA
1. Open **IntelliJ IDEA**.
2. Click on **File** ➜ **Open...**
3. Navigate to this directory: `c:\Users\asus\OneDrive\Desktop\ADRDE-DRDO\Airdrop Mission Planner\backend`
4. Click **OK**.
5. When prompted, open as a **Maven Project** and trust the project.

### Step 2: Allow Maven Sync to Complete
IntelliJ will automatically read the `pom.xml` file and download all dependencies (Spring Web, Spring Security, JPA, H2, PostgreSQL, JJWT). You will see the Maven progress bar in the bottom right corner.

### Step 3: Run the Application
1. Open the project tool window (`Alt + 1` or `Cmd + 1`).
2. Navigate to `src/main/java/com/adrde/airdrop/AirdropBackendApplication.java`.
3. Right-click the file and select **Run 'AirdropBackendApplication.main()'**.
4. The Spring Boot application will boot up on port **8080**.

---

## 🛡️ Authentication & API Request Flow

The backend handles requests in three distinct layers:

1. **`POST /api/auth/register`**: Creates a new user with BCrypt hashed passwords and returns a token.
2. **`POST /api/auth/login`**: Authenticates credentials and returns a token.
3. **`POST /api/simulate`**: Public/JWT request to run physics calculations.
4. **`POST /api/missions`** (JWT Sec): Saves a mission configuration and physics output.
5. **`GET /api/missions`** (JWT Sec): Retrieves the historical missions of the logged-in user.
