const authService = require('../app/services/auth.service');

const setupQRHandlers = (io, socket) => {
  socket.on('qr:register', async ({ sessionId }) => {
    if (!sessionId) {
      socket.emit('qr:error', { message: 'Session ID is required' });
      return;
    }
    try {
      const roomName = `qr_${sessionId}`;
      await socket.join(roomName);
      authService.qrSessionSockets[sessionId] = socket.id;
      console.log(`[QR Register] Client ${socket.id} registered for session: ${sessionId}`);
      const status = await authService.checkQRSessionStatus(sessionId);
      socket.emit('qr:status', status); // Only pending or expired
    } catch (error) {
      console.error('Error in QR registration:', error);
      socket.emit('qr:error', { message: error.message });
    }
  });

  socket.on('qr:unregister', ({ sessionId }) => {
    if (sessionId) {
      const roomName = `qr_${sessionId}`;
      socket.leave(roomName);
      delete authService.qrSessionSockets[sessionId];
      console.log(`Client ${socket.id} unregistered session: ${sessionId}`);
    }
  });

  socket.on('disconnect', () => {
    for (const sessionId in authService.qrSessionSockets) {
      if (authService.qrSessionSockets[sessionId] === socket.id) {
        delete authService.qrSessionSockets[sessionId];
      }
    }
  });
};

module.exports = { setupQRHandlers };