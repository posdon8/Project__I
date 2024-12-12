const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 4000;
const cors = require('cors');

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
    rooms[roomId] = { users: [username] };
    socket.join(roomId);
    socket.emit('room-created', roomId); // Gửi lại Room ID cho client
    console.log(`Room created: ${roomId}`);
  });

  // Khi tham gia phòng
  socket.on('join-room', ({ roomId, username }) => {
    if (rooms[roomId]) {
      rooms[roomId].users.push(username);
      socket.join(roomId);
      io.to(roomId).emit('user-joined', username); // Thông báo cho các người dùng khác
      console.log(`${username} joined room ${roomId}`);
    } else {
      socket.emit('error', 'Room not found');
    }
  });

  // Khi gửi tin nhắn
  socket.on('send-message', ({ roomId, username, message }) => {
    console.log("tin nhan dc gui");
    io.to(roomId).emit('receive-message', { username, message });
  });

  // Khi ngắt kết nối
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Khởi động server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
