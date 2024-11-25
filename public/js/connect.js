export const addAvatar = (div, ava) => {
    const html = `<div class="card_video_mute">
        <img src="${ava}" class="card_video_mute_img" alt="">
        <div class="camera_off"><i class="fa-solid fa-video-slash"></i></div>
        <div class="mic_off"><i class="fa-solid fa-microphone-slash"></i></div>
    </div>`
    div.innerHTML = html;
}