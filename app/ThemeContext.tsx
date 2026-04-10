import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const themes = {
    Light: {
        background: "#f5f5f5",
        container: "white",
        text: "#333",
        button: "#3498db",
        buttonText: "white",
    },
    Dark: {
        background: "#222",
        container: "#333",
        text: "#f5f5f5",
        button: "#555",
        buttonText: "#f5f5f5",
    },
    Blue: {
        background: "#e3f2fd",
        container: "#bbdefb",
        text: "#0d47a1",
        button: "#1976d2",
        buttonText: "white",
    },
    Green: {
        background: "#e8f5e9",
        container: "#c8e6c9",
        text: "#1b5e20",
        button: "#388e3c",
        buttonText: "white",
    },
    Red: {
        background: "#ffebee",
        container: "#ffcdd2",
        text: "#b71c1c",
        button: "#d32f2f",
        buttonText: "white",
    },
    Purple: {
        background: "#f3e5f5",
        container: "#ce93d8",
        text: "#4a148c",
        button: "#8e24aa",
        buttonText: "white",
    },
    Orange: {
        background: "#fff3e0",
        container: "#ffcc80",
        text: "#e65100",
        button: "#fb8c00",
        buttonText: "white",
    },
    Pink: {
        background: "#fce4ec",
        container: "#f8bbd0",
        text: "#ad1457",
        button: "#d81b60",
        buttonText: "white",
    },
    Gray: {
        background: "#ececec",
        container: "#bdbdbd",
        text: "#212121",
        button: "#757575",
        buttonText: "white",
    },
    Teal: {
        background: "#e0f2f1",
        container: "#b2dfdb",
        text: "#004d40",
        button: "#00796b",
        buttonText: "white",
    },
};

const STORAGE_KEY = "@riddles_app_theme";

const ThemeContext = createContext({
    theme: themes.Light,
    themeName: "Light",
    setTheme: (_: string) => { },
    themes: Object.keys(themes),
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [themeName, setThemeName] = useState("Light");

    // load persisted theme
    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored && themes[stored]) {
                    setThemeName(stored);
                }
            } catch (e) {
                // ignore storage errors
            }
        })();
    }, []);

    const setTheme = useCallback(async (name: string) => {
        if (!themes[name]) return;
        try {
            await AsyncStorage.setItem(STORAGE_KEY, name);
        } catch (e) {
            // ignore write errors
        }
        setThemeName(name);
    }, []);

    return (
        <ThemeContext.Provider
            value={{
                theme: themes[themeName],
                themeName,
                setTheme,
                themes: Object.keys(themes),
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};