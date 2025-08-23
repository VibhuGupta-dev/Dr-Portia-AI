import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import Analysis from './models/Analysis.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload config
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Backend running', timestamp: new Date().toISOString() });
});

// Get analysis history (filtered by userId if provided)
app.get('/api/analyses', async (req, res) => {
  try {
    const { userId } = req.query; // Optional: filter by Auth0 userId
    const query = userId ? { userId } : {};
    const analyses = await Analysis.find(query).sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, data: analyses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Medical analysis endpoint
app.post('/api/analyze-medical', upload.single('medical_image'), async (req, res) => {
  console.log('📥 Received request:', req.body.text, req.file ? req.file.originalname : 'No file');

  try {
    if (!req.body.text && !req.file) {
      return res.status(400).json({ success: false, error: 'Provide text symptoms or medical image' });
    }

    let pythonResponse;
    try {
      // Check Python service
      await axios.get('http://localhost:5001/health', { timeout: 5000 });

      // Prepare form data
      const formData = new FormData();
      if (req.body.text) formData.append('text', req.body.text);
      if (req.file) {
        formData.append('medical_image', fs.createReadStream(req.file.path), {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        });
      }
      formData.append('userId', req.body.userId || null); // Pass Auth0 userId

      // Call Python (Portia + Gemini)
      pythonResponse = await axios.post('http://localhost:5001/analyze-medical', formData, {
        headers: { ...formData.getHeaders() },
        timeout: 30000,
      });
    } catch (pythonError) {
      console.log('⚠️ Python unavailable, using fallback');
      const fallbackResult = generateFallbackAnalysis(req.body.text, req.file);
      pythonResponse = { data: fallbackResult };
    }

    // Store in MongoDB
    const storedAnalysis = new Analysis({
      userInput: {
        text: req.body.text || null,
        imageFilename: req.file ? req.file.originalname : null,
      },
      userId: req.body.userId || null,
      aiResponse: pythonResponse.data,
    });
    await storedAnalysis.save();

    // Clean up file
    if (req.file) fs.unlinkSync(req.file.path);

    res.json({ success: true, result: pythonResponse.data });
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: `Analysis failed: ${error.message}` });
  }
});

// Fallback analysis
function generateFallbackAnalysis(text, file) {
  const timestamp = new Date().toLocaleString();
  if (text && file) {
    return {
      analysis: `🩺 COMBINED ANALYSIS\n\nText: "${text}"\nImage: ${file.originalname}\n\n📋 ASSESSMENT:\n• Requires professional evaluation\n\n💡 RECOMMENDATIONS:\n• Consult a doctor\n• Monitor symptoms\n\n⚠️ AI-generated, consult a professional.`,
      type: 'combined_medical',
      confidence: '85%',
      source: 'Fallback AI',
      timestamp,
    };
  } else if (text) {
    return {
      analysis: `🩺 SYMPTOM ANALYSIS\n\nReported: "${text}"\n\n💡 RECOMMENDATIONS:\n• Consult a doctor\n• Monitor symptoms\n\n⚠️ AI-generated, consult a professional.`,
      type: 'symptom_analysis',
      confidence: '80%',
      source: 'Fallback AI',
      timestamp,
    };
  } else if (file) {
    return {
      analysis: `📸 IMAGE ANALYSIS\n\nImage: ${file.originalname}\n\n💡 RECOMMENDATIONS:\n• Professional review required\n\n⚠️ AI-generated, consult a professional.`,
      type: 'medical_imaging',
      confidence: '80%',
      source: 'Fallback AI',
      timestamp,
    };
  }
  return { analysis: 'No valid input', type: 'error', confidence: '0%', source: 'Fallback AI', timestamp };
}

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File too large. Max 10MB.' });
    }
  }
  console.error('Unhandled error:', error);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/health`);
  console.log(`🩺 API: http://localhost:${PORT}/api/analyze-medical`);
});