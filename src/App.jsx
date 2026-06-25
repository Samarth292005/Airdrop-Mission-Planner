import { useState } from "react";

const C = {
  paper: "#EAE3D2",
  paperDark: "#DDD4BC",
  paperMid: "#E4DCC8",
  ink: "#2B2620",
  inkSoft: "#675F4E",
  inkFaint: "#9C9080",
  rule: "#C4B89A",
  ruleFaint: "#D6CDBA",
  brown: "#8B6F47",
  red: "#9C3A2B",
  greenInk: "#3F5D3A",
};

const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "'Courier New', ui-monospace, monospace";
const SANS = "-apple-system, 'Helvetica Neue', Arial, sans-serif";

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

  const isValid =
    Number.isFinite(altitude) && altitude > 0 &&
    Number.isFinite(mass) && mass > 0 &&
    Number.isFinite(diameter) && diameter > 0 &&
    Number.isFinite(windSpeed) && windSpeed >= 0 &&
    Number.isFinite(windDir);

  function physics(alt, ws, wd, m, dia, type) {
    const g = 9.81;
    const rho = 1.225 * Math.exp(-alt / 8500);
    const cd = type === "round" ? 0.8 : 0.5;
    const area = Math.PI * (dia / 2) ** 2;
    const vTerm = Math.sqrt((2 * m * g) / (rho * cd * area));
    const descentTime = alt / vTerm;
    const drift = ws * descentTime;
    const carpHeading = (wd + 180) % 360;
    const gForce = vTerm ** 2 / (2 * 0.5 * 9.81);
    return { vTerm, descentTime, drift, carpHeading, gForce };
  }

  function simulate() {
    if (!isValid) return;
    const r = physics(altitude, windSpeed, windDir, mass, diameter, chute);
    setResult({
      vTerm: r.vTerm.toFixed(2),
      descentTime: r.descentTime.toFixed(1),
      drift: r.drift.toFixed(0),
      carpHeading: r.carpHeading.toFixed(0),
    });
  }

  function runAB() {
    if (!isValid) return;
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
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.paper,
      backgroundImage: `radial-gradient(circle at 1px 1px, ${C.rule}44 1px, transparent 0)`,
      backgroundSize: "20px 20px",
      color: C.ink,
      fontFamily: SANS,
      padding: "40px 24px 60px",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        .afp-input, .afp-select {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1.5px solid ${C.rule};
          padding: 7px 2px 8px;
          font-size: 13.5px;
          font-family: ${MONO};
          color: ${C.ink};
          outline: none;
          transition: border-color .15s, background .15s;
        }
        .afp-input:focus, .afp-select:focus {
          border-bottom-color: ${C.red};
          background: ${C.red}0d;
        }
        .afp-input.invalid {
          border-bottom-color: ${C.red};
          background: ${C.red}12;
        }
        .afp-select { cursor: pointer; }
        .afp-field-label {
          font-family: ${SANS};
          font-size: 10.5px;
          font-variant: small-caps;
          letter-spacing: .05em;
          color: ${C.inkFaint};
          display: block;
          margin-bottom: 4px;
        }
        .afp-stamp {
          cursor: pointer;
          background: transparent;
          font-family: ${SERIF};
          font-weight: 700;
          font-size: 13px;
          letter-spacing: .07em;
          text-transform: uppercase;
          padding: 10px 28px;
          border: 2px double ${C.red};
          color: ${C.red};
          transform: rotate(-1deg);
          transition: transform .15s, background .15s, opacity .15s;
          display: block;
        }
        .afp-stamp:hover:not(:disabled) { transform: rotate(0deg); background: ${C.red}10; }
        .afp-stamp.alt { border-color: ${C.greenInk}; color: ${C.greenInk}; transform: rotate(1deg); }
        .afp-stamp.alt:hover:not(:disabled) { transform: rotate(0deg); background: ${C.greenInk}10; }
        .afp-stamp:disabled { opacity: .3; cursor: not-allowed; transform: none; }
        .afp-tab {
          cursor: pointer;
          font-family: ${SERIF};
          font-size: 12.5px;
          letter-spacing: .02em;
          padding: 9px 22px 8px;
          border: 1px solid ${C.rule};
          border-bottom: none;
          border-radius: 4px 4px 0 0;
          background: ${C.paper};
          color: ${C.inkSoft};
          position: relative;
          top: 1px;
          user-select: none;
        }
        .afp-tab.active { background: ${C.paperDark}; color: ${C.ink}; font-weight: 700; }
        .afp-tab:hover:not(.active) { color: ${C.ink}; }
        .afp-divider {
          border: none;
          border-top: 1px solid ${C.ruleFaint};
          margin: 18px 0;
        }
        @media (max-width: 820px) {
          .sim-grid { grid-template-columns: 1fr !important; }
          .sim-col-border { border-right: none !important; padding-right: 0 !important; }
          .sim-col-border-left { border-left: none !important; padding-left: 0 !important; }
          .ab-grid { grid-template-columns: 1fr !important; }
          .ab-col-border { border-right: none !important; padding-right: 0 !important; }
        }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
          paddingBottom: 20,
          borderBottom: `1.5px solid ${C.rule}`,
        }}>
          <div>
            <div style={{
              fontFamily: SANS,
              fontSize: 10.5,
              fontVariant: "small-caps",
              letterSpacing: ".08em",
              color: C.inkFaint,
              marginBottom: 6,
            }}>
              Form 41-D · Airdrop Mission Planning
            </div>
            <h1 style={{
              margin: 0,
              fontFamily: SERIF,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: ".01em",
              color: C.ink,
              lineHeight: 1.2,
            }}>
              Airdrop Mission Planning Sheet
            </h1>
          </div>
          <div style={{
            border: `1.5px solid ${C.red}`,
            color: C.red,
            fontFamily: SERIF,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: ".1em",
            padding: "5px 10px",
            transform: "rotate(2deg)",
            whiteSpace: "nowrap",
            flexShrink: 0,
            marginLeft: 20,
          }}>
            TRAINING USE ONLY
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 0 }}>
          {[["simulate", "Simulate"], ["ab", "A/B Compare"]].map(([id, label]) => (
            <div key={id} className={`afp-tab${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>
              {label}
            </div>
          ))}
        </div>

        {/* ══════════════════ SIMULATE TAB ══════════════════ */}
        {tab === "simulate" && (
          <div style={{
            border: `1px solid ${C.rule}`,
            background: C.paperDark,
            borderRadius: "0 4px 4px 4px",
          }}>
            <div className="sim-grid" style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr 220px",
            }}>

              {/* LEFT: Aircraft & cargo */}
              <div className="sim-col-border" style={{
                padding: "24px 20px",
                borderRight: `1px solid ${C.rule}`,
              }}>
                <SectionLabel title="Aircraft & cargo" />
                <Field label="Altitude (m)" value={altitude} onChange={setAltitude} min={1} />
                <Field label="Speed (kt)" value={speed} onChange={setSpeed} min={1} />
                <Field label="Mass (kg)" value={mass} onChange={setMass} min={1} />
                <Field label="Canopy diameter (m)" value={diameter} onChange={setDiameter} min={0.1} step={0.1} />
              </div>

              {/* CENTRE: Plotting board + readouts */}
              <div style={{
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}>
                <div style={{
                  fontFamily: SANS,
                  fontSize: 10,
                  fontVariant: "small-caps",
                  letterSpacing: ".06em",
                  color: C.inkFaint,
                  marginBottom: 12,
                }}>
                  Plotting board
                </div>

                {/* Compass */}
                <svg viewBox="0 0 200 200" style={{ width: "100%", maxWidth: 240, display: "block" }}>
                  <circle cx="100" cy="100" r="94" fill={C.paper} stroke={C.ink} strokeWidth="1.2" />
                  <circle cx="100" cy="100" r="86" fill="none" stroke={C.ruleFaint} strokeWidth="0.8" />
                  <circle cx="100" cy="100" r="58" fill="none" stroke={C.ruleFaint} strokeWidth="0.5" strokeDasharray="2 4" />
                  <circle cx="100" cy="100" r="29" fill="none" stroke={C.ruleFaint} strokeWidth="0.5" strokeDasharray="2 4" />
                  {ticks.map((deg) => {
                    const isMajor = deg % 30 === 0;
                    const isCardinal = deg % 90 === 0;
                    const a = ((deg - 90) * Math.PI) / 180;
                    const r1 = 86, r2 = isCardinal ? 74 : isMajor ? 78 : 82;
                    return (
                      <line
                        key={deg}
                        x1={100 + r1 * Math.cos(a)} y1={100 + r1 * Math.sin(a)}
                        x2={100 + r2 * Math.cos(a)} y2={100 + r2 * Math.sin(a)}
                        stroke={isCardinal ? C.ink : C.inkSoft}
                        strokeWidth={isCardinal ? 1.4 : isMajor ? 0.9 : 0.5}
                      />
                    );
                  })}
                  {[[0, "N"], [90, "E"], [180, "S"], [270, "W"]].map(([deg, label]) => {
                    const a = ((deg - 90) * Math.PI) / 180;
                    return (
                      <text key={label}
                        x={100 + 65 * Math.cos(a)} y={100 + 65 * Math.sin(a)}
                        fontFamily={SERIF} fontSize="11" fontWeight="700"
                        fill={C.ink} textAnchor="middle" dominantBaseline="middle"
                      >{label}</text>
                    );
                  })}
                  {/* Crosshair */}
                  <line x1="100" y1="93" x2="100" y2="107" stroke={C.inkFaint} strokeWidth="0.6" />
                  <line x1="93" y1="100" x2="107" y2="100" stroke={C.inkFaint} strokeWidth="0.6" />
                  <circle cx="100" cy="100" r="2.5" fill={C.ink} />
                  {result && (
                    <>
                      <line x1="100" y1="100" x2={dotX} y2={dotY}
                        stroke={C.red} strokeWidth="1.2" strokeDasharray="2 3" strokeLinecap="round" />
                      <circle cx={dotX} cy={dotY} r="4" fill="none" stroke={C.red} strokeWidth="1.3" />
                      <circle cx={dotX} cy={dotY} r="1.3" fill={C.red} />
                    </>
                  )}
                </svg>

                {/* Readout table */}
                <div style={{ width: "100%", maxWidth: 280, marginTop: 20 }}>
                  <ReadoutRow label="Terminal velocity (Vt)" value={result ? `${result.vTerm} m/s` : "—"} />
                  <ReadoutRow label="Descent time (Td)" value={result ? `${result.descentTime} s` : "—"} />
                  <ReadoutRow label="Drift distance" value={result ? `${result.drift} m` : "—"} emphasis />
                  <ReadoutRow label="CARP heading" value={result ? `${result.carpHeading}°` : "—"} emphasis last />
                </div>

                {/* Action */}
                <div style={{ marginTop: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <button className="afp-stamp" onClick={simulate} disabled={!isValid}
                    title={isValid ? undefined : "Altitude, mass and canopy diameter must be greater than zero."}>
                    Run simulation
                  </button>
                  {!isValid && (
                    <div style={{ fontSize: 11, fontFamily: SANS, color: C.red, textAlign: "center", maxWidth: 220 }}>
                      Altitude, mass, diameter and wind speed must be positive.
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Wind & canopy */}
              <div className="sim-col-border-left" style={{
                padding: "24px 20px",
                borderLeft: `1px solid ${C.rule}`,
              }}>
                <SectionLabel title="Wind & canopy" />
                <Field label="Wind speed (m/s)" value={windSpeed} onChange={setWindSpeed} min={0} step={0.5} />
                <Field label="Wind direction (°)" value={windDir} onChange={setWindDir} min={0} max={359} wrap />
                <div style={{ marginTop: 4 }}>
                  <label className="afp-field-label">Canopy type</label>
                  <select className="afp-select" value={chute} onChange={(e) => setChute(e.target.value)}>
                    <option value="round">Round (Cd 0.8)</option>
                    <option value="ramair">Ram-air (Cd 0.5)</option>
                  </select>
                </div>

                {/* Mini legend */}
                <div style={{
                  marginTop: 28,
                  padding: "12px 14px",
                  background: C.paperMid,
                  border: `1px solid ${C.ruleFaint}`,
                  borderRadius: 2,
                }}>
                  <div style={{ fontFamily: SANS, fontSize: 10, fontVariant: "small-caps", letterSpacing: ".05em", color: C.inkFaint, marginBottom: 8 }}>
                    Plot legend
                  </div>
                  <LegendRow color={C.red} dashed label="Drift vector" />
                  <LegendRow color={C.red} circle label="Release point" />
                  <LegendRow color={C.inkFaint} label="Bearing rings" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ A/B TAB ══════════════════ */}
        {tab === "ab" && (
          <div style={{
            border: `1px solid ${C.rule}`,
            background: C.paperDark,
            borderRadius: "0 4px 4px 4px",
          }}>
            <div className="ab-grid" style={{
              display: "grid",
              gridTemplateColumns: "240px 1fr",
            }}>
              {/* LEFT: Conditions */}
              <div className="ab-col-border" style={{
                padding: "24px 20px",
                borderRight: `1px solid ${C.rule}`,
              }}>
                <SectionLabel title="Drop conditions" />
                <Field label="Altitude (m)" value={altitude} onChange={setAltitude} min={1} />
                <Field label="Mass (kg)" value={mass} onChange={setMass} min={1} />
                <Field label="Canopy diameter (m)" value={diameter} onChange={setDiameter} min={0.1} step={0.1} />
                <hr className="afp-divider" />
                <Field label="Wind speed (m/s)" value={windSpeed} onChange={setWindSpeed} min={0} step={0.5} />
                <Field label="Wind direction (°)" value={windDir} onChange={setWindDir} min={0} max={359} wrap />
                <div style={{ marginTop: 20 }}>
                  <button className="afp-stamp alt" onClick={runAB} disabled={!isValid}
                    title={isValid ? undefined : "Altitude, mass and canopy diameter must be greater than zero."}
                    style={{ width: "100%", textAlign: "center" }}>
                    Compare
                  </button>
                  {!isValid && (
                    <div style={{ marginTop: 8, fontSize: 11, fontFamily: SANS, color: C.red }}>
                      All values must be positive.
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Results */}
              <div style={{ padding: "24px 28px" }}>
                {!abResult ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 260,
                    color: C.inkSoft,
                    fontSize: 13,
                    fontStyle: "italic",
                    fontFamily: SERIF,
                    textAlign: "center",
                  }}>
                    Set drop conditions and press "Compare" to<br />plot both canopy types side by side.
                  </div>
                ) : (
                  <ABCompare result={abResult} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer note ── */}
        <div style={{
          marginTop: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 10.5,
          color: C.inkFaint,
          fontFamily: SANS,
          fontStyle: "italic",
          borderTop: `1px solid ${C.ruleFaint}`,
          paddingTop: 12,
        }}>
          <span>Standard atmosphere model · ISA lapse rate approximation</span>
          <span>Rev. 2 · Educational use only</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function SectionLabel({ title }) {
  return (
    <div style={{
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
      fontSize: 12.5,
      color: "#675F4E",
      borderBottom: "1px solid #C4B89A",
      paddingBottom: 8,
      marginBottom: 18,
      letterSpacing: ".01em",
    }}>
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
    <div style={{ marginBottom: 16 }}>
      <label className="afp-field-label">{label}</label>
      <input
        className={`afp-input${outOfRange ? " invalid" : ""}`}
        type="number"
        min={min} max={max} step={step ?? 1}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        onBlur={(e) => {
          let v = Number(e.target.value);
          if (!Number.isFinite(v)) v = min ?? 0;
          if (wrap) { v = ((v % 360) + 360) % 360; }
          else {
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
  const C = { ink: "#2B2620", inkSoft: "#675F4E", rule: "#C4B89A", red: "#9C3A2B" };
  const MONO = "'Courier New', ui-monospace, monospace";
  const SANS = "-apple-system, 'Helvetica Neue', Arial, sans-serif";
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      padding: "6px 0",
      borderBottom: last ? "none" : `1px dotted ${C.rule}`,
      gap: 12,
    }}>
      <span style={{ fontFamily: SANS, fontSize: 11, color: C.inkSoft, flexShrink: 0 }}>{label}</span>
      <span style={{
        fontFamily: MONO,
        fontSize: 13,
        fontWeight: emphasis ? 700 : 400,
        color: emphasis ? C.red : C.ink,
        letterSpacing: ".02em",
      }}>{value}</span>
    </div>
  );
}

function LegendRow({ color, dashed, circle, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      {circle ? (
        <svg width="16" height="10" viewBox="0 0 16 10">
          <circle cx="8" cy="5" r="3.5" fill="none" stroke={color} strokeWidth="1.3" />
          <circle cx="8" cy="5" r="1.2" fill={color} />
        </svg>
      ) : (
        <svg width="16" height="10" viewBox="0 0 16 10">
          <line x1="0" y1="5" x2="16" y2="5"
            stroke={color} strokeWidth="1.3"
            strokeDasharray={dashed ? "2 2.5" : "none"} />
        </svg>
      )}
      <span style={{ fontFamily: "-apple-system, sans-serif", fontSize: 10.5, color: "#675F4E" }}>{label}</span>
    </div>
  );
}

function ABCompare({ result }) {
  const C = { ink: "#2B2620", inkSoft: "#675F4E", inkFaint: "#9C9080", rule: "#C4B89A", ruleFaint: "#D6CDBA", red: "#9C3A2B", greenInk: "#3F5D3A", paperMid: "#E4DCC8" };
  const SERIF = "Georgia, 'Times New Roman', serif";
  const MONO = "'Courier New', ui-monospace, monospace";
  const SANS = "-apple-system, 'Helvetica Neue', Arial, sans-serif";

  const { round, ramair } = result;
  const rows = [
    { label: "Terminal velocity", r: `${round.vTerm.toFixed(2)} m/s`, a: `${ramair.vTerm.toFixed(2)} m/s`, best: round.vTerm < ramair.vTerm ? "r" : "a", note: "lower = gentler descent" },
    { label: "Descent time", r: `${round.descentTime.toFixed(1)} s`, a: `${ramair.descentTime.toFixed(1)} s`, best: round.descentTime > ramair.descentTime ? "r" : "a", note: "longer = more drift exposure" },
    { label: "Drift distance", r: `${round.drift.toFixed(0)} m`, a: `${ramair.drift.toFixed(0)} m`, best: round.drift < ramair.drift ? "r" : "a", note: "shorter = more accurate" },
    { label: "CARP heading", r: `${round.carpHeading.toFixed(0)}°`, a: `${ramair.carpHeading.toFixed(0)}°`, best: null, note: "release bearing" },
    { label: "Impact g-force", r: `${round.gForce.toFixed(1)} G`, a: `${ramair.gForce.toFixed(1)} G`, best: round.gForce < ramair.gForce ? "r" : "a", note: "lower = safer landing" },
  ];

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Round canopy", sub: "Cd 0.8", d: round, color: C.red, accentBg: `${C.red}0a` },
          { label: "Ram-air canopy", sub: "Cd 0.5", d: ramair, color: C.greenInk, accentBg: `${C.greenInk}0a` },
        ].map(({ label, sub, d, color, accentBg }) => (
          <div key={label} style={{
            padding: "16px 18px",
            background: accentBg,
            border: `1px solid ${color}33`,
            borderRadius: 3,
          }}>
            <div style={{ fontFamily: SANS, fontSize: 10.5, color: C.inkFaint, marginBottom: 6 }}>
              {label} <span style={{ opacity: .7 }}>· {sub}</span>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700, color: C.ink, lineHeight: 1 }}>
              {d.drift.toFixed(0)}
              <span style={{ fontSize: 13, color: C.inkSoft, fontWeight: 400, marginLeft: 4 }}>m drift</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11.5, color, marginTop: 6 }}>
              {d.vTerm.toFixed(2)} m/s · {d.gForce.toFixed(1)} G
            </div>
          </div>
        ))}
      </div>

      {/* Metric table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1.5px solid ${C.rule}` }}>
            {["Metric", "Round", "Ram-air", "Note"].map((h, i) => (
              <th key={h} style={{
                textAlign: i === 0 ? "left" : i === 3 ? "left" : "center",
                padding: "6px 10px 10px",
                fontFamily: SANS, fontVariant: "small-caps", fontWeight: 400,
                color: C.inkFaint, fontSize: 11,
                paddingLeft: i === 0 ? 0 : undefined,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} style={{ borderBottom: `1px dotted ${C.ruleFaint}` }}>
              <td style={{ padding: "9px 10px 9px 0", fontFamily: SANS, fontSize: 12, color: C.inkSoft }}>{row.label}</td>
              <td style={{ textAlign: "center", padding: "9px 10px", fontFamily: MONO, fontSize: 13, color: row.best === "r" ? C.red : C.ink, fontWeight: row.best === "r" ? 700 : 400 }}>
                {row.r}{row.best === "r" && <sup style={{ marginLeft: 2, fontSize: 9 }}>★</sup>}
              </td>
              <td style={{ textAlign: "center", padding: "9px 10px", fontFamily: MONO, fontSize: 13, color: row.best === "a" ? C.red : C.ink, fontWeight: row.best === "a" ? 700 : 400 }}>
                {row.a}{row.best === "a" && <sup style={{ marginLeft: 2, fontSize: 9 }}>★</sup>}
              </td>
              <td style={{ padding: "9px 0 9px 10px", fontFamily: SANS, fontSize: 11, color: C.inkFaint, fontStyle: "italic" }}>{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 10.5, fontStyle: "italic", color: C.inkFaint, marginTop: 10, fontFamily: SERIF }}>
        ★ favourable value for that metric
      </div>
    </div>
  );
}
