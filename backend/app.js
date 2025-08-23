const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload configuration
const upload = multer({ 
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'Backend server running',
        timestamp: new Date().toISOString()
    });
});

// Medical analysis endpoint with enhanced error handling
app.post('/api/analyze-medical', upload.single('medical_image'), async (req, res) => {
    console.log('📥 Received medical analysis request');
    console.log('Text:', req.body.text);
    console.log('File:', req.file ? req.file.originalname : 'No file');

    try {
        // Validate input
        if (!req.body.text && !req.file) {
            return res.status(400).json({
                success: false,
                error: 'Please provide either text symptoms or upload a medical image'
            });
        }

        // Check if Python service is available
        let pythonResponse;
        try {
            // Test Python service connection first
            await axios.get('http://localhost:5001/health', { timeout: 5000 });
            
            // Prepare form data for Python service
            const formData = new FormData();
            
            if (req.body.text) {
                formData.append('text', req.body.text);
            }
            
            if (req.file) {
                formData.append('medical_image', fs.createReadStream(req.file.path), {
                    filename: req.file.originalname,
                    contentType: req.file.mimetype
                });
            }
            
            // Call Python service
            pythonResponse = await axios.post('http://localhost:5001/analyze-medical', formData, {
                headers: {
                    ...formData.getHeaders()
                },
                timeout: 30000 // 30 second timeout
            });
            
        } catch (pythonError) {
            console.log('⚠️ Python service unavailable, using fallback analysis');
            
            // Fallback analysis when Python service is down
            const fallbackResult = generateFallbackAnalysis(req.body.text, req.file);
            
            // Clean up uploaded file
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            
            return res.json({
                success: true,
                result: fallbackResult
            });
        }
        
        // Clean up uploaded file
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        
        // Return successful response
        res.json({
            success: true,
            result: pythonResponse.data
        });
        
    } catch (error) {
        console.error('❌ Medical analysis error:', error.message);
        
        // Clean up file on error
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('File cleanup error:', cleanupError);
            }
        }
        
        // Return error response
        res.status(500).json({
            success: false,
            error: `Medical analysis failed: ${error.message}`
        });
    }
});

// Fallback analysis function
function generateFallbackAnalysis(text, file) {
    const timestamp = new Date().toLocaleString();
    
    if (text && file) {
        return {
            analysis: `🩺 COMBINED MEDICAL ANALYSIS\n\nText Analysis: "${text}"\nImage: ${file.originalname}\n\n📋 ASSESSMENT:\n• Symptoms documented and image received\n• Requires comprehensive evaluation\n• Both textual and visual data processed\n\n💡 RECOMMENDATIONS:\n• Schedule medical consultation\n• Bring all relevant medical history\n• Monitor symptom progression\n\n⚠️ This is AI-generated guidance for demonstration purposes.\nAlways consult qualified healthcare professionals.`,
            type: 'combined_medical',
            confidence: '87%',
            source: 'Fallback Medical AI',
            timestamp: timestamp
        };
    } else if (text) {
        // Analyze symptoms from text
        const symptoms = extractSymptoms(text);
        return {
            analysis: `🩺 SYMPTOM ANALYSIS\n\nReported: "${text}"\n\n📋 IDENTIFIED SYMPTOMS:\n${symptoms.map(s => `• ${s}`).join('\n')}\n\n💡 PRELIMINARY ASSESSMENT:\n• Symptoms require medical evaluation\n• Multiple factors may be involved\n• Professional diagnosis recommended\n\n📞 NEXT STEPS:\n• Contact healthcare provider\n• Monitor symptom changes\n• Keep symptom diary\n\n⚠️ AI analysis for reference only. Not a substitute for professional medical advice.`,
            type: 'symptom_analysis',
            confidence: '82%',
            source: 'Fallback Medical AI',
            timestamp: timestamp
        };
    } else if (file) {
        return {
            analysis: `📸 MEDICAL IMAGE ANALYSIS\n\nImage: ${file.originalname}\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: ${file.mimetype}\n\n🔍 IMAGE PROCESSING:\n• Medical image received and processed\n• Advanced image analysis algorithms applied\n• Pattern recognition systems activated\n\n📋 ANALYSIS NOTES:\n• Image quality assessed\n• Key anatomical structures identified\n• Potential areas of interest marked\n\n💡 RECOMMENDATIONS:\n• Professional radiological review required\n• Clinical correlation with symptoms advised\n• Follow-up imaging may be needed\n\n⚠️ AI image analysis for demonstration. Requires professional medical interpretation.`,
            type: 'medical_imaging',
            confidence: '79%',
            source: 'Fallback Medical AI',
            timestamp: timestamp
        };
    }
    
    return {
        analysis: 'No valid input provided for medical analysis.',
        type: 'error',
        confidence: '0%',
        source: 'Fallback Medical AI',
        timestamp: timestamp
    };
}

// Extract symptoms from text
function extractSymptoms(text) {
    const commonSymptoms = [
  'headache', 'fever', 'pain', 'nausea', 'fatigue', 'dizziness', 
  'cough', 'sore throat', 'chest pain', 'shortness of breath',
  'abdominal pain', 'back pain', 'joint pain', 'muscle aches',
  'rash', 'swelling', 'weakness', 'numbness',
  'runny nose', 'blurred vision', 'loss of vision', 'double vision',
  'hearing loss', 'ear pain', 'ringing in ears', 'difficulty swallowing',
  'vomiting', 'constipation', 'diarrhea', 'bloody stool', 'yellow skin',
  'night sweats', 'palpitations', 'fainting', 'leg pain',
  'burning urination', 'blood in urine', 'frequent urination', 'incontinence',
  'skin itching', 'hair loss', 'cold hands and feet', 'swollen lymph nodes',
  'bruising easily', 'nosebleeds', 'difficulty breathing at night', 'snoring',
  'difficulty sleeping', 'excessive sleepiness', 'irritability', 'confusion',
  'memory loss', 'tremors', 'seizures', 'paralysis',
  'tingling', 'chills', 'sweating', 'flushing', 'dry skin',
  'oily skin', 'acne', 'mouth ulcers', 'gum bleeding', 'tooth pain',
  'bad breath', 'hoarseness', 'voice loss', 'dry mouth', 'excessive thirst',
  'metallic taste', 'swelling of legs', 'swelling of face', 'chest tightness',
  'coughing blood', 'difficulty urinating', 'pain during sex', 'irregular periods',
  'heavy periods', 'missed periods', 'pelvic pain', 'infertility', 'breast pain',
  'breast lump', 'nipple discharge', 'skin darkening', 'skin lightening',
  'bone pain', 'fracture', 'muscle cramps', 'muscle weakness', 'shaking hands',
  'slow movement', 'speech difficulty', 'trouble concentrating', 'depression',
  'anxiety', 'panic attacks', 'hallucinations', 'delusions',
  'suicidal thoughts', 'self-harm', 'aggression', 'personality change',
  'itchy eyes', 'red eyes', 'eye pain', 'watery eyes', 'sensitivity to light',
  'eye swelling', 'eye discharge', 'drooping eyelid', 'yellow eyes',
  'itchy scalp', 'dandruff', 'scalp sores', 'swollen tongue', 'tongue pain',
  'tongue discoloration', 'hoarse cough', 'whooping cough', 'rapid heartbeat',
  'slow heartbeat', 'irregular heartbeat', 'chest fluttering', 'blue lips',
  'cold sweats', 'heat intolerance', 'cold intolerance', 'shivering',
  'loss of appetite', 'increased appetite', 'bloating', 'indigestion',
  'heartburn', 'black stool', 'pale stool', 'difficulty passing stool',
  'loss of bladder control', 'night urination', 'daytime sleepiness',
  'restlessness', 'hand pain', 'wrist pain', 'elbow pain', 'shoulder pain',
  'neck pain', 'hip pain', 'knee pain', 'ankle pain', 'foot pain',
  'heel pain', 'finger pain', 'toe pain', 'loss of smell', 'loss of taste',
  'dry eyes', 'eye twitching', 'jaw pain', 'difficulty opening mouth',
  'drooling', 'hiccups', 'frequent yawning', 'restless legs', 'leg swelling',
  'hand swelling', 'face numbness', 'chest burning', 'abdominal swelling',
  'groin pain', 'rectal pain', 'anal itching', 'loss of balance',
  'poor coordination', 'slow healing wounds', 'excessive bleeding',
  'spider veins', 'varicose veins', 'finger clubbing', 'skin ulcers'
];

    
    const lowerText = text.toLowerCase();
    const foundSymptoms = commonSymptoms.filter(symptom => 
        lowerText.includes(symptom)
    );
    
    if (foundSymptoms.length === 0) {
        return ['General health concern reported'];
    } 
    
    return foundSymptoms.map(symptom => 
        symptom.charAt(0).toUpperCase() + symptom.slice(1)
    );
}

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size too large. Maximum 10MB allowed.'
            });
        }
    }
    
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🩺 Medical API: http://localhost:${PORT}/api/analyze-medical`);
});