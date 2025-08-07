/**
 * @typedef {Object} Language
 * @property {string} language
 * @property {string} version
 * @property {string[]} aliases
 */

/**
 * @typedef {Object} RunContext
 * @property {(input: string) => void} setInput
 * @property {string} output
 * @property {boolean} isRunning
 * @property {Language[]} supportedLanguages
 * @property {Language} selectedLanguage
 * @property {(language: Language) => void} setSelectedLanguage
 * @property {() => void} runCode
 */

// Add these exports for runtime visibility:
export const Language = {};
export const RunContext = {};