# OpenAI TTS Demo with Performance Analytics

This application provides a simple interface for testing OpenAI's Speech API with comprehensive performance analytics.

## Features

- Text-to-speech conversion using OpenAI's Speech API
- Multiple voice options (alloy, echo, fable, onyx, nova, shimmer, etc.)
- Performance analytics for response times and audio quality
- Export performance data to CSV for analysis
- Server-side metrics tracking
- Compare different voices and text lengths

## Project Structure

This project combines both frontend and backend in a single React application:
- React frontend for the user interface
- Express backend server (located in the project root) for handling OpenAI API calls

## Setup Instructions

### 1. Clone or download the project

```bash
git clone <your-repository-url>
cd realtime-tts-app
```

### 2. Install dependencies

The project already includes all necessary dependencies in package.json:

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root directory:

```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

Replace `your_openai_api_key_here` with your actual OpenAI API key.

### 4. Run the backend server

Create a separate terminal window to run the Express server:

```bash
node server.js
```

The server should start and display a message confirming it's running on http://localhost:3001

### 5. Run the React application

In a different terminal window, start the React development server:

```bash
npm start
```

The application should open automatically in your browser at http://localhost:3000