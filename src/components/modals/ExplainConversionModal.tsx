import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calculator,
  ArrowRight,
  ArrowRightLeft,
  Copy,
  Check,
  Sparkles,
  Info,
  Layers,
  BookmarkCheck,
  ExternalLink,
} from 'lucide-react';
import { CustomUnitDefinition, UnitCategoryKey } from '../../types/civil';
import { BASE_UNITS, STANDARD_UNITS } from '../../utils/unitConverter';
import { BASE_UNIT_INFO, getUnitDefinition } from '../../utils/unitEngine';

export interface ExplainConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputValue: number;
  fromUnitId: string;
  toUnitId: string;
  category: UnitCategoryKey;
  customUnits: CustomUnitDefinition[];
  onSwapUnits?: () => void;
  onOpenCustomUnitsModal?: () => void;
}

export const ExplainConversionModal: React.FC<ExplainConversionModalProps> = ({
  isOpen,
  onClose,
  inputValue,
  fromUnitId,
  toUnitId,
  category,
  customUnits,
  onSwapUnits,
  onOpenCustomUnitsModal,
}) => {
  const [copied, setCopied] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const baseInfo = BASE_UNIT_INFO[category] || {
    id: BASE_UNITS[category] || 'base',
    name: 'Canonical SI Unit',
    symbol: BASE_UNITS[category] || 'base',
  };

  const fromUnitObj = getUnitDefinition(fromUnitId, category, customUnits);
  const toUnitObj = getUnitDefinition(toUnitId, category, customUnits);

  const fromCustomDef = customUnits.find((u) => u.id === fromUnitId && u.category === category);
  const toCustomDef = customUnits.find((u) => u.id === toUnitId && u.category === category);

  const isFromCustom = Boolean(fromCustomDef);
  const isToCustom = Boolean(toCustomDef);
  const hasCustomUnit = isFromCustom || isToCustom;

  // Retrieve stored base factors
  const fromFactor = fromUnitObj?.toBaseFactor ?? 1.0;
  const toFactor = toUnitObj?.toBaseFactor ?? 1.0;

  // Handle special slope non-linear trigonometric conversions
  const isSlopeSpecial = category === 'slope';

  let baseValue = inputValue * fromFactor;
  let targetValue = toFactor !== 0 ? baseValue / toFactor : 0;
  let slopeFormulaText = '';

  if (isSlopeSpecial) {
    if (fromUnitId === 'degree' && toUnitId === 'percent') {
      targetValue = Math.tan((inputValue * Math.PI) / 180) * 100;
      slopeFormulaText = `tan(${inputValue}°) × 100% = ${targetValue.toFixed(4)}%`;
    } else if (fromUnitId === 'percent' && toUnitId === 'degree') {
      targetValue = (Math.atan(inputValue / 100) * 180) / Math.PI;
      slopeFormulaText = `atan(${inputValue} / 100) × (180 / π) = ${targetValue.toFixed(4)}°`;
    } else if (fromUnitId === 'degree' && toUnitId === 'ratio') {
      targetValue = Math.tan((inputValue * Math.PI) / 180);
      slopeFormulaText = `tan(${inputValue}°) = ${targetValue.toFixed(5)} m/m`;
    } else if (fromUnitId === 'ratio' && toUnitId === 'degree') {
      targetValue = (Math.atan(inputValue) * 180) / Math.PI;
      slopeFormulaText = `atan(${inputValue}) × (180 / π) = ${targetValue.toFixed(4)}°`;
    } else if (fromUnitId === 'percent' && toUnitId === 'ratio') {
      targetValue = inputValue / 100;
      slopeFormulaText = `${inputValue}% ÷ 100 = ${targetValue.toFixed(4)} m/m`;
    } else if (fromUnitId === 'ratio' && toUnitId === 'percent') {
      targetValue = inputValue * 100;
      slopeFormulaText = `${inputValue} × 100% = ${targetValue.toFixed(2)}%`;
    }
  }

  const directMultiplier = toFactor !== 0 ? fromFactor / toFactor : 0;
  const reverseMultiplier = fromFactor !== 0 ? toFactor / fromFactor : 0;

  // Pretty number formatter
  const formatDec = (val: number, maxDigits: number = 6) => {
    if (val === 0) return '0';
    const abs = Math.abs(val);
    if (abs >= 1000000 || (abs < 0.0001 && abs > 0)) {
      return val.toExponential(4);
    }
    // Remove floating rounding errors
    const rounded = parseFloat(val.toFixed(maxDigits));
    return rounded.toLocaleString('en-US', {
      maximumFractionDigits: maxDigits,
    });
  };

  const formatExactOrExp = (val: number) => {
    if (val >= 1000000 || (Math.abs(val) < 0.0001 && val > 0)) {
      return val.toExponential(6);
    }
    return val.toLocaleString('en-US', { maximumFractionDigits: 8 });
  };

  const handleCopyProof = async () => {
    const proofText = `===============================================================
PB CIVILLAB - AUDIT CONVERSION BREAKDOWN & PROOF
===============================================================
Discipline Category: ${category.toUpperCase()}
Canonical Base SI Unit: ${baseInfo.name} (${baseInfo.symbol})
Source Unit: ${fromUnitObj?.name || fromUnitId} (${fromUnitObj?.symbol || fromUnitId}) [${isFromCustom ? 'CUSTOM STORED FACTOR' : 'STANDARD'}]
Target Unit: ${toUnitObj?.name || toUnitId} (${toUnitObj?.symbol || toUnitId}) [${isToCustom ? 'CUSTOM STORED FACTOR' : 'STANDARD'}]

INPUT VALUE: ${inputValue} ${fromUnitObj?.symbol || fromUnitId}
CONVERTED RESULT: ${formatDec(targetValue, 6)} ${toUnitObj?.symbol || toUnitId}

${
  hasCustomUnit
    ? `CUSTOM UNIT STORAGE AUDIT:
${
  isFromCustom && fromCustomDef
    ? `• Source [${fromCustomDef.name}] (${fromCustomDef.symbol}): Stored toBaseFactor = ${fromCustomDef.toBaseFactor} ${baseInfo.symbol}
  Description: ${fromCustomDef.description || 'User-defined custom unit'}`
    : ''
}
${
  isToCustom && toCustomDef
    ? `• Target [${toCustomDef.name}] (${toCustomDef.symbol}): Stored toBaseFactor = ${toCustomDef.toBaseFactor} ${baseInfo.symbol}
  Description: ${toCustomDef.description || 'User-defined custom unit'}`
    : ''
}
`
    : ''
}
===============================================================
STEP-BY-STEP CALCULATION PIPELINE:
===============================================================

STEP 1: NORMALIZATION TO BASE SI UNIT (${baseInfo.symbol})
  Principle: V_base = V_input × Factor_source
  Factor: 1 ${fromUnitObj?.symbol || fromUnitId} = ${fromFactor} ${baseInfo.symbol}
  Execution: ${inputValue} ${fromUnitObj?.symbol || fromUnitId} × ${fromFactor}
  Base SI Value = ${formatExactOrExp(baseValue)} ${baseInfo.symbol}

STEP 2: DENORMALIZATION TO TARGET UNIT (${toUnitObj?.symbol || toUnitId})
  Principle: V_target = V_base ÷ Factor_target
  Factor: 1 ${toUnitObj?.symbol || toUnitId} = ${toFactor} ${baseInfo.symbol}
  Execution: ${formatExactOrExp(baseValue)} ${baseInfo.symbol} ÷ ${toFactor}
  Target Value = ${formatDec(targetValue, 6)} ${toUnitObj?.symbol || toUnitId}

STEP 3: DIRECT COMBINED TRANSFER MULTIPLIER
  Principle: V_target = V_input × (Factor_source ÷ Factor_target)
  Direct Ratio: ${fromFactor} ÷ ${toFactor} = ${formatExactOrExp(directMultiplier)}
  Direct Multiplier: 1 ${fromUnitObj?.symbol || fromUnitId} = ${formatDec(directMultiplier, 8)} ${toUnitObj?.symbol || toUnitId}
  Inverted Multiplier: 1 ${toUnitObj?.symbol || toUnitId} = ${formatDec(reverseMultiplier, 8)} ${fromUnitObj?.symbol || fromUnitId}

Standard Compliance: BIPM SI Brocure 9th Ed., ASTM E380, BNBC-2020 App. A
Generated by PB CivilLab Engineering Platform
===============================================================`;

    try {
      await navigator.clipboard.writeText(proofText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="explain-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350, mass: 0.8 }}
            className="w-full max-w-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl space-y-4 custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="explain-modal-title"
                  className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)]"
                >
                  Conversion Logic & Step-by-Step Proof
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)]">
                  {category.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Exact mathematical pipeline using stored custom factors and Canonical Base SI normalization
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close conversion explanation modal"
            className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Conversion Context Card */}
        <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Source Display */}
            <div className="flex-1 w-full p-3 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                  Source Input
                </span>
                {isFromCustom ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    Custom Stored
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]">
                    Standard SI/Imp
                  </span>
                )}
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)]">
                {inputValue} <span className="text-sm font-semibold">{fromUnitObj?.symbol || fromUnitId}</span>
              </div>
              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">
                {fromUnitObj?.name || fromUnitId}
              </div>
            </div>

            {/* Direction Icon & Swap Action */}
            <div className="flex flex-col items-center justify-center shrink-0">
              {onSwapUnits ? (
                <button
                  type="button"
                  onClick={onSwapUnits}
                  title="Reverse conversion direction"
                  className="p-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-xs"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              ) : (
                <ArrowRight className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
              )}
              <span className="text-[9px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
                Star SI
              </span>
            </div>

            {/* Target Display */}
            <div className="flex-1 w-full p-3 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                  Converted Output
                </span>
                {isToCustom ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    Custom Stored
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]">
                    Standard SI/Imp
                  </span>
                )}
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-[var(--md-sys-color-primary)]">
                {formatDec(targetValue, 6)}{' '}
                <span className="text-sm font-semibold">{toUnitObj?.symbol || toUnitId}</span>
              </div>
              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">
                {toUnitObj?.name || toUnitId}
              </div>
            </div>
          </div>

          {/* Governing Base SI Reference */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--md-sys-color-outline-variant)]/50 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
            <span>
              Canonical SI Base Reference: <strong className="text-[var(--md-sys-color-on-surface)]">{baseInfo.name} ({baseInfo.symbol})</strong>
            </span>
            <span className="text-[10px] bg-[var(--md-sys-color-surface)] px-2 py-0.5 rounded border border-[var(--md-sys-color-outline-variant)]">
              Base Factor = 1.0
            </span>
          </div>
        </div>

        {/* Custom Unit Factors Callout Banner */}
        {hasCustomUnit ? (
          <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Active Custom Unit Factors from Project Storage</span>
            </div>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface)] leading-relaxed">
              This conversion utilizes custom unit definitions stored in your active workspace configuration. Each custom unit defines an exact multiplier relative to the Base SI unit (<strong>{baseInfo.symbol}</strong>):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono">
              {isFromCustom && fromCustomDef && (
                <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-amber-500/30">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                    Source: {fromCustomDef.name} ({fromCustomDef.symbol})
                  </div>
                  <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">
                    1 {fromCustomDef.symbol} = {fromCustomDef.toBaseFactor} {baseInfo.symbol}
                  </div>
                  {fromCustomDef.description && (
                    <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
                      {fromCustomDef.description}
                    </div>
                  )}
                </div>
              )}
              {isToCustom && toCustomDef && (
                <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-amber-500/30">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                    Target: {toCustomDef.name} ({toCustomDef.symbol})
                  </div>
                  <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">
                    1 {toCustomDef.symbol} = {toCustomDef.toBaseFactor} {baseInfo.symbol}
                  </div>
                  {toCustomDef.description && (
                    <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
                      {toCustomDef.description}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)]">
              <Info className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
              <span>
                Using verified international standard physical conversion constants (ASTM E380 / BIPM).
              </span>
            </div>
            {onOpenCustomUnitsModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCustomUnitsModal();
                }}
                className="text-[11px] font-bold text-[var(--md-sys-color-primary)] hover:underline shrink-0 cursor-pointer flex items-center gap-1"
              >
                <span>Add Custom Unit</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Multi-Step Mathematical Breakdown */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Mathematical Derivation Pipeline</span>
          </div>

          {/* STEP 1: Normalization */}
          <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[var(--md-sys-color-primary)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>Step 1: Normalization to Canonical Base SI ({baseInfo.symbol})</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]">
                V_base = V_src × Factor_src
              </span>
            </div>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Multiply input by the source unit’s stored factor (
              <code className="text-[var(--md-sys-color-primary)] font-bold font-mono">
                {fromFactor} {baseInfo.symbol}/{fromUnitObj?.symbol || fromUnitId}
              </code>
              ) to establish the invariant physical quantity in the standard dimension.
            </p>
            <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] font-mono text-xs text-[var(--md-sys-color-on-surface)] space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>Calculation:</span>
                <span>Factor: 1 {fromUnitObj?.symbol || fromUnitId} = {fromFactor} {baseInfo.symbol}</span>
              </div>
              <div className="text-sm font-bold text-[var(--md-sys-color-primary)]">
                {inputValue} {fromUnitObj?.symbol || fromUnitId} × {fromFactor} ={' '}
                <span className="underline decoration-[var(--md-sys-color-primary)]/40 underline-offset-4">
                  {formatExactOrExp(baseValue)} {baseInfo.symbol}
                </span>
              </div>
            </div>
          </div>

          {/* STEP 2: Denormalization */}
          <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[var(--md-sys-color-primary)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>Step 2: Denormalization from Base SI to Target ({toUnitObj?.symbol || toUnitId})</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]">
                V_tgt = V_base ÷ Factor_tgt
              </span>
            </div>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Divide the Base SI value by the target unit’s stored factor (
              <code className="text-[var(--md-sys-color-primary)] font-bold font-mono">
                {toFactor} {baseInfo.symbol}/{toUnitObj?.symbol || toUnitId}
              </code>
              ) to obtain the magnitude in the target engineering unit.
            </p>
            <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] font-mono text-xs text-[var(--md-sys-color-on-surface)] space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>Calculation:</span>
                <span>Factor: 1 {toUnitObj?.symbol || toUnitId} = {toFactor} {baseInfo.symbol}</span>
              </div>
              <div className="text-sm font-bold text-[var(--md-sys-color-primary)]">
                {formatExactOrExp(baseValue)} {baseInfo.symbol} ÷ {toFactor} ={' '}
                <span className="underline decoration-emerald-500/50 underline-offset-4 text-emerald-600 dark:text-emerald-400">
                  {formatDec(targetValue, 6)} {toUnitObj?.symbol || toUnitId}
                </span>
              </div>
            </div>
          </div>

          {/* STEP 3: Direct Multiplier & Inversion Ratio */}
          <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[var(--md-sys-color-primary)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>Step 3: Direct Transfer Multiplier & Inversion Ratio</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]">
                K = Factor_src / Factor_tgt
              </span>
            </div>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              For direct single-pass calculation without round-off drift, the compound multiplier ratio is:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <div className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Direct Multiplier (Forward)
                </div>
                <div className="text-xs font-bold text-[var(--md-sys-color-primary)] mt-0.5">
                  1 {fromUnitObj?.symbol || fromUnitId} = {formatDec(directMultiplier, 6)} {toUnitObj?.symbol || toUnitId}
                </div>
                <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  Ratio: ({fromFactor} ÷ {toFactor})
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                <div className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">
                  Reverse Multiplier (Inversion)
                </div>
                <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">
                  1 {toUnitObj?.symbol || toUnitId} = {formatDec(reverseMultiplier, 6)} {fromUnitObj?.symbol || fromUnitId}
                </div>
                <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  Ratio: ({toFactor} ÷ {fromFactor})
                </div>
              </div>
            </div>

            {isSlopeSpecial && slopeFormulaText && (
              <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] font-mono text-xs text-[var(--md-sys-color-primary)]">
                <span className="text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] block mb-0.5">
                  Non-Linear Trigonometric Slope Governing Formula:
                </span>
                <strong>{slopeFormulaText}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Stored Custom Units Library for this Category */}
        {customUnits.filter((u) => u.category === category).length > 0 && (
          <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                <BookmarkCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>All Stored Custom Units in {category.replace('_', ' ')}:</span>
              </span>
              <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                {customUnits.filter((u) => u.category === category).length} defined
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {customUnits
                .filter((u) => u.category === category)
                .map((u) => (
                  <div
                    key={u.id}
                    className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-[var(--md-sys-color-on-surface)]">{u.name}</span>{' '}
                      <span className="text-[var(--md-sys-color-primary)] font-bold">({u.symbol})</span>
                      {u.description && (
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block font-sans">
                          {u.description}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                        1 {u.symbol} = {u.toBaseFactor} {baseInfo.symbol}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
            <span>Verified: BIPM SI / ASTM E380 / BNBC-2020</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyProof}
              className="flex-1 sm:flex-initial min-h-[40px] px-3.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all btn-tactile"
              title="Copy mathematical conversion proof and audit breakdown to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Proof Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Copy Proof to Clipboard</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial min-h-[40px] px-5 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-white hover:bg-[var(--md-sys-color-primary)]/90 text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
