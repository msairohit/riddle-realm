import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface ThemeColors {
    background: string;
    gradientBackground: string[];
    cardBackground: string;
    text: string;
    textSecondary: string;
    accent: string;
    tint: string;
    borderColor: string;
    buttonGradient: string[];
    buttonText: string;
    hintButton: {
        backgroundColor: string;
        color: string;
    };
    answerButton: {
        backgroundColor: string;
        color: string;
    };
    headerIllustration: string;
    heartColor: string;
}

export interface AgeRange {
    id: string;
    label: string;
    range: string;
    themeName: string;
    icon: string;
    description: string;
}

export const ageRanges: AgeRange[] = [
    {
        id: "kids",
        label: "Kids",
        range: "0-12 years",
        themeName: "Orange",
        icon: "balloon",
        description: "Fun, colorful and friendly puzzles to spark young imaginations.",
    },
    {
        id: "teens",
        label: "Teens",
        range: "13-19 years",
        themeName: "Purple",
        icon: "gamepad-variant",
        description: "Cyberpunk styling, sharp logic and creative brain teasers.",
    },
    {
        id: "adults",
        label: "Adults",
        range: "20-59 years",
        themeName: "Teal",
        icon: "brain",
        description: "Elegant, beautiful sage mint styling with highly challenging riddles.",
    },
    {
        id: "seniors",
        label: "Seniors",
        range: "60+ years",
        themeName: "Blue",
        icon: "glasses",
        description: "Classic high-contrast design, clean spacing, and engaging brain gym.",
    },
];

const themes: Record<string, ThemeColors> = {
    Orange: {
        background: "#FFF8F0",
        gradientBackground: ["#FFF5E6", "#FFFBF5"],
        cardBackground: "rgba(255, 255, 255, 0.95)",
        text: "#5D4037",
        textSecondary: "#8D6E63",
        accent: "#FF9F43",
        tint: "#FF9F43",
        borderColor: "#FFE0B2",
        buttonGradient: ["#FF9F43", "#FFBE53"],
        buttonText: "#FFFFFF",
        hintButton: {
            backgroundColor: "#E0F7FA",
            color: "#006064",
        },
        answerButton: {
            backgroundColor: "#F3E5F5",
            color: "#4A148C",
        },
        headerIllustration: "balloon",
        heartColor: "#FF4A5A",
    },
    Purple: {
        background: "#F5F3FF",
        gradientBackground: ["#EDE9FE", "#F5F3FF"],
        cardBackground: "rgba(255, 255, 255, 0.95)",
        text: "#2E1065",
        textSecondary: "#7C3AED",
        accent: "#7C3AED",
        tint: "#7C3AED",
        borderColor: "#DDD6FE",
        buttonGradient: ["#7C3AED", "#A855F7"],
        buttonText: "#FFFFFF",
        hintButton: {
            backgroundColor: "#EDE9FE",
            color: "#5B21B6",
        },
        answerButton: {
            backgroundColor: "#FCE7F3",
            color: "#9D174D",
        },
        headerIllustration: "gamepad-variant",
        heartColor: "#E11D48",
    },
    Teal: {
        background: "#E8F5E9",
        gradientBackground: ["#E0F2F1", "#FFFFFF"],
        cardBackground: "rgba(255, 255, 255, 0.92)",
        text: "#0A3C36",
        textSecondary: "#4DB6AC",
        accent: "#0D9488",
        tint: "#0D9488",
        borderColor: "#E2E8F0",
        buttonGradient: ["#00B4D8", "#a3e635"],
        buttonText: "#FFFFFF",
        hintButton: {
            backgroundColor: "#E0F2F1",
            color: "#00796B",
        },
        answerButton: {
            backgroundColor: "#F3E5F5",
            color: "#7B1FA2",
        },
        headerIllustration: "brain",
        heartColor: "#FF5252",
    },
    Blue: {
        background: "#FAF9F6",
        gradientBackground: ["#E9F1F7", "#FFFFFF"],
        cardBackground: "rgba(255, 255, 255, 0.95)",
        text: "#0F172A",
        textSecondary: "#475569",
        accent: "#1E40AF",
        tint: "#1E40AF",
        borderColor: "#CBD5E1",
        buttonGradient: ["#1E40AF", "#3B82F6"],
        buttonText: "#FFFFFF",
        hintButton: {
            backgroundColor: "#EFF6FF",
            color: "#1E40AF",
        },
        answerButton: {
            backgroundColor: "#F5F3FF",
            color: "#6D28D9",
        },
        headerIllustration: "book-open-variant",
        heartColor: "#DC2626",
    },
};

const AGE_STORAGE_KEY = "@riddles_app_age_range";
const THEME_STORAGE_KEY = "@riddles_app_theme";

interface ThemeContextType {
    theme: ThemeColors;
    themeName: string;
    ageRange: string | null;
    setAgeRange: (range: string) => Promise<void>;
    ageRanges: AgeRange[];
    setTheme: (name: string) => Promise<void>;
    themes: string[];
}

const ThemeContext = createContext<ThemeContextType>({
    theme: themes.Teal,
    themeName: "Teal",
    ageRange: null,
    setAgeRange: async () => {},
    ageRanges,
    setTheme: async () => {},
    themes: Object.keys(themes),
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [ageRange, setAgeRangeState] = useState<string | null>(null);
    const [themeName, setThemeName] = useState<string>("Teal");
    const [loading, setLoading] = useState<boolean>(true);

    // load persisted age range and theme
    useEffect(() => {
        (async () => {
            try {
                const storedAge = await AsyncStorage.getItem(AGE_STORAGE_KEY);
                if (storedAge) {
                    setAgeRangeState(storedAge);
                    const rangeObj = ageRanges.find((r) => r.id === storedAge);
                    if (rangeObj && themes[rangeObj.themeName]) {
                        setThemeName(rangeObj.themeName);
                    }
                }
            } catch {
                // ignore storage errors
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const setAgeRange = useCallback(async (range: string) => {
        const rangeObj = ageRanges.find((r) => r.id === range);
        if (!rangeObj) return;

        try {
            await AsyncStorage.setItem(AGE_STORAGE_KEY, range);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, rangeObj.themeName);
        } catch {
            // ignore write errors
        }

        setAgeRangeState(range);
        setThemeName(rangeObj.themeName);
    }, []);

    const setTheme = useCallback(async (name: string) => {
        // dummy implementation for compatibility
    }, []);

    if (loading) {
        return null;
    }

    return (
        <ThemeContext.Provider
            value={{
                theme: themes[themeName] || themes.Teal,
                themeName,
                ageRange,
                setAgeRange,
                ageRanges,
                setTheme,
                themes: Object.keys(themes),
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export default function ThemeContextRoute() {
    return null;
}