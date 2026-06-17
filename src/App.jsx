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

  function simulate() {
    const g = 9.81;
    const rho = 1.225;
    const cd = chute === "round" ? 0.8 : 0.5;
    const area = Math.PI * (diameter / 2) ** 2;

    const vTerm = Math.sqrt((2 * mass * g) / (rho * cd * area));
    const descentTime = altitude / vTerm;
    const drift = windSpeed * descentTime;
    const carpHeading = (windDir + 180) % 360;

    setResult({
      vTerm: vTerm.toFixed(2),
      descentTime: descentTime.toFixed(1),
      drift: drift.toFixed(0),
      carpHeading: carpHeading.toFixed(0),
    });
  }

  const radius = 70;
  const center = 100;
  const scale = result ? Math.min(Number(result.drift) / 8, radius) : 0;
  const angleRad = ((windDir - 90) * Math.PI) / 180;
  const dotX = center + scale * Math.cos(angleRad);
  const dotY = center + scale * Math.sin(angleRad);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-xl font-semibold mb-1">Airdrop Mission Planner</h1>
        <p className="text-sm text-slate-400 mb-8">
          Set the drop parameters and run the simulation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-start">
          {/* Left parameters */}
          <div className="space-y-5">
            <Section title="Aircraft & cargo" />
            <Field label="Release altitude (m)" value={altitude} onChange={setAltitude} />
            <Field label="Aircraft speed (kt)" value={speed} onChange={setSpeed} />
            <Field label="Cargo mass (kg)" value={mass} onChange={setMass} />
            <Field label="Canopy diameter (m)" value={diameter} onChange={setDiameter} />
          </div>

          {/* Center display screen */}
          <div className="flex flex-col items-center">
            <div className="w-56 rounded-xl bg-slate-950 border border-emerald-500/30 shadow-[0_0_25px_-5px_rgba(16,185,129,0.4)] p-4">
              <div className="text-[10px] tracking-widest text-emerald-400/80 mb-2 text-center">
                LANDING DISPLAY
              </div>

              <svg viewBox="0 0 200 200" className="w-full">
                <circle cx="100" cy="100" r="70" fill="none" stroke="#10b98133" />
                <circle cx="100" cy="100" r="45" fill="none" stroke="#10b98133" />
                <circle cx="100" cy="100" r="20" fill="none" stroke="#10b98155" />
                <line x1="100" y1="10" x2="100" y2="190" stroke="#10b98122" />
                <line x1="10" y1="100" x2="190" y2="100" stroke="#10b98122" />
                <circle cx="100" cy="100" r="3" fill="#10b981" />
                {result && (
                  <>
                    <line
                      x1="100"
                      y1="100"
                      x2={dotX}
                      y2={dotY}
                      stroke="#34d399"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <circle cx={dotX} cy={dotY} r="4" fill="#34d399" />
                  </>
                )}
              </svg>

              <div className="mt-3 grid grid-cols-2 gap-y-2 text-[11px] font-mono text-emerald-300/90">
                <ReadOut label="V-TERM" value={result ? `${result.vTerm} m/s` : "--"} />
                <ReadOut label="T-DESC" value={result ? `${result.descentTime} s` : "--"} />
                <ReadOut label="DRIFT" value={result ? `${result.drift} m` : "--"} />
                <ReadOut label="CARP" value={result ? `${result.carpHeading}°` : "--"} />
              </div>
            </div>

            <button
              onClick={simulate}
              className="mt-5 w-40 bg-emerald-500 text-slate-950 rounded-lg py-2 text-sm font-medium hover:bg-emerald-400 transition"
            >
              Simulate
            </button>
          </div>

          {/* Right parameters */}
          <div className="space-y-5">
            <Section title="Wind & canopy" />
            <Field label="Wind speed (m/s)" value={windSpeed} onChange={setWindSpeed} />
            <Field label="Wind direction (°)" value={windDir} onChange={setWindDir} />
            <div>
              <label className="block text-xs text-slate-400 mb-1">Canopy type</label>
              <select
                value={chute}
                onChange={(e) => setChute(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="round">Round</option>
                <option value="ramair">Ram-air</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title }) {
  return (
    <div className="text-[11px] tracking-widest text-slate-500 uppercase">{title}</div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      />
    </div>
  );
}

function ReadOut({ label, value }) {
  return (
    <div>
      <div className="text-slate-500">{label}</div>
      <div>{value}</div>
    </div>
  );
}