// server.js - Backend server with performance metrics
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store performance metrics
let serverMetrics = [];

// Simple health check endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Text-to-Speech endpoint with performance tracking
app.post('/api/text-to-speech', async (req, res) => {
  const startTime = Date.now();
  const { text, voice = 'alloy', format = 'mp3' } = req.body;
  
  // Prepare metrics object
  const metric = {
    timestamp: new Date().toISOString(),
    textLength: text?.length || 0,
    wordCount: text?.split(/\s+/).filter(Boolean).length || 0,
    voice,
    requestFormat: format,
    clientIp: req.ip || 'unknown',
    startTime
  };
  
  try {
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    console.log(`Processing TTS request with voice: ${voice}, format: ${format}`);
    metric.openaiRequestTime = Date.now();
    
    // Call OpenAI API
    const response = await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/audio/speech',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: "gpt-4o-mini-tts", // Use the model from documentation
        input: text,
        voice: voice,
        response_format: format
      },
      responseType: 'arraybuffer',
    });
    
    // Record OpenAI response time
    metric.openaiResponseTime = Date.now();
    metric.openaiDuration = metric.openaiResponseTime - metric.openaiRequestTime;
    
    // Set appropriate content type based on format
    const contentType = 
      format === 'mp3' ? 'audio/mpeg' :
      format === 'wav' ? 'audio/wav' :
      format === 'opus' ? 'audio/opus' :
      format === 'aac' ? 'audio/aac' :
      format === 'flac' ? 'audio/flac' :
      format === 'pcm' ? 'audio/pcm' :
      'audio/mpeg';
    
    // Set response headers
    res.set({
      'Content-Type': contentType,
      'Content-Length': response.data.length,
      'X-Response-Time': metric.openaiDuration
    });
    
    // Record audio data size
    metric.audioSize = response.data.length;
    metric.status = 'success';
    
    // Complete the metrics
    metric.totalDuration = Date.now() - startTime;
    serverMetrics.push(metric);
    
    // Periodically save metrics to file
    if (serverMetrics.length % 10 === 0) {
      saveMetricsToFile();
    }
    
    // Send the audio data
    res.send(response.data);
    
  } catch (error) {
    console.error('Error generating speech:', error.message);
    
    // Record error in metrics
    metric.status = 'error';
    metric.errorMessage = error.message;
    metric.errorTime = Date.now();
    metric.totalDuration = metric.errorTime - startTime;
    serverMetrics.push(metric);
    
    // If we can access the response data (usually contains OpenAI's error message)
    if (error.response && error.response.data) {
      try {
        // For arraybuffer responses, we need to convert to text
        const errorMessage = error.response.headers['content-type'].includes('application/json')
          ? JSON.parse(Buffer.from(error.response.data).toString()).error.message
          : 'OpenAI API error';
          
        return res.status(error.response.status).json({ 
          error: errorMessage
        });
      } catch (e) {
        // If parsing fails
        console.error('Error parsing API response:', e);
      }
    }
    
    res.status(500).json({
      error: 'Failed to generate speech',
      details: error.message
    });
  }
});

// Endpoint to get server-side performance metrics
app.get('/api/performance-metrics', (req, res) => {
  res.json(serverMetrics);
});

// Endpoint to export server-side metrics as CSV
app.get('/api/export-metrics', (req, res) => {
  if (serverMetrics.length === 0) {
    return res.status(404).json({ error: 'No metrics available' });
  }
  
  const headers = [
    'Timestamp',
    'Voice',
    'Text Length (chars)',
    'Word Count',
    'Request Format',
    'OpenAI Duration (ms)',
    'Total Duration (ms)',
    'Audio Size (bytes)',
    'Status',
    'Error Message',
    'Client IP'
  ];
  
  const csvRows = serverMetrics.map(metric => [
    metric.timestamp,
    metric.voice,
    metric.textLength,
    metric.wordCount,
    metric.requestFormat,
    metric.openaiDuration || '',
    metric.totalDuration,
    metric.audioSize || '',
    metric.status,
    metric.errorMessage || '',
    metric.clientIp
  ]);
  
  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=tts-server-metrics-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.csv`);
  res.send(csvContent);
});

// Function to save metrics to file
function saveMetricsToFile() {
  if (serverMetrics.length === 0) return;
  
  const metricsDir = path.join(__dirname, 'metrics');
  
  // Create metrics directory if it doesn't exist
  if (!fs.existsSync(metricsDir)) {
    fs.mkdirSync(metricsDir, { recursive: true });
  }
  
  const filePath = path.join(metricsDir, `metrics-${new Date().toISOString().slice(0,10)}.json`);
  
  fs.writeFileSync(filePath, JSON.stringify(serverMetrics, null, 2));
  console.log(`Metrics saved to ${filePath}`);
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Set' : 'NOT SET - please set OPENAI_API_KEY in .env'}`);
});

// Save metrics on server shutdown
