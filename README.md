# OpenAI TTS Demo with Performance Analytics

This application provides a simple interface for testing OpenAI's Speech API with comprehensive performance analytics.

## Features

- Convert text to speech using OpenAI's Speech API
- Multiple voice options (alloy, echo, fable, onyx, nova, shimmer, etc.)
- Performance analytics for response times and audio quality
- Export performance data to CSV for analysis
- Server-side metrics tracking
- Compare different voices and text lengths

## Setup Instructions

### Backend Setup

1. Create a directory for the backend:
```bash
mkdir tts-backend
cd tts-backend
```

2. Create a package.json file or initialize:
```bash
npm init -y
```

3. Install the required dependencies:
```bash
npm install express cors axios dotenv fs path
npm install --save-dev nodemon
```

4. Create a `.env` file in the root of the backend directory:
```
OPENAI_API_KEY=your_openai_api_key_here
```
Replace `your_openai_api_key_here` with your actual OpenAI API key.

5. Copy the `enhanced-backend-analytics.js` code to `server.js`.

6. Start the backend server:
```bash
npm start
```

The server should start running on http://localhost:3001

### Frontend Setup

1. Create a React app (if you haven't already):
```bash
npx create-react-app tts-frontend
cd tts-frontend
```

2. Install axios for API requests