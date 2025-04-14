// Handle video/audio call functionality through socket.io
const { v4: uuidv4 } = require("uuid");

/**
 * Set up all call-related event handlers
 * @param {Object} io - Socket.io server instance
 * @param {Object} socket - Socket instance for the current connection
 * @param {Object} user - The authenticated user
 */
const setupCallHandlers = (io, socket, user) => {
  console.log(
    `Setting up call handlers for user ${user.id}, socket ${socket.id}`
  );

  // Handle call initiation
  socket.on("call:initiate", async (data, callback) => {
    const {
      calleeId,
      callerId,
      callerName,
      type,
      channelName: clientChannelName,
      token,
    } = data;

    console.log(`Call initiated: ${callerId} -> ${calleeId}`, data);

    if (!calleeId || !callerId) {
      console.error("Missing calleeId or callerId in call:initiate");
      // Report error back to caller if callback provided
      if (typeof callback === "function") {
        callback({
          success: false,
          error: "Missing required parameters",
        });
      }
      return;
    }

    // Verify the caller ID matches the socket user
    if (callerId !== user.id) {
      console.error(
        `User ID mismatch: socket user ${user.id} tried to initiate call as ${callerId}`
      );
      if (typeof callback === "function") {
        callback({
          success: false,
          error: "User ID mismatch",
        });
      }
      return;
    }

    // Generate a unique channel name for this call or use the one from client
    const channelName = clientChannelName || `call_${uuidv4()}`;

    // Include the channel name with the call data
    const callData = {
      ...data,
      channelName,
      token, // Use the token provided by client
      timestamp: new Date().toISOString(),
    };

    // Log all active rooms for the callee
    const calleeRooms = io.sockets.adapter.rooms.get(`user_${calleeId}`);
    console.log(
      `Rooms for callee ${calleeId}:`,
      calleeRooms ? { size: calleeRooms.size, exists: true } : { exists: false }
    );

    // Emit to the callee
    socket.to(`user_${calleeId}`).emit("call:incoming", callData);

    console.log(
      `Call initiated from ${callerId} to ${calleeId} on channel ${channelName}`
    );

    // Notify caller that the call request was processed
    if (typeof callback === "function") {
      callback({
        success: true,
        message: "Call request sent successfully",
        channelName,
      });
    }
  });

  // Handle call acceptance
  socket.on("call:accept", async (data) => {
    const { callerId, calleeId, channelName, token } = data;

    console.log(`Call accepted: ${callerId} <- ${calleeId}`, data);

    if (!callerId || !calleeId) {
      console.error("Missing required data in call:accept", {
        missingCallerId: !callerId,
        missingCalleeId: !calleeId,
        missingChannelName: !channelName,
      });
      return;
    }

    // Ensure we have a valid channel name
    const finalChannelName = channelName || `call-${Date.now()}`;

    // Get caller name from authenticated user if available
    const calleeName = user?.fullName || user?.name || "User";

    // Use client's token if provided and add additional information
    const responseData = {
      ...data,
      callerId,
      calleeId,
      calleeName,
      channelName: finalChannelName, // Use consistent channel name
      token, // Pass the token provided by the client
      status: "accepted",
      type: data.type || "video", // Ensure type is included
      timestamp: new Date().toISOString(),
    };

    console.log(`Emitting call:accepted event to user ${callerId} with data:`, {
      callerId: responseData.callerId,
      calleeId: responseData.calleeId,
      calleeName: responseData.calleeName,
      channelName: responseData.channelName,
      hasToken: !!responseData.token,
      type: responseData.type,
    });

    // Emit to the caller
    socket.to(`user_${callerId}`).emit("call:accepted", responseData);

    console.log(
      `Call accepted: ${callerId} and ${calleeId} in channel ${finalChannelName}`
    );
  });

  // Handle call rejection
  socket.on("call:reject", (data) => {
    const { callerId, calleeId, reason } = data;

    console.log(`Call rejected: ${callerId} <- ${calleeId}`, data);

    if (!callerId) {
      console.error("Missing callerId in call:reject");
      return;
    }

    // Emit to the caller
    socket.to(`user_${callerId}`).emit("call:rejected", {
      callerId,
      calleeId,
      reason: reason || "unavailable",
      timestamp: new Date().toISOString(),
    });

    console.log(`Call rejected from ${calleeId} to ${callerId}`);
  });

  // Handle call end
  socket.on("call:end", (data) => {
    const { callerId, calleeId, channelName } = data;

    console.log(`Call ended: ${callerId} <-> ${calleeId}`, data);

    if (!callerId || !calleeId) {
      console.error("Missing required data in call:end");
      return;
    }

    // Emit to both participants
    socket.to(`user_${callerId}`).emit("call:ended", {
      callerId,
      calleeId,
      channelName,
      timestamp: new Date().toISOString(),
    });

    socket.to(`user_${calleeId}`).emit("call:ended", {
      callerId,
      calleeId,
      channelName,
      timestamp: new Date().toISOString(),
    });

    console.log(`Call ended between ${callerId} and ${calleeId}`);
  });

  // Check if a user is connected
  socket.on("check:user:connected", (data, callback) => {
    const { userId } = data;
    console.log(`Checking if user ${userId} is connected`);

    if (!userId) {
      if (typeof callback === "function") {
        callback({ success: false, error: "Missing userId" });
      }
      return;
    }

    // Check if the user has a socket room
    const userRoom = io.sockets.adapter.rooms.get(`user_${userId}`);
    const isConnected = Boolean(userRoom && userRoom.size > 0);

    console.log(`User ${userId} connection status:`, {
      roomExists: Boolean(userRoom),
      roomSize: userRoom?.size || 0,
      isConnected,
    });

    if (typeof callback === "function") {
      callback({
        success: true,
        isConnected,
        roomSize: userRoom?.size || 0,
      });
    }
  });
};

module.exports = { setupCallHandlers };
