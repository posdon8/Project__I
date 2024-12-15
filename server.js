const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const cors = require('cors');

const PORT = process.env.PORT || 4000; // Sử dụng PORT từ môi trường hoặc mặc định là 4000

app.use(cors({
  origin: "https://project-i-54t6.onrender.com",  // Cho phép tất cả các nguồn
  methods: ["GET", "POST"]
}));




// Cho phép tất cả các nguồn truy cập (hoặc cấu hình cụ thể)

// Lưu trữ thông tin các phòng
const rooms = {};

// Serve frontend
app.use(express.static('public'));

// Khi có kết nối từ client
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Khi tạo phòng
  socket.on('create-room', (username) => {
    const roomId = uuidv4();
    if (rooms[roomId]) {
      socket.emit('room-creation-failed', 'Không thể tạo phòng. Vui lòng thử lại.');
      return;
    }
    rooms[roomId] = { users: [{username, socketId: socket.id}]};
    socket.join(roomId);
    socket.emit('room-created', roomId); // Gửi lại Room ID cho client
    console.log(`Room created: ${roomId}`);
  });
  socket.on('new-user-stream', (data) => {
    // Phát thông tin stream của người dùng này đến tất cả những người tham gia khác
    socket.to(data.roomId).emit('new-user-stream', {
      username: data.username,
      stream: data.stream
    });
  });
  // Khi tham gia phòng
  socket.on('join-room', ({ roomId, username }) => {
    if (rooms[roomId]) {
      if (rooms[roomId].users.length >= 6) {
        socket.emit('error', 'Phòng đã đầy!');
        return;
      }
      rooms[roomId].users.push({username, socketId: socket.id});
      socket.join(roomId);
      io.to(roomId).emit('user-joined', rooms[roomId].users); // Thông báo cho các người dùng khác
      console.log(`${username} joined room ${roomId}`);
    } else {
      socket.emit('error', 'Room not found');
      console.log(`Invalid Room ID: ${roomId} attempted by ${username}`);
    }
  });

  // Khi gửi tin nhắn
  socket.on('send-message', ({ roomId, username, message }) => {
    console.log(`Message from ${username} in room ${roomId}: ${message}`);
    
    io.to(roomId).emit('receive-message', { username, message });
  });

  // Khi ngắt kết nối
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    for (let roomId in rooms) {
      rooms[roomId].users = rooms[roomId].users.filter(user => user.socketId !== socket.id);
      io.to(roomId).emit('user-joined', rooms[roomId].users); // Cập nhật danh sách người dùng
    }
  });
});

// Khởi động server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
