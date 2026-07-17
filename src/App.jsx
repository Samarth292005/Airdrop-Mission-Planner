import { useState, useEffect } from "react";

const C = {
  paper: "#EAE3D2",
  paperDark: "#DDD4BC",
  ink: "#2B2620",
  inkSoft: "#675F4E",
  rule: "#B7AB8A",
  brown: "#8B6F47",
  red: "#9C3A2B",
  greenInk: "#3F5D3A",
};

const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "'Courier New', ui-monospace, monospace";
const SANS = "-apple-system, 'Helvetica Neue', Arial, sans-serif";

export default function AirdropPlanner() {
  // Input parameters
  const [altitude, setAltitude] = useState(1500);
  const [speed, setSpeed] = useState(130);
  const [mass, setMass] = useState(250);
  const [diameter, setDiameter] = useState(10);
  const [windSpeed, setWindSpeed] = useState(12);
  const [windDir, setWindDir] = useState(315);
  const [chute, setChute] = useState("round");
  const [result, setResult] = useState(null);
  const [abResult, setAbResult] = useState(null);
  const [tab, setTab] = useState("simulate");

  // Authentication & Backend State
  const [token, setToken] = useState(localStorage.getItem("airdrop_token") || "");
  const [username, setUsername] = useState(localStorage.getItem("airdrop_username") || "");
  const [missions, setMissions] = useState([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [apiError, setApiError] = useState("");

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  const API_BASE = "http://localhost:8080/api";

  const isValid =
    Number.isFinite(altitude) && altitude > 0 &&
    Number.isFinite(mass) && mass > 0 &&
    Number.isFinite(diameter) && diameter > 0 &&
    Number.isFinite(windSpeed) && windSpeed >= 0 &&
    Number.isFinite(windDir) && windDir >= 0 && windDir <= 360;

  // Fetch saved missions from database
  const fetchMissions = async (authToken) => {
    try {
      const activeToken = authToken || token;
      if (!activeToken) return;

      const res = await fetch(`${API_BASE}/missions`, {
        headers: {
          "Authorization": `Bearer ${activeToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMissions(data);
      }
    } catch (err) {
      console.error("Failed to fetch missions:", err);
    }
  };

  // Load missions on mount if authenticated
  useEffect(() => {
    if (token) {
      fetchMissions(token);
    }
  }, [token]);

  // Physics logic (local fallback / A/B calculations)
  function physics(alt, ws, wd, m, dia, type) {
    const g = 9.81;
    const rho = 1.225 * Math.exp(-alt / 8500);
    const cd = type === "round" ? 0.8 : 0.5;
    const area = Math.PI * (dia / 2) ** 2;
    const vTerm = Math.sqrt((2 * m * g) / (rho * cd * area));
    const descentTime = alt / vTerm;
    
    // Wind penetration factor based on canopy steering capabilities:
    // Round canopies are non-steerable and drift fully (1.0).
    // Ram-air canopies are steerable gliding wings allowing active wind penetration/navigation (0.65).
    const windPenetration = type === "round" ? 1.0 : 0.65;
    
    const drift = ws * descentTime * windPenetration;
    const carpHeading = wd % 360;
    const gForce = vTerm ** 2 / (2 * 0.5 * 9.81);
    return { vTerm, descentTime, drift, carpHeading, gForce };
  }

  // Handle Login or Register submit
  const handleLoginRegister = async (e) => {
    e.preventDefault();
    setAuthMsg("");
    const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("airdrop_token", data.token);
        localStorage.setItem("airdrop_username", data.username);
        setToken(data.token);
        setUsername(data.username);
        setShowAuthModal(false);
        setAuthPassword("");
        fetchMissions(data.token);
      } else {
        const errorText = await res.text();
        setAuthMsg(errorText || "Authentication failed.");
      }
    } catch (err) {
      setAuthMsg("Server is offline. Local simulation fallback is active.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("airdrop_token");
    localStorage.removeItem("airdrop_username");
    setToken("");
    setUsername("");
    setMissions([]);
  };

  // Run simulation (triggers API call or local fallback)
  async function simulate() {
    if (!isValid) return;
    setIsOfflineMode(false);
    setApiError("");

    try {
      const res = await fetch(`${API_BASE}/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          altitude,
          speed,
          mass,
          diameter,
          windSpeed,
          windDir,
          canopyType: chute
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult({
          vTerm: data.terminalVelocity.toFixed(2),
          descentTime: data.descentTime.toFixed(1),
          drift: data.driftDistance.toFixed(0),
          carpHeading: data.carpHeading.toFixed(0),
        });
        return;
      }
    } catch (e) {
      console.log("Backend offline, falling back to local physics simulator.");
    }

    // Local physics simulation fallback
    setIsOfflineMode(true);
    const r = physics(altitude, windSpeed, windDir, mass, diameter, chute);
    setResult({
      vTerm: r.vTerm.toFixed(2),
      descentTime: r.descentTime.toFixed(1),
      drift: r.drift.toFixed(0),
      carpHeading: r.carpHeading.toFixed(0),
    });
  }

  // Save current drop parameters and output results to database
  const saveMission = async () => {
    if (!token) {
      setAuthMode("login");
      setAuthMsg("Please sign in to save your mission configurations.");
      setShowAuthModal(true);
      return;
    }

    setApiError("");
    try {
      const res = await fetch(`${API_BASE}/missions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          altitude,
          speed,
          mass,
          diameter,
          windSpeed,
          windDir,
          canopyType: chute
        })
      });

      if (res.ok) {
        alert("Mission configuration and physics results saved successfully to PostgreSQL!");
        fetchMissions(token);
      } else {
        const errText = await res.text();
        setApiError(errText || "Error saving mission.");
      }
    } catch (err) {
      setApiError("Backend database is unreachable. Mission not saved.");
    }
  };

  function runAB() {
    if (!isValid) return;
    setAbResult({
      round: physics(altitude, windSpeed, windDir, mass, diameter, "round"),
      ramair: physics(altitude, windSpeed, windDir, mass, diameter, "ramair"),
    });
  }

  const radius = 70,
    center = 100;
  const carpHeadingVal = windDir % 360;
  const scale = result ? Math.min(Number(result.drift) / 6, radius * 0.9) : 0;
  const angleRad = ((carpHeadingVal - 90) * Math.PI) / 180;
  const dotX = center + scale * Math.cos(angleRad);
  const dotY = center + scale * Math.sin(angleRad);
  const carpTextAnchor = dotX > center ? "start" : "end";
  const carpTextX = dotX > center ? dotX + 6 : dotX - 6;

  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);


  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.paper,
        backgroundImage: `radial-gradient(circle at 1px 1px, ${C.rule}33 1px, transparent 0)`,
        backgroundSize: "16px 16px",
        color: C.ink,
        fontFamily: SANS,
        padding: "36px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{`
        /* Hide spin buttons for Chrome, Safari, Edge, Opera */
        .afp-input::-webkit-outer-spin-button,
        .afp-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        /* Hide spin buttons for Firefox */
        .afp-input[type=number] {
          -moz-appearance: textfield;
        }

        .afp-input, .afp-select {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid ${C.rule};
          padding: 6px 2px 7px;
          font-size: 14px;
          font-family: ${MONO};
          color: ${C.ink};
          outline: none;
          box-sizing: border-box;
          transition: border-color .15s ease, background .15s ease;
        }
        .afp-input:focus, .afp-select:focus {
          border-bottom: 1px solid ${C.red};
          background: ${C.red}0d;
        }
        .afp-input.invalid {
          border-bottom: 1px solid ${C.red};
          background: ${C.red}14;
        }
        .afp-select { cursor: pointer; }
        
        .afp-tab {
          cursor: pointer;
          font-family: ${SERIF};
          font-size: 13px;
          letter-spacing: .02em;
          padding: 9px 20px 8px;
          border: 1px solid ${C.rule};
          border-bottom: none;
          border-radius: 4px 4px 0 0;
          background: ${C.paper};
          color: ${C.inkSoft};
          position: relative;
          top: 1px;
          transition: color 0.15s ease, background 0.15s ease;
        }
        .afp-tab.active {
          background: ${C.paperDark};
          color: ${C.ink};
          font-weight: 700;
        }
        .afp-tab:hover:not(.active) { color: ${C.ink}; }
        
        .afp-stamp {
          cursor: pointer;
          background: transparent;
          font-family: ${SERIF};
          font-weight: 700;
          font-size: 13px;
          letter-spacing: .06em;
          text-transform: uppercase;
          padding: 10px 24px;
          border: 2px double ${C.red};
          color: ${C.red};
          transform: rotate(-1.5deg);
          transition: transform .15s ease, background .15s ease, opacity .15s ease;
          display: inline-block;
          text-align: center;
        }
        .afp-stamp:hover { transform: rotate(0deg); background: ${C.red}10; }
        
        .afp-stamp.alt { border-color: ${C.greenInk}; color: ${C.greenInk}; transform: rotate(1.5deg); }
        .afp-stamp.alt:hover { transform: rotate(0deg); background: ${C.greenInk}10; }
        
        .afp-stamp.blue { border-color: ${C.ink}; color: ${C.ink}; transform: rotate(-0.5deg); }
        .afp-stamp.blue:hover { transform: rotate(0deg); background: ${C.ink}10; }

        .afp-stamp:disabled {
          opacity: .35;
          cursor: not-allowed;
          transform: none;
        }
        .afp-stamp:disabled:hover { background: transparent; }

        .afp-field-label {
          font-family: ${SANS};
          font-size: 11px;
          font-variant: small-caps;
          letter-spacing: .03em;
          color: ${C.inkSoft};
          display: block;
          margin-bottom: 3px;
        }
        
        @media (max-width: 760px) {
          .afp-grid-3 { grid-template-columns: 1fr !important; }
          .afp-col-rule { border-right: none !important; border-bottom: 1px solid ${C.rule}; }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 920 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
            paddingBottom: 16,
            borderBottom: `1px solid ${C.rule}`,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: SERIF,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: ".01em",
                color: C.ink,
              }}
            >
              Airdrop Mission Planning Sheet
            </h1>
            <p style={{ margin: "5px 0 0", fontSize: 12.5, color: C.inkSoft, fontStyle: "italic" }}>
              Form 41-D - enter drop parameters, then plot.
            </p>
          </div>

          {/* Credentials Info block */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {username ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontFamily: MONO, color: C.greenInk, fontWeight: "bold" }}>
                  OFFICER: {username.toUpperCase()}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    textDecoration: "underline",
                    fontSize: 11.5,
                    fontFamily: SERIF,
                    color: C.red,
                    padding: 0,
                  }}
                >
                  [ SIGN OUT ]
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode("login"); setAuthMsg(""); setShowAuthModal(true); }}
                style={{
                  cursor: "pointer",
                  background: "none",
                  border: `1.5px solid ${C.ink}`,
                  fontSize: 11,
                  fontFamily: SERIF,
                  fontWeight: 700,
                  letterSpacing: ".05em",
                  padding: "4px 10px",
                  color: C.ink,
                  transform: "rotate(-1deg)",
                  transition: "background 0.15s ease",
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = `${C.ink}10`; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                [ OFFICER SIGN IN ]
              </button>
            )}
            <div style={{ fontSize: 10, fontFamily: MONO, color: token ? C.greenInk : C.red }}>
              STATUS: {token ? "SECURED DATABASE NETWORK" : "LOCAL offline MODE"}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 0 }}>
          {[
            ["simulate", "Simulate"],
            ["ab", "A/B Compare"],
            ["history", "Saved Archives"],
          ].map(([id, label]) => (
            <div
              key={id}
              className={`afp-tab${tab === id ? " active" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </div>
          ))}
        </div>

        {/* SIMULATE TAB */}
        {tab === "simulate" && (
          <div style={{ border: `1px solid ${C.rule}`, background: C.paperDark }}>
            <div
              className="afp-grid-3"
              style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 1fr" }}
            >
              {/* Left */}
              <div className="afp-col-rule" style={{ padding: 22, borderRight: `1px solid ${C.rule}` }}>
                <SectionLabel title="Aircraft & cargo" />
                <Field label="Altitude (m)" value={altitude} onChange={setAltitude} min={1} />
                <Field label="Speed (kt)" value={speed} onChange={setSpeed} min={1} />
                <Field label="Mass (kg)" value={mass} onChange={setMass} min={1} />
                <Field label="Canopy diameter (m)" value={diameter} onChange={setDiameter} min={0.1} step={0.1} />
              </div>

              {/* Centre */}
              <div style={{ padding: 22, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 10.5,
                    fontVariant: "small-caps",
                    letterSpacing: ".05em",
                    color: C.inkSoft,
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  Plotting board
                </div>

                <svg viewBox="0 0 200 200" style={{ width: "100%", maxWidth: 260, display: "block" }}>
                  {/* engraved bezel */}
                  <circle cx="100" cy="100" r="94" fill={C.paper} stroke={C.ink} strokeWidth="1.2" />
                  <circle cx="100" cy="100" r="86" fill="none" stroke={C.rule} strokeWidth="1" />

                  {/* ticks */}
                  {ticks.map((deg) => {
                    const isMajor = deg % 30 === 0;
                    const isCardinal = deg % 90 === 0;
                    const a = ((deg - 90) * Math.PI) / 180;
                    const r1 = 86;
                    const r2 = isMajor ? 76 : 81;
                    const x1 = 100 + r1 * Math.cos(a);
                    const y1 = 100 + r1 * Math.sin(a);
                    const x2 = 100 + r2 * Math.cos(a);
                    const y2 = 100 + r2 * Math.sin(a);
                    return (
                      <line
                        key={deg}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isCardinal ? C.ink : C.inkSoft}
                        strokeWidth={isCardinal ? 1.4 : isMajor ? 1 : 0.6}
                      />
                    );
                  })}

                  {/* cardinal labels */}
                  {[
                    [0, "N"],
                    [90, "E"],
                    [180, "S"],
                    [270, "W"],
                  ].map(([deg, label]) => {
                    const a = ((deg - 90) * Math.PI) / 180;
                    const x = 100 + 68 * Math.cos(a);
                    const y = 100 + 68 * Math.sin(a);
                    return (
                      <text
                        key={label}
                        x={x}
                        y={y}
                        fontFamily={SERIF}
                        fontSize="11"
                        fontWeight="700"
                        fill={C.ink}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {label}
                      </text>
                    );
                  })}

                  {/* centre pivot */}
                  <circle cx="100" cy="100" r="2.5" fill={C.ink} />

                  {/* CARP (Computed Air Release Point) vector */}
                  {result && (
                    <>
                      <line
                        x1="100"
                        y1="100"
                        x2={dotX}
                        y2={dotY}
                        stroke={C.red}
                        strokeWidth="1.3"
                        strokeDasharray="1 3"
                        strokeLinecap="round"
                      />
                      <circle cx={dotX} cy={dotY} r="3.5" fill="none" stroke={C.red} strokeWidth="1.4" />
                      <circle cx={dotX} cy={dotY} r="1.1" fill={C.red} />
                      <text
                        x={carpTextX}
                        y={dotY + 3}
                        fontFamily={MONO}
                        fontSize="8"
                        fontWeight="bold"
                        fill={C.red}
                        textAnchor={carpTextAnchor}
                      >
                        CARP
                      </text>
                    </>
                  )}
                </svg>

                <div style={{ width: "100%", maxWidth: 260, marginTop: 14 }}>
                  <ReadoutRow label="Vt — terminal velocity" value={result ? `${result.vTerm} m/s` : "—"} />
                  <ReadoutRow label="Td — descent time" value={result ? `${result.descentTime} s` : "—"} />
                  <ReadoutRow label="Drift distance" value={result ? `${result.drift} m` : "—"} emphasis />
                  <ReadoutRow label="CARP heading" value={result ? `${result.carpHeading}°` : "—"} emphasis last />
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 18, justifyContent: "center", width: "100%" }}>
                  <button
                    className="afp-stamp"
                    onClick={simulate}
                    disabled={!isValid}
                  >
                    Run simulation
                  </button>
                  
                  <button
                    className="afp-stamp alt"
                    onClick={saveMission}
                    title="Save mission telemetry to database"
                  >
                    Save mission
                  </button>
                </div>

                {isOfflineMode && (
                  <div style={{ marginTop: 8, fontSize: 11, fontFamily: MONO, color: C.inkSoft }}>
                    Note: Running offline solver fallback
                  </div>
                )}
                {apiError && (
                  <div style={{ marginTop: 8, fontSize: 11, fontFamily: MONO, color: C.red }}>
                    Database error: {apiError}
                  </div>
                )}
                {!isValid && (
                  <div style={{ marginTop: 8, fontSize: 11, fontFamily: SANS, color: C.red }}>
                    Check inputs — values must be positive.
                  </div>
                )}
              </div>

              {/* Right */}
              <div style={{ padding: 22 }}>
                <SectionLabel title="Wind & canopy" />
                <Field label="Wind speed (m/s)" value={windSpeed} onChange={setWindSpeed} min={0} step={0.5} />
                <Field label="Wind direction (°)" value={windDir} onChange={setWindDir} min={0} max={359} wrap />
                <div style={{ marginTop: 4 }}>
                  <label className="afp-field-label">Canopy type</label>
                  <select className="afp-select" value={chute} onChange={(e) => setChute(e.target.value)}>
                    <option value="round">Round</option>
                    <option value="ramair">Ram-air</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* A/B TAB */}
        {tab === "ab" && (
          <div style={{ border: `1px solid ${C.rule}`, background: C.paperDark }}>
            <div className="afp-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 2fr" }}>
              <div className="afp-col-rule" style={{ padding: 22, borderRight: `1px solid ${C.rule}` }}>
                <SectionLabel title="Conditions" />
                <Field label="Altitude (m)" value={altitude} onChange={setAltitude} min={1} />
                <Field label="Mass (kg)" value={mass} onChange={setMass} min={1} />
                <Field label="Canopy diameter (m)" value={diameter} onChange={setDiameter} min={0.1} step={0.1} />
                <Field label="Wind speed (m/s)" value={windSpeed} onChange={setWindSpeed} min={0} step={0.5} />
                <Field label="Wind direction (°)" value={windDir} onChange={setWindDir} min={0} max={359} wrap />
                <button
                  className="afp-stamp alt"
                  onClick={runAB}
                  disabled={!isValid}
                  style={{ marginTop: 10, width: "100%" }}
                >
                  Compare
                </button>
                {!isValid && (
                  <div style={{ marginTop: 8, fontSize: 11, fontFamily: SANS, color: C.red }}>
                    Check inputs — values must be positive.
                  </div>
                )}
              </div>

              <div style={{ padding: 24 }}>
                {!abResult ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 240,
                      color: C.inkSoft,
                      fontSize: 13,
                      fontStyle: "italic",
                      fontFamily: SERIF,
                    }}
                  >
                    Set conditions and stamp "Compare" to plot both canopies.
                  </div>
                ) : (
                  <ABCompare result={abResult} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ARCHIVES TAB */}
        {tab === "history" && (
          <div style={{ border: `1px solid ${C.rule}`, background: C.paperDark, padding: 22 }}>
            <SectionLabel title="Saved Mission Archives" />
            {!token ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.inkSoft, fontFamily: SERIF }}>
                <p style={{ fontSize: 14, fontStyle: "italic", margin: "0 0 16px" }}>
                  Authentication required to query database mission logs.
                </p>
                <button
                  className="afp-stamp blue"
                  onClick={() => { setAuthMode("login"); setAuthMsg(""); setShowAuthModal(true); }}
                >
                  Sign in
                </button>
              </div>
            ) : missions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.inkSoft, fontFamily: SERIF, fontStyle: "italic", fontSize: 13 }}>
                No missions found in the PostgreSQL archive. Run a simulation and click "Save Mission" to insert logs.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: MONO, fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.rule}` }}>
                      <th style={{ textAlign: "left", padding: "8px", color: C.inkSoft, fontFamily: SANS, fontVariant: "small-caps" }}>Timestamp</th>
                      <th style={{ textAlign: "left", padding: "8px", color: C.inkSoft, fontFamily: SANS, fontVariant: "small-caps" }}>Telemetry Configuration</th>
                      <th style={{ textAlign: "center", padding: "8px", color: C.inkSoft, fontFamily: SANS, fontVariant: "small-caps" }}>Canopy</th>
                      <th style={{ textAlign: "right", padding: "8px", color: C.inkSoft, fontFamily: SANS, fontVariant: "small-caps" }}>Vt</th>
                      <th style={{ textAlign: "right", padding: "8px", color: C.inkSoft, fontFamily: SANS, fontVariant: "small-caps" }}>Descent</th>
                      <th style={{ textAlign: "right", padding: "8px", color: C.inkSoft, fontFamily: SANS, fontVariant: "small-caps" }}>Drift</th>
                      <th style={{ textAlign: "center", padding: "8px", color: C.inkSoft, fontFamily: SANS, fontVariant: "small-caps" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missions.map((m) => (
                      <tr key={m.id} style={{ borderBottom: `1px dotted ${C.rule}` }}>
                        <td style={{ padding: "8px", color: C.inkSoft }}>
                          {new Date(m.createdAt).toLocaleString(undefined, {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </td>
                        <td style={{ padding: "8px" }}>
                          Alt: {m.altitude}m | Speed: {m.speed}kt | Mass: {m.mass}kg | Wind: {m.windSpeed}m/s @ {m.windDir}°
                        </td>
                        <td style={{ padding: "8px", textAlign: "center", textTransform: "capitalize", color: C.brown, fontWeight: "bold" }}>
                          {m.canopyType}
                        </td>
                        <td style={{ padding: "8px", textAlign: "right" }}>
                          {m.simulationResult ? `${m.simulationResult.terminalVelocity.toFixed(1)} m/s` : "N/A"}
                        </td>
                        <td style={{ padding: "8px", textAlign: "right" }}>
                          {m.simulationResult ? `${m.simulationResult.descentTime.toFixed(0)} s` : "N/A"}
                        </td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold", color: C.red }}>
                          {m.simulationResult ? `${m.simulationResult.driftDistance.toFixed(0)} m` : "N/A"}
                        </td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <button
                            onClick={() => {
                              setAltitude(m.altitude);
                              setSpeed(m.speed);
                              setMass(m.mass);
                              setDiameter(m.diameter);
                              setWindSpeed(m.windSpeed);
                              setWindDir(m.windDir);
                              setChute(m.canopyType);
                              if (m.simulationResult) {
                                setResult({
                                  vTerm: m.simulationResult.terminalVelocity.toFixed(2),
                                  descentTime: m.simulationResult.descentTime.toFixed(1),
                                  drift: m.simulationResult.driftDistance.toFixed(0),
                                  carpHeading: m.simulationResult.carpHeading.toFixed(0),
                                });
                              }
                              setTab("simulate");
                            }}
                            style={{
                              background: "transparent",
                              border: `1px solid ${C.rule}`,
                              cursor: "pointer",
                              fontSize: 10,
                              fontFamily: SERIF,
                              fontWeight: 700,
                              padding: "2px 6px",
                              color: C.ink,
                            }}
                          >
                            LOAD
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Auth Modal (Vintage ID Card overlay) */}
      {showAuthModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(43,38,32,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              background: C.paper,
              border: `3px double ${C.ink}`,
              padding: 28,
              width: 340,
              boxSizing: "border-box",
              position: "relative",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            }}
          >
            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                position: "absolute",
                top: 8,
                right: 12,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                fontFamily: MONO,
                color: C.inkSoft,
              }}
            >
              ×
            </button>
            <h3
              style={{
                margin: "0 0 20px",
                fontFamily: SERIF,
                fontSize: 14,
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: C.ink,
                borderBottom: `2px solid ${C.ink}`,
                paddingBottom: 8,
              }}
            >
              {authMode === "login" ? "Officer Credential Card" : "Officer Roster Registration"}
            </h3>

            <form onSubmit={handleLoginRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="afp-field-label">Username</label>
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="afp-input"
                  style={{ fontSize: 13 }}
                />
              </div>

              <div>
                <label className="afp-field-label">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="afp-input"
                  style={{ fontSize: 13 }}
                />
              </div>

              {authMsg && (
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: MONO,
                    color: C.red,
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  ⚠ {authMsg}
                </div>
              )}

              <button
                type="submit"
                className="afp-stamp"
                style={{ marginTop: 8, width: "100%" }}
              >
                {authMode === "login" ? "Authorize Entry" : "Register Profile"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setAuthMsg("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontFamily: SERIF,
                  textDecoration: "underline",
                  color: C.inkSoft,
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                {authMode === "login" ? "Register new officer profile" : "Return to credentials entry"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ title }) {
  return (
    <div
      style={{
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: 13,
        color: C.inkSoft,
        borderBottom: `1px solid ${C.rule}`,
        paddingBottom: 7,
        marginBottom: 16,
      }}
    >
      {title}
    </div>
  );
}

function Field({ label, value, onChange, min, max, step, wrap }) {
  const outOfRange =
    value === "" ||
    !Number.isFinite(value) ||
    (min !== undefined && value < min) ||
    (max !== undefined && value > max);

  return (
    <div style={{ marginBottom: 14 }}>
      <label className="afp-field-label">{label}</label>
      <input
        className={`afp-input${outOfRange ? " invalid" : ""}`}
        type="number"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? "" : Number(raw));
        }}
        onBlur={(e) => {
          let v = Number(e.target.value);
          if (!Number.isFinite(v)) v = min ?? 0;
          if (wrap) {
            v = ((v % 360) + 360) % 360;
          } else {
            if (min !== undefined && v < min) v = min;
            if (max !== undefined && v > max) v = max;
          }
          onChange(v);
        }}
      />
    </div>
  );
}

function ReadoutRow({ label, value, emphasis, last }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "5px 0",
        borderBottom: last ? "none" : `1px dotted ${C.rule}`,
      }}
    >
      <span style={{ fontFamily: SANS, fontSize: 11.5, color: C.inkSoft }}>{label}</span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 13,
          fontWeight: emphasis ? 700 : 400,
          color: emphasis ? C.red : C.ink,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ABCompare({ result }) {
  const { round, ramair } = result;
  const rows = [
    { label: "Terminal velocity", r: `${round.vTerm.toFixed(2)} m/s`, a: `${ramair.vTerm.toFixed(2)} m/s`, best: round.vTerm < ramair.vTerm ? "r" : "a" },
    { label: "Descent time", r: `${round.descentTime.toFixed(1)} s`, a: `${ramair.descentTime.toFixed(1)} s`, best: round.descentTime > ramair.descentTime ? "r" : "a" },
    { label: "Drift distance", r: `${round.drift.toFixed(0)} m`, a: `${ramair.drift.toFixed(0)} m`, best: round.drift < ramair.drift ? "r" : "a" },
    { label: "CARP heading", r: `${round.carpHeading.toFixed(0)}°`, a: `${ramair.carpHeading.toFixed(0)}°`, best: null },
    { label: "Impact g-force", r: `${round.gForce.toFixed(1)} G`, a: `${ramair.gForce.toFixed(1)} G`, best: round.gForce < ramair.gForce ? "r" : "a" },
  ];

  return (
    <div>
      {/* Summary line */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          marginBottom: 22,
          borderBottom: `1px solid ${C.rule}`,
          paddingBottom: 16,
        }}
      >
        {[
          { label: "Round", sub: "Cd 0.8", d: round, color: C.red },
          { label: "Ram-air", sub: "Cd 0.5 · Cl 0.8", d: ramair, color: C.greenInk },
        ].map(({ label, sub, d, color }, i) => (
          <div key={label} style={{ paddingLeft: i === 1 ? 20 : 0, borderLeft: i === 1 ? `1px solid ${C.rule}` : "none" }}>
            <div style={{ fontFamily: SANS, fontSize: 11, fontVariant: "small-caps", color: C.inkSoft }}>
              {label} <span style={{ opacity: 0.7 }}>· {sub}</span>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, color: C.ink }}>
              {d.drift.toFixed(0)}
              <span style={{ fontSize: 13, color: C.inkSoft, fontWeight: 400 }}> m drift</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11.5, color: color }}>
              {d.vTerm.toFixed(2)} m/s · {d.gForce.toFixed(1)} G
            </div>
          </div>
        ))}
      </div>

      {/* Metric table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: MONO, fontSize: 12.5 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.rule}` }}>
            <th style={{ textAlign: "left", padding: "5px 8px 8px 0", fontFamily: SANS, fontVariant: "small-caps", fontWeight: 400, color: C.inkSoft, fontSize: 11.5 }}>
              Metric
            </th>
            <th style={{ textAlign: "center", padding: "5px 8px 8px", fontFamily: SANS, fontVariant: "small-caps", fontWeight: 400, color: C.inkSoft, fontSize: 11.5 }}>
              Round
            </th>
            <th style={{ textAlign: "center", padding: "5px 8px 8px", fontFamily: SANS, fontVariant: "small-caps", fontWeight: 400, color: C.inkSoft, fontSize: 11.5 }}>
              Ram-air
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} style={{ borderBottom: `1px dotted ${C.rule}` }}>
              <td style={{ padding: "8px 8px 8px 0", color: C.inkSoft, fontFamily: SANS, fontSize: 12 }}>{row.label}</td>
              <td style={{ textAlign: "center", padding: "8px", color: row.best === "r" ? C.red : C.ink, fontWeight: row.best === "r" ? 700 : 400 }}>
                {row.r}
                {row.best === "r" && <span style={{ marginLeft: 4 }}>*</span>}
              </td>
              <td style={{ textAlign: "center", padding: "8px", color: row.best === "a" ? C.red : C.ink, fontWeight: row.best === "a" ? 700 : 400 }}>
                {row.a}
                {row.best === "a" && <span style={{ marginLeft: 4 }}>*</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 11, fontStyle: "italic", color: C.inkSoft, marginTop: 10, fontFamily: SERIF }}>
        * favourable value for that metric
      </div>
    </div>
  );
}
