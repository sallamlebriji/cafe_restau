let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    socket.on("join:establishment", (establishmentId) => {
      socket.join(`establishment:${establishmentId}`);
    });

    socket.on("join:super-admin", () => {
      socket.join("platform:super-admin");
    });

    socket.on("disconnect", () => {});
  });
};

export const emitToEstablishment = (establishmentId, event, payload) => {
  if (ioInstance && establishmentId) {
    ioInstance.to(`establishment:${establishmentId}`).emit(event, payload);
    ioInstance.to("platform:super-admin").emit(event, {
      ...payload,
      establishmentId
    });
  }
};
