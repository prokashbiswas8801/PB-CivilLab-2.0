import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  HardHat,
  Boxes,
  Waves,
  Sparkles,
  Hammer,
  Grid,
  Shovel,
  ArrowRight,
  Clock,
  ExternalLink,
  CornerDownLeft,
} from 'lucide-react';
import { EngineeringModuleId } from '../types/civil';

export interface CommandPaletteItem {
  id: string;
  title: string;
  category: 'Calculators' | 'Units & Conversion' | 'Design Codes & Equations' | 'Actions';
  description: string;
  keywords: string[];
  shortcut?: string;
  moduleId?: EngineeringModuleId;
  action?: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (moduleId: EngineeringModuleId) => void;
  recentQueries: string[];
  onAddRecentQuery: (query: string) => void;
  onOpenProfile?: () => void;
  onOpenPreferences?: () => void;
  onOpenPresets?: () => void;
  onOpenPrintPreview?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectModule,
  recentQueries,
  onAddRecentQuery,
  onOpenProfile,
  onOpenPreferences,
  onOpenPresets,
  onOpenPrintPreview,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Master index of 27+ calculators, engineering units, design equations and actions
  const allItems: CommandPaletteItem[] = useMemo(() => [
    // Calculators
    {
      id: 'mod-boq-estimator',
      title: 'Quantity Takeoff & Bill of Quantities (BOQ)',
      category: 'Calculators',
      description: 'Itemized measurement sheet (L×W×H), live subtotals, multi-currency (BDT, USD, INR, EUR), contingency, CP&OH and VAT',
      keywords: ['boq', 'takeoff', 'quantity', 'estimate', 'bill', 'quantities', 'measurement', 'sheet', 'currency', 'vat', 'cost', 'contractor'],
      moduleId: 'boq-estimator',
    },
    {
      id: 'mod-rate-analysis',
      title: 'Granular Unit Rate Analysis (1 m³ RCC & Trades)',
      category: 'Calculators',
      description: 'Detailed unit rate breakdown for RCC 1:1.5:3, 1:2:4, PCC, brickwork, labor (masons, helpers), equipment hire and contractor profit',
      keywords: ['rate', 'analysis', 'unit rate', 'cost', 'rcc', 'labor', 'mason', 'equipment', 'shuttering', 'profit', 'margin', 'cft'],
      moduleId: 'rate-analysis',
    },
    {
      id: 'mod-unit-converter',
      title: 'Smart Unit Converter & Feet-Inch Parser',
      category: 'Calculators',
      description: 'Convert length, area, regional land (Decimal/Katha), volume (CFT/m³), stress (MPa/psi), and parse 12\'--4 1/2"',
      keywords: ['unit', 'convert', 'converter', 'feet', 'inch', 'fraction', 'cft', 'katha', 'decimal', 'psi', 'mpa'],
      moduleId: 'unit-converter',
    },
    {
      id: 'mod-concrete-materials',
      title: 'Material & Concrete Mix Proportions',
      category: 'Calculators',
      description: 'BNBC 2020 / ACI 318 / IS 456 volumetric mix ratios, 50kg cement bag counts, sand CFT, and dry factors (1.54)',
      keywords: ['concrete', 'mix', 'materials', 'cement', 'bags', 'sand', 'cft', 'aggregate', 'dry', 'factor', 'bnbc', 'aci', 'is456'],
      moduleId: 'concrete-materials',
    },
    {
      id: 'mod-rebar-bbs',
      title: 'Structural RCC & Rebar BBS Schedule',
      category: 'Calculators',
      description: 'Bar Bending Schedule with exact physics unit weights (W = D²/162.2), 90°/135°/180° bend deductions',
      keywords: ['rebar', 'bbs', 'bar', 'bending', 'schedule', 'cutting', 'length', 'steel', 'slab', 'column', 'stirrup', 'ties'],
      moduleId: 'rebar-bbs',
    },
    {
      id: 'mod-masonry-finishes',
      title: 'Masonry, Plaster & Tile Quantities',
      category: 'Calculators',
      description: 'Brickwork estimator with modular joints, door/window deductions, mortar volume, plaster coats, and tile boxes',
      keywords: ['brick', 'masonry', 'mortar', 'wall', 'plaster', 'tiles', 'openings', 'door', 'window', 'finishes'],
      moduleId: 'masonry-finishes',
    },
    {
      id: 'mod-earthwork-alignment',
      title: 'Earthwork & Prismoidal Road Alignment',
      category: 'Calculators',
      description: 'Pit excavation frustum, trapezoidal trench, Bank-to-Loose bulking swell factors, and 3-station road prismoidal',
      keywords: ['earthwork', 'excavation', 'prismoidal', 'road', 'alignment', 'bank', 'loose', 'swell', 'trucks', 'trench'],
      moduleId: 'earthwork-alignment',
    },
    {
      id: 'mod-beam-analysis',
      title: 'Structural Beam Analysis & SFD / BMD',
      category: 'Calculators',
      description: 'AISC 360 / Eurocode 3 flexural checks, shear envelope, midspan deflection, and allowable bending stress',
      keywords: ['beam', 'flexure', 'bending', 'shear', 'sfd', 'bmd', 'moment', 'deflection', 'aisc', 'eurocode'],
      moduleId: 'beam-analysis',
    },
    {
      id: 'mod-bearing-capacity',
      title: 'Shallow Foundation Bearing Capacity',
      category: 'Calculators',
      description: 'Terzaghi / Meyerhof bearing capacity factors (Nc, Nq, Nγ) with GWT water table corrections and factor of safety',
      keywords: ['bearing', 'capacity', 'foundation', 'soil', 'footing', 'geotechnical', 'terzaghi', 'meyerhof', 'subgrade'],
      moduleId: 'bearing-capacity',
    },
    {
      id: 'mod-concrete-mix',
      title: 'ACI 211.1 Volumetric Mix Proportioning',
      category: 'Calculators',
      description: 'Absolute volume concrete batching with Abram\'s 28-day target strength curve and slump adjustment',
      keywords: ['aci211', 'mix', 'design', 'abrams', 'slump', 'water', 'cement', 'ratio'],
      moduleId: 'concrete-mix',
    },
    {
      id: 'mod-open-channel',
      title: 'Open-Channel Hydraulics & Manning Flow',
      category: 'Calculators',
      description: 'Trapezoidal channel discharge Q, mean velocity V, hydraulic radius Rh, and Froude number regime',
      keywords: ['channel', 'hydraulics', 'manning', 'froude', 'discharge', 'flow', 'drainage', 'culvert'],
      moduleId: 'open-channel',
    },

    // Units & Quick Conversions
    {
      id: 'unit-feet-inch',
      title: 'Architectural Feet-Inch to Metric Conversion',
      category: 'Units & Conversion',
      description: 'Convert 12\'-4 1/2" into exact decimal millimeters (3771.9 mm) and meters',
      keywords: ['feet', 'inch', 'parser', 'fraction', 'mm', 'metric'],
      moduleId: 'unit-converter',
    },
    {
      id: 'unit-land-decimal',
      title: 'Regional Land Measurement: Katha, Bigha, Decimal',
      category: 'Units & Conversion',
      description: '1 Decimal = 435.6 sq ft · 1 Katha = 1.65 Dec (720 sq ft) · 1 Bigha = 20 Kathas (14,400 sq ft)',
      keywords: ['land', 'katha', 'bigha', 'decimal', 'satang', 'sqft', 'acre'],
      moduleId: 'unit-converter',
    },
    {
      id: 'unit-cft-m3',
      title: 'Concrete Bulk Volume: CFT ⇄ m³',
      category: 'Units & Conversion',
      description: '1 m³ = 35.3147 CFT (Cubic Feet) · Instant high-precision bidirectional conversion',
      keywords: ['cft', 'm3', 'volume', 'cubic', 'feet', 'meter'],
      moduleId: 'unit-converter',
    },
    {
      id: 'unit-mpa-psi',
      title: 'Structural Concrete Compressive Stress: MPa ⇄ psi',
      category: 'Units & Conversion',
      description: '1 MPa = 145.038 psi · C25 = 3,625 psi · C30 = 4,350 psi · C40 = 5,800 psi',
      keywords: ['mpa', 'psi', 'stress', 'pressure', 'cylinder', 'strength'],
      moduleId: 'unit-converter',
    },
    {
      id: 'unit-rebar-mass',
      title: 'Rebar Weight Formula: W = D² / 162.2 kg/m',
      category: 'Units & Conversion',
      description: 'Exact theoretical steel bar unit weight formula: W = (π × D² × ρ) / 4 with ρ = 7850 kg/m³',
      keywords: ['rebar', 'weight', 'd2/162', 'steel', 'mass', 'formula'],
      moduleId: 'rebar-bbs',
    },

    // Design Codes & Equations
    {
      id: 'code-bnbc-2020',
      title: 'BNBC 2020 Dry Volume Factor (1.54)',
      category: 'Design Codes & Equations',
      description: 'Bangladesh National Building Code: Dry volume of concrete = Wet Volume × 1.54',
      keywords: ['bnbc', '2020', 'dry', 'volume', '1.54', 'factor', 'concrete'],
      moduleId: 'concrete-materials',
    },
    {
      id: 'code-aci-318',
      title: 'ACI 318 Building Code Requirements for Structural Concrete',
      category: 'Design Codes & Equations',
      description: 'ACI 318 clear cover, minimum reinforcement, and development length criteria',
      keywords: ['aci', '318', 'american', 'concrete', 'cover', 'code'],
      moduleId: 'concrete-materials',
    },
    {
      id: 'code-is-456',
      title: 'IS 456:2000 Plain and Reinforced Concrete Code',
      category: 'Design Codes & Equations',
      description: 'Indian Standard code for RCC structures with 1.52 dry volume factor',
      keywords: ['is456', 'indian', 'standard', 'concrete', 'code'],
      moduleId: 'concrete-materials',
    },
    {
      id: 'eq-terzaghi',
      title: 'Terzaghi Ultimate Bearing Capacity Equation',
      category: 'Design Codes & Equations',
      description: 'qu = c\'·Nc·sc + q·Nq + 0.5·γ·B·Nγ·sγ with Meyerhof shape factors',
      keywords: ['terzaghi', 'bearing', 'capacity', 'qu', 'equation', 'soil'],
      moduleId: 'bearing-capacity',
    },
    {
      id: 'eq-manning',
      title: 'Manning Open-Channel Flow Equation',
      category: 'Design Codes & Equations',
      description: 'V = (1/n) · Rh^(2/3) · S^(1/2) · Q = A · V · Froude Fr = V / √(g · D)',
      keywords: ['manning', 'hydraulics', 'flow', 'equation', 'froude'],
      moduleId: 'open-channel',
    },
    {
      id: 'eq-prismoidal',
      title: 'Prismoidal Volume Formula for Earthwork',
      category: 'Design Codes & Equations',
      description: 'V = (L / 6) × [A1 + 4·Am + A2] · Eliminates end-area overestimation error',
      keywords: ['prismoidal', 'volume', 'earthwork', 'road', 'formula'],
      moduleId: 'earthwork-alignment',
    },

    // Actions & User Settings
    {
      id: 'action-user-profile',
      title: 'Engineer Profile & Professional Credentials',
      category: 'Actions',
      description: 'Edit personal credentials, designation, organization, and registration ID for calculation reports',
      keywords: ['profile', 'engineer', 'credentials', 'designation', 'organization', 'license', 'signature', 'eor'],
      action: onOpenProfile,
    },
    {
      id: 'action-user-preferences',
      title: 'Custom Preferences & Calculation Defaults',
      category: 'Actions',
      description: 'Configure decimal precision (0-4), cement bag weights (50kg), wastage percentages, and regional land rules',
      keywords: ['preferences', 'settings', 'precision', 'decimals', 'wastage', 'cement', 'katha', 'bigha', 'land'],
      action: onOpenPreferences,
    },
    {
      id: 'action-user-presets',
      title: 'Engineering Presets Library & Manager',
      category: 'Actions',
      description: 'Create, save, load, and transfer custom mix ratios, PWD material rates, and beam structural parameters',
      keywords: ['presets', 'preset', 'save preset', 'load preset', 'mix', 'rates', 'm25', 'pwd'],
      action: onOpenPresets,
    },
    {
      id: 'action-print-preview',
      title: 'Print Preview & Vector PDF Engine',
      category: 'Actions',
      description: 'Open professional certified submittal preview with QR code verification, layout presets, and vector PDF export',
      keywords: ['print', 'pdf', 'preview', 'export', 'submittal', 'qr', 'stamp', 'vector', 'report', 'sheet'],
      action: onOpenPrintPreview,
    },
  ], [onOpenProfile, onOpenPreferences, onOpenPresets, onOpenPrintPreview]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return allItems;
    }
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [allItems, query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          executeItem(selected);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  const executeItem = (item: CommandPaletteItem) => {
    if (query.trim()) {
      onAddRecentQuery(query.trim());
    }
    if (item.moduleId) {
      onSelectModule(item.moduleId);
    } else if (item.action) {
      item.action();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Engineering Command Palette and Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Field */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
          <Search className="w-5 h-5 text-[var(--md-sys-color-primary)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, unit, formula, or calculator (e.g. 'cft', 'katha', 'rebar', '12-4 1/2')..."
            className="w-full bg-transparent border-0 outline-hidden font-mono text-sm text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)]">
              ESC
            </kbd>
          </div>
        </div>

        {/* Recent Search Queries Strip (if any) */}
        {recentQueries.length > 0 && !query && (
          <div className="px-4 py-2 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex items-center gap-2 overflow-x-auto text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
            <span className="text-[var(--md-sys-color-on-surface-variant)] shrink-0">Recent:</span>
            {recentQueries.slice(0, 5).map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuery(q)}
                className="px-2 py-0.5 rounded bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-[var(--md-sys-color-outline-variant)]">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
              No matching calculators, units, or equations found for &quot;{query}&quot;.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3 py-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                      : 'hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase opacity-75">
                        {item.category}
                      </span>
                      <span className="text-xs font-bold truncate">{item.title}</span>
                    </div>
                    <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">
                      {item.description}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold opacity-90">
                        <span>Select</span>
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>Indexed 27+ Civil Engineering Modules & Units</span>
        </div>
      </div>
    </div>
  );
};
