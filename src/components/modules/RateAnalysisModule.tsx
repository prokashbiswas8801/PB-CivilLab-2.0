import React from 'react';
import { Calculator, ArrowRight } from 'lucide-react';
import {
  CivilWorkspace,
  CurrencyCode,
  SUPPORTED_CURRENCIES,
  RateAnalysisWorkType,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import { getCurrencySymbol, RateAnalysisResult } from '../../utils/calculations';
import { UnitInput } from '../UnitInput';

export interface RateAnalysisInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
  onApplyRateToBOQ: () => void;
}

export const RateAnalysisInputs: React.FC<RateAnalysisInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
  onApplyRateToBOQ,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
            Engineering Trade Work Type
          </label>
          <span className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface)]">
            {getCurrencySymbol(activeWorkspace.rateAnalysis.currency)} ({activeWorkspace.rateAnalysis.currency})
          </span>
        </div>

        <select
          value={activeWorkspace.rateAnalysis.workType}
          onChange={(e) => {
            const wt = e.target.value as RateAnalysisWorkType;
            updateActiveWorkspace((ws) => ({
              ...ws,
              rateAnalysis: { ...ws.rateAnalysis, workType: wt },
            }));
          }}
          className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono font-bold"
        >
          <option value="rcc-1-1.5-3">RCC Structural Concrete (1:1.5:3, ~M20)</option>
          <option value="rcc-1-2-4">RCC Structural Concrete (1:2:4, ~M15)</option>
          <option value="pcc-1-3-6">PCC Foundation Bed Lean Concrete (1:3:6)</option>
          <option value="brickwork-1-6">First Class Brickwork in 1:6 Mortar</option>
          <option value="plaster-1-4">12mm Wall Plaster in 1:4 Mortar</option>
          <option value="rebar-fabrication">Rebar Cutting, Bending & Placing (1 Ton)</option>
        </select>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <UnitInput
              label="Basis Volume"
              category="volume"
              siValue={activeWorkspace.rateAnalysis.basisVolumeM3}
              onChangeSI={(val) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, basisVolumeM3: val },
                }));
              }}
              currentUnitId={getFieldUnit('rate.vol', 'volume', 'm3')}
              onUnitChange={(u) => updateFieldUnit('rate.vol', u)}
              customUnits={customUnits}
              step={0.5}
              min={0.1}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1">Currency Code</label>
            <select
              value={activeWorkspace.rateAnalysis.currency}
              onChange={(e) => {
                const curr = e.target.value as CurrencyCode;
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  currency: curr,
                  boq: { ...ws.boq, currency: curr },
                  rateAnalysis: { ...ws.rateAnalysis, currency: curr },
                }));
              }}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Material Market Rates */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
          Material Market Procurement Rates
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold mb-1">Cement ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/50kg bag)</label>
            <input
              type="number"
              step="10"
              value={activeWorkspace.rateAnalysis.cementPricePerBag}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, cementPricePerBag: val },
                }));
              }}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1">Coarse Sand ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)</label>
            <input
              type="number"
              step="50"
              value={activeWorkspace.rateAnalysis.sandPricePerM3}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, sandPricePerM3: val },
                }));
              }}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1">Stone Chips ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)</label>
            <input
              type="number"
              step="50"
              value={activeWorkspace.rateAnalysis.stoneChipsPricePerM3}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, stoneChipsPricePerM3: val },
                }));
              }}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1">Rebar Steel ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/kg)</label>
            <input
              type="number"
              step="2"
              value={activeWorkspace.rateAnalysis.rebarPricePerKg}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, rebarPricePerKg: val },
                }));
              }}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
            />
          </div>
        </div>

        {activeWorkspace.rateAnalysis.workType.startsWith('rcc') && (
          <div>
            <label className="block text-[11px] font-semibold mb-1">Rebar Allowance (kg/m³ concrete)</label>
            <input
              type="number"
              step="10"
              value={activeWorkspace.rateAnalysis.rebarAllowanceKgPerM3}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, rebarAllowanceKgPerM3: val },
                }));
              }}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
            />
          </div>
        )}
      </div>

      {/* Labor Daily Wages & Man-days */}
      <div className="space-y-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
          Daily Labor Wages & Man-days
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold mb-1">Head Mason ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/day)</label>
            <input
              type="number"
              step="50"
              value={activeWorkspace.rateAnalysis.masonDailyWage}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, masonDailyWage: val },
                }));
              }}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1">Mason Days Required</label>
            <input
              type="number"
              step="0.05"
              value={activeWorkspace.rateAnalysis.masonDaysRequired}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, masonDaysRequired: val },
                }));
              }}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1">Helper / Jogali ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/day)</label>
            <input
              type="number"
              step="50"
              value={activeWorkspace.rateAnalysis.laborerDailyWage}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, laborerDailyWage: val },
                }));
              }}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1">Helper Days Required</label>
            <input
              type="number"
              step="0.1"
              value={activeWorkspace.rateAnalysis.laborerDaysRequired}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, laborerDaysRequired: val },
                }));
              }}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Plant Hire & Margins */}
      <div className="space-y-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
          Plant Hire & Contractor Margin
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold mb-1">Mixer Hire ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)</label>
            <input
              type="number"
              step="25"
              value={activeWorkspace.rateAnalysis.mixerHirePerM3}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, mixerHirePerM3: val },
                }));
              }}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1">Shuttering Hire ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)</label>
            <input
              type="number"
              step="50"
              value={activeWorkspace.rateAnalysis.shutteringScaffoldingPerM3}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, shutteringScaffoldingPerM3: val },
                }));
              }}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1">Water & Elect (%)</label>
            <input
              type="number"
              step="0.5"
              value={activeWorkspace.rateAnalysis.waterElectricityPercent}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, waterElectricityPercent: val },
                }));
              }}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1">Contractor Profit (%)</label>
            <input
              type="number"
              step="1.0"
              value={activeWorkspace.rateAnalysis.contractorProfitPercent}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  rateAnalysis: { ...ws.rateAnalysis, contractorProfitPercent: val },
                }));
              }}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onApplyRateToBOQ}
        className="w-full touch-target-48 py-2.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
      >
        <ArrowRight className="w-4 h-4" />
        <span>Apply Unit Rate to BOQ Measurement Sheet</span>
      </button>
    </div>
  );
};

export interface RateAnalysisTablesProps {
  rateResult: RateAnalysisResult;
}

export const RateAnalysisTables: React.FC<RateAnalysisTablesProps> = ({ rateResult }) => {
  return (
    <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
        <div>
          <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <span>Granular Cost Rate Analysis</span>
          </h2>
          <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
            {rateResult.workDescription} ({rateResult.basisVolumeM3} m³)
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono block text-[var(--md-sys-color-on-surface-variant)]">Composite Unit Rate</span>
          <span className="text-lg font-bold font-mono text-[var(--md-sys-color-primary)]">
            {rateResult.currencySymbol} {rateResult.unitRatePerM3.toFixed(2)} / m³
          </span>
        </div>
      </div>

      {/* Materials Breakdown */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">
          1. Direct Material Components
        </h3>
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] font-bold bg-[var(--md-sys-color-surface-container-low)]">
              <th className="py-2 px-2 text-left">Material</th>
              <th className="py-2 px-2 text-right">Quantity</th>
              <th className="py-2 px-2 text-center">Unit</th>
              <th className="py-2 px-2 text-right">Rate ({rateResult.currencySymbol})</th>
              <th className="py-2 px-2 text-right">Cost ({rateResult.currencySymbol})</th>
              <th className="py-2 px-2 text-right">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
            {rateResult.materials.map((m, i) => (
              <tr key={i} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                <td className="py-1.5 px-2 font-semibold text-[var(--md-sys-color-on-surface)]">{m.name}</td>
                <td className="py-1.5 px-2 text-right">{m.quantity}</td>
                <td className="py-1.5 px-2 text-center">{m.unit}</td>
                <td className="py-1.5 px-2 text-right">{m.unitPrice.toLocaleString()}</td>
                <td className="py-1.5 px-2 text-right font-bold">{m.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-1.5 px-2 text-right text-[var(--md-sys-color-on-surface-variant)]">{m.percentageOfMaterial}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
              <td colSpan={4} className="py-2 px-2 text-left">Materials Subtotal:</td>
              <td className="py-2 px-2 text-right text-[var(--md-sys-color-primary)]">
                {rateResult.currencySymbol} {rateResult.materialsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Labor Breakdown */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">
          2. Direct Labor & Craftsmanship
        </h3>
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] font-bold bg-[var(--md-sys-color-surface-container-low)]">
              <th className="py-2 px-2 text-left">Trade</th>
              <th className="py-2 px-2 text-right">Days</th>
              <th className="py-2 px-2 text-right">Daily Wage ({rateResult.currencySymbol})</th>
              <th className="py-2 px-2 text-right">Cost ({rateResult.currencySymbol})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
            {rateResult.labors.map((l, i) => (
              <tr key={i} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                <td className="py-1.5 px-2 font-semibold text-[var(--md-sys-color-on-surface)]">{l.trade}</td>
                <td className="py-1.5 px-2 text-right">{l.daysRequired}</td>
                <td className="py-1.5 px-2 text-right">{l.dailyWage.toLocaleString()}</td>
                <td className="py-1.5 px-2 text-right font-bold">{l.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
              <td colSpan={3} className="py-2 px-2 text-left">Labor Subtotal:</td>
              <td className="py-2 px-2 text-right text-[var(--md-sys-color-tertiary)]">
                {rateResult.currencySymbol} {rateResult.laborsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Equipment & Scaffolding Breakdown */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">
          3. Equipment Plant & Formwork Centering
        </h3>
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] font-bold bg-[var(--md-sys-color-surface-container-low)]">
              <th className="py-2 px-2 text-left">Plant / Formwork</th>
              <th className="py-2 px-2 text-right">Rate / Unit</th>
              <th className="py-2 px-2 text-right">Total ({rateResult.currencySymbol})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
            {rateResult.equipment.map((eq, i) => (
              <tr key={i} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                <td className="py-1.5 px-2 font-semibold text-[var(--md-sys-color-on-surface)]">{eq.equipment}</td>
                <td className="py-1.5 px-2 text-right">{eq.ratePerUnit.toLocaleString()}</td>
                <td className="py-1.5 px-2 text-right font-bold">{eq.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
              <td colSpan={2} className="py-2 px-2 text-left">Equipment Subtotal:</td>
              <td className="py-2 px-2 text-right">
                {rateResult.currencySymbol} {rateResult.equipmentCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
