const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 5000
const io = new Server(server, {
    cors: {
        origin: `http://localhost:3000`,
        methods: [ "GET", "POST" ]
    }
})
/* Legacy
const io = require("socket.io")(server, {
    cors: {
        origin: `http://localhost:${PORT}`,
        methods: [ "GET", "POST" ]
    }
})*/

io.on("connection", (socket) => {
    socket.emit("me", socket.id)

    socket.on("disconnect", () => {
        socket.broadcast.emit("callEnded")
    })

    socket.on("inviteUser", (data) => {
        io.to(data.userToCall).emit("inviteUser", {signal: data.signalData, from: data.from, name: data.name})
    })

    socket.on("answerInvite", (data) => {
        io.to(data.to).emit("inviteAccepted", data.signal)
    })
})

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})