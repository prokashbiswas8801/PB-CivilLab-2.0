import React from 'react';
import {
  FileSpreadsheet,
  Plus,
  Calculator,
  Trash2,
  Sparkles,
  Download,
  Edit3,
  Copy,
} from 'lucide-react';
import {
  CivilWorkspace,
  CurrencyCode,
  SUPPORTED_CURRENCIES,
  TakeoffCategory,
  TakeoffUnit,
  TakeoffLineItem,
  CustomUnitDefinition,
  UnitCategoryKey,
} from '../../types/civil';
import {
  getCurrencySymbol,
  BOQResult,
  RateAnalysisResult,
  ComputedTakeoffItem,
} from '../../utils/calculations';
import { UnitInput } from '../UnitInput';

export interface BoqEstimatorInputsProps {
  activeWorkspace: CivilWorkspace;
  updateActiveWorkspace: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  rateAnalysisResult: RateAnalysisResult | null;
  customUnits: CustomUnitDefinition[];
  getFieldUnit: (fieldKey: string, category: UnitCategoryKey, fallbackUnitId: string) => string;
  updateFieldUnit: (fieldKey: string, unitId: string) => void;
  editingTakeoffItemId: string | null;
  setEditingTakeoffItemId: (id: string | null) => void;
  itemNo: string;
  setItemNo: (val: string) => void;
  itemDesc: string;
  setItemDesc: (val: string) => void;
  itemCategory: TakeoffCategory;
  setItemCategory: (val: TakeoffCategory) => void;
  itemUnit: TakeoffUnit;
  setItemUnit: (val: TakeoffUnit) => void;
  itemMembers: number;
  setItemMembers: (val: number) => void;
  itemLength: number;
  setItemLength: (val: number) => void;
  itemWidth: number;
  setItemWidth: (val: number) => void;
  itemHeight: number;
  setItemHeight: (val: number) => void;
  itemDeduction: number;
  setItemDeduction: (val: number) => void;
  itemWastage: number;
  setItemWastage: (val: number) => void;
  itemUnitRate: number;
  setItemUnitRate: (val: number) => void;
  onSaveTakeoffItem: (e: React.FormEvent) => void;
  onApplyRateToBOQ: () => void;
  onClearAllBOQItems: () => void;
  onLoadSampleBOQItems: () => void;
  onExportBOQCSV: () => void;
  onSyncFromModules?: () => void;
}

export const BoqEstimatorInputs: React.FC<BoqEstimatorInputsProps> = ({
  activeWorkspace,
  updateActiveWorkspace,
  rateAnalysisResult,
  customUnits,
  getFieldUnit,
  updateFieldUnit,
  editingTakeoffItemId,
  setEditingTakeoffItemId,
  itemNo,
  setItemNo,
  itemDesc,
  setItemDesc,
  itemCategory,
  setItemCategory,
  itemUnit,
  setItemUnit,
  itemMembers,
  setItemMembers,
  itemLength,
  setItemLength,
  itemWidth,
  setItemWidth,
  itemHeight,
  setItemHeight,
  itemDeduction,
  setItemDeduction,
  itemWastage,
  setItemWastage,
  itemUnitRate,
  setItemUnitRate,
  onSaveTakeoffItem,
  onApplyRateToBOQ,
  onClearAllBOQItems,
  onLoadSampleBOQItems,
  onExportBOQCSV,
  onSyncFromModules,
}) => {
  return (
    <div className="space-y-4">
      {/* Project Currency & Markup Modifiers */}
      <div className="p-3.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
            Project BOQ Financial Modifiers
          </span>
          <span className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface)]">
            Currency: {getCurrencySymbol(activeWorkspace.boq.currency)} ({activeWorkspace.boq.currency})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold mb-1">Currency</label>
            <select
              value={activeWorkspace.boq.currency}
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
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1">Contingency (%)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="50"
              value={activeWorkspace.boq.contingencyPercent}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  boq: { ...ws.boq, contingencyPercent: val },
                }));
              }}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1">CP & OH (%)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="50"
              value={activeWorkspace.boq.contractorOverheadPercent}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  boq: { ...ws.boq, contractorOverheadPercent: val },
                }));
              }}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1">VAT / Tax (%)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="50"
              value={activeWorkspace.boq.vatTaxPercent}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  boq: { ...ws.boq, vatTaxPercent: val },
                }));
              }}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Add/Edit Takeoff Line Item Form */}
      <form onSubmit={onSaveTakeoffItem} className="p-3.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
            {editingTakeoffItemId ? 'Edit Takeoff Line Item' : 'Add Item to Measurement Sheet (L×W×H)'}
          </span>
          {editingTakeoffItemId && (
            <button
              type="button"
              onClick={() => {
                setEditingTakeoffItemId(null);
                setItemDesc('');
                setItemNo('');
              }}
              className="text-xs text-[var(--md-sys-color-error)] underline cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold mb-1">Item #</label>
            <input
              type="text"
              placeholder="e.g. 1.01"
              value={itemNo}
              onChange={(e) => setItemNo(e.target.value)}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold mb-1">Item Description</label>
            <input
              type="text"
              required
              placeholder="e.g. RCC (1:1.5:3) in Isolated Footings"
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold mb-1">Trade Category</label>
            <select
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value as TakeoffCategory)}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            >
              <option value="earthwork">Earthwork</option>
              <option value="substructure">Substructure</option>
              <option value="superstructure">Superstructure</option>
              <option value="rebar">Rebar Steel</option>
              <option value="masonry">Masonry</option>
              <option value="finishing">Finishing / Tiles</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="misc">Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1">Unit</label>
            <select
              value={itemUnit}
              onChange={(e) => setItemUnit(e.target.value as TakeoffUnit)}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            >
              <option value="m3">m³ (Cubic Meter)</option>
              <option value="m2">m² (Square Meter)</option>
              <option value="m">m (Linear Meter)</option>
              <option value="cft">CFT (Cubic Feet)</option>
              <option value="sft">SFT (Square Feet)</option>
              <option value="rft">RFT (Running Feet)</option>
              <option value="kg">kg (Kilogram)</option>
              <option value="ton">Ton (Metric Tonne)</option>
              <option value="bags">Bags (50kg)</option>
              <option value="nos">Nos (Items / Count)</option>
              <option value="lump-sum">Lump-Sum</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1">Nos / Count</label>
            <input
              type="number"
              min="1"
              step="1"
              value={itemMembers}
              onChange={(e) => setItemMembers(Number(e.target.value))}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>
        </div>

        {/* L x W x H with Flexible Universal Unit Engine */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <UnitInput
            label="Length L"
            category="length"
            siValue={itemLength}
            onChangeSI={(val) => setItemLength(val)}
            currentUnitId={getFieldUnit('boq.itemL', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('boq.itemL', u)}
            customUnits={customUnits}
            step={0.01}
          />
          <UnitInput
            label="Width W"
            category="length"
            siValue={itemWidth}
            onChangeSI={(val) => setItemWidth(val)}
            currentUnitId={getFieldUnit('boq.itemW', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('boq.itemW', u)}
            customUnits={customUnits}
            step={0.01}
          />
          <UnitInput
            label="Height H"
            category="length"
            siValue={itemHeight}
            onChangeSI={(val) => setItemHeight(val)}
            currentUnitId={getFieldUnit('boq.itemH', 'length', 'm')}
            onUnitChange={(u) => updateFieldUnit('boq.itemH', u)}
            customUnits={customUnits}
            step={0.01}
          />
          <div>
            <label className="block text-[11px] font-semibold mb-1">Deduction</label>
            <input
              type="number"
              step="0.01"
              value={itemDeduction}
              onChange={(e) => setItemDeduction(Number(e.target.value))}
              className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold mb-1">Wastage (%)</label>
            <input
              type="number"
              step="0.5"
              value={itemWastage}
              onChange={(e) => setItemWastage(Number(e.target.value))}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold">Unit Rate ({getCurrencySymbol(activeWorkspace.boq.currency)})</label>
              {rateAnalysisResult && (
                <button
                  type="button"
                  onClick={() => setItemUnitRate(itemUnit === 'cft' ? rateAnalysisResult.unitRatePerCft : rateAnalysisResult.unitRatePerM3)}
                  className="text-[10px] text-[var(--md-sys-color-primary)] font-bold underline cursor-pointer"
                  title="Import calculated rate from Rate Analysis Workbench"
                >
                  Use Rate ({itemUnit === 'cft' ? `${rateAnalysisResult.unitRatePerCft.toFixed(2)}/cft` : `${rateAnalysisResult.unitRatePerM3.toFixed(2)}/m³`})
                </button>
              )}
            </div>
            <input
              type="number"
              step="0.1"
              value={itemUnitRate}
              onChange={(e) => setItemUnitRate(Number(e.target.value))}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full touch-target-48 py-2.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{editingTakeoffItemId ? 'Save Changes' : 'Append to Takeoff Spreadsheet'}</span>
        </button>
      </form>

      {/* Quick Helper Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onApplyRateToBOQ}
            className="text-xs font-semibold text-[var(--md-sys-color-primary)] flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Apply Rate Analysis to BOQ</span>
          </button>

          {onSyncFromModules && (
            <button
              type="button"
              onClick={onSyncFromModules}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 hover:underline cursor-pointer px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10"
              title="One-click auto-sync Rebar BBS tonnage and Concrete Mix batch volumes into this BOQ"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Auto-Sync BBS &amp; Mix</span>
            </button>
          )}

          {activeWorkspace.boq.items.length > 0 ? (
            <button
              type="button"
              onClick={onClearAllBOQItems}
              className="text-xs font-semibold text-[var(--md-sys-color-error)] flex items-center gap-1 hover:underline cursor-pointer"
              title="Clear all takeoff line items in this workspace"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Items</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onLoadSampleBOQItems}
              className="text-xs font-semibold text-[var(--md-sys-color-primary)] flex items-center gap-1 hover:underline cursor-pointer"
              title="Load 7 demo takeoff items"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Demo Takeoffs</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onExportBOQCSV}
          className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 hover:underline cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />
          <span>Export CSV Sheet</span>
        </button>
      </div>
    </div>
  );
};

export interface BoqEstimatorTableProps {
  boqResult: BOQResult;
  filteredBOQItems: ComputedTakeoffItem[];
  boqCategoryFilter: 'all' | TakeoffCategory;
  setBoqCategoryFilter: (cat: 'all' | TakeoffCategory) => void;
  onEditTakeoffItem: (item: ComputedTakeoffItem) => void;
  onDuplicateTakeoffItem: (item: ComputedTakeoffItem) => void;
  onDeleteTakeoffItem: (id: string) => void;
  onLoadSampleBOQItems: () => void;
  onSyncFromModules?: () => void;
}

export const BoqEstimatorTable: React.FC<BoqEstimatorTableProps> = ({
  boqResult,
  filteredBOQItems,
  boqCategoryFilter,
  setBoqCategoryFilter,
  onEditTakeoffItem,
  onDuplicateTakeoffItem,
  onDeleteTakeoffItem,
  onLoadSampleBOQItems,
  onSyncFromModules,
}) => {
  return (
    <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
        <div>
          <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <span>Dynamic Measurement Sheet (L × W × H)</span>
          </h2>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
              Itemized Takeoff & Cost Quantification ({boqResult.items.length} Lines)
            </span>
            {onSyncFromModules && (
              <button
                type="button"
                onClick={onSyncFromModules}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer transition-colors"
                title="Auto-sync BBS rebar tonnage and Concrete Mix batch volumes into this takeoff sheet"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Auto-Sync BBS &amp; Mix</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
          {(['all', 'earthwork', 'substructure', 'superstructure', 'rebar', 'masonry', 'finishing'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setBoqCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md capitalize cursor-pointer transition-colors ${
                boqCategoryFilter === cat
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                  : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] font-bold">
              <th className="py-2.5 px-2">Item #</th>
              <th className="py-2.5 px-2">Description</th>
              <th className="py-2.5 px-2 text-center">Nos</th>
              <th className="py-2.5 px-2 text-right">L (m)</th>
              <th className="py-2.5 px-2 text-right">W (m)</th>
              <th className="py-2.5 px-2 text-right">H (m)</th>
              <th className="py-2.5 px-2 text-right">Ded.</th>
              <th className="py-2.5 px-2 text-center">Unit</th>
              <th className="py-2.5 px-2 text-right">Billable</th>
              <th className="py-2.5 px-2 text-right">Rate ({boqResult.currencySymbol})</th>
              <th className="py-2.5 px-2 text-right">Total ({boqResult.currencySymbol})</th>
              <th className="py-2.5 px-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
            {filteredBOQItems.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                    <FileSpreadsheet className="w-8 h-8 text-[var(--md-sys-color-outline)]" />
                    <p className="font-semibold text-sm text-[var(--md-sys-color-on-surface)]">
                      Takeoff Spreadsheet is Empty
                    </p>
                    <p className="max-w-md text-xs">
                      This project currently has no takeoff line items. Append items using the form on the left, or quickly load sample engineering data.
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onLoadSampleBOQItems}
                        className="touch-target-48 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Load Demo Takeoffs (7 Items)</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBOQItems.map((it) => (
                <tr key={it.id} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                  <td className="py-2 px-2 font-bold text-[var(--md-sys-color-primary)] whitespace-nowrap">
                    {it.itemNo}
                  </td>
                  <td className="py-2 px-2 min-w-[180px]">
                    <div className="font-semibold text-[var(--md-sys-color-on-surface)] truncate max-w-xs">{it.description}</div>
                    <span className="text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                      [{it.category}]
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">{it.numberOfMembers}</td>
                  <td className="py-2 px-2 text-right">{it.lengthM > 0 ? it.lengthM.toFixed(2) : '-'}</td>
                  <td className="py-2 px-2 text-right">{it.widthM > 0 ? it.widthM.toFixed(2) : '-'}</td>
                  <td className="py-2 px-2 text-right">{it.heightM > 0 ? it.heightM.toFixed(2) : '-'}</td>
                  <td className="py-2 px-2 text-right text-[var(--md-sys-color-error)]">
                    {it.deductionQty > 0 ? `-${it.deductionQty.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-2 px-2 text-center font-bold">{it.unit}</td>
                  <td className="py-2 px-2 text-right font-bold">
                    {it.totalBillableQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {it.wastagePercent > 0 && (
                      <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block font-normal">
                        +{it.wastagePercent}% wst
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-semibold">
                    {it.unitRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-[var(--md-sys-color-on-surface)] whitespace-nowrap">
                    {it.itemTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditTakeoffItem(it)}
                        className="p-1 hover:text-[var(--md-sys-color-primary)] cursor-pointer"
                        title="Edit Line Item"
                        aria-label={`Edit ${it.description}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateTakeoffItem(it)}
                        className="p-1 hover:text-[var(--md-sys-color-tertiary)] cursor-pointer"
                        title="Duplicate Line Item"
                        aria-label={`Duplicate ${it.description}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTakeoffItem(it.id)}
                        className="p-1 hover:text-[var(--md-sys-color-error)] cursor-pointer"
                        title="Delete Line Item"
                        aria-label={`Delete ${it.description}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Financial Reconciliation Summary Card */}
      <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">Direct Takeoff Subtotal:</span>
          <span className="font-bold">{boqResult.currencySymbol} {boqResult.subtotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">+ Contingency Reserve ({boqResult.contingencyPercent}%):</span>
          <span>{boqResult.currencySymbol} {boqResult.contingencyAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">+ Contractor Profit & Overhead CP&OH ({boqResult.contractorOverheadPercent}%):</span>
          <span className="text-[var(--md-sys-color-tertiary)] font-bold">{boqResult.currencySymbol} {boqResult.contractorOverheadAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">+ Statutory VAT / Tax ({boqResult.vatTaxPercent}%):</span>
          <span>{boqResult.currencySymbol} {boqResult.vatTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] flex justify-between items-center text-base font-mono font-bold text-[var(--md-sys-color-primary)]">
          <span>ESTIMATED GRAND TOTAL BOQ ({boqResult.currency}):</span>
          <span className="text-xl font-extrabold">{boqResult.currencySymbol} {boqResult.grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
};
