import React, { useState, useRef } from 'react';
import axios from 'axios';
import './SimplifiedTTS.css';

const SimplifiedTTS = () => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [status, setStatus] = useState('Ready');
  const [logs, setLogs] = useState([]);
  
  const audioRef = useRef(null);
  
  const addLog = (message) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toISOString().substr(11, 8)} - ${message}`].slice(-10));
  };

  const generateSpeech = async () => {
    if (!text || isProcessing) return;
    
    setIsProcessing(true);
    setStatus('Processing...');
    addLog('Converting text to speech...');
    
    try {
      // Call your backend API to handle the OpenAI API call
      const response = await axios.post('http://localhost:3001/api/text-to-speech', {
        text: text,
        voice: selectedVoice,
        stream: true, // Request streaming response
      }, {
        responseType: 'blob' // Important for handling audio data
      });
      
      // Create a blob URL from the audio data
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Set the audio source and play
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        addLog('Audio ready for playback');
      }
      
      setStatus('Ready');
      addLog('Text-to-speech conversion completed');
    } catch (error) {
      console.error('Error generating speech:', error);
      setStatus(`Error: ${error.message}`);
      addLog(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="simplified-tts-container">
      <h1>OpenAI Speech API Demo</h1>
      
      <div className="status-container">
        <span className="status-text">{status}</span>
      </div>
      
      <div className="controls">
        <select 
          value={selectedVoice} 
          onChange={(e) => setSelectedVoice(e.target.value)}
          className="voice-selector"
          disabled={isProcessing}
        >
          <option value="alloy">Alloy</option>
          <option value="echo">Echo</option>
          <option value="fable">Fable</option>
          <option value="onyx">Onyx</option>
          <option value="nova">Nova</option>
          <option value="shimmer">Shimmer</option>
          <option value="ballad">Ballad</option>
          <option value="ash">Ash</option>
          <option value="coral">Coral</option>
          <option value="sage">Sage</option>
          <option value="shimmer">Shimmer</option>
        </select>
      </div>
      
      <div className="input-container">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to be spoken..."
          disabled={isProcessing}
          className="text-input"
        />
        
        <button 
          onClick={generateSpeech}
          disabled={!text || isProcessing}
          className="speak-button"
        >
          {isProcessing ? 'Processing...' : 'Generate Speech'}
        </button>
      </div>
      
      <div className="audio-player">
        <audio 
          ref={audioRef} 
          controls 
          onError={(e) => {
            console.error('Audio error:', e);
            addLog(`Audio element error: ${e.target.error?.message || 'Unknown error'}`);
          }}
        />
      </div>
      
      <div className="logs-container">
        <h3>Event Log</h3>
        <div className="logs">
          {logs.map((log, index) => (
            <div key={index} className="log-entry">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimplifiedTTS;