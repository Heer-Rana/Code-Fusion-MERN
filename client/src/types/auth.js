/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} email
 * @property {Date} lastActive
 * @property {Date} [createdAt]
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user
 * @property {boolean} loading
 * @property {string|null} error
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} RegisterCredentials
 * @property {string} username
 * @property {string} email
 * @property {string} password
 */

// Add these exports for runtime visibility:
export const User = {};
export const AuthState = {};
export const LoginCredentials = {};
export const RegisterCredentials = {};