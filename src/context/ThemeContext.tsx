import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

export type EngineeringTheme =
  | 'obsidian-gold'
  | 'blueprint-navy'
  | 'terracotta-studio'
  | 'emerald-botanical'
  | 'editorial-parchment'
  | 'solar-amber';

export interface ThemeDefinition {
  id: EngineeringTheme;
  name: string;
  subtitle: string;
  mode: 'dark' | 'light';
  colors: {
    bg: string;
    surface: string;
    card: string;
    border: string;
    accent: string;
    secondary: string;
    tertiary?: string;
    success: string;
    text: string;
    muted: string;
    palette: string[]; // 4 preview swatches: [bg, surface, primary, secondary]
    ambientGlow: string;
    gridLine: string;
    glassSurface: string;
    bevelHighlight: string;
  };
  surfaceBadges: string[];
  gridPattern: boolean;
  highContrast: boolean;
  description: string;
}

export const ENGINEERING_THEMES: Record<EngineeringTheme, ThemeDefinition> = {
  'obsidian-gold': {
    id: 'obsidian-gold',
    name: 'Obsidian Gold',
    subtitle: 'Atelier Dark',
    mode: 'dark',
    colors: {
      bg: '#0C0B0A',
      surface: '#161412',
      card: '#1F1C19',
      border: '#38312B',
      accent: '#F59E0B', // Radiant 24k Amber Gold
      secondary: '#F43F5E', // Crimson Rose
      tertiary: '#10B981', // Emerald
      success: '#10B981',
      text: '#FAF7F2',
      muted: '#A8A29E',
      palette: ['#0C0B0A', '#1F1C19', '#F59E0B', '#F43F5E'],
      ambientGlow: 'rgba(245, 158, 11, 0.16)',
      gridLine: 'rgba(245, 158, 11, 0.07)',
      glassSurface: 'rgba(28, 25, 22, 0.82)',
      bevelHighlight: 'rgba(254, 243, 199, 0.14)',
    },
    surfaceBadges: ['Gold Bevel', 'Micro-Grid', 'Smoked Glass'],
    gridPattern: true,
    highContrast: true,
    description: 'Bespoke architectural obsidian workbench with 24k amber gold specular bevels and smoked glass elevation.',
  },
  'blueprint-navy': {
    id: 'blueprint-navy',
    name: 'Royal Blueprint',
    subtitle: 'CAD Cobalt Dark',
    mode: 'dark',
    colors: {
      bg: '#07101E',
      surface: '#0D1B30',
      card: '#132642',
      border: '#233F6B',
      accent: '#38BDF8', // Electric CAD Cyan
      secondary: '#3B82F6', // Structural Cobalt
      tertiary: '#2DD4BF', // Teal Vector
      success: '#10B981',
      text: '#F0F7FF',
      muted: '#93B4DB',
      palette: ['#07101E', '#132642', '#38BDF8', '#3B82F6'],
      ambientGlow: 'rgba(56, 189, 248, 0.18)',
      gridLine: 'rgba(56, 189, 248, 0.09)',
      glassSurface: 'rgba(13, 27, 48, 0.84)',
      bevelHighlight: 'rgba(186, 230, 253, 0.16)',
    },
    surfaceBadges: ['CAD Blueprint', 'Cyan HUD', '3D Depth'],
    gridPattern: true,
    highContrast: true,
    description: 'Precision structural CAD midnight sapphire with electric cyan coordinate grids and translucent HUD panels.',
  },
  'terracotta-studio': {
    id: 'terracotta-studio',
    name: 'Terracotta Studio',
    subtitle: 'Espresso Clay Dark',
    mode: 'dark',
    colors: {
      bg: '#140F0D',
      surface: '#1F1714',
      card: '#2A1F1B',
      border: '#46342D',
      accent: '#F97316', // Kiln Terracotta Orange
      secondary: '#EAB308', // Burnished Brass
      tertiary: '#22C55E', // Sage Green
      success: '#22C55E',
      text: '#FFFBEB',
      muted: '#D6C4B0',
      palette: ['#140F0D', '#2A1F1B', '#F97316', '#EAB308'],
      ambientGlow: 'rgba(249, 115, 22, 0.16)',
      gridLine: 'rgba(249, 115, 22, 0.07)',
      glassSurface: 'rgba(31, 23, 20, 0.84)',
      bevelHighlight: 'rgba(255, 237, 213, 0.14)',
    },
    surfaceBadges: ['Clay 3D Bevel', 'Warm Glow', 'Bronze Trim'],
    gridPattern: true,
    highContrast: true,
    description: 'Rich roasted espresso and kiln-fired terracotta clay with tactile 3D card depth and warm studio illumination.',
  },
  'emerald-botanical': {
    id: 'emerald-botanical',
    name: 'Emerald Botanical',
    subtitle: 'Geotech Jade Dark',
    mode: 'dark',
    colors: {
      bg: '#061410',
      surface: '#0C221B',
      card: '#123027',
      border: '#214E3F',
      accent: '#10B981', // Luminous Jade Emerald
      secondary: '#F59E0B', // Burnished Brass
      tertiary: '#34D399', // Mint Contour
      success: '#34D399',
      text: '#ECFDF5',
      muted: '#99E6C9',
      palette: ['#061410', '#123027', '#10B981', '#F59E0B'],
      ambientGlow: 'rgba(16, 185, 129, 0.17)',
      gridLine: 'rgba(16, 185, 129, 0.08)',
      glassSurface: 'rgba(12, 34, 27, 0.84)',
      bevelHighlight: 'rgba(209, 250, 229, 0.15)',
    },
    surfaceBadges: ['Topo Grid', 'Jade Glass', 'Brass Accent'],
    gridPattern: true,
    highContrast: true,
    description: 'Deep geotechnical forest obsidian with luminous jade glassmorphic overlays and polished brass instruments.',
  },
  'editorial-parchment': {
    id: 'editorial-parchment',
    name: 'Editorial Parchment',
    subtitle: 'Archival Vellum Light',
    mode: 'light',
    colors: {
      bg: '#F5F1E8',
      surface: '#FFFFFF',
      card: '#FAF7F0',
      border: '#D5CDBE',
      accent: '#9F1239', // Venetian Crimson Ruby
      secondary: '#B45309', // Archival Ochre Gold
      tertiary: '#15803D', // Botanical Ink Green
      success: '#15803D',
      text: '#1C1917',
      muted: '#57534E',
      palette: ['#F5F1E8', '#FFFFFF', '#9F1239', '#B45309'],
      ambientGlow: 'rgba(180, 83, 9, 0.10)',
      gridLine: 'rgba(120, 93, 60, 0.075)',
      glassSurface: 'rgba(255, 253, 249, 0.88)',
      bevelHighlight: 'rgba(255, 255, 255, 0.95)',
    },
    surfaceBadges: ['Vellum Grid', 'Paper Stack 3D', 'Ruby Ink'],
    gridPattern: true,
    highContrast: true,
    description: 'Warm architectural drafting vellum with millimeter grid lines, 3D paper-stack shadows, and crimson ruby ink.',
  },
  'solar-amber': {
    id: 'solar-amber',
    name: 'Solar Daylight',
    subtitle: 'Alabaster & Cobalt Light',
    mode: 'light',
    colors: {
      bg: '#F3F7FC',
      surface: '#FFFFFF',
      card: '#F8FAFC',
      border: '#C5D3E6',
      accent: '#1D4ED8', // Structural Cobalt Blue
      secondary: '#EA580C', // Safety Vermilion
      tertiary: '#047857', // Survey Emerald
      success: '#16A34A',
      text: '#0F172A',
      muted: '#475569',
      palette: ['#F3F7FC', '#FFFFFF', '#1D4ED8', '#EA580C'],
      ambientGlow: 'rgba(29, 78, 216, 0.10)',
      gridLine: 'rgba(29, 78, 216, 0.065)',
      glassSurface: 'rgba(255, 255, 255, 0.88)',
      bevelHighlight: 'rgba(255, 255, 255, 0.98)',
    },
    surfaceBadges: ['Daylight CAD', 'Porcelain 3D', 'Cobalt & Orange'],
    gridPattern: true,
    highContrast: true,
    description: 'High-clarity architectural alabaster with structural cobalt blue, safety vermilion, and crisp porcelain 3D depth.',
  },
};

const THEME_STORAGE_KEY = 'bd_civillab_active_theme_v5';

// Helper to map any legacy theme id to one of the 6 curated themes
export function normalizeTheme(id: string | null | undefined): EngineeringTheme {
  if (!id) return 'obsidian-gold';
  if (id in ENGINEERING_THEMES) return id as EngineeringTheme;
  if (id === 'cad-charcoal' || id === 'dark') return 'obsidian-gold';
  if (id === 'calcpad-paper' || id === 'light') return 'editorial-parchment';
  if (id === 'site-daylight') return 'solar-amber';
  if (id === 'emerald-matrix') return 'emerald-botanical';
  return 'obsidian-gold';
}

interface ThemeContextType {
  theme: EngineeringTheme;
  themeConfig: ThemeDefinition;
  setTheme: (theme: EngineeringTheme) => void;
  cycleNextTheme: () => void;
  availableThemes: ThemeDefinition[];
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<EngineeringTheme>(() => {
    if (typeof window === 'undefined') return 'obsidian-gold';
    try {
      const stored =
        localStorage.getItem(THEME_STORAGE_KEY) ||
        localStorage.getItem('bd_civillab_active_theme_v4') ||
        localStorage.getItem('pb_civillab_active_theme_v4') ||
        localStorage.getItem('pb_civillab_active_theme_v3');
      return normalizeTheme(stored);
    } catch {
      return 'obsidian-gold';
    }
  });

  const themeConfig = useMemo(() => ENGINEERING_THEMES[theme] || ENGINEERING_THEMES['obsidian-gold'], [theme]);

  const setTheme = (newTheme: EngineeringTheme) => {
    const validTheme = normalizeTheme(newTheme);
    setThemeState(validTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, validTheme);
      localStorage.setItem('bd_civillab_active_theme_v4', validTheme);
    } catch {
      // Ignore
    }
  };

  const cycleNextTheme = () => {
    const themeKeys = Object.keys(ENGINEERING_THEMES) as EngineeringTheme[];
    const currentIndex = themeKeys.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    setTheme(themeKeys[nextIndex]);
  };

  // Sync class names and data attributes on <html> and documentElement
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Remove any previous theme classes (including legacy)
    root.classList.remove(
      'theme-obsidian-gold',
      'theme-blueprint-navy',
      'theme-terracotta-studio',
      'theme-editorial-parchment',
      'theme-solar-amber',
      'theme-emerald-botanical',
      'theme-cad-charcoal',
      'theme-calcpad-paper',
      'theme-site-daylight',
      'theme-emerald-matrix',
      'dark',
      'light'
    );

    // Apply active theme class and data-theme attribute
    root.classList.add(`theme-${theme}`);
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-theme-mode', themeConfig.mode);

    if (themeConfig.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    // Update <meta name="theme-color">
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeConfig.colors.bg);
    }
  }, [theme, themeConfig]);

  const availableThemes = useMemo(() => Object.values(ENGINEERING_THEMES), []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeConfig,
        setTheme,
        cycleNextTheme,
        availableThemes,
        isDark: themeConfig.mode === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
