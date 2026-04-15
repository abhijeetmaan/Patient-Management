const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
});

const getDoctorRoom = (doctorId) => `doctor:${String(doctorId || "")}`;
const doctorSocketIds = new Map();

app.set("io", io);
app.set("doctorSocketIds", doctorSocketIds);

const trackDoctorSocket = (doctorId, socketId) => {
  if (!doctorId || !socketId) {
    return;
  }

  const normalizedDoctorId = String(doctorId).trim();
  if (!normalizedDoctorId) {
    return;
  }

  const socketIds = doctorSocketIds.get(normalizedDoctorId) || new Set();
  socketIds.add(socketId);
  doctorSocketIds.set(normalizedDoctorId, socketIds);
};

const untrackDoctorSocket = (doctorId, socketId) => {
  if (!doctorId || !socketId) {
    return;
  }

  const normalizedDoctorId = String(doctorId).trim();
  const socketIds = doctorSocketIds.get(normalizedDoctorId);
  if (!socketIds) {
    return;
  }

  socketIds.delete(socketId);

  if (socketIds.size === 0) {
    doctorSocketIds.delete(normalizedDoctorId);
  }
};

io.on("connection", (socket) => {
  const doctorId = String(socket.handshake.auth?.doctorId || "").trim();
  const role = String(socket.handshake.auth?.role || "").toLowerCase();
  socket.data.doctorId = doctorId;

  if (doctorId) {
    socket.join(getDoctorRoom(doctorId));
    trackDoctorSocket(doctorId, socket.id);
  }

  if (role === "admin") {
    socket.join("admins");
  }

  console.log(`Socket connected: ${socket.id}`);

  socket.on("disconnect", (reason) => {
    untrackDoctorSocket(socket.data.doctorId, socket.id);
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    "Tip: On macOS, port 5000 may be used by Control Center (AirPlay/AirTunes).",
  );
});
