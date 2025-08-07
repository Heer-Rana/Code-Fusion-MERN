/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} message
 * @property {string} username
 * @property {string} timestamp
 */

/**
 * @typedef {Object} ChatContext
 * @property {ChatMessage[]} messages
 * @property {(messages: ChatMessage[] | ((messages: ChatMessage[]) => ChatMessage[])) => void} setMessages
 * @property {boolean} isNewMessage
 * @property {(isNewMessage: boolean) => void} setIsNewMessage
 * @property {number} lastScrollHeight
 * @property {(lastScrollHeight: number) => void} setLastScrollHeight
 */

// IMPORTANT: Add this line below your JSDoc definitions.
// This creates an empty JavaScript object that can be imported at runtime.
// The JSDoc @typedef for ChatMessage will still provide type hints for this object.
export const ChatMessage = {};

// If you also need ChatContext to be importable as a runtime value, add a similar line:
export const ChatContext = {}; // Or export const ChatContext = { messages: [], /* ... */ }; if it needs default values