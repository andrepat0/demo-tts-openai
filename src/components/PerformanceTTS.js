import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './PerformanceTTS.css';

const PerformanceTTS = () => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [status, setStatus] = useState('Ready');
  const [logs, setLogs] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [currentPerformance, setCurrentPerformance] = useState(null);
  
  const audioRef = useRef(null);
  
  const addLog = (message) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toISOString().substr(11, 8)} - ${message}`].slice(-10));
  };

  // Load performance data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('tts-performance-data');
    if (savedData) {
      try {
        setPerformanceData(JSON.parse(savedData));
      } catch (e) {
        console.error('Error loading performance data:', e);
      }
    }
  }, []);

  // Save performance data to localStorage when updated
  useEffect(() => {
    if (performanceData.length > 0) {
      localStorage.setItem('tts-performance-data', JSON.stringify(performanceData));
    }
  }, [performanceData]);

  const generateSpeech = async () => {
    if (!text || isProcessing) return;
    
    setIsProcessing(true);
    setStatus('Processing...');
    addLog('Sending text to server...');
    
    // Start timing
    const startTime = performance.now();
    const metrics = {
      textLength: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      voice: selectedVoice,
      timestamp: new Date().toISOString(),
      requestStartTime: startTime,
    };
    
    try {
      // Call your backend API to handle the OpenAI API call
      const response = await axios.post('http://localhost:3001/api/text-to-speech', {
        text: text,
        voice: selectedVoice
      }, {
        responseType: 'blob'
      });
      
      // Record server response time
      const serverResponseTime = performance.now();
      metrics.serverResponseTime = serverResponseTime - startTime;
      
      addLog(`Response received in ${Math.round(metrics.serverResponseTime)}ms`);
      
      // Create a blob URL from the audio data
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Get audio file size
      metrics.audioSize = audioBlob.size;
      
      // Set the audio source
      if (audioRef.current) {
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current.src = audioUrl;
        audioRef.current.load(); // Force reload
        
        // Record time until audio is ready for playback
        metrics.audioLoadedTime = performance.now() - startTime;
        addLog(`Audio ready in ${Math.round(metrics.audioLoadedTime)}ms`);
      }
      
      // Update current performance data
      setCurrentPerformance(metrics);
      
      // Add to performance history
      setPerformanceData(prev => [...prev, metrics]);
      
      setStatus('Ready');
      addLog('Text-to-speech conversion completed');
    } catch (error) {
      console.error('Error generating speech:', error);
      
      // Record error time and details
      metrics.error = true;
      metrics.errorTime = performance.now() - startTime;
      metrics.errorDetails = error.message;
      
      setCurrentPerformance(metrics);
      setPerformanceData(prev => [...prev, metrics]);
      
      setStatus(`Error: ${error.message}`);
      addLog(`Server error: ${error.response?.status || 'Unknown'}`);
      
      if (error.response && error.response.data) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            addLog(`Error details: ${errorData.error || 'Unknown error'}`);
          } catch (e) {
            addLog('Could not parse error details');
          }
        };
        reader.readAsText(error.response.data);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Record audio play timing
  const handleAudioPlay = () => {
    addLog('Audio playback started');
    if (currentPerformance) {
      const updatedMetrics = {
        ...currentPerformance,
        playbackStartTime: performance.now() - currentPerformance.requestStartTime
      };
      setCurrentPerformance(updatedMetrics);
      
      // Update in performance history
      setPerformanceData(prev => 
        prev.map(item => 
          item.timestamp === updatedMetrics.timestamp ? updatedMetrics : item
        )
      );
    }
  };

  // Record audio ended timing
  const handleAudioEnded = () => {
    addLog('Audio playback completed');
    if (currentPerformance) {
      const updatedMetrics = {
        ...currentPerformance,
        playbackEndTime: performance.now() - currentPerformance.requestStartTime,
        totalDuration: audioRef.current.duration
      };
      setCurrentPerformance(updatedMetrics);
      
      // Update in performance history
      setPerformanceData(prev => 
        prev.map(item => 
          item.timestamp === updatedMetrics.timestamp ? updatedMetrics : item
        )
      );
    }
  };

  // Export performance data to CSV
  const exportPerformanceData = () => {
    if (performanceData.length === 0) {
      addLog('No performance data to export');
      return;
    }
    
    // Create CSV headers
    const headers = [
      'Timestamp',
      'Voice',
      'Text Length (chars)',
      'Word Count',
      'Server Response Time (ms)',
      'Audio Load Time (ms)',
      'Audio Size (bytes)',
      'Playback Start Time (ms)',
      'Playback End Time (ms)',
      'Audio Duration (s)',
      'Characters per Second',
      'Words per Second',
      'Error'
    ];
    
    // Format data
    const csvData = performanceData.map(item => [
      item.timestamp,
      item.voice,
      item.textLength,
      item.wordCount,
      Math.round(item.serverResponseTime),
      Math.round(item.audioLoadedTime),
      item.audioSize,
      item.playbackStartTime ? Math.round(item.playbackStartTime) : 'N/A',
      item.playbackEndTime ? Math.round(item.playbackEndTime) : 'N/A',
      item.totalDuration ? item.totalDuration.toFixed(2) : 'N/A',
      item.totalDuration ? (item.textLength / item.totalDuration).toFixed(2) : 'N/A',
      item.totalDuration ? (item.wordCount / item.totalDuration).toFixed(2) : 'N/A',
      item.error ? 'Yes' : 'No'
    ]);
    
    // Combine headers and data
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tts-performance-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    link.remove();
    addLog('Performance data exported to CSV');
  };

  // Clear performance data
  const clearPerformanceData = () => {
    setPerformanceData([]);
    localStorage.removeItem('tts-performance-data');
    addLog('Performance data cleared');
  };

  return (
    <div className="simplified-tts-container">
      <h1>OpenAI Speech API Demo with Performance Analytics</h1>
      
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
          onPlay={handleAudioPlay}
          onEnded={handleAudioEnded}
          onError={(e) => {
            console.error('Audio error:', e);
            addLog(`Audio element error: ${e.target.error?.message || 'Unknown error'}`);
          }}
        />
      </div>
      
      {currentPerformance && (
        <div className="performance-metrics">
          <h3>Current Request Metrics</h3>
          <table>
            <tbody>
              <tr>
                <td>Text Length:</td>
                <td>{currentPerformance.textLength} characters</td>
              </tr>
              <tr>
                <td>Word Count:</td>
                <td>{currentPerformance.wordCount} words</td>
              </tr>
              <tr>
                <td>Server Response Time:</td>
                <td>{Math.round(currentPerformance.serverResponseTime)} ms</td>
              </tr>
              <tr>
                <td>Audio Ready Time:</td>
                <td>{Math.round(currentPerformance.audioLoadedTime)} ms</td>
              </tr>
              <tr>
                <td>Audio Size:</td>
                <td>{(currentPerformance.audioSize / 1024).toFixed(2)} KB</td>
              </tr>
              {currentPerformance.totalDuration && (
                <>
                  <tr>
                    <td>Audio Duration:</td>
                    <td>{currentPerformance.totalDuration.toFixed(2)} seconds</td>
                  </tr>
                  <tr>
                    <td>Characters per Second:</td>
                    <td>{(currentPerformance.textLength / currentPerformance.totalDuration).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Words per Second:</td>
                    <td>{(currentPerformance.wordCount / currentPerformance.totalDuration).toFixed(2)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="performance-buttons">
        <button 
          onClick={exportPerformanceData}
          disabled={performanceData.length === 0}
          className="export-button"
        >
          Export Performance Data (CSV)
        </button>
        <button 
          onClick={clearPerformanceData}
          disabled={performanceData.length === 0}
          className="clear-button"
        >
          Clear Performance Data
        </button>
      </div>
      
      <div className="performance-summary">
        <h3>Performance Summary ({performanceData.length} requests)</h3>
        {performanceData.length > 0 && (
          <table>
            <tbody>
              <tr>
                <td>Avg Response Time:</td>
                <td>
                  {Math.round(
                    performanceData.reduce((sum, item) => sum + item.serverResponseTime, 0) / 
                    performanceData.length
                  )} ms
                </td>
              </tr>
              <tr>
                <td>Avg Audio Ready Time:</td>
                <td>
                  {Math.round(
                    performanceData.reduce((sum, item) => sum + item.audioLoadedTime, 0) / 
                    performanceData.length
                  )} ms
                </td>
              </tr>
              <tr>
                <td>Success Rate:</td>
                <td>
                  {Math.round(
                    (performanceData.filter(item => !item.error).length / 
                    performanceData.length) * 100
                  )}%
                </td>
              </tr>
            </tbody>
          </table>
        )}
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

export default PerformanceTTS;