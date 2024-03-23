import { Server as SocketIOServer } from "socket.io";
import http from 'http'

export const initSocketServer = (server:http.Server)=>{
    const io = new SocketIOServer(server)

    io.on("connection" ,(socket)=>{
        console.log('user connected');
        
// Listen notification event from frontend
        socket.on("notification" , (data)=>{
            //brodcast the notification data to all connected clients
            io.emit("newNotification",data)

        })

        socket.on("disconnect",()=>{
            console.log("user disconnected");
            
        })
    })
}