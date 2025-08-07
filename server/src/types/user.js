const USER_CONNECTION_STATUS = {
  OFFLINE: "offline",
  ONLINE: "online",
};

/**
 * @typedef {Object} User
 * @property {string} username
 * @property {string} roomId
 * @property {string} status
 * @property {number} cursorPosition
 * @property {boolean} typing
 * @property {string|null} currentFile
 * @property {string} socketId
 */

module.exports = { USER_CONNECTION_STATUS };
