import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

export type EngineeringTheme =
  | 'cad-charcoal'
  | 'blueprint-navy'
  | 'calcpad-paper'
  | 'site-daylight'
  | 'emerald-matrix';

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
    secondary: string;
    tertiary?: string;
    quaternary?: string;
    text: string;
    palette: string[]; // 4 vibrant preview swatches
  };
  gridPattern: boolean;
  highContrast: boolean;
  description: string;
}

export const ENGINEERING_THEMES: Record<EngineeringTheme, ThemeDefinition> = {
  'cad-charcoal': {
    id: 'cad-charcoal',
    name: 'Cyber Charcoal',
    subtitle: 'Electric Dark Workbench',
    mode: 'dark',
    colors: {
      bg: '#0B0F19',
      surface: '#131A29',
      border: '#243047',
      accent: '#00E5FF', // Luminous Electric Cyan
      secondary: '#F59E0B', // Radiant Amber
      tertiary: '#10B981', // Neon Emerald
      quaternary: '#A855F7', // Electric Violet
      text: '#F0F6FC',
      palette: ['#0B0F19', '#131A29', '#00E5FF', '#F59E0B'],
    },
    gridPattern: false,
    highContrast: false,
    description: 'Precision low-glare dark workbench glowing with luminous electric cyan, radiant amber, and neon emerald.',
  },
  'blueprint-navy': {
    id: 'blueprint-navy',
    name: 'Royal Blueprint',
    subtitle: 'Oceanic Technical Blue',
    mode: 'dark',
    colors: {
      bg: '#061325',
      surface: '#0B213F',
      border: '#1B3F6E',
      accent: '#38BDF8', // Blueprint Sky Cyan
      secondary: '#3B82F6', // Royal Sapphire
      tertiary: '#34D399', // Mint Green
      quaternary: '#FBBF24', // Golden Compass
      text: '#F0F8FF',
      palette: ['#061325', '#0B213F', '#38BDF8', '#34D399'],
    },
    gridPattern: true,
    highContrast: false,
    description: 'Deep oceanic navy with holographic cyan blueprint grid, royal sapphire surfaces, and golden compass highlights.',
  },
  'calcpad-paper': {
    id: 'calcpad-paper',
    name: 'Creative CalcPad',
    subtitle: 'Joyful Studio Light',
    mode: 'light',
    colors: {
      bg: '#F8FAF6', // warm joyful graph paper tint
      surface: '#FFFFFF',
      border: '#D5DFD3',
      accent: '#0284C7', // Vibrant Cerulean
      secondary: '#059669', // Fresh Mint Green
      tertiary: '#F97316', // Sunburst Orange
      quaternary: '#8B5CF6', // Amethyst Violet
      text: '#0F172A',
      palette: ['#F8FAF6', '#FFFFFF', '#0284C7', '#059669'],
    },
    gridPattern: true,
    highContrast: false,
    description: 'Crisp computational pad with cheerful graph paper tint, jewel-toned accents, and joyful mathematical typesetting.',
  },
  'site-daylight': {
    id: 'site-daylight',
    name: 'Solar Amber',
    subtitle: 'Sun-Drenched High Energy',
    mode: 'light',
    colors: {
      bg: '#FFFDF8',
      surface: '#FFFFFF',
      border: '#CBD5E1',
      accent: '#FF5500', // Safety Clementine Orange
      secondary: '#2563EB', // Royal Cobalt
      tertiary: '#16A34A', // Leaf Green
      quaternary: '#EAB308', // Sunflower Gold
      text: '#090D16',
      palette: ['#FFFDF8', '#FFFFFF', '#FF5500', '#2563EB'],
    },
    gridPattern: false,
    highContrast: true,
    description: 'High-energy sunlit white with Safety Clementine orange and vivid cobalt engineered for maximum outdoor satisfaction.',
  },
  'emerald-matrix': {
    id: 'emerald-matrix',
    name: 'Emerald Studio',
    subtitle: 'Lush Botanical Civil Lab',
    mode: 'dark',
    colors: {
      bg: '#051611',
      surface: '#0B261E',
      border: '#16483A',
      accent: '#10B981', // Luminous Jade
      secondary: '#06B6D4', // Aqua Cyan
      tertiary: '#84CC16', // Electric Lime
      quaternary: '#F59E0B', // Solar Amber
      text: '#ECFDF5',
      palette: ['#051611', '#0B261E', '#10B981', '#06B6D4'],
    },
    gridPattern: true,
    highContrast: false,
    description: 'Deep botanical evergreen workbench inspired by environmental & hydraulic civil systems, glowing with jade and aqua.',
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

  const themeConfig = useMemo(() => ENGINEERING_THEMES[theme] || ENGINEERING_THEMES['cad-charcoal'], [theme]);

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
    const themeKeys = Object.keys(ENGINEERING_THEMES) as EngineeringTheme[];
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
      'theme-emerald-matrix',
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
