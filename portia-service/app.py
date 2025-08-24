from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import traceback
from werkzeug.utils import secure_filename
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# Config
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
UPLOAD_FOLDER = 'temp_uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'dicom'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Gemini Setup
try:
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in .env")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')  # Free tier
    print("Gemini API configured successfully")
except Exception as e:
    print(f"Gemini configuration error: {str(e)}")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Fallback symptom patterns
symptom_patterns = {
    'headache': ['tension headache', 'migraine', 'cluster headache', 'sinus headache'],
    'fever': ['viral infection', 'bacterial infection', 'inflammatory condition'],
    'chest pain': ['cardiac condition', 'respiratory issue', 'musculoskeletal'],
    'abdominal pain': ['gastroenteritis', 'appendicitis', 'digestive issue'],
    'shortness of breath': ['respiratory infection', 'asthma', 'cardiac condition'],
    'nausea': ['gastroenteritis', 'food poisoning', 'medication side effect'],
    'dizziness': ['inner ear problem', 'blood pressure issue', 'dehydration'],
    'fatigue': ['viral infection', 'sleep disorder', 'metabolic condition'],
    'rash': ['allergic reaction', 'viral exanthem', 'dermatitis'],
    'sore throat': ['viral pharyngitis', 'strep throat', 'allergies'],
}

def analyze_with_gemini(text=None, image_path=None, user_id=None):
    try:
        print(f"Analyzing with Gemini: text={text}, image_path={image_path}, user_id={user_id}")
        # Base prompt
        base_prompt = (
            "You are an AI Doctor assistant designed for village people in India. Analyze the provided medical symptoms and/or image. "
            "Provide a detailed analysis in simple Hinglish (mix of Hindi and English) that is easy to understand for people with limited medical knowledge. "
            "Include possible conditions (bimariyaan) with simple explanations, practical recommendations (like home remedies or what to do if a doctor is far away), "
            "and a clear disclaimer that this is AI-generated and not a substitute for professional medical advice. "
            "Format the response clearly with sections: 📋 Analysis (Vishleshan), 💡 Recommendations (Sifarish), ⚠️ Disclaimer (Chetavni). "
            "Use a compassionate and reassuring tone to build trust."
        )
        if text:
            base_prompt += f"\nSymptoms: {text}"
        if user_id:
            base_prompt += f"\nUser ID: {user_id} (for context, do not include in response)"

        # Prepare Gemini content
        content = [base_prompt]
        if image_path:
            uploaded_file = genai.upload_file(image_path)
            content.append(uploaded_file)

        # Call Gemini
        response = model.generate_content(content)
        print("Gemini response received")
        return response.text
    except Exception as e:
        print(f"Gemini error: {str(e)}")
        traceback.print_exc()
        # Fallback to static analysis
        timestamp = datetime.now().isoformat()
        if text or image_path:
            analysis = "🩺 FALLBACK ANALYSIS\n\n"
            if text:
                symptoms = [s for s in symptom_patterns if s in text.lower()]
                analysis += f"📋 Symptoms Detected: {', '.join(symptoms) or 'None'}\n"
                if symptoms:
                    conditions = set()
                    for s in symptoms:
                        conditions.update(symptom_patterns.get(s, []))
                    analysis += f"🔍 Possible Conditions: {', '.join(conditions) or 'Unknown'}\n"
            if image_path:
                analysis += f"📸 Image Analysis: Image ({os.path.basename(image_path)}) processed, requires professional review.\n"
            analysis += (
                "\n💡 Recommendations:\n"
                "• Consult a healthcare professional\n"
                "• Monitor symptoms\n"
                "\n⚠️ Disclaimer: This is AI-generated and not a substitute for professional medical advice."
            )
            return {
                'analysis': analysis,
                'type': 'fallback_medical',
                'confidence': '75%',
                'source': 'Fallback AI',
                'timestamp': timestamp,
            }
        return {
            'analysis': 'No valid input provided.',
            'type': 'error',
            'confidence': '0%',
            'source': 'Fallback AI',
            'timestamp': timestamp,
        }

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'Gemini AI running',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0',
    })

@app.route('/analyze-medical', methods=['POST'])
def analyze_medical():
    try:
        text = request.form.get('text', '').strip()
        user_id = request.form.get('userId', '').strip()
        uploaded_file = request.files.get('medical_image')

        if not text and not uploaded_file:
            return jsonify({'error': 'No input provided'}), 400

        image_path = None
        if uploaded_file and allowed_file(uploaded_file.filename):
            filename = secure_filename(uploaded_file.filename)
            image_path = os.path.join(UPLOAD_FOLDER, filename)
            uploaded_file.save(image_path)

        # Analyze with Gemini
        result = analyze_with_gemini(text, image_path, user_id)

        # Clean up
        if image_path:
            try:
                os.remove(image_path)
            except:
                pass

        # If result is a string (from Gemini), format it
        if isinstance(result, str):
            result = {
                'analysis': result,
                'type': 'gemini_medical',
                'confidence': '90%',
                'source': 'Gemini LLM',
                'timestamp': datetime.now().isoformat(),
            }

        return jsonify(result)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

if __name__ == '__main__':
    print("🚀 Starting Gemini AI Doctor...")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print("🔗 Running on: http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)