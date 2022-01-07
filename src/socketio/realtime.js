import socketio from "socket.io";

let connection = null;

class Realtime {
  constructor() {
    this.io = null;
  }
  connect(server) {
    this.io = socketio(server);

    this.io.on("connection", (socket) => {
      socket.on("disconnect", function () {
        console.log(socket.id, "Socket disconnected");
      });

      console.log(`New socket connection: ${socket.id}`);
    });
  }

  static init(server) {
    if (!connection) {
      connection = new Realtime();
      connection.connect(server);
    }
  }

  static getConnection() {
    if (!connection) {
      throw new Error("no active connection");
    }
    return connection;
  }
}

export default {
  connect: Realtime.init,
  connection: Realtime.getConnection,
};
