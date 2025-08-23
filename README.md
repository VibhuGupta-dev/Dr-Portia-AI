effective use of provided resources.
Dr. Portia AI - Empowering Health with AI ✨
Tagline: Accessible symptom and image analysis for a healthier India! 🌿
Overview 🎉
Dr. Portia AI is a groundbreaking medical analysis platform delivering preliminary insights from text-based symptoms and medical images. Crafted with the MERN stack (sans MongoDB), a powerful Flask backend, and fortified with Auth0, it tackles healthcare accessibility head-on, especially in rural India. Born from a hackathon, this scalable proof-of-concept promises a brighter health future!
Why Dr. Portia AI? 🌍
In India, where over 70% of the population in rural areas battles doctor shortages, Dr. Portia AI shines as a beacon of hope. Imagine a villager uploading an X-ray or typing “fever and cough” to get life-saving tips—prompting timely care! With potential ties to Ayushman Bharat Digital Mission, it bridges a critical healthcare gap with security and flair.
How It Works 🚀

Frontend (React): Log in with Auth0, input symptoms, or upload images with ease.
Backend (Node.js): Seamlessly manages API requests and hands off to Flask.
Flask Backend: Powers advanced symptom and image analysis like a pro.
Fallback System: Keeps the show running if Flask takes a break.

(Add a dazzling diagram here if possible!)
Features 🌟

Symptom Analysis: Detects conditions (e.g., “headache, fever”) from a database of 100+ symptoms.
Medical Image Analysis: Handles PNG, JPG, DICOM, etc., with simulated diagnostics (e.g., X-ray, CT scan).
Secure Authentication: Locks it down with Auth0 for total peace of mind.
Comprehensive Reports: Blends text and image insights for a full picture.
Fallback Mechanism: Delivers analysis even during server hiccups.
API Endpoints: Rocks with /health, /api/analyze-medical, and /analyze.

Tools Utilized and Why 💡

local_file_reader_tool.py: Reads image metadata (e.g., size, type) in analyze_medical_image, slashing manual work and boosting efficiency.
local_file_writer_tool.py: Saves temp files in temp_uploads and cleans up, enhancing security and resource flow.
image_understanding_tool.py: Powers simulated medical image analysis, paving the way for AI diagnostics with hackathon flair.

These tailored tools amp up reliability and highlight smart resource use!
Limitations ⚠️

Image analysis is simulated, with real API integration on the horizon.
Relies on rule-based symptom matching, ripe for ML upgrades.

Future Improvements 🌱

Integrate real medical imaging APIs.
Add machine learning for symptom analysis.
Explore Ayushman Bharat integration.

Contributing 🤝
Fork the repo, spin a branch, and send a pull request. Stick to the style guide and toss in tests!
License 📜
MIT License.
Disclaimer ℹ️
Dr. Portia AI is for informational use only. Always consult healthcare professionals for diagnosis.
