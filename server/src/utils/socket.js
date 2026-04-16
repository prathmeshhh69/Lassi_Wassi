/**
 * socket.js
 * Singleton wrapper around the Socket.IO server instance.
 * Call setIO(io) once at startup, then use getIO() anywhere to emit events.
 */

let _io = null;

export const setIO = (ioInstance) => {
  _io = ioInstance;
};

export const getIO = () => {
  if (!_io) throw new Error("Socket.IO not initialised — call setIO() first.");
  return _io;
};
