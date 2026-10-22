import { UnitInput } from '../UnitInput';

export interface PipeHydraulicsInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits?: CustomUnitDefinition[];
  getFieldUnit?: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit?: (fieldKey: string, unitId: string) => void;
}

export const PipeHydraulicsInputs: React.FC<PipeHydraulicsInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits = [],
  getFieldUnit = (_k, _c, fallback) => fallback,
  updateFieldUnit = () => {},
}) => {
  const pipe = activeWorkspace.pipe || {
    pipeMaterial: 'pvc-hdpe',
    hazenWilliamsC: 150,
    internalDiameterMm: 250,
    lengthM: 180,
    flowRateLps: 45,
    inletElevationM: 25.0,
    outletElevationM: 18.0,
    inletPressureKpa: 300,
    minorLossCoefficientK: 2.0,
    waterTempC: 20,
  };

  const updatePipe = (patch: Partial<typeof pipe>) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      pipe: { ...pipe, ...patch },
    }));
  };

  const handleMaterialChange = (mat: PipeMaterialType) => {
    const cMap: Record<PipeMaterialType, number> = {
      'pvc-hdpe': 150,
      'ductile-iron': 130,
      'cast-iron': 100,
      'concrete': 120,
      'galvanized-steel': 120,
    };
    updatePipe({
      pipeMaterial: mat,
      hazenWilliamsC: cMap[mat] || 130,
    });
  };

  // Instant velocity calculation for proactive hints
  const areaM2 = Math.PI * Math.pow((pipe.internalDiameterMm / 1000) / 2, 2);
  const dischargeM3s = pipe.flowRateLps / 1000;
  const currentVelocityMps = areaM2 > 0 ? dischargeM3s / areaM2 : 0;

  return (
    <div className="space-y-4">
      {/* Pipe Material & Hazen-Williams Roughness */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Pipe Material
          </label>
          <select
            value={pipe.pipeMaterial}
            onChange={(e) => handleMaterialChange(e.target.value as PipeMaterialType)}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
          >
            <option value="pvc-hdpe">PVC / HDPE (C = 150)</option>
            <option value="ductile-iron">Ductile Iron (Cement Lined, C = 130)</option>
            <option value="concrete">Precast Concrete / RCC (C = 120)</option>
            <option value="galvanized-steel">Galvanized Steel / GI (C = 120)</option>
            <option value="cast-iron">Unlined Cast Iron (C = 100)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Hazen-Williams Roughness C
          </label>
          <input
            type="number"
            value={pipe.hazenWilliamsC}
            onChange={(e) => updatePipe({ hazenWilliamsC: Math.max(40, Math.min(160, Number(e.target.value) || 130)) })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="5"
            min="40"
            max="160"
          />
          <div className="flex items-center gap-1 mt-1 overflow-x-auto">
            {[
              { label: 'C=150', val: 150, title: 'Plastic / Smooth PVC / HDPE' },
              { label: 'C=130', val: 130, title: 'Cement-lined Ductile Iron' },
              { label: 'C=120', val: 120, title: 'RCC / Galvanized Steel' },
              { label: 'C=100', val: 100, title: 'Cast Iron (Aged/Corroded)' },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => updatePipe({ hazenWilliamsC: item.val })}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                  pipe.hazenWilliamsC === item.val
                    ? 'bg-[var(--md-sys-color-primary)] text-white border-transparent'
                    : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
                title={item.title}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <UnitInput
          label="Internal Diameter D"
          category="length"
          siValue={pipe.internalDiameterMm * 0.001}
          onChangeSI={(val) => updatePipe({ internalDiameterMm: Math.max(25, Math.round(val * 1000)) })}
          currentUnitId={getFieldUnit('pipe.dia', 'length', 'mm')}
          onUnitChange={(u) => updateFieldUnit('pipe.dia', u)}
          customUnits={customUnits}
          step={25}
          presets={[
            { label: '100 mm (4")', valueSI: 0.100, title: '4" Distribution Lateral' },
            { label: '150 mm (6")', valueSI: 0.150, title: '6" Sub-main Feeder' },
            { label: '200 mm (8")', valueSI: 0.200, title: '8" Municipal Water Main' },
            { label: '250 mm (10")', valueSI: 0.250, title: '10" Trunk Supply Line' },
            { label: '300 mm (12")', valueSI: 0.300, title: '12" Primary Water Main' },
          ]}
          validationRule={{
            minSI: 0.025,
            maxSI: 3.0,
            warningBelowSI: 0.05,
            warningAboveSI: 1.5,
            warningHint: 'Standard pressure distribution mains generally range from 100 mm to 600 mm.',
          }}
          standardRef="AWWA C900 / ASTM D3034 / BNBC 2020 Part 8"
          recommendedRange="100 mm – 400 mm"
          designTip="Internal diameter D directly dictates flow cross-section A = π·D²/4 and velocity head V²/(2g)."
        />
      </div>

      {/* Hydraulic Flow, Length & Pressure Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
        <UnitInput
          label="Flow Rate Q"
          category="flow_rate"
          siValue={pipe.flowRateLps * 0.001}
          onChangeSI={(val) => updatePipe({ flowRateLps: Math.max(0.1, val * 1000) })}
          currentUnitId={getFieldUnit('pipe.flow', 'flow_rate', 'L/s')}
          onUnitChange={(u) => updateFieldUnit('pipe.flow', u)}
          customUnits={customUnits}
          step={5}
          presets={[
            { label: '10 L/s', valueSI: 0.010, title: 'Light Residential Branch' },
            { label: '25 L/s', valueSI: 0.025, title: 'Medium Distribution Flow' },
            { label: '50 L/s', valueSI: 0.050, title: 'High Municipal Main Demand' },
            { label: '100 L/s', valueSI: 0.100, title: 'Industrial / Booster Station' },
          ]}
          validationRule={{
            minSI: 0.0001,
            maxSI: 5.0,
            warningBelowSI: currentVelocityMps < 0.6 ? pipe.flowRateLps * 0.001 + 0.001 : undefined,
            warningAboveSI: currentVelocityMps > 3.0 ? pipe.flowRateLps * 0.001 - 0.001 : undefined,
            warningHint: currentVelocityMps < 0.6
              ? `Low velocity (${currentVelocityMps.toFixed(2)} m/s): Below 0.6 m/s self-cleansing velocity. Silt deposits and suspended solids may settle.`
              : currentVelocityMps > 3.0
              ? `High velocity (${currentVelocityMps.toFixed(2)} m/s): Exceeds 3.0 m/s limit. High friction losses and severe water hammer risks.`
              : undefined,
          }}
          standardRef="AWWA Manual M11 / BNBC 2020 Part 8"
          recommendedRange="0.6 m/s ≤ Velocity ≤ 2.5 m/s"
          designTip="Velocity V = Q/A should ideally be maintained between 0.9 m/s and 2.0 m/s for economic pumping."
        />

        <UnitInput
          label="Pipe Length L"
          category="length"
          siValue={pipe.lengthM}
          onChangeSI={(val) => updatePipe({ lengthM: Math.max(1, val) })}
          currentUnitId={getFieldUnit('pipe.length', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('pipe.length', u)}
          customUnits={customUnits}
          step={20}
          presets={[
            { label: '50 m', valueSI: 50, title: 'Short Site Run' },
            { label: '150 m', valueSI: 150, title: 'Standard Street Block' },
            { label: '300 m', valueSI: 300, title: 'Long Distribution Feeder' },
            { label: '1,000 m', valueSI: 1000, title: '1 km Trunk Transmission' },
          ]}
          standardRef="AWWA / Hydraulics"
          recommendedRange="10 m – 5,000 m"
          designTip="Friction head loss is directly proportional to length L in the Hazen-Williams equation."
        />

        <UnitInput
          label="Inlet Pressure"
          category="pressure"
          siValue={pipe.inletPressureKpa * 1000}
          onChangeSI={(val) => updatePipe({ inletPressureKpa: Math.max(0, val / 1000) })}
          currentUnitId={getFieldUnit('pipe.inletP', 'pressure', 'kPa')}
          onUnitChange={(u) => updateFieldUnit('pipe.inletP', u)}
          customUnits={customUnits}
          step={25}
          presets={[
            { label: '150 kPa', valueSI: 150000, title: 'Low Distribution Pressure (1.5 bar / 22 psi)' },
            { label: '300 kPa', valueSI: 300000, title: 'Normal Municipal Pressure (3 bar / 44 psi)' },
            { label: '500 kPa', valueSI: 500000, title: 'High Pressure Main (5 bar / 73 psi)' },
          ]}
          standardRef="BNBC 2020 Part 8 / AWWA"
          recommendedRange="140 kPa (20 psi) – 550 kPa (80 psi)"
          designTip="Minimum residual pressure at any delivery fixture must exceed 100 kPa (15 psi) per plumbing codes."
        />
      </div>

      {/* Minor Losses & Elevations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
        <UnitInput
          label="Inlet Elevation z1"
          category="length"
          siValue={pipe.inletElevationM}
          onChangeSI={(val) => updatePipe({ inletElevationM: val })}
          currentUnitId={getFieldUnit('pipe.z1', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('pipe.z1', u)}
          customUnits={customUnits}
          step={1}
          presets={[
            { label: '10 m', valueSI: 10, title: 'Elevation 10m' },
            { label: '20 m', valueSI: 20, title: 'Elevation 20m' },
            { label: '30 m', valueSI: 30, title: 'Elevation 30m' },
          ]}
        />
        <UnitInput
          label="Outlet Elevation z2"
          category="length"
          siValue={pipe.outletElevationM}
          onChangeSI={(val) => updatePipe({ outletElevationM: val })}
          currentUnitId={getFieldUnit('pipe.z2', 'length', 'm')}
          onUnitChange={(u) => updateFieldUnit('pipe.z2', u)}
          customUnits={customUnits}
          step={1}
          presets={[
            { label: '10 m', valueSI: 10, title: 'Elevation 10m' },
            { label: '15 m', valueSI: 15, title: 'Elevation 15m' },
            { label: '25 m', valueSI: 25, title: 'Elevation 25m' },
          ]}
        />
        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--md-sys-color-on-surface)]">
            Minor Loss Coeff ΣK
          </label>
          <input
            type="number"
            value={pipe.minorLossCoefficientK}
            onChange={(e) => updatePipe({ minorLossCoefficientK: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-xs bg-[var(--md-sys-color-surface)]"
            step="0.5"
            min="0"
          />
          <div className="flex items-center gap-1 mt-1 overflow-x-auto">
            {[
              { label: '1.0', val: 1.0, title: 'Straight line with entry/exit' },
              { label: '2.5', val: 2.5, title: 'A few bends and standard gate valve' },
              { label: '5.0', val: 5.0, title: 'Multiple bends, tee & check valve' },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => updatePipe({ minorLossCoefficientK: item.val })}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                  pipe.minorLossCoefficientK === item.val
                    ? 'bg-[var(--md-sys-color-primary)] text-white border-transparent'
                    : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
                title={item.title}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface PipeHydraulicsMetricsProps {
  result: PipeHydraulicsResult;
}

export const PipeHydraulicsMetrics: React.FC<PipeHydraulicsMetricsProps> = ({ result }) => {
  return (
    <div className="space-y-4">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Flow Velocity (V)
          </div>
          <div className="text-xl font-mono font-bold text-sky-600 dark:text-sky-400">
            {result.velocityMps.toFixed(2)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">m/s</span>
          </div>
          <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            {result.selfCleansingStatus === 'pass' ? '✓ Self-Cleansing' : '⚠ Sub-Critical Sluggish'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Friction Head Loss (h_f)
          </div>
          <div className="text-xl font-mono font-bold text-rose-600 dark:text-rose-400">
            {result.frictionHeadLossM.toFixed(2)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">m</span>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Slope Sf = {result.frictionSlopeMPerM} m/m
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Residual Outlet Pressure
          </div>
          <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {result.outletPressureKpa.toFixed(1)}{' '}
            <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">kPa</span>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Delivery Terminal Head
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
            Reynolds Number (Re)
          </div>
          <div className="text-xl font-mono font-bold text-[var(--md-sys-color-on-surface)]">
            {result.reynoldsNumber.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-[var(--md-sys-color-primary)]">
            Flow Regime: {result.flowRegime}
          </div>
        </div>
      </div>

      {/* Hydraulic Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="font-bold text-[var(--md-sys-color-primary)]">Energy Grade Line (EGL)</div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface)]">
            Inlet EGL: <strong>{result.inletTotalHeadM} m</strong>
          </div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface)]">
            Outlet EGL: <strong>{result.outletTotalHeadM} m</strong>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Velocity Head: {result.velocityHeadM} m
          </div>
        </div>

        <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="font-bold text-[var(--md-sys-color-primary)]">Head Loss Breakdown</div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface)]">
            Friction Loss h_f: <strong>{result.frictionHeadLossM} m</strong>
          </div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface)]">
            Minor Loss h_m: <strong>{result.minorHeadLossM} m</strong>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Total Dynamic Loss: {result.totalHeadLossM} m
          </div>
        </div>

        <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1">
          <div className="font-bold text-[var(--md-sys-color-primary)]">Cross-Sectional Properties</div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface)]">
            Flow Area A: <strong>{result.flowAreaM2} m²</strong>
          </div>
          <div className="text-[11px] text-[var(--md-sys-color-on-surface)]">
            Hydraulic Radius R: <strong>{result.hydraulicRadiusM} m</strong>
          </div>
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
            Discharge Q: {result.flowRateM3ps} m³/s ({result.flowRateLps} L/s)
          </div>
        </div>
      </div>
    </div>
  );
};
