/*
let mediaRecorder;
let recordedChunks = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startRecording') {
    startRecording();
  } else if (request.action === 'stopRecording') {
    stopRecording();
  }
});

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
      recordedChunks = [];
      processRecording(audioBlob);
    };

    mediaRecorder.start();
  } catch (error) {
    console.error('Recording error:', error);
  }
}

function stopRecording() {
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.stop();
  }
}

async function processRecording(audioBlob) {
  chrome.storage.sync.get('assemblyAIKey', async ({ assemblyAIKey }) => {
    const formData = new FormData();
    formData.append('file', audioBlob);

    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: { Authorization: assemblyAIKey },
      body: formData,
    });

    const result = await response.json();
    console.log('Transcription:', result);
  });
}
  */