// app.js

const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('canvasElement');
const startRecordingButton = document.getElementById('startRecording');
const stopRecordingButton = document.getElementById('stopRecording');
const downloadVideoButton = document.getElementById('downloadVideo');

let mediaRecorder;
let recordedBlobs;

const constraints = {
    audio: false,
    video: true
};

async function init() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = stream;
        window.stream = stream;
    } catch (e) {
        console.error('Error accessing media devices.', e);
    }
}

function getSupportedMimeType() {
    const possibleTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
    ];

    for (const type of possibleTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    return '';
}

startRecordingButton.addEventListener('click', () => {
    recordedBlobs = [];
    const mimeType = getSupportedMimeType();
    if (mimeType === '') {
        console.error('No supported mime type found for MediaRecorder.');
        return;
    }
    let options = { mimeType: mimeType };
    try {
        mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
        console.error('Exception while creating MediaRecorder:', e);
        return;
    }

    mediaRecorder.onstop = (event) => {
        console.log('Recorder stopped: ', event);
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();

    console.log('MediaRecorder started', mediaRecorder);
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = false;

    // Start virtual background replacement
    videoElement.style.display = 'block';
    canvasElement.style.display = 'none';
    requestAnimationFrame(drawToCanvas);
});

stopRecordingButton.addEventListener('click', () => {
    mediaRecorder.stop();
    startRecordingButton.disabled = false;
    stopRecordingButton.disabled = true;
    downloadVideoButton.disabled = false;

    // Stop virtual background replacement
    videoElement.style.display = 'none';
    canvasElement.style.display = 'block';
});

function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

downloadVideoButton.addEventListener('click', () => {
    const blob = new Blob(recordedBlobs, { type: recordedBlobs[0].type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'recorded_video.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
});

function drawToCanvas() {
    const ctx = canvasElement.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    // Here you can add virtual background logic
    // For now, we just draw a solid color background
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    requestAnimationFrame(drawToCanvas);
}

init();
