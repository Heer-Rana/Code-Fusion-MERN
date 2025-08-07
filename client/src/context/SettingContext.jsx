import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { langs } from "@uiw/codemirror-extensions-langs";

const defaultSettings = {
  theme: "Abcdef",
  font: "Fira Code",
  fontSize: 16,
  copilotEnabled: true,
  language: "javascript",
};

const SettingContext = createContext();

export function SettingContextProvider({ children }) {
  const [theme, setTheme] = useState(defaultSettings.theme);
  const [font, setFont] = useState(defaultSettings.font);
  const [fontSize, setFontSize] = useState(defaultSettings.fontSize);
  const [copilotEnabled, setCopilotEnabled] = useState(defaultSettings.copilotEnabled);
  const [language, setLanguage] = useState(defaultSettings.language);

  // Load saved settings once on mount
  useEffect(() => {
    try {
      const storedSettingsRaw = localStorage.getItem("settings");
      if (storedSettingsRaw) {
        const storedSettings = JSON.parse(storedSettingsRaw);

        if (storedSettings.theme && typeof storedSettings.theme === "string") setTheme(storedSettings.theme);
        if (storedSettings.font && typeof storedSettings.font === "string") setFont(storedSettings.font);
        if (storedSettings.fontSize && Number.isInteger(storedSettings.fontSize)) setFontSize(storedSettings.fontSize);
        if (typeof storedSettings.copilotEnabled === "boolean") setCopilotEnabled(storedSettings.copilotEnabled);
        if (storedSettings.language && typeof storedSettings.language === "string") setLanguage(storedSettings.language);
      }
    } catch (error) {
      console.error("Failed to parse stored settings:", error);
      // Optionally, clear corrupted localStorage data:
      // localStorage.removeItem("settings");
    }
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    const settingsToStore = { theme, font, fontSize, copilotEnabled, language };
    localStorage.setItem("settings", JSON.stringify(settingsToStore));
  }, [theme, font, fontSize, copilotEnabled, language]);

  // Reset all settings to default values and clear storage
  const resetSettings = useCallback(() => {
    setTheme(defaultSettings.theme);
    setFont(defaultSettings.font);
    setFontSize(defaultSettings.fontSize);
    setCopilotEnabled(defaultSettings.copilotEnabled);
    setLanguage(defaultSettings.language);
    localStorage.removeItem("settings");
  }, []);

  // Memoize context value for performance
  const contextValue = useMemo(() => ({
    theme,
    setTheme,
    font,
    setFont,
    fontSize,
    setFontSize,
    copilotEnabled,
    setCopilotEnabled,
    language,
    setLanguage,
    availableLanguages: Object.keys(langs),
    resetSettings,
  }), [
    theme,
    font,
    fontSize,
    copilotEnabled,
    language,
    resetSettings,
  ]);

  return (
    <SettingContext.Provider value={contextValue}>
      {children}
    </SettingContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingContext);
}
