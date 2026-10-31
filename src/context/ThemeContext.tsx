import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

export type EngineeringTheme =
  | 'cad-charcoal'
  | 'blueprint-navy'
  | 'calcpad-paper'
  | 'site-daylight';

export interface ThemeDefinition {
  id: EngineeringTheme;
  name: string;
  subtitle: string;
  mode: 'dark' | 'light';
  colors: {
    bg: string;
    surface: string;
    border: string;
    accent: string;
    secondary?: string;
    text: string;
  };
  gridPattern: boolean;
  highContrast: boolean;
  description: string;
}

export const ENGINEERING_THEMES: Record<EngineeringTheme, ThemeDefinition> = {
  'cad-charcoal': {
    id: 'cad-charcoal',
    name: 'CAD Charcoal',
    subtitle: 'Default Dark',
    mode: 'dark',
    colors: {
      bg: '#0F1216',
      surface: '#161B22',
      border: '#262C36',
      accent: '#0EA5E9', // CAD Cyan
      secondary: '#F59E0B', // Amber Crosshair
      text: '#E6EDF3',
    },
    gridPattern: false,
    highContrast: false,
    description: 'Precision low-glare dark workbench inspired by AutoCAD and modern CAD/CAE tools.',
  },
  'blueprint-navy': {
    id: 'blueprint-navy',
    name: 'Blueprint Navy',
    subtitle: 'Technical Blue',
    mode: 'dark',
    colors: {
      bg: '#071324',
      surface: '#0D1F38',
      border: '#1E3A5F',
      accent: '#38BDF8', // Blueprint Cyan
      secondary: '#60A5FA',
      text: '#F0F6FC',
    },
    gridPattern: true,
    highContrast: false,
    description: 'Classic architectural cyan blueprint with subtle coordinate grid background.',
  },
  'calcpad-paper': {
    id: 'calcpad-paper',
    name: 'CalcPad Paper',
    subtitle: 'Engineering Pad Light',
    mode: 'light',
    colors: {
      bg: '#F4F5F0', // warm graph paper tint
      surface: '#FFFFFF',
      border: '#D8DDD6',
      accent: '#0284C7',
      secondary: '#059669',
      text: '#111827',
    },
    gridPattern: true,
    highContrast: false,
    description: 'Crisp computational pad with warm grid tint and high-legibility mathematical typesetting.',
  },
  'site-daylight': {
    id: 'site-daylight',
    name: 'Site Daylight',
    subtitle: 'High-Contrast Field Mode',
    mode: 'light',
    colors: {
      bg: '#FFFFFF',
      surface: '#FFFFFF',
      border: '#1E293B',
      accent: '#EA580C', // Safety Orange
      secondary: '#0284C7',
      text: '#000000',
    },
    gridPattern: false,
    highContrast: true,
    description: 'Ultra-high contrast with Safety Orange accents engineered for direct sun visibility on active construction sites.',
  },
};

const THEME_STORAGE_KEY = 'pb_civillab_active_theme_v3';

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
    if (typeof window === 'undefined') return 'cad-charcoal';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && stored in ENGINEERING_THEMES) {
        return stored as EngineeringTheme;
      }
      // Migrate legacy string preferences if found
      if (stored === 'light') return 'calcpad-paper';
      if (stored === 'dark') return 'cad-charcoal';
      
      const v2State = localStorage.getItem('pb_civillab_schema_v2');
      if (v2State) {
        const parsed = JSON.parse(v2State);
        if (parsed.themePreference === 'light') return 'calcpad-paper';
        if (parsed.themePreference === 'dark') return 'cad-charcoal';
      }
    } catch {
      // Fallback
    }
    return 'cad-charcoal';
  });

  const themeConfig = useMemo(() => ENGINEERING_THEMES[theme], [theme]);

  const setTheme = (newTheme: EngineeringTheme) => {
    if (!ENGINEERING_THEMES[newTheme]) return;
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore
    }
  };

  const cycleNextTheme = () => {
    const themeKeys: EngineeringTheme[] = ['cad-charcoal', 'blueprint-navy', 'calcpad-paper', 'site-daylight'];
    const currentIndex = themeKeys.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    setTheme(themeKeys[nextIndex]);
  };

  // Sync class names and data attributes on <html> and documentElement
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Remove any previous theme class
    root.classList.remove(
      'theme-cad-charcoal',
      'theme-blueprint-navy',
      'theme-calcpad-paper',
      'theme-site-daylight',
      'dark',
      'sunlight-mode'
    );

    // Apply active theme class
    root.classList.add(`theme-${theme}`);
    root.setAttribute('data-theme', theme);

    if (themeConfig.mode === 'dark') {
      root.classList.add('dark');
    }

    if (theme === 'site-daylight') {
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
