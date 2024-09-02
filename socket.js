const { Server } = require("socket.io");

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "http://localhost:3000",
      },
      connectionStateRecovery: {},
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not intialized!");
    }
    return io;
  },
};
