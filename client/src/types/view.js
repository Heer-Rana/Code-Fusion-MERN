/**
 * @readonly
 * @enum {string}
 */
const VIEWS = {
  FILES: "FILES",
  CHATS: "CHATS",
  CLIENTS: "CLIENTS",
  RUN: "RUN",
  COPILOT: "COPILOT",
  SETTINGS: "SETTINGS",
};

/**
 * @typedef {Object} ViewContext
 * @property {VIEWS} activeView
 * @property {(activeView: VIEWS) => void} setActiveView
 * @property {boolean} isSidebarOpen
 * @property {(isSidebarOpen: boolean) => void} setIsSidebarOpen
 * @property {Object.<VIEWS, JSX.Element>} viewComponents
 * @property {Object.<VIEWS, JSX.Element>} viewIcons
 */

export { VIEWS };
