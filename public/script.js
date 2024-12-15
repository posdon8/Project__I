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
      document.getElementById('room-id-display').textContent = roomId;
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
    socket.on('user-joined', (users) => {
      document.getElementById('room-id-display').textContent = roomId; // Hiển thị Room ID
      document.getElementById('home').style.display = 'none';
      document.getElementById('meeting-room').style.display = 'block';
      startStream();
    });
    
    // Xử lý khi lỗi xảy ra
    socket.on('error', (errorMessage) => {
      alert(errorMessage); // Hiển thị thông báo lỗi
    });
  } else {
    alert('Vui lòng nhập Room ID và tên người dùng!');
  }
}
function updateUsers(users) {
  const userContainer = document.getElementById('user-container');
  userContainer.innerHTML = '';
  users.forEach((user) => {
    const userDiv = document.createElement('div');
    userDiv.className = 'user';
    userDiv.id = `user-${user.socketId}`;
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = user.socketId === socket.id;
    video.id = `video-${user.socketId}`;
    userDiv.appendChild(video);
    const usernameDiv = document.createElement('div');
    usernameDiv.textContent = user.username;
    usernameDiv.className = 'username';
    userDiv.appendChild(usernameDiv);
    userContainer.appendChild(userDiv);
  });
}


// Bắt đầu camera
async function startStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const video = document.getElementById('local-video');
    video.srcObject = localStream;
    
    // Gửi stream của mình tới server và các người tham gia khác
    socket.emit('new-user-stream', { roomId, username, stream: localStream });
  } catch (error) {
    console.error("Error accessing media devices.", error);
  }
}

// Khi nhận stream của các người tham gia khác
socket.on('new-user-stream', (data) => {
  const userVideo = document.createElement('video');
  userVideo.autoplay = true;
  userVideo.srcObject = data.stream;
  document.getElementById('user-container').appendChild(userVideo);
});

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
socket.on('user-joined', (users) => {
  const chatMessages = document.getElementById('chat-messages');
  const latestUser = users[users.length - 1];
  const newMessage = document.createElement('div');
  newMessage.textContent = `${latestUser.username} joined the room.`;
  chatMessages.appendChild(newMessage);

  // Cập nhật danh sách người dùng
  updateUsers(users);
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
  console.log("message out:", message) ;
}

// Nhận tin nhắn
socket.on('receive-message', ({ username, message }) => {
  const chatMessages = document.getElementById('chat-messages');
  const newMessage = document.createElement('div');
  newMessage.textContent = `${username}: ${message}`;
  chatMessages.appendChild(newMessage);
  console.log("Received message:", username, message);

  chatMessages.scrollTop = chatMessages.scrollHeight; // Cuộn xuống cuối cùng
});




