// Create the overlay with all functionality
function createOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'speech-overlay';
  overlay.style.position = 'fixed';
  overlay.style.bottom = '20px';
  overlay.style.right = '20px';
  overlay.style.zIndex = '10000';
  overlay.style.backgroundColor = 'white';
  overlay.style.padding = '20px';
  overlay.style.borderRadius = '8px';
  overlay.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';

  overlay.innerHTML = `
    <h3 style="margin: 0 0 15px 0;">AI Speech to Text</h3>
    <input type="password" id="apiKeyInput" placeholder="AssemblyAI API Key" style="margin-bottom: 10px; width: 200px;">
    <button id="saveKeyBtn">Save Key</button>
    <div style="margin: 15px 0;">
      <button id="startBtn">Start Recording</button>
      <button id="stopBtn" disabled>Stop Recording</button>
    </div>
    <p id="status" style="color: #666; margin: 0;">Status: Ready</p>
    <button id="closeBtn" style="margin-top: 15px;">Close</button>
  `;

  document.body.appendChild(overlay);

  // --- Event Listeners ---
  let mediaRecorder;
  let recordedChunks = [];

  // Save API Key
  document.getElementById('saveKeyBtn').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (apiKey) {
      chrome.storage.sync.set({ assemblyAIKey: apiKey }, () => {
        updateStatus('API key saved!');
      });
    }
  });

  // Start Recording
  document.getElementById('startBtn').addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      recordedChunks = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        processRecording(new Blob(recordedChunks, { type: 'audio/webm' }));
      };

      mediaRecorder.start();
      updateStatus('Recording...');
      toggleButtons(true);
    } catch (error) {
      updateStatus(`Error: ${error.message}`);
    }
  });

  // Stop Recording
  document.getElementById('stopBtn').addEventListener('click', () => {
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.stop();
      toggleButtons(false);
      updateStatus('Processing...');
    }
  });

  // Close Overlay
  document.getElementById('closeBtn').addEventListener('click', () => {
    overlay.remove();
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
  });
}

// Helper functions
function toggleButtons(isRecording) {
  document.getElementById('startBtn').disabled = isRecording;
  document.getElementById('stopBtn').disabled = !isRecording;
}

function updateStatus(text) {
  document.getElementById('status').textContent = `Status: ${text}`;
}

async function processRecording(audioBlob) {
  chrome.storage.sync.get('assemblyAIKey', async ({ assemblyAIKey }) => {
    if (!assemblyAIKey) {
      updateStatus('API key missing!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', audioBlob);

      const response = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: { Authorization: assemblyAIKey },
        body: formData,
      });

      const result = await response.json();
      updateStatus('Transcription received!');
      console.log('Transcription:', result);
    } catch (error) {
      updateStatus('Transcription failed');
      console.error(error);
    }
  });
}

// Initialize
createOverlay();