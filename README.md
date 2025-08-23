Dr. Portia AI - Empowering Health with AI

Tagline: Accessible symptom and image analysis for a healthier India.

Overview

Dr. Portia AI is an innovative medical analysis platform designed to provide preliminary insights from text-based symptoms and medical images. Built using the MERN stack (without MongoDB), a Flask backend for advanced processing, and secured with Auth0, it addresses healthcare accessibility challenges, especially in rural India. Developed for a hackathon, this project offers a scalable proof-of-concept for preliminary medical support.

Why Dr. Portia AI?

In India, with over 70% of the population in rural areas facing doctor shortages, Dr. Portia AI delivers critical preliminary insights. A user in a remote village can input “fever and cough” or upload an X-ray to get actionable recommendations, encouraging timely medical care. With potential to integrate with India’s Ayushman Bharat Digital Mission, it tackles a pressing healthcare gap securely and efficiently.

How It Works





Frontend (React): Users log in via Auth0 and input symptoms or upload images.



Backend (Node.js): Manages API requests and forwards data to Flask.



Flask Backend: Processes medical data with symptom and image analysis.



Fallback System: Ensures continuity if the Flask server is unavailable.



(Add a diagram if possible)

Features





Symptom Analysis: Identifies conditions from text (e.g., “headache, fever”) using a database of over 100 symptoms.



Medical Image Analysis: Supports PNG, JPG, DICOM, etc., with simulated diagnostics (e.g., X-ray, CT scan).



Secure Authentication: Uses Auth0 for safe user access.



Comprehensive Reports: Combines text and image analysis.



Fallback Mechanism: Provides analysis during server downtime.



API Endpoints: Includes /health, /api/analyze-medical, and /analyze for robust functionality.

Tools Utilized and Why





local_file_reader_tool.py: Employed to read uploaded image metadata (e.g., size, type) in analyze_medical_image. This optimized file processing, reducing manual effort and enhancing efficiency.



local_file_writer_tool.py: Utilized to save temporary image files in temp_uploads and clean them up. This improved security and resource management during file handling.


Limitations





Image analysis is simulated, with plans for real API integration.



Relies on rule-based symptom matching, open to ML enhancements.

Future Improvements





Integrate real medical imaging APIs.



Add machine learning for symptom analysis.



Explore Ayushman Bharat integration.

Contributing

Fork the repo, create a branch, and submit a pull request. Follow the style guide and include tests.

License

MIT License.

Disclaimer

Dr. Portia AI is for informational use only. Consult healthcare professionals for diagnosis.



image_understanding_tool.py: Adapted for simulated medical image analysis, laying the groundwork for future AI-driven diagnostics. This demonstrated innovation within hackathon time limits.

These tools, customized for the project, boosted reliability and showcased effective use of provided resources.
