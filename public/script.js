let username = '';
let roomId = '';
let localStream;

const socket = io('https://project-i-54t6.onrender.com');
socket.on('connect', () => {
  console.log('Connected to server');
});

function updateDateTime() {
  const now = new Date(); // Lấy thời gian hiện tại
  const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
  };
  const formattedDateTime = now.toLocaleString('en-US', options);
  document.getElementById('datetime').textContent = formattedDateTime;}
setInterval(updateDateTime, 1000);
updateDateTime();

// Đăng nhập
function login() {
  username = document.getElementById('username').value;
  if (username) {
    document.getElementById('login').style.display = 'none';
    document.getElementById('create-meeting').style.display = 'block';
  } else {
    alert('Vui lòng nhập tên người dùng!');
  }
}

// Tạo phòng
function createMeeting() {
  console.log("Creating new meeting...");
  if (username) {
    socket.emit('create-room', username); // Gửi tên người dùng để tạo phòng
    socket.on('room-created', (roomId) => {
      alert(`Room ID: ${roomId}`);
      joinMeeting(roomId); // Tự động tham gia phòng
    }); // Gửi tên người dùng để tạo phòng
  } else {
    alert('Vui lòng đăng nhập trước khi tạo phòng!');
  }
}




// Tham gia phòng
function joinMeeting(roomId) {
  username = document.getElementById('username').value || username;
  roomId = roomId || document.getElementById('room-id').value;

  if (username && roomId) {
    socket.emit('join-room', { roomId, username });
    document.getElementById('home').style.display = 'none';
    document.getElementById('meeting-room').style.display = 'block';
    startStream();
  }
}

// Bắt đầu camera
async function startStream() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  const video = document.getElementById('local-video');
  video.srcObject = localStream;
}

// Bật/tắt camera
function toggleCamera() {
  const videoTrack = localStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
}

// Bật/tắt mic
function toggleMic() {
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
}
// Khi người dùng tham gia phòng
socket.on('user-joined', (username) => {
  const chatMessages = document.getElementById('chat-messages');
  const newMessage = document.createElement('div');
  newMessage.textContent = `${username} joined the room.`;
  chatMessages.appendChild(newMessage);
});
// Gửi tin nhắn
function sendMessage() {
  const message = document.getElementById('message').value;
  if (!message) {
    alert('Message cannot be empty!');
    return;
  }
  socket.emit('send-message', { roomId, username, message }); // Gửi tin nhắn đến server
  document.getElementById('message').value = '';
  console.log("message out:", message);
}

// Nhận tin nhắn
socket.on('receive-message', ({ username, message }) => {
  const chatMessages = document.getElementById('chat-messages');
  const newMessage = document.createElement('div');
  newMessage.textContent = `${username}: ${message}`;
  chatMessages.appendChild(newMessage);
});


