// D:\Code-Fusion\server\src\types\socket.js
const SocketEvent = {
    JOIN_REQUEST: "join-request",
    USERNAME_EXISTS: "username-exists",
    USER_JOINED: "user-joined",
    JOIN_ACCEPTED: "join-accepted",
    USER_DISCONNECTED: "user-disconnected",
    SYNC_FILE_STRUCTURE: "sync-file-structure",
    DIRECTORY_CREATED: "directory-created",
    DIRECTORY_UPDATED: "directory-updated",
    DIRECTORY_RENAMED: "directory-renamed",
    DIRECTORY_DELETED: "directory-deleted",
    FILE_CREATED: "file-created",
    FILE_UPDATED: "file-updated",
    FILE_RENAMED: "file-renamed",
    FILE_DELETED: "file-deleted",
    USER_OFFLINE: "user-offline",
    USER_ONLINE: "user-online",
    SEND_MESSAGE: "send-message",
    RECEIVE_MESSAGE: "receive-message",
    TYPING_START: "typing-start",
    TYPING_PAUSE: "typing-pause",
    REQUEST_DRAWING: "request-drawing",
    SYNC_DRAWING: "sync-drawing",
    DRAWING_UPDATE: "drawing-update",
    // Add other socket events you define
};

module.exports = {
    SocketEvent,
    // You could also export other functions/variables here if needed
};