import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Profile from "../component/profile";

function Dashboard() {
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");

  const { logout, isAuthenticated } = useAuth0();

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch("https://dr-portia-ai.onrender/health");
      setBackendStatus(response.ok ? "online" : "offline");
    } catch {
      setBackendStatus("offline");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
  };

  const analyzeData = async () => {
    if (!inputText.trim() && !selectedImage) return;

    setLoading(true);

    const userMessage = {
      type: "user",
      text: inputText,
      image: selectedImage ? URL.createObjectURL(selectedImage) : null,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      await checkBackendStatus();
      if (backendStatus === "offline") throw new Error("Server Offline");

      const formData = new FormData();
      if (inputText.trim()) formData.append("text", inputText.trim());
      if (selectedImage) formData.append("medical_image", selectedImage);

      const response = await fetch("https://dr-portia-ai.onrender/api/analyze-medical", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      const botMessage = {
        type: "bot",
        text: response.ok && result.success ? result.result.analysis : result.error || "Error",
        meta: result.result || null,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, { type: "bot", text: `❌ ${err.message}` }]);
    } finally {
      setInputText("");
      setSelectedImage(null);
      setLoading(false);
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
                src={Profile()?.props?.children[0]?.props?.src}
                alt="avatar"
                className="w-16 h-16 rounded-full border-2 border-cyan-400"
              />
              <div className="text-center">
                <p className="font-bold">{Profile()?.props?.children[1]?.props?.children}</p>
                <p className="text-sm text-gray-400">{Profile()?.props?.children[2]?.props?.children}</p>
              </div>
            </div>
          )}
          <div className="text-sm">{backendStatus === "online" ? "🟢 Online" : "🔴 Offline"}</div>
        </div>

        <button
          onClick={() => logout({ returnTo: window.location.origin })}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold shadow-md"
        >
          🚪 Logout
        </button>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              👋 Welcome! Describe your symptoms or upload a medical image to begin.
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-lg p-4 rounded-2xl shadow-md ${
                  msg.type === "user"
                    ? "bg-cyan-600 text-white rounded-br-none"
                    : "bg-gray-800 text-gray-200 rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="uploaded"
                    className="mt-3 max-w-[200px] rounded-lg border border-gray-700"
                  />
                )}
                {msg.meta && (
                  <div className="mt-3 text-sm text-gray-400 border-t border-gray-700 pt-2 space-y-1">
                    <p>
                      <strong>Type:</strong> {msg.meta.type}
                    </p>
                    <p>
                      <strong>Confidence:</strong> {msg.meta.confidence}
                    </p>
                    <p>
                      <strong>Source:</strong> {msg.meta.source}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-300 p-4 rounded-2xl rounded-bl-none shadow-md animate-pulse">
                Analyzing...
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
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer text-sm text-gray-300"
            >
              📎 Upload
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe your symptoms..."
              className="flex-1 px-4 py-3 bg-gray-800 rounded-lg text-white focus:outline-none border border-gray-700"
            />
            <button
              onClick={analyzeData}
              disabled={loading}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold disabled:opacity-50"
            >
              ➤
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
