import React, { useState, useEffect } from 'react';
import {
  Calculator,
  ArrowLeftRight,
  RotateCcw,
  Copy,
  Check,
  CornerDownLeft,
  Sparkles,
} from 'lucide-react';
import { evaluateMathExpression } from '../ui/TechnicalInput';

type ConverterMode = 'mm-in' | 'm-ft' | 'mpa-psi' | 'katha-sqft' | 'cft-m3';

interface ConversionPreset {
  id: ConverterMode;
  label: string;
  unitLeft: string;
  unitRight: string;
  leftToRight: (v: number) => number;
  rightToLeft: (v: number) => number;
  precision: number;
}

const CONVERTER_PRESETS: ConversionPreset[] = [
  {
    id: 'mm-in',
    label: 'mm ↔ inch',
    unitLeft: 'mm',
    unitRight: 'in',
    leftToRight: (v) => v / 25.4,
    rightToLeft: (v) => v * 25.4,
    precision: 4,
  },
  {
    id: 'm-ft',
    label: 'm ↔ ft',
    unitLeft: 'm',
    unitRight: 'ft',
    leftToRight: (v) => v * 3.2808399,
    rightToLeft: (v) => v / 3.2808399,
    precision: 3,
  },
  {
    id: 'mpa-psi',
    label: 'MPa ↔ psi',
    unitLeft: 'MPa',
    unitRight: 'psi',
    leftToRight: (v) => v * 145.0377,
    rightToLeft: (v) => v / 145.0377,
    precision: 2,
  },
  {
    id: 'katha-sqft',
    label: 'Katha ↔ sq.ft',
    unitLeft: 'Katha',
    unitRight: 'sq.ft',
    leftToRight: (v) => v * 720,
    rightToLeft: (v) => v / 720,
    precision: 2,
  },
  {
    id: 'cft-m3',
    label: 'CFT ↔ m³',
    unitLeft: 'cft',
    unitRight: 'm³',
    leftToRight: (v) => v / 35.31467,
    rightToLeft: (v) => v * 35.31467,
    precision: 3,
  },
];

interface ScratchHistoryItem {
  id: string;
  expression: string;
  result: number;
}

export const QuickScratchpadConverter: React.FC = () => {
  // Scratchpad state
  const [expression, setExpression] = useState('12 * 0.25 * 0.45 * 24');
  const [liveResult, setLiveResult] = useState<number | null>(32.4);
  const [history, setHistory] = useState<ScratchHistoryItem[]>([
    { id: '1', expression: '12 * 0.25 * 0.45 * 24', result: 32.4 },
    { id: '2', expression: 'sqrt(25^2 + 10^2)', result: 26.926 },
    { id: '3', expression: '16^2 / 162.2', result: 1.578 },
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Converter state
  const [activePreset, setActivePreset] = useState<ConverterMode>('mm-in');
  const [valLeft, setValLeft] = useState<string>('250');
  const [valRight, setValRight] = useState<string>('9.8425');

  // Evaluate expression in real-time
  useEffect(() => {
    if (!expression.trim()) {
      setLiveResult(null);
      return;
    }
    const evaluated = evaluateMathExpression(expression);
    setLiveResult(evaluated);
  }, [expression]);

  const handleCommitCalculation = () => {
    if (liveResult !== null && !isNaN(liveResult)) {
      const newItem: ScratchHistoryItem = {
        id: Date.now().toString(),
        expression: expression.trim(),
        result: Number(liveResult.toFixed(4)),
      };
      setHistory((prev) => [newItem, ...prev.slice(0, 7)]);
    }
  };

  const handleInsertSnippet = (snippet: string) => {
    setExpression((prev) => (prev ? `${prev} * ${snippet}` : snippet));
  };

  const handleCopyValue = (val: string | number, id: string) => {
    navigator.clipboard?.writeText(val.toString());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Unit Converter handler
  const currentPreset = CONVERTER_PRESETS.find((p) => p.id === activePreset) || CONVERTER_PRESETS[0];

  const handleLeftChange = (raw: string) => {
    setValLeft(raw);
    const parsed = evaluateMathExpression(raw);
    if (parsed !== null && !isNaN(parsed)) {
      const converted = currentPreset.leftToRight(parsed);
      setValRight(converted.toFixed(currentPreset.precision));
    } else {
      setValRight('');
    }
  };

  const handleRightChange = (raw: string) => {
    setValRight(raw);
    const parsed = evaluateMathExpression(raw);
    if (parsed !== null && !isNaN(parsed)) {
      const converted = currentPreset.rightToLeft(parsed);
      setValLeft(converted.toFixed(currentPreset.precision));
    } else {
      setValLeft('');
    }
  };

  const handlePresetSwitch = (presetId: ConverterMode) => {
    setActivePreset(presetId);
    const preset = CONVERTER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const baseVal = 10;
    setValLeft(baseVal.toString());
    setValRight(preset.leftToRight(baseVal).toFixed(preset.precision));
  };

  return (
    <div className="border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] rounded-md p-3.5 space-y-3.5 flex flex-col justify-between shadow-xs">
      {/* SECTION 1: ENGINEERING SCRATCHPAD */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]/60 pb-2">
          <div className="flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
              Engineering Scratchpad
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
            Inline Math Parser
          </span>
        </div>

        {/* Input & Evaluation */}
        <div className="space-y-1.5">
          <div className="relative">
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitCalculation();
              }}
              placeholder="e.g. 12 * 0.25 * 0.45 * 24, sqrt(200), 16^2/162"
              className="w-full px-2.5 py-1.5 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded text-xs font-mono text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/50"
            />
            <button
              type="button"
              onClick={handleCommitCalculation}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface)] rounded transition-colors"
              title="Store to calculation log (Enter)"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Real-time result strip with vibrant glow */}
          <div className="px-2.5 py-2 bg-gradient-to-r from-sky-500/15 via-teal-500/10 to-transparent border border-sky-500/40 rounded flex items-center justify-between text-xs font-mono shadow-xs">
            <span className="text-[10px] text-sky-400 uppercase font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
              <span>Live Evaluation</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sky-400 text-sm tabular-nums tracking-wide">
                {liveResult !== null && !isNaN(liveResult) ? Number(liveResult.toFixed(4)).toLocaleString() : '—'}
              </span>
              {liveResult !== null && !isNaN(liveResult) && (
                <button
                  type="button"
                  onClick={() => handleCopyValue(liveResult, 'live')}
                  className="p-1 text-sky-400 hover:text-white hover:bg-sky-500/30 rounded transition-colors"
                  title="Copy result"
                >
                  {copiedId === 'live' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Civil engineering quick constant shortcuts - COLORFUL & SATISFYING */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono pt-0.5">
          <span className="text-[var(--md-sys-color-on-surface-variant)] text-[9px] uppercase pr-0.5">
            Quick:
          </span>
          <button
            type="button"
            onClick={() => handleInsertSnippet('24')}
            className="px-2 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 transition-colors font-semibold"
            title="RCC Unit Weight 24 kN/m³"
          >
            γ=24
          </button>
          <button
            type="button"
            onClick={() => handleInsertSnippet('1.54')}
            className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors font-semibold"
            title="Dry Concrete Volume Factor 1.54"
          >
            1.54×
          </button>
          <button
            type="button"
            onClick={() => handleInsertSnippet('(16^2/162.2)')}
            className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-colors font-semibold"
            title="16mm Rebar Weight (d²/162.2)"
          >
            d²/162
          </button>
          <button
            type="button"
            onClick={() => handleInsertSnippet('sqrt(2)')}
            className="px-2 py-0.5 rounded bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 transition-colors font-semibold"
            title="Square Root"
          >
            √
          </button>
          <button
            type="button"
            onClick={() => handleInsertSnippet('3.14159')}
            className="px-2 py-0.5 rounded bg-teal-500/15 hover:bg-teal-500/25 text-teal-400 border border-teal-500/30 transition-colors font-semibold"
            title="Pi constant"
          >
            π
          </button>
          <button
            type="button"
            onClick={() => setExpression('')}
            className="px-2 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-colors font-semibold ml-auto"
            title="Clear Scratchpad"
          >
            AC
          </button>
        </div>

        {/* Compact History List */}
        {history.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="text-[9px] uppercase font-mono tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
              <span>Recent Calculations</span>
              <span className="text-[8px] text-[var(--md-sys-color-primary)]">Click to recall</span>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
              {history.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => setExpression(item.expression)}
                  className="px-2 py-1 bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] rounded border border-[var(--md-sys-color-outline-variant)]/60 hover:border-sky-500/40 text-[11px] font-mono flex items-center justify-between cursor-pointer group transition-colors"
                >
                  <span className="text-[var(--md-sys-color-on-surface-variant)] truncate max-w-[140px] group-hover:text-[var(--md-sys-color-on-surface)]">
                    {item.expression}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-bold text-sky-400 tabular-nums">
                      = {item.result}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyValue(item.result, item.id);
                      }}
                      className="text-slate-400 hover:text-sky-400"
                    >
                      {copiedId === item.id ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: RAPID INLINE CONVERTER */}
      <div className="border-t border-[var(--md-sys-color-outline-variant)]/60 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
              Rapid Unit Converter
            </h3>
          </div>
          <span className="text-[9px] font-mono text-[var(--md-sys-color-on-surface-variant)] font-semibold">
            2-Way Live
          </span>
        </div>

        {/* Preset Selector Tabs with Colorful Jewel States */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5">
          {CONVERTER_PRESETS.map((preset) => {
            const isSel = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSwitch(preset.id)}
                className={`px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                  isSel
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold shadow-xs'
                    : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* 2-Way Input Row */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <div className="relative">
              <input
                type="text"
                value={valLeft}
                onChange={(e) => handleLeftChange(e.target.value)}
                className="w-full px-2 py-1.5 pr-8 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded text-xs font-mono tabular-nums text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--md-sys-color-primary)]">
                {currentPreset.unitLeft}
              </span>
            </div>
          </div>

          <div>
            <div className="relative">
              <input
                type="text"
                value={valRight}
                onChange={(e) => handleRightChange(e.target.value)}
                className="w-full px-2 py-1.5 pr-8 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded text-xs font-mono tabular-nums text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-500">
                {currentPreset.unitRight}
              </span>
            </div>
          </div>
        </div>

        {/* Equivalence Hint */}
        <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between pt-0.5">
          <span>Formula Ratio:</span>
          <span className="text-[var(--md-sys-color-on-surface)]">
            1 {currentPreset.unitLeft} = {currentPreset.leftToRight(1).toFixed(currentPreset.precision)} {currentPreset.unitRight}
          </span>
        </div>
      </div>
    </div>
  );
};
