import { useState } from "react";

export default function AirdropPlanner() {
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

  function physics(alt, ws, wd, m, dia, type) {
    const g = 9.81;
    const rho = 1.225 * Math.exp(-alt / 8500);
    const cd = type === "round" ? 0.8 : 0.5;
    const area = Math.PI * (dia / 2) ** 2;
    const vTerm = Math.sqrt((2 * m * g) / (rho * cd * area));
    const descentTime = alt / vTerm;
    const drift = ws * descentTime;
    const carpHeading = (wd + 180) % 360;
    const gForce = (vTerm ** 2) / (2 * 0.5 * 9.81);
    return { vTerm, descentTime, drift, carpHeading, gForce };
  }

  function simulate() {
    const r = physics(altitude, windSpeed, windDir, mass, diameter, chute);
    setResult({
      vTerm: r.vTerm.toFixed(2),
      descentTime: r.descentTime.toFixed(1),
      drift: r.drift.toFixed(0),
      carpHeading: r.carpHeading.toFixed(0),
    });
  }

  function runAB() {
    setAbResult({
      round: physics(altitude, windSpeed, windDir, mass, diameter, "round"),
      ramair: physics(altitude, windSpeed, windDir, mass, diameter, "ramair"),
    });
  }

  const radius = 70, center = 100;
  const scale = result ? Math.min(Number(result.drift) / 6, radius * 0.9) : 0;
  const angleRad = ((windDir - 90) * Math.PI) / 180;
  const dotX = center + scale * Math.cos(angleRad);
  const dotY = center + scale * Math.sin(angleRad);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", color: "#cbd5e1", fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: "0.02em" }}>Airdrop Mission Planner</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569" }}>Set drop parameters and run the simulation.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e2a3a", paddingBottom: 12 }}>
          {[["simulate", "Simulate"], ["ab", "A/B Compare"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "5px 14px", fontSize: 12, borderRadius: 6, cursor: "pointer",
              background: tab === id ? "#1e2a3a" : "transparent",
              color: tab === id ? "#EF9F27" : "#475569",
              border: tab === id ? "1px solid #EF9F2744" : "1px solid transparent",
            }}>{label}</button>
          ))}
        </div>

        {/* SIMULATE TAB */}
        {tab === "simulate" && (
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 200px", gap: 20, alignItems: "start" }}>

            {/* Left */}
            <div style={{ background: "#0f172a", border: "1px solid #1e2a3a", borderRadius: 10, padding: 16 }}>
              <SectionLabel title="Aircraft & Cargo" />
              <Field label="Altitude (m)" value={altitude} onChange={setAltitude} />
              <Field label="Speed (kt)" value={speed} onChange={setSpeed} />
              <Field label="Mass (kg)" value={mass} onChange={setMass} />
              <Field label="Canopy dia (m)" value={diameter} onChange={setDiameter} />
            </div>

            {/* Centre */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ background: "#0f172a", border: "1px solid #1D9E7533", borderRadius: 12, padding: 18, width: "100%", maxWidth: 300 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "#1D9E75aa", textAlign: "center", marginBottom: 10 }}>LANDING DISPLAY</div>
                <svg viewBox="0 0 200 200" style={{ width: "100%", display: "block" }}>
                  {[70, 45, 20].map(r => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#1D9E7522" strokeWidth="0.8" />)}
                  <line x1="100" y1="10" x2="100" y2="190" stroke="#1D9E7518" strokeWidth="0.5" />
                  <line x1="10" y1="100" x2="190" y2="100" stroke="#1D9E7518" strokeWidth="0.5" />
                  <circle cx="100" cy="100" r="3" fill="#1D9E75" />
                  {result && (
                    <>
                      <line x1="100" y1="100" x2={dotX} y2={dotY} stroke="#EF9F27" strokeWidth="1.2" strokeDasharray="4 3" />
                      <circle cx={dotX} cy={dotY} r="4.5" fill="#EF9F27" />
                    </>
                  )}
                </svg>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px", marginTop: 12, paddingTop: 12, borderTop: "1px solid #1e2a3a" }}>
                  <ReadOut label="V-TERM" value={result ? `${result.vTerm} m/s` : "—"} />
                  <ReadOut label="T-DESC" value={result ? `${result.descentTime} s` : "—"} />
                  <ReadOut label="DRIFT" value={result ? `${result.drift} m` : "—"} accent />
                  <ReadOut label="CARP" value={result ? `${result.carpHeading}°` : "—"} accent />
                </div>
              </div>

              <button onClick={simulate} style={{
                background: "#EF9F27", color: "#0a0f1a", border: "none", borderRadius: 7,
                padding: "9px 32px", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em"
              }}>Simulate</button>
            </div>

            {/* Right */}
            <div style={{ background: "#0f172a", border: "1px solid #1e2a3a", borderRadius: 10, padding: 16 }}>
              <SectionLabel title="Wind & Canopy" />
              <Field label="Wind speed (m/s)" value={windSpeed} onChange={setWindSpeed} />
              <Field label="Wind dir (°)" value={windDir} onChange={setWindDir} />
              <div style={{ marginTop: 4 }}>
                <label style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Canopy type</label>
                <select value={chute} onChange={e => setChute(e.target.value)} style={{
                  width: "100%", background: "#1e2a3a", border: "1px solid #334155",
                  borderRadius: 6, padding: "7px 10px", fontSize: 12, color: "#cbd5e1", outline: "none"
                }}>
                  <option value="round">Round</option>
                  <option value="ramair">Ram-Air</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* A/B TAB */}
        {tab === "ab" && (
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "start" }}>
            <div style={{ background: "#0f172a", border: "1px solid #1e2a3a", borderRadius: 10, padding: 16 }}>
              <SectionLabel title="Conditions" />
              <Field label="Altitude (m)" value={altitude} onChange={setAltitude} />
              <Field label="Mass (kg)" value={mass} onChange={setMass} />
              <Field label="Canopy dia (m)" value={diameter} onChange={setDiameter} />
              <Field label="Wind speed (m/s)" value={windSpeed} onChange={setWindSpeed} />
              <Field label="Wind dir (°)" value={windDir} onChange={setWindDir} />
              <button onClick={runAB} style={{
                width: "100%", marginTop: 8, background: "#1D9E7522", color: "#1D9E75",
                border: "1px solid #1D9E75", borderRadius: 7, padding: "9px 0",
                fontSize: 11, cursor: "pointer", letterSpacing: "0.08em"
              }}>Compare</button>
            </div>

            <div style={{ background: "#0f172a", border: "1px solid #1e2a3a", borderRadius: 10, padding: 20 }}>
              {!abResult ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260, color: "#334155", fontSize: 12 }}>
                  Set conditions and click Compare →
                </div>
              ) : (
                <ABCompare result={abResult} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ title }) {
  return <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#334155", textTransform: "uppercase", borderBottom: "1px solid #1e2a3a", paddingBottom: 6, marginBottom: 14 }}>{title}</div>;
}

function Field({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{label}</label>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} style={{
        width: "100%", background: "#1e2a3a", border: "1px solid #334155",
        borderRadius: 6, padding: "7px 10px", fontSize: 12, color: "#cbd5e1",
        outline: "none", boxSizing: "border-box", fontFamily: "monospace"
      }} />
    </div>
  );
}

function ReadOut({ label, value, accent }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.1em" }}>{label}</div>
      <div style={{ fontSize: 12, fontFamily: "monospace", color: accent ? "#EF9F27" : "#1D9E75", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function ABCompare({ result }) {
  const { round, ramair } = result;
  const rows = [
    { label: "Terminal velocity", r: `${round.vTerm.toFixed(2)} m/s`, a: `${ramair.vTerm.toFixed(2)} m/s`, best: round.vTerm < ramair.vTerm ? "r" : "a" },
    { label: "Descent time",      r: `${round.descentTime.toFixed(1)} s`, a: `${ramair.descentTime.toFixed(1)} s`, best: round.descentTime > ramair.descentTime ? "r" : "a" },
    { label: "Drift distance",    r: `${round.drift.toFixed(0)} m`, a: `${ramair.drift.toFixed(0)} m`, best: round.drift < ramair.drift ? "r" : "a" },
    { label: "CARP heading",      r: `${round.carpHeading.toFixed(0)}°`, a: `${ramair.carpHeading.toFixed(0)}°`, best: null },
    { label: "Impact G-force",    r: `${round.gForce.toFixed(1)} G`, a: `${ramair.gForce.toFixed(1)} G`, best: round.gForce < ramair.gForce ? "r" : "a" },
  ];

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { type: "round", label: "Round", sub: "Cd = 0.8", color: "#EF9F27", d: round },
          { type: "ramair", label: "Ram-Air", sub: "Cd = 0.5  Cl = 0.8", color: "#1D9E75", d: ramair },
        ].map(({ label, sub, color, d }) => (
          <div key={label} style={{ background: "#1e2a3a", border: `1px solid ${color}33`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 10, color, letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>{label} <span style={{ color: "#475569", fontSize: 9 }}>{sub}</span></div>
            <div style={{ fontSize: 26, fontFamily: "monospace", color: "#fff", fontWeight: 600 }}>{d.drift.toFixed(0)}<span style={{ fontSize: 11, color: "#475569" }}> m drift</span></div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{d.vTerm.toFixed(2)} m/s · {d.gForce.toFixed(1)} G</div>
          </div>
        ))}
      </div>

      {/* Metric table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "monospace" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #1e2a3a" }}>
            <th style={{ textAlign: "left", padding: "6px 8px", color: "#334155", fontWeight: 400, fontSize: 9, letterSpacing: "0.1em" }}>METRIC</th>
            <th style={{ textAlign: "center", padding: "6px 8px", color: "#EF9F27", fontWeight: 400, fontSize: 9 }}>ROUND</th>
            <th style={{ textAlign: "center", padding: "6px 8px", color: "#1D9E75", fontWeight: 400, fontSize: 9 }}>RAM-AIR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.label} style={{ borderBottom: "1px solid #0f172a" }}>
              <td style={{ padding: "9px 8px", color: "#475569", fontSize: 11 }}>{row.label}</td>
              <td style={{ textAlign: "center", padding: "9px 8px", color: row.best === "r" ? "#1D9E75" : "#cbd5e1" }}>
                {row.r}{row.best === "r" && <span style={{ marginLeft: 4, fontSize: 10 }}>✓</span>}
              </td>
              <td style={{ textAlign: "center", padding: "9px 8px", color: row.best === "a" ? "#1D9E75" : "#cbd5e1" }}>
                {row.a}{row.best === "a" && <span style={{ marginLeft: 4, fontSize: 10 }}>✓</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 9, color: "#334155", marginTop: 10, letterSpacing: "0.06em" }}>✓ better value for that metric</div>
    </div>
  );
}
