import { useState } from "react";

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
    const gForce = vTerm ** 2 / (2 * 0.5 * 9.81);
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

  const radius = 70,
    center = 100;
  const scale = result ? Math.min(Number(result.drift) / 6, radius * 0.9) : 0;
  const angleRad = ((windDir - 90) * Math.PI) / 180;
  const dotX = center + scale * Math.cos(angleRad);
  const dotY = center + scale * Math.sin(angleRad);

  // compass tick marks, every 10°, labelled at the cardinals
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
      }}
    >
      <style>{`
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
          padding: 10px 26px;
          border: 2px double ${C.red};
          color: ${C.red};
          transform: rotate(-1deg);
          transition: transform .15s ease, background .15s ease;
        }
        .afp-stamp:hover { transform: rotate(0deg); background: ${C.red}10; }
        .afp-stamp.alt { border-color: ${C.greenInk}; color: ${C.greenInk}; transform: rotate(1deg); }
        .afp-stamp.alt:hover { transform: rotate(0deg); background: ${C.greenInk}10; }
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

      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
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
              Form 41-D · enter drop parameters, then plot.
            </p>
          </div>
          <div
            style={{
              border: `1.5px solid ${C.red}`,
              color: C.red,
              fontFamily: SERIF,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".08em",
              padding: "5px 9px",
              transform: "rotate(2deg)",
              whiteSpace: "nowrap",
            }}
          >
            TRAINING USE ONLY
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 0 }}>
          {[
            ["simulate", "Simulate"],
            ["ab", "A/B Compare"],
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
                <Field label="Altitude (m)" value={altitude} onChange={setAltitude} />
                <Field label="Speed (kt)" value={speed} onChange={setSpeed} />
                <Field label="Mass (kg)" value={mass} onChange={setMass} />
                <Field label="Canopy diameter (m)" value={diameter} onChange={setDiameter} />
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

                  {/* wind / drift vector */}
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
                    </>
                  )}
                </svg>

                <div style={{ width: "100%", maxWidth: 260, marginTop: 14 }}>
                  <ReadoutRow label="Vt — terminal velocity" value={result ? `${result.vTerm} m/s` : "—"} />
                  <ReadoutRow label="Td — descent time" value={result ? `${result.descentTime} s` : "—"} />
                  <ReadoutRow label="Drift distance" value={result ? `${result.drift} m` : "—"} emphasis />
                  <ReadoutRow label="CARP heading" value={result ? `${result.carpHeading}°` : "—"} emphasis last />
                </div>

                <button className="afp-stamp" onClick={simulate} style={{ marginTop: 18 }}>
                  Run simulation
                </button>
              </div>

              {/* Right */}
              <div style={{ padding: 22 }}>
                <SectionLabel title="Wind & canopy" />
                <Field label="Wind speed (m/s)" value={windSpeed} onChange={setWindSpeed} />
                <Field label="Wind direction (°)" value={windDir} onChange={setWindDir} />
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
                <Field label="Altitude (m)" value={altitude} onChange={setAltitude} />
                <Field label="Mass (kg)" value={mass} onChange={setMass} />
                <Field label="Canopy diameter (m)" value={diameter} onChange={setDiameter} />
                <Field label="Wind speed (m/s)" value={windSpeed} onChange={setWindSpeed} />
                <Field label="Wind direction (°)" value={windDir} onChange={setWindDir} />
                <button className="afp-stamp alt" onClick={runAB} style={{ marginTop: 10, width: "100%" }}>
                  Compare
                </button>
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
      </div>
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

function Field({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="afp-field-label">{label}</label>
      <input
        className="afp-input"
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
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
