import React, { useState, useEffect } from "react";
import Spline from "@splinetool/react-spline";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [isDark] = useState(true);
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  // 🔥 Redirect to dashboard when authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // ✨ Particle effect (always mounted, never skipped)
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "0";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      vx: Math.random() * 0.5 - 0.25,
      vy: Math.random() * 0.5 - 0.25,
    }));

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(6, 182, 212, 0.3)";
        ctx.fill();
      });
      requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      canvas.remove();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className={`min-h-screen w-full ${
        isDark
          ? "bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white"
          : "bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 text-gray-900"
      }`}
    >
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-6 md:px-12 py-4 bg-opacity-90 backdrop-blur-md bg-[#0f172a]">
        <h1 className="text-2xl md:text-3xl font-bold tracking-wide">
          Dr Portia <span className="text-cyan-400">AI</span>
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => loginWithRedirect()}
            className="px-6 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-semibold shadow-lg shadow-cyan-500/30"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* 🔄 Loading state */}
      {isLoading ? (
        <div className="h-[80vh] flex items-center justify-center">
          <p className="text-xl animate-pulse">Checking authentication...</p>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <div
            className="flex flex-col md:flex-row items-center justify-between px-6 md:px-20 py-16 md:py-24 gap-12"
            id="home"
          >
            <div className="flex-1 space-y-6 text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">
                Revolutionizing <span className="text-cyan-400">Healthcare</span> with AI
              </h2>
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-lg mx-auto md:mx-0">
                Dr Portia AI is your intelligent health assistant — providing
                personalized guidance, real-time analysis, and unwavering support to
                keep you in safe hands.
              </p>
              <div className="flex space-x-4 justify-center md:justify-start">
                <button
                  onClick={() => loginWithRedirect()}
                  className="px-8 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-semibold shadow-lg shadow-cyan-500/30"
                >
                  Get Started
                </button>
                <button
                  onClick={() => loginWithRedirect()}
                  className="px-8 py-3 rounded-full border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 font-semibold"
                >
                  Learn More
                </button>
              </div>
            </div>

            <div className="flex-1 flex justify-center items-center h-[420px]">
              <Spline scene="https://prod.spline.design/c7sYrFZYigbPoC9x/scene.splinecode" />
            </div>
          </div>

          {/* Features Section */}
          <div className="px-6 md:px-20 py-16" id="features">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Why Choose Dr Portia AI?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Personalized Care",
                  desc: "Tailored health insights based on your unique needs.",
                },
                {
                  title: "Real-Time Analysis",
                  desc: "Instant diagnostics and recommendations powered by AI.",
                },
                {
                  title: "24/7 Support",
                  desc: "Always-on assistance for your health queries.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="p-6 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-all"
                >
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
