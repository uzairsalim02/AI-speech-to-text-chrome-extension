// content.js
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
  overlay.style.width = '400px';

  overlay.innerHTML = `
    <h3 style="margin: 0 0 15px 0;">AI Speech to Text</h3>
    <input type="password" id="apiKeyInput" placeholder="AssemblyAI API Key" style="margin-bottom: 10px; width: 100%;">
    <button id="saveKeyBtn">Save Key</button>
    <div style="margin: 15px 0;">
      <button id="startBtn">Start Recording</button>
      <button id="stopBtn" disabled>Stop Recording</button>
    </div>
    <p id="status" style="color: #666; margin: 0 0 10px 0;">Status: Ready</p>
    <textarea id="transcriptBox" 
              style="width: 100%; height: 150px; margin-bottom: 10px; padding: 8px;"
              placeholder="Transcription will appear here..."></textarea>
    <button id="closeBtn">Close</button>
  `;

  document.body.appendChild(overlay);

  // --- Event Listeners and Logic ---
  let mediaRecorder;
  let recordedChunks = [];
  const transcriptBox = document.getElementById('transcriptBox');

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
      transcriptBox.value = '';
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      recordedChunks = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
        processRecording(audioBlob);
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

  // Load saved API key
  chrome.storage.sync.get('assemblyAIKey', ({ assemblyAIKey }) => {
    if (assemblyAIKey) {
      document.getElementById('apiKeyInput').value = assemblyAIKey;
    }
  });

  async function processRecording(audioBlob) {
    try {
      const { assemblyAIKey } = await chrome.storage.sync.get('assemblyAIKey');
      if (!assemblyAIKey) {
        updateStatus('API key missing!');
        return;
      }

      // Upload audio to AssemblyAI
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: { Authorization: assemblyAIKey },
        body: audioBlob
      });
      const uploadData = await uploadResponse.json();
      
      // Create transcript
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: { 
          Authorization: assemblyAIKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audio_url: uploadData.upload_url })
      });
      const transcriptData = await transcriptResponse.json();
      
      // Poll for transcript completion
      const pollingUrl = `https://api.assemblyai.com/v2/transcript/${transcriptData.id}`;
      let pollingInterval = setInterval(async () => {
        const pollingResponse = await fetch(pollingUrl, {
          headers: { Authorization: assemblyAIKey }
        });
        const pollingData = await pollingResponse.json();
        
        if (pollingData.status === 'completed') {
          clearInterval(pollingInterval);
          transcriptBox.value = pollingData.text;
          updateStatus('Transcription complete!');
        } else if (pollingData.status === 'error') {
          clearInterval(pollingInterval);
          updateStatus('Transcription failed!');
        }
      }, 3000); // Poll every 3 seconds

    } catch (error) {
      updateStatus('Transcription failed');
      console.error(error);
    }
  }

  function toggleButtons(isRecording) {
    document.getElementById('startBtn').disabled = isRecording;
    document.getElementById('stopBtn').disabled = !isRecording;
  }

  function updateStatus(text) {
    document.getElementById('status').textContent = `Status: ${text}`;
  }
}

// Initialize overlay
createOverlay();