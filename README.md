# Dr. Portia AI ✨
**Tagline:** Accessible symptom and image analysis for a healthier India! 🌿

## Overview 🎉
Dr. Portia AI is a groundbreaking medical analysis platform delivering preliminary insights from **text-based symptoms** and **medical images**. Built using the **MERN stack (without MongoDB)**, a robust **Flask backend**, and secured with **Auth0**, it addresses healthcare accessibility challenges, particularly in rural India.

Originally born from a hackathon, this scalable proof-of-concept promises a brighter health future!

---

## Why Dr. Portia AI? 🌍
In India, over **70% of the rural population faces doctor shortages**. Dr. Portia AI serves as a beacon of hope:

- A villager can upload an X-ray or type “fever and cough” to receive **life-saving preliminary insights**.
- Bridges the critical healthcare gap with potential integration into **Ayushman Bharat Digital Mission**.
- Combines security, speed, and user-friendly design to reach underserved communities.

---

## How It Works 🚀

**Frontend (React)**  
- Auth0 login  
- Symptom input & image upload  

**Backend (Node.js)**  
- Handles API requests  
- Hands off processing to Flask  

**Flask Backend**  
- Performs advanced **symptom & image analysis**  

**Fallback System**  
- Ensures continuous service even if Flask is down  

---

## Features 🌟
- **Symptom Analysis:** Detects conditions from a database of **100+ symptoms**.
- **Medical Image Analysis:** Supports **PNG, JPG, DICOM**, with simulated diagnostics.
- **Secure Authentication:** Auth0 ensures safe access.
- **Comprehensive Reports:** Combines text and image insights for a holistic overview.
- **Fallback Mechanism:** Maintains analysis even during server hiccups.
- **API Endpoints:** `/health`, `/api/analyze-medical`, `/analyze`.

---

## Tools Utilized 💡
- **local_file_reader_tool.py:** Reads image metadata (size, type), reducing manual effort.
- **local_file_writer_tool.py:** Handles temporary file storage and cleanup, boosting security.
- **image_understanding_tool.py:** Simulates medical image analysis, laying groundwork for AI diagnostics.

These tools improve reliability and demonstrate efficient resource management.

---

## Limitations ⚠️
- Image analysis is **simulated**; real API integration is upcoming.
- Symptom analysis is **rule-based**, ready for ML upgrades.

---

## Future Improvements 🌱
- Integrate **real medical imaging APIs**
- Implement **ML-powered symptom analysis**
- Explore **Ayushman Bharat integration**

---

## Contributing 🤝
1. Fork the repository  
2. Create a branch  
3. Submit a pull request  

> Follow the style guide and include tests.

---

## License 📜
MIT License

---

## Disclaimer ℹ️
Dr. Portia AI is **informational only**. Always consult qualified healthcare professionals for diagnosis and treatment.
