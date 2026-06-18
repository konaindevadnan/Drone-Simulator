// server.js
const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// roomCode -> { viewerId, controllerId, fpv }
const rooms = new Map();

const normRoom = (code) => String(code || "MIMAR").toUpperCase();

io.on("connection", (socket) => {
  console.log("✅ client connected:", socket.id);

  // VIEWER creates room
  socket.on("create_room", (roomCode, cb) => {
    const code = normRoom(roomCode);

    rooms.set(code, {
      viewerId: socket.id,
      controllerId: null,
      fpv: false,
    });

    socket.join(code);
    console.log("✅ room created:", code);

    cb?.({ ok: true });
  });

  // CONTROLLER joins room
  socket.on("join_room", (roomCode, cb) => {
    const code = normRoom(roomCode);
    const room = rooms.get(code);

    if (!room) {
      console.log("❌ join_room failed (room not found):", code);
      return cb?.({ ok: false, error: "Room not found" });
    }

    room.controllerId = socket.id;
    rooms.set(code, room);

    socket.join(code);
    console.log("✅ controller joined:", code);

    // notify viewer
    if (room.viewerId) {
      io.to(room.viewerId).emit("controller_joined", { roomCode: code });
    }

    // sync camera state to controller (so label matches)
    socket.emit("camera_mode", { fpv: !!room.fpv });

    cb?.({ ok: true });
  });

  // CONTROLLER -> VIEWER (movement)
  socket.on("control_input", ({ roomCode, input }) => {
    const code = normRoom(roomCode);
    const room = rooms.get(code);
    if (!room) return;

    // ✅ SECURITY/STABILITY: only current controller can send controls
    if (room.controllerId !== socket.id) return;

    if (room.viewerId) io.to(room.viewerId).emit("control_input", { input });
  });

  // CONTROLLER -> VIEWER (zoom + fpv tilt)
  socket.on("camera_control", ({ roomCode, zoom, fpvTilt }) => {
    const code = normRoom(roomCode);
    const room = rooms.get(code);
    if (!room) return;

    // ✅ only current controller can send camera controls
    if (room.controllerId !== socket.id) return;

    if (room.viewerId) io.to(room.viewerId).emit("camera_control", { zoom, fpvTilt });
  });

  // VIEWER -> CONTROLLER (battery + signal)
  socket.on("telemetry", ({ roomCode, battery, signal }) => {
    const code = normRoom(roomCode);
    const room = rooms.get(code);
    if (!room) return;

    // ✅ only viewer can send telemetry
    if (room.viewerId !== socket.id) return;

    if (room.controllerId) io.to(room.controllerId).emit("telemetry", { battery, signal });
  });

  // CONTROLLER -> ROOM (toggle FPV/TPV)
  socket.on("toggle_camera", ({ roomCode }) => {
    const code = normRoom(roomCode);
    const room = rooms.get(code);
    if (!room) return;

    // ✅ only controller can toggle
    if (room.controllerId !== socket.id) return;

    room.fpv = !room.fpv;
    rooms.set(code, room);

    io.to(code).emit("camera_mode", { fpv: !!room.fpv });
  });

  socket.on("disconnect", () => {
    console.log("⚠️ client disconnected:", socket.id);

    for (const [code, room] of rooms.entries()) {
      // viewer left -> close room
      if (room.viewerId === socket.id) {
        rooms.delete(code);
        console.log("⚠️ room closed (viewer left):", code);
        continue;
      }

      // controller left -> notify viewer + clear controllerId
      if (room.controllerId === socket.id) {
        room.controllerId = null;
        rooms.set(code, room);

        console.log("⚠️ controller left room:", code);

        if (room.viewerId) {
          io.to(room.viewerId).emit("controller_left", { roomCode: code });
        }
      }
    }
  });
});

/// httpServer.listen(3001, "0.0.0.0", () => {
//   console.log("✅ Socket server running on http://0.0.0.0:3001");
// });
///-----------old code------------------
const os = require("os");

const getLocalIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal/loopback addresses
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
};

httpServer.listen(3001, "0.0.0.0", () => {
  const localIP = getLocalIP();
  console.log("=================================================");
  console.log(`✅ Socket server running globally on port 3001`);
  console.log(`📡 Local Network IP: http://${localIP}:3001`);
  console.log("=================================================");
});

