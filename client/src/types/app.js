
const ACTIVITY_STATE = {
    CODING: "coding",
    DRAWING: "drawing",
}

// Define DrawingData as a JSDoc typedef for JS compatibility
/**
 * @typedef {Object} DrawingData
 * @property {StoreSnapshot<TLRecord>} snapshot
 */

/**
 * @typedef {Object} AppContext
 * @property {User} currentUser
 * @property {(user: User) => void} setCurrentUser
 * @property {USER_STATUS} status
 * @property {(status: USER_STATUS) => void} setStatus
 * @property {ACTIVITY_STATE} activityState
 * @property {(state: ACTIVITY_STATE) => void} setActivityState
 * @property {DrawingData} drawingData
 * @property {(data: DrawingData) => void} setDrawingData
 */

export { ACTIVITY_STATE }

/**
 * These exports are only for JSDoc typedef reference.
 * They are empty objects to satisfy ES module export requirements.
 */
const AppContext = {};
const DrawingData = {};

export { AppContext, DrawingData }
