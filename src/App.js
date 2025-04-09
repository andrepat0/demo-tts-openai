import React, { useState } from 'react';
import './App.css';
import SimplifiedTTS from './components/SimplifiedTTS';
import PerformanceTTS from './components/PerformanceTTS';

function App() {
  const [activeComponent, setActiveComponent] = useState('simple');

  return (
    <div className="app-container">
      <div className="component-selector">
        <button 
          className={activeComponent === 'simple' ? 'active' : ''}
          onClick={() => setActiveComponent('simple')}
        >
          Basic TTS
        </button>
        <button 
          className={activeComponent === 'performance' ? 'active' : ''}
          onClick={() => setActiveComponent('performance')}
        >
          TTS with Performance Analytics
        </button>
      </div>

      <div className="component-container">
        {activeComponent === 'simple' ? (
          <SimplifiedTTS />
        ) : (
          <PerformanceTTS />
        )}
      </div>
    </div>
  );
}

export default App;