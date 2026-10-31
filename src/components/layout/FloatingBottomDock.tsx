import React, { useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Grid,
  Search,
  ArrowRightLeft,
  History,
  User,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useCivilLab, ActivePage } from '../../context/CivilLabContext';

export interface FloatingBottomDockProps {
  onNavigateHome?: () => void;
  onNavigateAll?: () => void;
  onOpenSearch?: () => void;
  onNavigateConverter?: () => void;
  onOpenHistory?: () => void;
  onOpenProfile?: () => void;
}

interface DestinationItem {
  id: ActivePage | 'search';
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcutHint: string;
  altKeyNumber: string;
  description: string;
}

const DESTINATIONS: DestinationItem[] = [
  {
    id: 'home',
    label: 'Home',
    shortLabel: 'Home',
    icon: LayoutDashboard,
    shortcutHint: 'Alt+1',
    altKeyNumber: '1',
    description: 'Dashboard & Categorized Overview',
  },
  {
    id: 'all',
    label: 'All Tools',
    shortLabel: 'All',
    icon: Grid,
    shortcutHint: 'Alt+2',
    altKeyNumber: '2',
    description: 'Complete Engineering Feature Directory',
  },
  {
    id: 'search',
    label: 'Search',
    shortLabel: 'Search',
    icon: Search,
    shortcutHint: 'Ctrl+K',
    altKeyNumber: '3',
    description: 'Unified Search & Command Palette',
  },
  {
    id: 'converter',
    label: 'Converter',
    shortLabel: 'Units',
    icon: ArrowRightLeft,
    shortcutHint: 'Alt+4',
    altKeyNumber: '4',
    description: 'Engineering & Regional Unit Converter',
  },
  {
    id: 'history',
    label: 'History',
    shortLabel: 'History',
    icon: History,
    shortcutHint: 'Alt+5',
    altKeyNumber: '5',
    description: 'Saved Calculations & Conversions Ledger',
  },
  {
    id: 'profile',
    label: 'Profile',
    shortLabel: 'Profile',
    icon: User,
    shortcutHint: 'Alt+6',
    altKeyNumber: '6',
    description: 'User Profile, Projects & PDF Presets',
  },
];

export const FloatingBottomDock: React.FC<FloatingBottomDockProps> = ({
  onNavigateHome,
  onNavigateAll,
  onOpenSearch,
  onNavigateConverter,
  onOpenHistory,
  onOpenProfile,
}) => {
  const {
    activePage,
    setActivePage,
    savedHistory,
    isDockCollapsed,
    setIsDockCollapsed,
    toggleDockCollapsed,
  } = useCivilLab();

  const handleSelect = useCallback(
    (destId: ActivePage | 'search') => {
      if (destId === 'home') {
        setActivePage('home', null);
        onNavigateHome?.();
      } else if (destId === 'all') {
        setActivePage('all', null);
        onNavigateAll?.();
      } else if (destId === 'search') {
        onOpenSearch?.();
      } else if (destId === 'converter') {
        setActivePage('converter', 'unit-converter');
        onNavigateConverter?.();
      } else if (destId === 'history') {
        setActivePage('history', null);
        onOpenHistory?.();
      } else if (destId === 'profile') {
        setActivePage('profile', null);
        onOpenProfile?.();
      }
    },
    [
      setActivePage,
      onNavigateHome,
      onNavigateAll,
      onOpenSearch,
      onNavigateConverter,
      onOpenHistory,
      onOpenProfile,
    ]
  );

  // Global Keyboard Shortcuts (Alt+1 through Alt+6, Ctrl+K / Cmd+K, Alt+D for dock collapse)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement;

      // Ctrl+K / Cmd+K for Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleSelect('search');
        return;
      }

      // Alt+D to toggle dock collapse
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleDockCollapsed();
        return;
      }

      // Alt + 1..6 navigation
      if (e.altKey && !isInput) {
        if (e.key === '1') {
          e.preventDefault();
          handleSelect('home');
        } else if (e.key === '2') {
          e.preventDefault();
          handleSelect('all');
        } else if (e.key === '3') {
          e.preventDefault();
          handleSelect('search');
        } else if (e.key === '4') {
          e.preventDefault();
          handleSelect('converter');
        } else if (e.key === '5') {
          e.preventDefault();
          handleSelect('history');
        } else if (e.key === '6') {
          e.preventDefault();
          handleSelect('profile');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelect, toggleDockCollapsed]);

  // COLLAPSED STATE: Unobtrusive Floating Pill in bottom-right corner
  if (isDockCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-50 print:hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => setIsDockCollapsed(false)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]/95 backdrop-blur-xl shadow-2xl text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] hover:border-[var(--md-sys-color-primary)] transition-all cursor-pointer group hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40"
          title="Expand Navigation Dock (Alt+D)"
          aria-label="Expand Navigation Dock"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--md-sys-color-primary)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--md-sys-color-primary)]"></span>
          </span>
          <Layers className="w-4 h-4 text-[var(--md-sys-color-primary)] group-hover:rotate-12 transition-transform duration-200" />
          <span className="text-xs font-mono font-semibold tracking-wide hidden xs:inline">
            Expand Dock
          </span>
          {savedHistory.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[var(--md-sys-color-primary)] text-white shadow-xs">
              {savedHistory.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  // EXPANDED STATE: Sleek floating bottom dock with 6 primary destinations + 1 minimize toggle
  return (
    <nav
      aria-label="PB CivilLab Main Navigation"
      className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 print:hidden transition-all duration-200 max-w-[96vw] sm:max-w-none"
    >
      <div
        className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-2xl sm:rounded-full bg-[var(--md-sys-color-surface)]/95 backdrop-blur-xl border border-[var(--md-sys-color-outline)] shadow-2xl shadow-black/40 ring-1 ring-white/10 select-none pb-[max(0.35rem,env(safe-area-inset-bottom))]
        max-h-[500px]:p-1 max-h-[500px]:gap-0.5"
      >
        {DESTINATIONS.map((dest) => {
          const isActive =
            dest.id === 'search' ? false : activePage === dest.id;
          const Icon = dest.icon;
          const hasBadge = dest.id === 'history' && savedHistory.length > 0;

          return (
            <button
              key={dest.id}
              type="button"
              onClick={() => handleSelect(dest.id)}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-full min-w-[48px] min-h-[44px] sm:min-w-[56px] text-xs font-mono font-medium transition-all cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]
              max-h-[500px]:min-h-[36px] max-h-[500px]:py-1 max-h-[500px]:px-2 ${
                isActive
                  ? 'bg-[var(--md-sys-color-primary)] text-white shadow-md shadow-[var(--md-sys-color-primary)]/30 font-bold'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
              }`}
              title={`${dest.label} — ${dest.description} (${dest.shortcutHint})`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 sm:w-4 sm:h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-[var(--md-sys-color-primary)]'
                  }`}
                />
                {hasBadge && (
                  <span
                    className={`absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold font-mono tracking-tighter shadow-xs ${
                      isActive
                        ? 'bg-white text-[var(--md-sys-color-primary)]'
                        : 'bg-[var(--md-sys-color-primary)] text-white'
                    }`}
                  >
                    {savedHistory.length}
                  </span>
                )}
              </div>

              {/* Destination Label */}
              <span className="text-[10px] sm:text-xs font-sans tracking-tight max-h-[500px]:hidden">
                <span className="sm:hidden">{dest.shortLabel}</span>
                <span className="hidden sm:inline">{dest.label}</span>
              </span>

              {/* Desktop Keyboard Shortcut Badge */}
              <kbd
                className={`hidden lg:inline-flex items-center text-[9px] font-mono px-1 py-0.2 rounded border transition-colors opacity-70 group-hover:opacity-100 max-h-[500px]:hidden ${
                  isActive
                    ? 'border-white/40 text-white/90 bg-white/10'
                    : 'border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)]'
                }`}
              >
                {dest.shortcutHint}
              </kbd>
            </button>
          );
        })}

        {/* Vertical Divider */}
        <div className="w-px h-6 bg-[var(--md-sys-color-outline)]/60 my-auto mx-0.5" />

        {/* Minimize / Collapse Toggle Button */}
        <button
          type="button"
          onClick={toggleDockCollapsed}
          className="flex items-center justify-center p-2 rounded-xl sm:rounded-full min-w-[38px] min-h-[44px] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-all cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]
          max-h-[500px]:min-h-[36px] max-h-[500px]:p-1.5"
          title="Minimize Dock to Corner Pill (Alt+D)"
          aria-label="Minimize Navigation Dock"
        >
          <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>
    </nav>
  );
};
