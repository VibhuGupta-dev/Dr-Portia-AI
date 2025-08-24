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
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max
UPLOAD_FOLDER = 'temp_uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'dicom'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Gemini AI Setup
try:
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    print("✅ Gemini API configured successfully")
except Exception as e:
    print(f"⚠️ Gemini configuration error: {e}")

# Allowed file check
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

# Analyze with Gemini or fallback
def analyze_with_gemini(text=None, image_path=None, user_id=None):
    try:
        base_prompt = (
            "You are an AI Doctor assistant for village people in India. Analyze provided symptoms "
            "and/or image. Provide simple Hinglish explanation, possible conditions, recommendations, "
            "and disclaimer. Format: 📋 Analysis, 💡 Recommendations, ⚠️ Disclaimer."
        )
        if text:
            base_prompt += f"\nSymptoms: {text}"
        if user_id:
            base_prompt += f"\nUser ID: {user_id} (do not include in response)"

        content = [base_prompt]
        if image_path:
            uploaded_file = genai.upload_file(image_path)
            content.append(uploaded_file)

        response = model.generate_content(content)
        return response.text
    except Exception as e:
        print(f"⚠️ Gemini error: {e}")
        traceback.print_exc()
        # Fallback analysis
        timestamp = datetime.now().isoformat()
        analysis_text = "🩺 FALLBACK ANALYSIS\n\n"
        if text:
            symptoms = [s for s in symptom_patterns if s in text.lower()]
            analysis_text += f"📋 Symptoms Detected: {', '.join(symptoms) or 'None'}\n"
            if symptoms:
                conditions = set()
                for s in symptoms:
                    conditions.update(symptom_patterns.get(s, []))
                analysis_text += f"🔍 Possible Conditions: {', '.join(conditions) or 'Unknown'}\n"
        if image_path:
            analysis_text += f"📸 Image Analysis: Image ({os.path.basename(image_path)}) processed, requires professional review.\n"
        analysis_text += (
            "\n💡 Recommendations:\n"
            "• Consult a healthcare professional\n"
            "• Monitor symptoms\n"
            "\n⚠️ Disclaimer: AI-generated, not professional medical advice."
        )
        return {
            'analysis': analysis_text,
            'type': 'fallback_medical',
            'confidence': '75%',
            'source': 'Fallback AI',
            'timestamp': timestamp,
        }

# Health check
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'Gemini AI running',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0'
    })

# Medical analysis endpoint
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

        # Call Gemini / fallback
        result = analyze_with_gemini(text, image_path, user_id)

        # Clean up uploaded file
        if image_path:
            try:
                os.remove(image_path)
            except:
                pass

        # If result is string, convert to JSON
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
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"🚀 Starting Gemini AI Doctor on port {port}...")
    app.run(host='0.0.0.0', port=port)
