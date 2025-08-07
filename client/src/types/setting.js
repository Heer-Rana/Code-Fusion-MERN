/**
 * @typedef {Object} Settings
 * @property {string} theme
 * @property {string} language
 * @property {number} fontSize
 * @property {string} fontFamily
 * @property {boolean} showGitHubCorner
 */

/**
 * @typedef {Object} SettingsContext
 * @property {string} theme
 * @property {string} language
 * @property {number} fontSize
 * @property {string} fontFamily
 * @property {boolean} showGitHubCorner
 * @property {(theme: string) => void} setTheme
 * @property {(language: string) => void} setLanguage
 * @property {(fontSize: number) => void} setFontSize
 * @property {(fontFamily: string) => void} setFontFamily
 * @property {(showGitHubCorner: boolean) => void} setShowGitHubCorner
 * @property {() => void} resetSettings
 */

// Add these exports for runtime visibility:
export const Settings = {};
export const SettingsContext = {};