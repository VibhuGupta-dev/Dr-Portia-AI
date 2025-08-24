import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Profile from '../component/profile';

// Your deployed Flask backend URL (replace with your actual Render URL)
const BACKEND_URL = 'https://dr-portia-ai-1.onrender.com';

function Dashboard() {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [showHistory, setShowHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { logout, isAuthenticated, user } = useAuth0();

  // Init: check backend + fetch history
  useEffect(() => {
    const init = async () => {
      await checkBackendStatus();
      if (isAuthenticated) fetchHistory();
    };
    init();
  }, [isAuthenticated]);

  // Check if backend is online
  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      const online = response.ok;
      setBackendStatus(online ? 'online' : 'offline');
      return online;
    } catch (err) {
      console.error('Backend check failed:', err);
      setBackendStatus('offline');
      return false;
    }
  };

  // Fetch user history (only if you have this endpoint in Express backend)
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/analyses?userId=${user.sub}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) setHistory(result.data);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  // Handle image selection
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
  };

  // Send user input to backend
  const analyzeData = async () => {
    if (!inputText.trim() && !selectedImage) return;

    setLoading(true);

    // Show user message
    const userMessage = {
      type: 'user',
      text: inputText,
      image: selectedImage ? URL.createObjectURL(selectedImage) : null,
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const online = await checkBackendStatus();
      if (!online) {
        throw new Error('Server is offline. Please try again later.');
      }

      const formData = new FormData();
      if (inputText.trim()) formData.append('text', inputText.trim());
      if (selectedImage) formData.append('medical_image', selectedImage);
      if (isAuthenticated && user?.sub) formData.append('userId', user.sub);

      const response = await fetch(`${BACKEND_URL}/analyze-medical`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle Flask backend response format
      const botMessage = {
        type: 'bot',
        text: result.analysis || result.error || 'No analysis available',
        meta: {
          type: result.type || 'unknown',
          confidence: result.confidence || 'N/A',
          source: result.source || 'AI',
          timestamp: result.timestamp || new Date().toISOString()
        }
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (isAuthenticated) {
        // fetchHistory();
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: `❌ ${err.message}`,
        meta: null
      }]);
    } finally {
      setInputText('');
      setSelectedImage(null);
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      analyzeData();
    }
  };

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 md:z-auto
        w-80 md:w-64 h-full
        bg-gray-950 border-r border-gray-800
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
      `}>
        {/* Mobile close button */}
        <div className="flex justify-between items-center p-4 md:hidden">
          <h2 className="text-lg font-bold">Dr. Portia AI</h2>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 p-4 md:p-6">
          {/* User Profile */}
          {isAuthenticated && (
            <div className="flex flex-col items-center gap-3 mb-6 md:mb-10">
              <img
                src={Profile()?.props?.children[0]?.props?.src || '/default-avatar.png'}
                alt="avatar"
                className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-cyan-400"
              />
              <div className="text-center">
                <p className="font-bold text-sm md:text-base">{Profile()?.props?.children[1]?.props?.children || 'User'}</p>
                <p className="text-xs md:text-sm text-gray-400">{Profile()?.props?.children[2]?.props?.children || 'user@example.com'}</p>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="text-xs md:text-sm mb-4 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-green-400' : 'bg-red-400'}`}></span>
            {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Checking...'}
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              setMessages([]);
              setSidebarOpen(false);
            }}
            className="w-full px-4 py-3 mb-4 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium transition-colors"
          >
            + New Chat
          </button>

          {/* History Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 mb-2 disabled:opacity-50 transition-colors"
            disabled={history.length === 0}
          >
            {showHistory ? 'Hide History' : 'Show History'}
          </button>

          {/* History */}
          {showHistory && (
            <div className="max-h-60 md:max-h-96 overflow-y-auto space-y-2">
              {history.length === 0 && (
                <p className="text-gray-400 text-xs md:text-sm">No history available.</p>
              )}
              {history.map((item, i) => (
                <div key={i} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs md:text-sm cursor-pointer transition-colors">
                  <p className="truncate"><strong>Input:</strong> {item.userInput?.text || 'Image only'}</p>
                  {item.userInput?.imageFilename && (
                    <p className="truncate"><strong>Image:</strong> {item.userInput.imageFilename}</p>
                  )}
                  <p className="truncate"><strong>Response:</strong> {item.aiResponse?.analysis?.slice(0, 50) || 'No response'}...</p>
                  <p className="text-gray-500"><strong>Date:</strong> {new Date(item.timestamp).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="p-4 md:p-6 border-t border-gray-800">
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold shadow-md text-sm transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-gray-950 border-b border-gray-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Dr. Portia AI</h1>
          <div className={`w-3 h-3 rounded-full ${backendStatus === 'online' ? 'bg-green-400' : 'bg-red-400'}`}></div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-8 md:mt-20 px-4">
              <div className="max-w-md mx-auto">
                <h2 className="text-xl md:text-2xl font-bold mb-4">👋 Welcome to Dr. Portia AI</h2>
                <p className="text-sm md:text-base mb-4">
                  Describe your symptoms or upload a medical image to begin analysis.
                </p>
                <div className="text-xs md:text-sm">
                  Status: {backendStatus === 'online' ? '🟢 Ready' : '🔴 Connecting...'}
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'bot' ? (
                  <div className="w-full max-w-none md:max-w-3xl bg-gray-800 text-white p-4 md:p-5 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-xs">
                        🩺
                      </div>
                      <h3 className="text-sm md:text-lg font-bold">Dr. Portia AI</h3>
                    </div>
                    <div className="text-sm md:text-base leading-relaxed whitespace-pre-line">
                      {msg.text}
                    </div>
                    {msg.meta && msg.meta.type !== 'unknown' && (
                      <div className="mt-3 p-3 bg-gray-700 rounded-lg text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>❤️ <strong>Type:</strong> {msg.meta.type}</div>
                          <div>🌡️ <strong>Confidence:</strong> {msg.meta.confidence}</div>
                          <div>📂 <strong>Source:</strong> {msg.meta.source}</div>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 p-3 rounded-xl bg-yellow-900/30 text-xs border border-yellow-700">
                      ⚠️ <strong>Disclaimer:</strong> This is AI-generated analysis. Always consult a healthcare professional for medical advice.
                    </div>
                  </div>
                ) : (
                  <div className="max-w-xs md:max-w-lg p-3 md:p-4 rounded-2xl shadow-md bg-cyan-600 text-white rounded-br-none">
                    <p className="text-sm md:text-base whitespace-pre-line">{msg.text}</p>
                    {msg.image && (
                      <img 
                        src={msg.image} 
                        alt="uploaded" 
                        className="mt-2 md:mt-3 max-w-[150px] md:max-w-[200px] rounded-lg border border-gray-700"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {loading && (
            <div className="flex justify-start max-w-4xl mx-auto">
              <div className="bg-gray-800 text-gray-300 p-3 md:p-4 rounded-2xl rounded-bl-none shadow-md">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
                  <span className="text-sm">Analyzing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-800 bg-gray-950 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* File Selection Preview */}
            {selectedImage && (
              <div className="mb-3 p-3 bg-gray-800 rounded-lg flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-gray-400">Selected: </span>
                  <span className="text-white">{selectedImage.name}</span>
                  <span className="text-gray-400 ml-2">
                    ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-end gap-2 md:gap-3">
              {/* File Upload */}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
                id="upload"
              />
              <label 
                htmlFor="upload" 
                className="flex-shrink-0 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
              >
                📎
              </label>

              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your symptoms..."
                  rows="1"
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-700 transition-all resize-none text-sm md:text-base"
                  style={{
                    minHeight: '48px',
                    maxHeight: '120px',
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />
              </div>

              {/* Send Button */}
              <button 
                onClick={analyzeData} 
                disabled={loading || (!inputText.trim() && !selectedImage)}
                className="flex-shrink-0 w-12 h-12 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  '➤'
                )}
              </button>
            </div>

            {/* Mobile hint */}
            <div className="mt-2 text-xs text-gray-500 text-center md:hidden">
              Tap to upload image • Press Enter to send
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;