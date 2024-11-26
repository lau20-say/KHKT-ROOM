const serverURI = "https://khkt-room.onrender.com";
const TOKEN = localStorage.getItem("token");
let myAva, myName;
(async () => {

	const responsea = await axios.post(
		`${serverURI}/api/room/check-room-exit`,
		{
			id: ROOM_ID
		}
	);
	console.log(responsea);
	if (responsea.status !== 200) {
		window.location.href = `/room-not-found`;
		return;
	}

	if (!TOKEN) {
		// Chuyển hướng nếu không tìm thấy token
		window.location.href = `/session-expired`;
		return;
	}

	try {
		// Gửi yêu cầu xác thực token
		const response = await axios.post(
			`${serverURI}/api/user/get-user`,
			{}, // Payload nếu cần
			{
				headers: {
					Authorization: `Bearer ${TOKEN}`,
					"Content-Type": "application/json",
				},
			}
		);
console.log(response);
		const decodedToken = response.data; // Giả sử server trả về thông tin người dùng
		myAva = decodedToken.message.avatar;
		myName = decodedToken.message.fullName;

		const currentTime = Math.floor(Date.now() / 1000);

		if (decodedToken.exp && decodedToken.exp < currentTime) {
			// Token hết hạn
			window.location.href = `/session-expired`;
			return;
		}


	} catch (error) {
		console.error("Token validation failed:", error.message || error);
		window.location.href = `/session-expired`;
	}
})();
const socket = io('/');
let myId;
const videoGrid = document.getElementById('videoGrid');
var peer = new Peer();
const myPeer = new Peer(undefined, {
	path: '/peerjs',
	host: '/',
	port: '5001',
});

let peers = {};
let myVideoStream;
function updateVideoGridClass() {
	const videoGrid = document.getElementById("videoGrid");
	const videoElements = videoGrid.children.length;

	videoGrid.className = "";

	if (videoElements === 1) {
		videoGrid.classList.add("one-set");
	} else if (videoElements === 2) {
		videoGrid.classList.add("two-set");
	} else if (videoElements === 3 || videoElements === 4) {
		videoGrid.classList.add("three-set");
	} else if (videoElements === 5 || videoElements === 6) {
		videoGrid.classList.add("four-set");
	} else if (videoElements === 7 || videoElements === 8) {
		videoGrid.classList.add("five-set");
	}
	else if (videoElements === 9 || videoElements === 10) {
		videoGrid.classList.add("six-set");
	} else if (videoElements === 11 || videoElements === 12) {
		videoGrid.classList.add("seven-set");
	} else if (videoElements === 13 || videoElements === 14) {
		videoGrid.classList.add("eight-set");
	}
}
peer.on('open', (id) => {
	myId = id;
	socket.emit('join-room', ROOM_ID, myId, myAva);
	AddUser(myId, myAva);

	socket.on("all-users", (allUser) => {
		allUser.forEach(user => {
			AddUser(user.userId, user.userAvatar);
		});
	});

	socket.on('user-connected', (toId, toAva) => {
		AddUser(toId, toAva);
		if (myVideoStream) {
			const call = peer.call(toId, myVideoStream, {
				metadata: {
					userID: myId
				}
			});
		}
	});

	socket.on("user-disconnected", (userId) => {
		RemoveUser(userId);
	});

	peer.on('call', function (call) {
		const UserID = call.metadata.userID;
		call.answer();
		call.on('stream', (stream) => {
			OnCamUser(UserID, stream);
		});
	});

	socket.on("disconnect", () => {
		socket.emit("disconnect");
	});

	let text = $('input');

	$('html').keydown(function (e) {
		if (e.which == 13 && text.val().length !== 0) {
			socket.emit('message', text.val());
			text.val('');
		}
	});

	socket.on('createMessage', (message, userId) => {
		const messageClass = userId === myId ? 'myMessage' : 'otherMessage'; // Xác định class dựa trên userId

		$('ul').append(`
                    <li class="${messageClass}">
                        <span class="messageHeader">
                            <span>
                                From
                                <span class="messageSender">${userId === myId ? 'You' : 'Someone'}</span>
                                to
                                <span class="messageReceiver">Everyone:</span>
                            </span>
                            ${new Date().toLocaleString('en-US', {
			hour: 'numeric',
			minute: 'numeric',
			hour12: true,
		})}
                        </span>
                        <span class="messageContent">${message}</span>
                    </li>
                `);

		scrollToBottom();
	});
});

// Hàm để thêm người dùng vào video grid
const AddUser = (id, ava) => {
	if (document.getElementById(`user-${id}`)) {
		document.getElementById(`user-${id}`).remove();
	}
	const UserDiv = document.createElement('div');
	UserDiv.id = `user-${id}`;

	const Avatar = document.createElement('div');
	const Video = document.createElement('video');

	Avatar.id = `avatar-${id}`;
	Avatar.classList.add("card_video_mute");
	Avatar.innerHTML = `<img src="${ava}" class="card_video_mute_img" alt="">`;
	UserDiv.appendChild(Avatar);

	Video.srcObject = null;
	Video.autoplay = true;
	Video.id = `video-${id}`;
	Video.classList.add("card_video_mute");
	Video.muted = true;
	Video.classList.add("camera-off-st");
	Video.style.transform = "scaleX(-1)";
	Video.playsInline = true;
	Video.addEventListener('loadedmetadata', () => {
		Video.play();
	});
	UserDiv.appendChild(Video);
	videoGrid.appendChild(UserDiv);
	updateVideoGridClass();
};

// Hàm để xóa người dùng khỏi video grid
const RemoveUser = (id) => {
	const userElement = document.getElementById(`user-${id}`);
	if (userElement) {
		userElement.remove();
	}
	updateVideoGridClass();
};

// Hàm bật camera của người dùng
const OnCamUser = (id, stream) => {
	document.getElementById(`avatar-${id}`).classList.add("camera-off-st");
	document.getElementById(`video-${id}`).srcObject = stream;
	document.getElementById(`video-${id}`).classList.remove("camera-off-st");
	document.getElementById(`video-${id}`).play();
	const video = document.getElementById(`video-${id}`);
	video.addEventListener('loadedmetadata', () => {
		video.play().catch(err => console.error("Error playing video:", err));
	});
};

// Hàm tắt camera của người dùng
const OffCamUser = (id) => {
	const videoElement = document.getElementById(`video-${id}`);
	const avatarElement = document.getElementById(`avatar-${id}`);

	if (videoElement) {
		videoElement.classList.add("camera-off-st");
		videoElement.srcObject = null;
	} else {
		console.warn(`Video element for user ${id} not found.`);
	}

	if (avatarElement) {
		avatarElement.classList.remove("camera-off-st");
	} else {
		console.warn(`Avatar element for user ${id} not found.`);
	}
};

socket.on("user-off-cam", (userID) => {
	OffCamUser(userID);
});

// Hàm bật/tắt camera cho bản thân
const OnCam = () => {
	const videoButton = document.querySelector('.mainVideoButton'); // Tìm phần tử nút bật/tắt camera

	if (!myVideoStream) {
		navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
			myVideoStream = stream;
			OnCamUser(myId, stream);

			socket.emit("on-my-cam");

			socket.on("list-user", (list) => {
				list.forEach((user) => {
					if (user.userId !== myId) {
						const call = peer.call(user.userId, stream, {
							metadata: {
								userID: myId
							}
						});
						call.on('error', (err) => {
							console.error("Error in call:", err);
						});
					}
				});
			});

			videoButton.innerHTML = `
                        <i class="fas fa-video"></i>
                        <span>Stop Video</span>
                    `;
		});
	} else {
		myVideoStream.getTracks().forEach((track) => track.stop());
		myVideoStream = null;

		socket.emit("off-cam", myId);
		OffCamUser(myId);

		videoButton.innerHTML = `
                    <i class="fa-solid fa-video-slash"></i>
                    <span>Play Video</span>
                `;
	}
};

const toggleChat = () => {
	const div = document.querySelector('.mainRight');

	if (div) {
		const hasClass = div.classList.contains('camera-off-st');

		if (hasClass) {
			div.classList.remove("camera-off-st");
		} else {
			div.classList.add("camera-off-st");
		}
	} else {
		console.warn('Không tìm thấy phần tử có class "mainRight".');
	}
};

const leave = () => {
	window.location.href = "/end-call";
};

const scrollToBottom = () => {
	var d = $('.mainChatWindow');
	d.scrollTop(d.prop('scrollHeight'));
};
