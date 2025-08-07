"use strict";
const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const { SocketEvent } = require('./types/socket.js');
const { USER_CONNECTION_STATUS } = require('./types/user.js');
const { Server } = require("socket.io");
const path = require("path");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();

// 1. CONNECT TO MONGODB
const connectDB = async () => {
    try {
        console.log("🔄 Attempting to connect to MongoDB...");
        const mongoUris = [
            process.env.MONGO_URI || "mongodb://127.0.0.1:27017/codefusion",
            "mongodb://localhost:27017/codefusion",
        ];
        let connected = false;
        for (const uri of mongoUris) {
            try {
                const conn = await mongoose.connect(uri, {
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                    family: 4,
                });
                console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
                console.log(`📁 Database: ${conn.connection.name}`);
                connected = true;
                break;
            } catch (err) {
                console.log(`❌ Failed to connect to ${uri}`);
            }
        }
        if (!connected) throw new Error("Failed all MongoDB URIs");
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        if (process.env.NODE_ENV === "production") process.exit(1);
        else console.warn("⚠️ Server running without DB for debugging");
    }
};
connectDB();

// 2. MIDDLEWARE
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
    cors({
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// 3. SESSION STORE
let sessionStore;
try {
    sessionStore = MongoStore.create({
        mongoUrl: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/codefusion",
        collectionName: "sessions",
        ttl: 24 * 60 * 60,
    });
} catch (err) {
    console.warn("⚠️ Session store fallback to in-memory (likely due to MongoStore creation failure)", err.message);
    sessionStore = undefined;
}

app.use(
    session({
        secret: process.env.SESSION_SECRET || "change-this-secret",
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        },
    })
);

// 4. ROUTES & STATIC
app.use("/api/auth", authRoutes);

// ✅ 4.5: ADD /api/test ROUTE HERE
app.get("/api/test", (req, res) => {
    res.json({ message: "✅ Backend API is working!" });
});

// MongoDB health check
app.get("/api/mongo-status", (req, res) => {
    const status = mongoose.connection.readyState;
    let msg = "unknown";

    switch (status) {
        case 0: msg = "disconnected"; break;
        case 1: msg = "connected"; break;
        case 2: msg = "connecting"; break;
        case 3: msg = "disconnecting"; break;
    }

    res.json({
        status: msg,
        db: mongoose.connection.name,
        host: mongoose.connection.host,
    });
});

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// 5. SOCKET.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
    },
    maxHttpBufferSize: 1e8,
    pingTimeout: 60000,
});

let userSocketMap = [];

function getUsersInRoom(roomId) {
    return userSocketMap.filter((user) => user.roomId === roomId);
}
function getRoomId(socketId) {
    return userSocketMap.find((user) => user.socketId === socketId)?.roomId || null;
}
function getUserBySocketId(socketId) {
    return userSocketMap.find((user) => user.socketId === socketId) || null;
}

io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    socket.on(SocketEvent.JOIN_REQUEST, ({ roomId, username }) => {
        if (getUsersInRoom(roomId).some((u) => u.username === username)) {
            return io.to(socket.id).emit(SocketEvent.USERNAME_EXISTS);
        }

        const user = {
            username,
            roomId,
            socketId: socket.id,
            status: USER_CONNECTION_STATUS.ONLINE,
            cursorPosition: 0,
            typing: false,
            currentFile: null,
        };

        userSocketMap.push(user);
        socket.join(roomId);

        socket.broadcast.to(roomId).emit(SocketEvent.USER_JOINED, { user });
        io.to(socket.id).emit(SocketEvent.JOIN_ACCEPTED, { user, users: getUsersInRoom(roomId) });
    });

    socket.on("disconnecting", () => {
        const user = getUserBySocketId(socket.id);
        if (!user) return;
        const roomId = user.roomId;
        socket.broadcast.to(roomId).emit(SocketEvent.USER_DISCONNECTED, { user });
        userSocketMap = userSocketMap.filter((u) => u.socketId !== socket.id);
        socket.leave(roomId);
    });

    socket.on(SocketEvent.SYNC_FILE_STRUCTURE, ({ fileStructure, openFiles, activeFile, socketId }) =>
        io.to(socketId).emit(SocketEvent.SYNC_FILE_STRUCTURE, { fileStructure, openFiles, activeFile }),
    );
    socket.on(SocketEvent.DIRECTORY_CREATED, (data) => {
        const roomId = getRoomId(socket.id);
        if (roomId) {
            io.to(roomId).emit(SocketEvent.DIRECTORY_CREATED, data);
        }
    });
    socket.on(SocketEvent.DIRECTORY_UPDATED, (data) => {
        const roomId = getRoomId(socket.id);
        if (roomId) {
            socket.to(roomId).emit(SocketEvent.DIRECTORY_UPDATED, data);
        }
    });
    socket.on(SocketEvent.DIRECTORY_RENAMED, (data) => {
        const roomId = getRoomId(socket.id);
        if (roomId) {
            socket.to(roomId).emit(SocketEvent.DIRECTORY_RENAMED, data);
        }
    });
    socket.on(SocketEvent.DIRECTORY_DELETED, (data) => {
        const roomId = getRoomId(socket.id);
        if (roomId) {
            socket.to(roomId).emit(SocketEvent.DIRECTORY_DELETED, data);
        }
    });
    socket.on(SocketEvent.FILE_CREATED, (data) => {
        const roomId = getRoomId(socket.id);
        if (roomId) {
            socket.to(roomId).emit(SocketEvent.FILE_CREATED, data);
        }
    });
    socket.on(SocketEvent.FILE_UPDATED, (data) => {
        const roomId = getRoomId(socket.id);
        if (roomId) {
            socket.to(roomId).emit(SocketEvent.FILE_UPDATED, data);
        }
    });
    socket.on(SocketEvent.FILE_RENAMED, (data) => {
        const roomId = getRoomId(socket.id);
        if (roomId) {
            socket.to(roomId).emit(SocketEvent.FILE_RENAMED, data);
        }
    });
    socket.on(SocketEvent.FILE_DELETED, (data) => {
        const roomId = getRoomId(socket.id);
        if (roomId) {
            socket.to(roomId).emit(SocketEvent.FILE_DELETED, data);
        }
    });

    socket.on(SocketEvent.USER_OFFLINE, ({ socketId }) => {
        userSocketMap = userSocketMap.map((user) =>
            user.socketId === socketId ? { ...user, status: USER_CONNECTION_STATUS.OFFLINE } : user,
        );
        const user = getUserBySocketId(socketId);
        if (user && user.roomId) {
            io.to(user.roomId).emit(SocketEvent.USER_OFFLINE, { socketId });
        }
    });

    socket.on(SocketEvent.USER_ONLINE, ({ socketId }) => {
        userSocketMap = userSocketMap.map((user) =>
            user.socketId === socketId ? { ...user, status: USER_CONNECTION_STATUS.ONLINE } : user,
        );
        const user = getUserBySocketId(socketId);
        if (user && user.roomId) {
            io.to(user.roomId).emit(SocketEvent.USER_ONLINE, { socketId });
        }
    });

    socket.on(SocketEvent.SEND_MESSAGE, ({ message }) =>
        io.to(getRoomId(socket.id)).emit(SocketEvent.RECEIVE_MESSAGE, { message }),
    );

    socket.on(SocketEvent.TYPING_START, ({ cursorPosition }) => {
        userSocketMap = userSocketMap.map((user) =>
            user.socketId === socket.id ? { ...user, typing: true, cursorPosition } : user,
        );
        const user = getUserBySocketId(socket.id);
        if (user) io.to(user.roomId).emit(SocketEvent.TYPING_START, { user });
    });

    socket.on(SocketEvent.TYPING_PAUSE, () => {
        userSocketMap = userSocketMap.map((user) =>
            user.socketId === socket.id ? { ...user, typing: false } : user,
        );
        const user = getUserBySocketId(socket.id);
        if (user) io.to(user.roomId).emit(SocketEvent.TYPING_PAUSE, { user });
    });

    socket.on(SocketEvent.REQUEST_DRAWING, () => {
        const roomId = getRoomId(socket.id);
        if (roomId) io.to(roomId).emit(SocketEvent.REQUEST_DRAWING, { socketId: socket.id });
    });

    socket.on(SocketEvent.SYNC_DRAWING, ({ drawingData, socketId }) => {
        socket.broadcast.to(socketId).emit(SocketEvent.SYNC_DRAWING, { drawingData });
    });

    socket.on(SocketEvent.DRAWING_UPDATE, ({ snapshot }) =>
        io.to(getRoomId(socket.id)).emit(SocketEvent.DRAWING_UPDATE, { snapshot }),
    );

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});

// 6. START SERVER
const PORT = process.env.PORT || 4002;
server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`🔗 Test: http://localhost:${PORT}/api/test`);
    console.log(`📊 MongoDB status: http://localhost:${PORT}/api/mongo-status`);
});
