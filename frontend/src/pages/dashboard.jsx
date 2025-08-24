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
      // Note: This endpoint doesn't exist in your Flask backend
      // You might want to implement it or remove this feature
      const response = await fetch(`${BACKEND_URL}/api/analyses?userId=${user.sub}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) setHistory(result.data);
      }
    } catch (err) {
      console.error('History fetch error:', err);
      // Don't show error to user, just log it
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
      
      // Only fetch history if the endpoint exists
      if (isAuthenticated) {
        // fetchHistory(); // Commented out since Flask backend doesn't have this endpoint
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 p-6 flex flex-col justify-between">
        <div>
          {isAuthenticated && (
            <div className="flex flex-col items-center gap-3 mb-10">
              <img
                src={Profile()?.props?.children[0]?.props?.src || '/default-avatar.png'}
                alt="avatar"
                className="w-16 h-16 rounded-full border-2 border-cyan-400"
              />
              <div className="text-center">
                <p className="font-bold">{Profile()?.props?.children[1]?.props?.children || 'User'}</p>
                <p className="text-sm text-gray-400">{Profile()?.props?.children[2]?.props?.children || 'user@example.com'}</p>
              </div>
            </div>
          )}
          <div className="text-sm mb-4">
            {backendStatus === 'online' ? '🟢 Online' : backendStatus === 'offline' ? '🔴 Offline' : '⏳ Checking...'}
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 mb-2 disabled:opacity-50"
            disabled={history.length === 0}
          >
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
          {showHistory && (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {history.length === 0 && (
                <p className="text-gray-400 text-sm">No history available.</p>
              )}
              {history.map((item, i) => (
                <div key={i} className="p-3 bg-gray-800 rounded-lg text-sm">
                  <p><strong>Input:</strong> {item.userInput?.text || 'Image only'}</p>
                  {item.userInput?.imageFilename && (
                    <p><strong>Image:</strong> {item.userInput.imageFilename}</p>
                  )}
                  <p><strong>Response:</strong> {item.aiResponse?.analysis?.slice(0, 100) || 'No response'}...</p>
                  <p><strong>Date:</strong> {new Date(item.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold shadow-md"
        >
          🚪 Logout
        </button>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              <h2 className="text-2xl font-bold mb-4">👋 Welcome to Dr. Portia AI</h2>
              <p>Describe your symptoms or upload a medical image to begin analysis.</p>
              <div className="mt-4 text-sm">
                Status: {backendStatus === 'online' ? '🟢 Ready' : '🔴 Connecting...'}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'bot' ? (
                <div className="max-w-lg w-full bg-gradient-to-br from-cyan-900 via-gray-900 to-black text-white p-5 rounded-2xl shadow-lg border border-cyan-700">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                    🩺 Health Analysis
                  </h3>
                  <div className="mb-3 whitespace-pre-line text-sm leading-relaxed">
                    {msg.text}
                  </div>
                  {msg.meta && msg.meta.type !== 'unknown' && (
                    <div className="grid grid-cols-1 gap-2 text-xs bg-gray-800 rounded-lg p-3 mt-3">
                      <div className="flex items-center gap-2">
                        ❤️ <span><strong>Type:</strong> {msg.meta.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        🌡️ <span><strong>Confidence:</strong> {msg.meta.confidence}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        📂 <span><strong>Source:</strong> {msg.meta.source}</span>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 p-3 rounded-xl bg-yellow-900/30 text-sm border border-yellow-700">
                    ⚠️ <strong>Disclaimer:</strong> This is AI-generated analysis. Always consult a healthcare professional for medical advice.
                  </div>
                </div>
              ) : (
                <div className="max-w-lg p-4 rounded-2xl shadow-md bg-cyan-600 text-white rounded-br-none">
                  <p className="whitespace-pre-line">{msg.text}</p>
                  {msg.image && (
                    <img 
                      src={msg.image} 
                      alt="uploaded" 
                      className="mt-3 max-w-[200px] rounded-lg border border-gray-700"
                    />
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-300 p-4 rounded-2xl rounded-bl-none shadow-md">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
                  <span>Analyzing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-800 bg-gray-950">
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
              id="upload"
            />
            <label 
              htmlFor="upload" 
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer text-sm text-gray-300 transition-colors"
            >
              📎 {selectedImage ? selectedImage.name.slice(0, 15) + '...' : 'Upload Image'}
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your symptoms... (Press Enter to send)"
              className="flex-1 px-4 py-3 bg-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-700 transition-all"
            />
            <button 
              onClick={analyzeData} 
              disabled={loading || (!inputText.trim() && !selectedImage)}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {loading ? '...' : '➤'}
            </button>
          </div>
          {selectedImage && (
            <div className="mt-2 text-sm text-gray-400">
              Selected: {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
              <button 
                onClick={() => setSelectedImage(null)}
                className="ml-2 text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;