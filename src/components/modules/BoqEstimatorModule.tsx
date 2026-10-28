import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Calculator,
  Trash2,
  Sparkles,
  Download,
  Edit3,
  Copy,
  Layers,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  SlidersHorizontal,
  FileText,
  DollarSign,
  Building,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
  Search,
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
  UserProfile,
  WBSSection,
  BidTabulationData,
} from '../../types/civil';
import {
  getCurrencySymbol,
  BOQResult,
  RateAnalysisResult,
  ComputedTakeoffItem,
} from '../../utils/calculations';
import { UnitInput } from '../UnitInput';
import {
  STANDARD_WBS_SECTIONS,
  REGIONAL_DISTRICT_ADJUSTMENTS,
  ALL_RATE_LIBRARIES,
  createDefaultBidTabulation,
  RateLibraryItem,
} from '../../utils/costLibraries';
import {
  computeCashFlowForecast,
  CashFlowForecastResult,
} from '../../utils/cashFlowEngine';
import {
  evaluateBidTabulation,
  BidTabulationReport,
} from '../../utils/bidTabulationEngine';
import {
  exportTenderBoqCsv,
  exportTenderBoqPdf,
} from '../../utils/tenderExport';

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
  selectedWbsSectionId?: string;
  setSelectedWbsSectionId?: (id: string) => void;
  itemStartMonth?: number;
  setItemStartMonth?: (val: number) => void;
  itemDurationMonths?: number;
  setItemDurationMonths?: (val: number) => void;
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
  selectedWbsSectionId = 'sec-100',
  setSelectedWbsSectionId,
  itemStartMonth = 1,
  setItemStartMonth,
  itemDurationMonths = 2,
  setItemDurationMonths,
}) => {
  const currentLibraryId = activeWorkspace.boq?.rateLibraryId || 'pwd-2024';
  const currentDistrictId = activeWorkspace.boq?.regionalDistrictId || 'dhaka';
  const activeDistrict = REGIONAL_DISTRICT_ADJUSTMENTS.find((d) => d.id === currentDistrictId) || REGIONAL_DISTRICT_ADJUSTMENTS[0];
  const activeLibrary = ALL_RATE_LIBRARIES[currentLibraryId] || ALL_RATE_LIBRARIES['pwd-2024'];

  const [localWbsSection, setLocalWbsSection] = useState<string>(selectedWbsSectionId);
  const [localStartMonth, setLocalStartMonth] = useState<number>(itemStartMonth);
  const [localDurationMonths, setLocalDurationMonths] = useState<number>(itemDurationMonths);

  const handleWbsChange = (secId: string) => {
    setLocalWbsSection(secId);
    if (setSelectedWbsSectionId) setSelectedWbsSectionId(secId);
    const sec = STANDARD_WBS_SECTIONS.find((s) => s.id === secId);
    if (sec) {
      setItemCategory(sec.category);
      if (!itemNo || itemNo.includes('.')) {
        const matchingCount = activeWorkspace.boq.items.filter((it) => it.wbsSectionId === secId).length;
        setItemNo(`${sec.code}.${String(matchingCount + 1).padStart(2, '0')}`);
      }
    }
  };

  // Re-sequence all items hierarchically
  const handleResequenceAllItems = () => {
    const sectionCounts: Record<string, number> = {};
    const updated = activeWorkspace.boq.items.map((it) => {
      const secId = it.wbsSectionId || 'sec-100';
      const sec = STANDARD_WBS_SECTIONS.find((s) => s.id === secId) || STANDARD_WBS_SECTIONS[0];
      sectionCounts[secId] = (sectionCounts[secId] || 0) + 1;
      return {
        ...it,
        wbsSectionId: secId,
        itemNo: `${sec.code}.${String(sectionCounts[secId]).padStart(2, '0')}`,
      };
    });

    updateActiveWorkspace((ws) => ({
      ...ws,
      boq: {
        ...ws.boq,
        items: updated,
      },
    }));
  };

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
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1">CP&amp;OH Margin (%)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="60"
              value={activeWorkspace.boq.contractorOverheadPercent}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  boq: { ...ws.boq, contractorOverheadPercent: val },
                }));
              }}
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
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
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>
        </div>

        {/* Regional District Multiplier & Rate Library Pill */}
        <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] flex flex-wrap items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] gap-2">
          <div className="flex items-center gap-1.5 font-mono">
            <MapPin className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Zone: <strong>{activeDistrict.name}</strong> ({activeDistrict.multiplier}x)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono">Lib: {activeLibrary.name.split(' ')[0]}</span>
            <button
              type="button"
              onClick={handleResequenceAllItems}
              className="text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
              title="Automatically re-sequence item numbers based on WBS Chapters (100.01, 200.01...)"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>Auto-Sequence WBS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Item Creator Form */}
      <form onSubmit={onSaveTakeoffItem} className="p-3.5 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
            {editingTakeoffItemId ? 'Edit Takeoff Line Item' : 'Append Takeoff Line Item'}
          </h3>
          {editingTakeoffItemId && (
            <button
              type="button"
              onClick={() => setEditingTakeoffItemId(null)}
              className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:underline cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* WBS Chapter Selection */}
        <div>
          <label className="block text-[11px] font-semibold mb-1 flex items-center justify-between">
            <span>Work Breakdown Structure (WBS Chapter)</span>
            <span className="text-[10px] text-[var(--md-sys-color-primary)] font-mono">Auto-Numbering</span>
          </label>
          <select
            value={localWbsSection}
            onChange={(e) => handleWbsChange(e.target.value)}
            className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
          >
            {STANDARD_WBS_SECTIONS.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] font-semibold mb-1">Item #</label>
            <input
              type="text"
              value={itemNo}
              onChange={(e) => setItemNo(e.target.value)}
              placeholder="e.g. 200.01"
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-[11px] font-semibold mb-1">Item Description</label>
            <input
              type="text"
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              placeholder="e.g. Foundation earth excavation in all soils"
              className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
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

        {/* Wastage & Unit Rate */}
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
                  Use Analysis ({itemUnit === 'cft' ? `${rateAnalysisResult.unitRatePerCft.toFixed(2)}/cft` : `${rateAnalysisResult.unitRatePerM3.toFixed(2)}/m³`})
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

        {/* Scheduling & Cash Flow Links */}
        <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>Timeline Linkage for S-Curve Cash Flow</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-semibold mb-1">Start Month</label>
              <input
                type="number"
                min="1"
                max="36"
                value={localStartMonth}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value));
                  setLocalStartMonth(val);
                  if (setItemStartMonth) setItemStartMonth(val);
                }}
                className="w-full px-2 py-1.5 rounded-md border border-[var(--md-sys-color-outline)] text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold mb-1">Duration (Months)</label>
              <input
                type="number"
                min="1"
                max="24"
                value={localDurationMonths}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value));
                  setLocalDurationMonths(val);
                  if (setItemDurationMonths) setItemDurationMonths(val);
                }}
                className="w-full px-2 py-1.5 rounded-md border border-[var(--md-sys-color-outline)] text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full touch-target-48 py-2.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs btn-tactile"
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
              title="Load demo takeoff items"
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
  activeWorkspace?: CivilWorkspace;
  updateActiveWorkspace?: (updater: (ws: CivilWorkspace) => CivilWorkspace) => void;
  userProfile?: UserProfile;
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
  activeWorkspace,
  updateActiveWorkspace,
  userProfile,
}) => {
  // Navigation Tabs for Master QS Control Center
  const [activeTab, setActiveTab] = useState<'takeoff' | 'rate-library' | 'bid-tabulation' | 'cash-flow' | 'tender-forms'>('takeoff');

  // Multi-Rate Library selection & Regional index state
  const selectedLibraryId = activeWorkspace?.boq?.rateLibraryId || 'pwd-2024';
  const selectedDistrictId = activeWorkspace?.boq?.regionalDistrictId || 'dhaka';
  const activeLibrary = ALL_RATE_LIBRARIES[selectedLibraryId] || ALL_RATE_LIBRARIES['pwd-2024'];
  const activeDistrict = REGIONAL_DISTRICT_ADJUSTMENTS.find((d) => d.id === selectedDistrictId) || REGIONAL_DISTRICT_ADJUSTMENTS[0];

  // Bid Tabulation Data
  const bidData: BidTabulationData = useMemo(() => {
    return activeWorkspace?.boq?.bidTabulation || createDefaultBidTabulation();
  }, [activeWorkspace?.boq?.bidTabulation]);

  const bidReport: BidTabulationReport = useMemo(() => {
    return evaluateBidTabulation(bidData);
  }, [bidData]);

  // Cash Flow & S-Curve Schedule
  const cashFlowResult: CashFlowForecastResult = useMemo(() => {
    return computeCashFlowForecast(boqResult.items, {
      totalProjectMonths: activeWorkspace?.boq?.projectDurationMonths || 12,
      retainagePercent: activeWorkspace?.boq?.retainagePercent || 5,
      contingencyPercent: boqResult.contingencyPercent,
      contractorOverheadPercent: boqResult.contractorOverheadPercent,
      vatTaxPercent: boqResult.vatTaxPercent,
    });
  }, [boqResult, activeWorkspace?.boq?.projectDurationMonths, activeWorkspace?.boq?.retainagePercent]);

  // Collapsed WBS sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (secId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  // Group items by WBS Section
  const itemsBySection = useMemo(() => {
    const map: Record<string, ComputedTakeoffItem[]> = {};
    STANDARD_WBS_SECTIONS.forEach((sec) => {
      map[sec.id] = [];
    });

    filteredBOQItems.forEach((it) => {
      const secId = it.wbsSectionId || 'sec-100';
      if (!map[secId]) map[secId] = [];
      map[secId].push(it);
    });

    return map;
  }, [filteredBOQItems]);

  // Apply Regional District Multiplier to All Unit Rates
  const handleApplyRegionalMultiplierToAll = () => {
    if (!updateActiveWorkspace || !activeWorkspace) return;
    const factor = activeDistrict.multiplier;
    const updatedItems = activeWorkspace.boq.items.map((it) => ({
      ...it,
      unitRate: Math.round(it.unitRate * factor * 10) / 10,
    }));

    updateActiveWorkspace((ws) => ({
      ...ws,
      boq: {
        ...ws.boq,
        items: updatedItems,
        regionalMultiplier: factor,
      },
    }));
  };

  // Apply Winning Vendor Rates to matching BOQ items
  const handleApplyVendorRatesToBOQ = () => {
    if (!updateActiveWorkspace || !activeWorkspace) return;
    const updatedItems = activeWorkspace.boq.items.map((it) => {
      // Find matching bid item by description keyword or unit
      const matchingBid = bidReport.lineItems.find(
        (b) =>
          it.description.toLowerCase().includes(b.itemDescription.toLowerCase().slice(0, 8)) ||
          b.itemDescription.toLowerCase().includes(it.description.toLowerCase().slice(0, 8))
      );
      if (matchingBid && matchingBid.lowestRate > 0) {
        return {
          ...it,
          unitRate: matchingBid.lowestRate,
          vendorSource: matchingBid.lowestVendorName,
        };
      }
      return it;
    });

    updateActiveWorkspace((ws) => ({
      ...ws,
      boq: {
        ...ws.boq,
        items: updatedItems,
      },
    }));
  };

  // Export Tender Forms
  const handleExportCsv = () => {
    if (activeWorkspace) {
      exportTenderBoqCsv(activeWorkspace, boqResult, bidReport);
    }
  };

  const handleExportPdf = async () => {
    if (activeWorkspace) {
      await exportTenderBoqPdf({
        workspace: activeWorkspace,
        boqResult,
        userProfile,
        bidReport,
        cashFlow: cashFlowResult,
      });
    }
  };

  return (
    <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 md:p-6 space-y-5">
      {/* Top Header & Master Segmented Tabs */}
      <div className="space-y-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)]">
                Civil Cost Engineering &amp; Tender Management
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                WBS &middot; S-CURVE &middot; 3-BID MATRIX
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mt-0.5">
              <FileSpreadsheet className="w-5 h-5 text-[var(--md-sys-color-primary)] shrink-0" />
              <span>Project Bill of Quantities &middot; {activeWorkspace?.projectCode || 'PBCL-2026'}</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer btn-tactile"
              title="Download Tender Form CSV / Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Tender CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 text-xs font-bold shadow-xs transition-opacity cursor-pointer btn-tactile"
              title="Generate Official A4 Tender Submittal PDF with QR Code"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Official Tender PDF</span>
            </button>
          </div>
        </div>

        {/* 5 Master Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-bold custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('takeoff')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'takeoff'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>WBS Measurement Sheet ({boqResult.items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rate-library')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'rate-library'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Rate Libraries &amp; Regional Multipliers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bid-tabulation')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'bid-tabulation'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Vendor Bid Tabulation (3 Quotes)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cash-flow')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'cash-flow'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Cash Flow &amp; S-Curve</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tender-forms')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'tender-forms'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tender BOQ Forms</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WBS MEASUREMENT SHEET */}
      {activeTab === 'takeoff' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold">
              {(['all', 'earthwork', 'substructure', 'superstructure', 'rebar', 'masonry', 'finishing'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setBoqCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg capitalize cursor-pointer transition-colors ${
                    boqCategoryFilter === cat
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">
              Direct Subtotal: <strong className="text-[var(--md-sys-color-primary)]">{boqResult.currencySymbol} {boqResult.subtotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          {/* Hierarchical WBS Sections */}
          <div className="space-y-4">
            {STANDARD_WBS_SECTIONS.map((sec) => {
              const secItems = itemsBySection[sec.id] || [];
              if (secItems.length === 0 && boqCategoryFilter !== 'all') return null;

              const secSubtotal = secItems.reduce((acc, it) => acc + it.itemTotalAmount, 0);
              const secSharePct = boqResult.subtotalAmount > 0 ? (secSubtotal / boqResult.subtotalAmount) * 100 : 0;
              const isCollapsed = collapsedSections[sec.id] || false;

              return (
                <div key={sec.id} className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] overflow-hidden">
                  {/* Section Header Banner */}
                  <div
                    onClick={() => toggleSection(sec.id)}
                    className="p-3.5 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]">
                        {sec.code}
                      </span>
                      <div>
                        <h4 className="text-xs md:text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                          {sec.title}
                        </h4>
                        <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate max-w-md hidden sm:block">
                          {sec.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                      <div className="text-right">
                        <div className="font-bold text-[var(--md-sys-color-on-surface)]">
                          {boqResult.currencySymbol} {secSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                          {secItems.length} items &middot; {secSharePct.toFixed(1)}% share
                        </div>
                      </div>
                      {isCollapsed ? <ChevronDown className="w-4 h-4 opacity-70" /> : <ChevronUp className="w-4 h-4 opacity-70" />}
                    </div>
                  </div>

                  {/* Section Line Items Table */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] font-bold">
                            <th className="py-2.5 px-3">Item #</th>
                            <th className="py-2.5 px-2">Description</th>
                            <th className="py-2.5 px-2 text-center">Nos</th>
                            <th className="py-2.5 px-2 text-right">L (m)</th>
                            <th className="py-2.5 px-2 text-right">W (m)</th>
                            <th className="py-2.5 px-2 text-right">H (m)</th>
                            <th className="py-2.5 px-2 text-center">Unit</th>
                            <th className="py-2.5 px-2 text-right">Qty</th>
                            <th className="py-2.5 px-2 text-right">Rate</th>
                            <th className="py-2.5 px-2 text-right">Total ({boqResult.currencySymbol})</th>
                            <th className="py-2.5 px-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                          {secItems.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="py-6 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                                No line items assigned to Section {sec.code}. Add items via the input form.
                              </td>
                            </tr>
                          ) : (
                            secItems.map((it) => (
                              <tr key={it.id} className="hover:bg-[var(--md-sys-color-surface)] transition-colors">
                                <td className="py-2 px-3 font-bold text-[var(--md-sys-color-primary)] whitespace-nowrap">
                                  {it.itemNo}
                                </td>
                                <td className="py-2 px-2 min-w-[200px]">
                                  <div className="font-semibold text-[var(--md-sys-color-on-surface)] truncate max-w-sm">
                                    {it.description}
                                  </div>
                                  {it.vendorSource && (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block">
                                      Vendor: {it.vendorSource}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-center">{it.numberOfMembers}</td>
                                <td className="py-2 px-2 text-right">{it.lengthM > 0 ? it.lengthM.toFixed(2) : '-'}</td>
                                <td className="py-2 px-2 text-right">{it.widthM > 0 ? it.widthM.toFixed(2) : '-'}</td>
                                <td className="py-2 px-2 text-right">{it.heightM > 0 ? it.heightM.toFixed(2) : '-'}</td>
                                <td className="py-2 px-2 text-center font-bold">{it.unit}</td>
                                <td className="py-2 px-2 text-right font-bold">
                                  {it.totalBillableQty.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 px-2 text-right">
                                  {it.unitRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 px-2 text-right font-bold text-[var(--md-sys-color-on-surface)] whitespace-nowrap">
                                  {it.itemTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 px-2 text-center whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => onEditTakeoffItem(it)}
                                      className="p-1 hover:text-[var(--md-sys-color-primary)] cursor-pointer"
                                      title="Edit Line Item"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDuplicateTakeoffItem(it)}
                                      className="p-1 hover:text-[var(--md-sys-color-tertiary)] cursor-pointer"
                                      title="Duplicate Line Item"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteTakeoffItem(it.id)}
                                      className="p-1 hover:text-[var(--md-sys-color-error)] cursor-pointer"
                                      title="Delete Line Item"
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
                  )}
                </div>
              );
            })}
          </div>

          {/* Grand Reconciliation Card */}
          <div className="p-4 md:p-5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Direct Takeoff Subtotal:</span>
              <span className="font-bold">{boqResult.currencySymbol} {boqResult.subtotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">+ Contingency Reserve ({boqResult.contingencyPercent}%):</span>
              <span>{boqResult.currencySymbol} {boqResult.contingencyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">+ Contractor Profit &amp; Overhead CP&amp;OH ({boqResult.contractorOverheadPercent}%):</span>
              <span className="text-[var(--md-sys-color-tertiary)] font-bold">{boqResult.currencySymbol} {boqResult.contractorOverheadAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">+ Statutory VAT / Tax ({boqResult.vatTaxPercent}%):</span>
              <span>{boqResult.currencySymbol} {boqResult.vatTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] flex justify-between items-center text-sm md:text-base font-mono font-bold text-[var(--md-sys-color-primary)]">
              <span>ESTIMATED GRAND TOTAL BOQ ({boqResult.currency}):</span>
              <span className="text-lg md:text-xl font-extrabold">{boqResult.currencySymbol} {boqResult.grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RATE LIBRARIES & REGIONAL PRICE INDEXING */}
      {activeTab === 'rate-library' && (
        <div className="space-y-6">
          {/* Controls: Rate Library & Regional District Switcher */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-primary)] mb-1.5">
                Active Rate Library
              </label>
              <select
                value={selectedLibraryId}
                onChange={(e) => {
                  const libId = e.target.value as any;
                  if (updateActiveWorkspace) {
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      boq: { ...ws.boq, rateLibraryId: libId },
                    }));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono font-bold"
              >
                <option value="pwd-2024">PWD Schedule of Rates 2024 (Official Government Standard)</option>
                <option value="pwd-2025">PWD Schedule of Rates 2025 (Inflation &amp; Fuel Escalation Adjusted)</option>
                <option value="lged-2024">LGED Rural Infrastructure Schedule 2024 (Upazila &amp; Culvert)</option>
                <option value="commercial">Private Commercial &amp; High-Rise Developer Rates</option>
              </select>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
                {activeLibrary.description}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                  Regional District Price Adjustment
                </label>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {activeDistrict.multiplier}x Multiplier
                </span>
              </div>
              <select
                value={selectedDistrictId}
                onChange={(e) => {
                  const distId = e.target.value;
                  if (updateActiveWorkspace) {
                    updateActiveWorkspace((ws) => ({
                      ...ws,
                      boq: { ...ws.boq, regionalDistrictId: distId },
                    }));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono font-bold"
              >
                {REGIONAL_DISTRICT_ADJUSTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.division}) &middot; {d.multiplier}x
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
                {activeDistrict.notes} Freight allowance: +{activeDistrict.transportAllowanceBdtPerTon} BDT/Ton.
              </p>
            </div>
          </div>

          {/* Action to Apply Multiplier */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <div>
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                Apply Regional Factor ({activeDistrict.multiplier}x) to Takeoff Unit Rates
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Instantly adjust all {activeWorkspace?.boq.items.length || 0} takeoff line items in this workspace for {activeDistrict.name} logistics.
              </p>
            </div>
            <button
              type="button"
              onClick={handleApplyRegionalMultiplierToAll}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer btn-tactile shrink-0"
            >
              Apply to All Items
            </button>
          </div>

          {/* Rate Library Catalogue Table */}
          <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden">
            <div className="p-3.5 bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-[var(--md-sys-color-on-surface)]">
                {activeLibrary.name} &middot; Standard Item Catalogue ({activeLibrary.items.length} Pre-Priced Items)
              </h3>
              <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                Authority: {activeLibrary.authority}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] font-bold">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-2">Work Description &amp; Technical Notes</th>
                    <th className="py-2.5 px-2 text-center">Unit</th>
                    <th className="py-2.5 px-2 text-right">Labor</th>
                    <th className="py-2.5 px-2 text-right">Material</th>
                    <th className="py-2.5 px-2 text-right">Base Rate</th>
                    <th className="py-2.5 px-2 text-right">District Rate ({activeDistrict.multiplier}x)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                  {activeLibrary.items.map((item) => {
                    const regionalRate = Math.round(item.baseRateBdt * activeDistrict.multiplier * 10) / 10;
                    return (
                      <tr key={item.code} className="hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[var(--md-sys-color-primary)] whitespace-nowrap">
                          {item.code}
                        </td>
                        <td className="py-2.5 px-2 max-w-md">
                          <div className="font-semibold text-[var(--md-sys-color-on-surface)]">
                            {item.description}
                          </div>
                          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] italic mt-0.5">
                            {item.specNotes}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold">{item.unit}</td>
                        <td className="py-2.5 px-2 text-right">{item.laborRateBdt.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right">{item.materialRateBdt.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right font-semibold">{item.baseRateBdt.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right font-bold text-[var(--md-sys-color-primary)]">
                          {regionalRate.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VENDOR BID TABULATION (3-QUOTE COMPARISON) */}
      {activeTab === 'bid-tabulation' && (
        <div className="space-y-6">
          {/* Executive Bid Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Engineer's Baseline Estimate
              </div>
              <div className="text-lg font-bold font-mono text-[var(--md-sys-color-on-surface)]">
                {boqResult.currencySymbol} {bidReport.totalEngineersEstimate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                Benchmark procurement cost
              </div>
            </div>

            {bidReport.vendors.map((v) => (
              <div
                key={v.vendorKey}
                className={`p-4 rounded-2xl border space-y-1 ${
                  v.isLowestOverall
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
                    : 'bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider truncate">
                    Rank #{v.rank} &middot; {v.vendorName.split(' ')[0]}
                  </div>
                  {v.isLowestOverall && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">
                      LOWEST (L1)
                    </span>
                  )}
                </div>
                <div className="text-lg font-bold font-mono">
                  {boqResult.currencySymbol} {v.totalBidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-mono">
                  Variance: <span className={v.variancePercent <= 0 ? 'text-emerald-600 font-bold' : 'text-rose-500'}>
                    {v.variancePercent > 0 ? `+${v.variancePercent}%` : `${v.variancePercent}%`}
                  </span> &middot; {v.lowestItemCount} items won
                </div>
              </div>
            ))}
          </div>

          {/* Winning Bidder Action Banner */}
          <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                  Recommended Award: {bidReport.recommendedVendorName}
                </h4>
              </div>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                Evaluated lowest responsive bidder with net potential savings of <strong>{boqResult.currencySymbol} {bidReport.netSavingsAgainstEstimateBdt.toLocaleString()} ({bidReport.netSavingsPercent}%)</strong> against the baseline engineer's estimate.
              </p>
            </div>

            <button
              type="button"
              onClick={handleApplyVendorRatesToBOQ}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer btn-tactile"
            >
              Apply Winning Rates to BOQ Schedule
            </button>
          </div>

          {/* Bid Tabulation Comparison Matrix Table */}
          <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden">
            <div className="p-3.5 bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-[var(--md-sys-color-on-surface)]">
                3-Quote Subcontractor &amp; Material Quotation Matrix
              </h3>
              <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                {bidReport.lineItems.length} Comparison Items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] font-bold">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-2 text-center">Unit</th>
                    <th className="py-2.5 px-2 text-right">Qty</th>
                    <th className="py-2.5 px-2 text-right">Eng. Estimate</th>
                    <th className="py-2.5 px-2 text-right bg-blue-500/5">{bidData.vendor1Name}</th>
                    <th className="py-2.5 px-2 text-right bg-emerald-500/5">{bidData.vendor2Name}</th>
                    <th className="py-2.5 px-2 text-right bg-amber-500/5">{bidData.vendor3Name}</th>
                    <th className="py-2.5 px-2 text-right">Winning (L1)</th>
                    <th className="py-2.5 px-2 text-center">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                  {bidReport.lineItems.map((b) => (
                    <tr key={b.id} className="hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[var(--md-sys-color-on-surface)] min-w-[200px]">
                        {b.itemDescription}
                      </td>
                      <td className="py-2.5 px-2 text-center">{b.unit}</td>
                      <td className="py-2.5 px-2 text-right">{b.quantity.toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-right">{b.engineersRate.toLocaleString()}</td>
                      <td className={`py-2.5 px-2 text-right ${b.lowestVendorKey === 'vendor1' ? 'font-bold text-emerald-600 bg-emerald-500/10' : ''}`}>
                        {b.vendor1Rate.toLocaleString()}
                      </td>
                      <td className={`py-2.5 px-2 text-right ${b.lowestVendorKey === 'vendor2' ? 'font-bold text-emerald-600 bg-emerald-500/10' : ''}`}>
                        {b.vendor2Rate.toLocaleString()}
                      </td>
                      <td className={`py-2.5 px-2 text-right ${b.lowestVendorKey === 'vendor3' ? 'font-bold text-emerald-600 bg-emerald-500/10' : ''}`}>
                        {b.vendor3Rate.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {b.lowestRate.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${b.varianceFromEstimatePercent <= 0 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'}`}>
                          {b.varianceFromEstimatePercent > 0 ? `+${b.varianceFromEstimatePercent}%` : `${b.varianceFromEstimatePercent}%`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CASH FLOW & S-CURVE FORECASTING */}
      {activeTab === 'cash-flow' && (
        <div className="space-y-6">
          {/* Executive Timeline Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Project Duration
              </div>
              <div className="text-xl font-bold font-mono text-[var(--md-sys-color-primary)] mt-1">
                {cashFlowResult.totalProjectMonths} Months
              </div>
              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Construction schedule</div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Avg. Monthly Burn Rate
              </div>
              <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-1">
                {boqResult.currencySymbol} {cashFlowResult.averageMonthlyBurnRate.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Capital drawdown / mo</div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Peak Expenditure Month
              </div>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                Month {cashFlowResult.peakExpenditureMonth}
              </div>
              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">{boqResult.currencySymbol} {cashFlowResult.peakExpenditureAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Retainage Withheld ({cashFlowResult.retainagePercent}%)
              </div>
              <div className="text-xl font-bold font-mono text-[var(--md-sys-color-tertiary)] mt-1">
                {boqResult.currencySymbol} {cashFlowResult.totalRetainageWithheld.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Security retention</div>
            </div>
          </div>

          {/* S-Curve Chart (Vector SVG Visualizer) */}
          <div className="p-5 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-[var(--md-sys-color-primary)]">
                  Construction S-Curve &amp; Monthly Capital Drawdown
                </h4>
                <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Cumulative Planned Progress (%) vs. Monthly Cash Outflow Distribution
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                  <span>S-Curve Cumulative (%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-teal-500/50 inline-block" />
                  <span>Monthly Spend</span>
                </span>
              </div>
            </div>

            {/* SVG Visualizer */}
            <div className="w-full h-56 bg-[var(--md-sys-color-surface)] rounded-xl border border-[var(--md-sys-color-outline-variant)] p-2">
              <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                {/* Gridlines */}
                {[0, 25, 50, 75, 100].map((pct, idx) => {
                  const y = 170 - (pct / 100) * 140;
                  return (
                    <g key={idx}>
                      <line x1="40" y1={y} x2="580" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                      <text x="32" y={y + 3} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.6" fontFamily="monospace">
                        {pct}%
                      </text>
                    </g>
                  );
                })}

                {/* Monthly Bars (Drawdown) */}
                {cashFlowResult.monthlyPeriods.map((p, idx) => {
                  const totalBars = cashFlowResult.monthlyPeriods.length;
                  const barWidth = Math.max(12, Math.min(32, 500 / totalBars - 6));
                  const x = 50 + idx * (520 / Math.max(1, totalBars - 1)) - barWidth / 2;
                  const maxPeak = cashFlowResult.peakExpenditureAmount || 1;
                  const barHeight = (p.grossBilling / maxPeak) * 120;
                  const y = 170 - barHeight;

                  return (
                    <g key={idx}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill="#0d9488"
                        fillOpacity="0.45"
                        rx="3"
                      />
                      <text x={x + barWidth / 2} y="185" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.75" fontFamily="monospace">
                        M{p.month}
                      </text>
                    </g>
                  );
                })}

                {/* Cumulative S-Curve Line */}
                {cashFlowResult.monthlyPeriods.length > 1 && (
                  <>
                    <path
                      d={cashFlowResult.monthlyPeriods.reduce((acc, p, idx) => {
                        const totalBars = cashFlowResult.monthlyPeriods.length;
                        const x = 50 + idx * (520 / Math.max(1, totalBars - 1));
                        const y = 170 - (p.cumulativeProgressPercent / 100) * 140;
                        return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }, '')}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* S-Curve Plot Points */}
                    {cashFlowResult.monthlyPeriods.map((p, idx) => {
                      const totalBars = cashFlowResult.monthlyPeriods.length;
                      const x = 50 + idx * (520 / Math.max(1, totalBars - 1));
                      const y = 170 - (p.cumulativeProgressPercent / 100) * 140;
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r="3"
                          fill="#ffffff"
                          stroke="#2563eb"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Project Milestones Matrix */}
          <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden">
            <div className="p-3.5 bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-[var(--md-sys-color-on-surface)]">
                Contractual Progress Payment Milestones
              </h4>
              <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                Standard FIDIC / PWD Framework
              </span>
            </div>

            <div className="divide-y divide-[var(--md-sys-color-outline-variant)]">
              {cashFlowResult.milestones.map((m, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-[var(--md-sys-color-surface-container-low)]">
                  <div>
                    <div className="font-bold text-[var(--md-sys-color-on-surface)]">
                      {m.label}
                    </div>
                    <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                      Expected Completion: Month {m.expectedMonth} &middot; Progress Target: {m.percentage}%
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-[var(--md-sys-color-primary)]">
                      {boqResult.currencySymbol} {m.cumulativeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      Payment Milestone
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Drawdown Schedule Table */}
          <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden">
            <div className="p-3.5 bg-[var(--md-sys-color-surface-container)]">
              <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-[var(--md-sys-color-on-surface)]">
                Monthly Capital Drawdown Ledger
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] font-bold">
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-2 text-right">Direct Spend</th>
                    <th className="py-2.5 px-2 text-right">Gross Billing</th>
                    <th className="py-2.5 px-2 text-right text-[var(--md-sys-color-tertiary)]">Retainage ({cashFlowResult.retainagePercent}%)</th>
                    <th className="py-2.5 px-2 text-right font-bold">Net Cash Outflow</th>
                    <th className="py-2.5 px-2 text-right">Cumulative Spend</th>
                    <th className="py-2.5 px-3 text-right">S-Curve (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                  {cashFlowResult.monthlyPeriods.map((p) => (
                    <tr key={p.month} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                      <td className="py-2.5 px-3 font-bold text-[var(--md-sys-color-primary)]">
                        {p.periodLabel}
                      </td>
                      <td className="py-2.5 px-2 text-right">{p.directPlannedExpenditure.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-2 text-right font-semibold">{p.grossBilling.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-2 text-right text-[var(--md-sys-color-tertiary)]">-{p.retainageWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {p.netCashOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2 text-right">{p.cumulativePlannedExpenditure.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{p.cumulativeProgressPercent.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TENDER BOQ FORMS */}
      {activeTab === 'tender-forms' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                Official Tender Forms &middot; Standard FIDIC / PWD Procurement Suite
              </h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Generate Form A (Summary of Bill of Quantities), Form B (Itemized Priced Schedule), and Form C (Daywork / Quotes).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3.5 py-2 rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-xs font-bold cursor-pointer btn-tactile"
              >
                Download CSV Tender Form
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="px-4 py-2 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 text-xs font-bold shadow-xs cursor-pointer btn-tactile"
              >
                Download Certified A4 PDF Submittal
              </button>
            </div>
          </div>

          {/* Form A Preview */}
          <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden">
            <div className="p-4 bg-[var(--md-sys-color-surface-container)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[var(--md-sys-color-primary)]">
                  FORM A
                </span>
                <h4 className="text-xs md:text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Grand Summary of Bill of Quantities (WBS Chapters)
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Total: {boqResult.currencySymbol} {boqResult.grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] font-bold">
                    <th className="py-2.5 px-3">WBS Code</th>
                    <th className="py-2.5 px-2">Chapter Description</th>
                    <th className="py-2.5 px-2 text-center">Items</th>
                    <th className="py-2.5 px-2 text-right">Subtotal ({boqResult.currencySymbol})</th>
                    <th className="py-2.5 px-3 text-right">% of Direct Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                  {(boqResult.wbsSectionSummaries || []).map((s) => (
                    <tr key={s.wbsSectionId} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                      <td className="py-2.5 px-3 font-bold text-[var(--md-sys-color-primary)]">
                        Section {s.code}
                      </td>
                      <td className="py-2.5 px-2 font-medium">{s.title}</td>
                      <td className="py-2.5 px-2 text-center">{s.itemCount}</td>
                      <td className="py-2.5 px-2 text-right font-bold">{s.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">{s.percentageOfSubtotal.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
