import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

export type EngineeringTheme =
  | 'obsidian-gold'
  | 'terracotta-studio'
  | 'editorial-parchment'
  | 'solar-amber'
  | 'emerald-botanical';

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
  };
  gridPattern: boolean;
  highContrast: boolean;
  description: string;
}

export const ENGINEERING_THEMES: Record<EngineeringTheme, ThemeDefinition> = {
  'obsidian-gold': {
    id: 'obsidian-gold',
    name: 'Obsidian Gold',
    subtitle: 'Default Dark',
    mode: 'dark',
    colors: {
      bg: '#121110',
      surface: '#1C1917',
      card: '#24201D',
      border: '#38322C',
      accent: '#F59E0B', // Radiant Gold / Amber
      secondary: '#E11D48', // Crimson Rose
      tertiary: '#10B981', // Emerald
      success: '#10B981',
      text: '#FAF7F2',
      muted: '#A8A29E',
      palette: ['#121110', '#1C1917', '#F59E0B', '#E11D48'],
    },
    gridPattern: false,
    highContrast: true,
    description: 'Bespoke obsidian charcoal dark workspace with high-contrast amber gold and crimson accents.',
  },
  'terracotta-studio': {
    id: 'terracotta-studio',
    name: 'Terracotta Studio',
    subtitle: 'Espresso Dark',
    mode: 'dark',
    colors: {
      bg: '#161210',
      surface: '#211B18',
      card: '#2B231F',
      border: '#433630',
      accent: '#EA580C', // Burnt Terracotta
      secondary: '#EAB308', // Warm Gold
      tertiary: '#22C55E', // Green
      success: '#22C55E',
      text: '#FFFBEB',
      muted: '#D6C7B2',
      palette: ['#161210', '#211B18', '#EA580C', '#EAB308'],
    },
    gridPattern: false,
    highContrast: true,
    description: 'Rich espresso and earthen clay palette tailored for heavy civil masonry & structural design.',
  },
  'editorial-parchment': {
    id: 'editorial-parchment',
    name: 'Editorial Parchment',
    subtitle: 'Serif Light',
    mode: 'light',
    colors: {
      bg: '#F7F4EF',
      surface: '#FFFFFF',
      card: '#EFECE6',
      border: '#D6D0C4',
      accent: '#9F1239', // Crimson Ruby
      secondary: '#B45309', // Amber Ochre
      tertiary: '#15803D', // Forest Green
      success: '#15803D',
      text: '#1C1917',
      muted: '#57534E',
      palette: ['#F7F4EF', '#FFFFFF', '#9F1239', '#B45309'],
    },
    gridPattern: true,
    highContrast: true,
    description: 'High-elegance archival print aesthetic with cream paper, ruby accents, and authoritative typography.',
  },
  'solar-amber': {
    id: 'solar-amber',
    name: 'Solar Amber',
    subtitle: 'Sun-Drenched Light',
    mode: 'light',
    colors: {
      bg: '#FFFFFF',
      surface: '#F8FAFC',
      card: '#F1F5F9',
      border: '#CBD5E1',
      accent: '#D9460F', // Safety Vermilion
      secondary: '#047857', // Forest Emerald
      tertiary: '#16A34A', // Leaf Green
      success: '#16A34A',
      text: '#090D16',
      muted: '#475569',
      palette: ['#FFFFFF', '#F8FAFC', '#D9460F', '#047857'],
    },
    gridPattern: false,
    highContrast: true,
    description: 'Maximum contrast sun-drenched daytime palette engineered for outdoor jobsites and tablet use.',
  },
  'emerald-botanical': {
    id: 'emerald-botanical',
    name: 'Emerald Botanical',
    subtitle: 'Evergreen & Brass',
    mode: 'dark',
    colors: {
      bg: '#071712',
      surface: '#0D241D',
      card: '#133027',
      border: '#214E3F',
      accent: '#10B981', // Jade Emerald
      secondary: '#F59E0B', // Polished Brass
      tertiary: '#34D399', // Mint
      success: '#34D399',
      text: '#ECFDF5',
      muted: '#A7F3D0',
      palette: ['#071712', '#0D241D', '#10B981', '#F59E0B'],
    },
    gridPattern: true,
    highContrast: true,
    description: 'Deep botanical evergreen & brass workbench inspired by environmental & hydraulic civil engineering.',
  },
};

const THEME_STORAGE_KEY = 'bd_civillab_active_theme_v4';

// Helper to map any legacy theme id to a v4 theme id
function normalizeTheme(id: string | null | undefined): EngineeringTheme {
  if (!id) return 'obsidian-gold';
  if (id in ENGINEERING_THEMES) return id as EngineeringTheme;
  if (id === 'cad-charcoal' || id === 'blueprint-navy' || id === 'dark') return 'obsidian-gold';
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
      const stored = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('pb_civillab_active_theme_v4') || localStorage.getItem('pb_civillab_active_theme_v3');
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
      'theme-terracotta-studio',
      'theme-editorial-parchment',
      'theme-solar-amber',
      'theme-emerald-botanical',
      'theme-cad-charcoal',
      'theme-blueprint-navy',
      'theme-calcpad-paper',
      'theme-site-daylight',
      'theme-emerald-matrix',
      'dark',
      'sunlight-mode'
    );

    // Apply active theme class and data-theme attribute
    root.classList.add(`theme-${theme}`);
    root.setAttribute('data-theme', theme);

    if (themeConfig.mode === 'dark') {
      root.classList.add('dark');
    }

    if (theme === 'solar-amber') {
      root.classList.add('sunlight-mode');
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
