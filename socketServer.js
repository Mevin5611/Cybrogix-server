"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketServer = void 0;
const socket_io_1 = require("socket.io");
const initSocketServer = (server) => {
    const io = new socket_io_1.Server(server);
    io.on("connection", (socket) => {
        console.log('user connected');
        // Listen notification event from frontend
        socket.on("notification", (data) => {
            //brodcast the notification data to all connected clients
            io.emit("newNotification", data);
        });
        socket.on("disconnect", () => {
            console.log("user disconnected");
        });
    });
};
exports.initSocketServer = initSocketServer;
