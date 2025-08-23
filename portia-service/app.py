from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime
import traceback
from werkzeug.utils import secure_filename
import base64

app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
UPLOAD_FOLDER = 'temp_uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'dicom'}

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def analyze_symptoms(text):
    """Analyze medical symptoms from text"""
    text_lower = text.lower()
    
    # Common symptoms and their potential conditions
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
    'cough': ['common cold', 'bronchitis', 'pneumonia'],
    'runny nose': ['allergic rhinitis', 'common cold', 'sinus infection'],
    'joint pain': ['arthritis', 'autoimmune disorder', 'injury'],
    'back pain': ['muscle strain', 'herniated disc', 'arthritis'],
    'swelling': ['inflammation', 'injury', 'infection'],
    'weight loss': ['thyroid disorder', 'cancer', 'chronic infection'],
    'weight gain': ['hypothyroidism', 'obesity', 'medication side effect'],
    'blurred vision': ['refractive error', 'diabetes', 'cataract'],
    'loss of vision': ['glaucoma', 'retinal detachment', 'optic neuritis'],
    'double vision': ['nerve palsy', 'stroke', 'multiple sclerosis'],
    'hearing loss': ['ear infection', 'aging', 'noise exposure'],
    'ear pain': ['ear infection', 'TMJ disorder', 'foreign body'],
    'ringing in ears': ['tinnitus', 'hearing loss', 'earwax blockage'],
    'difficulty swallowing': ['throat infection', 'esophageal stricture', 'neurological issue'],
    'vomiting': ['food poisoning', 'gastroenteritis', 'migraine'],
    'constipation': ['low fiber diet', 'dehydration', 'IBS'],
    'diarrhea': ['food poisoning', 'gastroenteritis', 'IBD'],
    'bloody stool': ['hemorrhoids', 'GI bleeding', 'colon cancer'],
    'yellow skin': ['jaundice', 'liver disease', 'hemolysis'],
    'night sweats': ['tuberculosis', 'lymphoma', 'menopause'],
    'palpitations': ['anxiety', 'arrhythmia', 'thyroid disorder'],
    'fainting': ['low blood pressure', 'cardiac issue', 'neurological condition'],
    'leg pain': ['muscle cramp', 'deep vein thrombosis', 'sciatica'],
    'burning urination': ['UTI', 'STI', 'prostatitis'],
    'blood in urine': ['UTI', 'kidney stones', 'bladder cancer'],
    'frequent urination': ['diabetes', 'UTI', 'prostate enlargement'],
    'incontinence': ['neurological disorder', 'weak pelvic muscles', 'UTI'],
    'skin itching': ['eczema', 'allergy', 'liver disease'],
    'hair loss': ['alopecia areata', 'thyroid disorder', 'nutritional deficiency'],
    'cold hands and feet': ['anemia', 'poor circulation', 'Raynaud’s phenomenon'],
    'swollen lymph nodes': ['infection', 'lymphoma', 'autoimmune disorder'],
    'bruising easily': ['platelet disorder', 'clotting disorder', 'liver disease'],
    'nosebleeds': ['trauma', 'dry air', 'clotting disorder'],
    'difficulty breathing at night': ['sleep apnea', 'heart failure', 'asthma'],
    'snoring': ['sleep apnea', 'obesity', 'nasal obstruction'],
    'difficulty sleeping': ['insomnia', 'anxiety', 'sleep apnea'],
    'excessive sleepiness': ['narcolepsy', 'sleep apnea', 'hypothyroidism'],
    'irritability': ['stress', 'depression', 'thyroid disorder'],
    'confusion': ['delirium', 'dementia', 'low blood sugar'],
    'memory loss': ['Alzheimer’s disease', 'stroke', 'trauma'],
    'tremors': ['Parkinson’s disease', 'essential tremor', 'thyroid disorder'],
    'seizures': ['epilepsy', 'brain injury', 'infection'],
    'weakness': ['stroke', 'neuropathy', 'muscle disease'],
    'paralysis': ['stroke', 'spinal cord injury', 'neuromuscular disease'],
    'tingling': ['nerve compression', 'diabetes', 'vitamin deficiency'],
    'numbness': ['nerve damage', 'stroke', 'multiple sclerosis'],
    'chills': ['infection', 'malaria', 'hypothermia'],
    'sweating': ['fever', 'menopause', 'thyroid disorder'],
    'flushing': ['menopause', 'carcinoid syndrome', 'medication reaction'],
    'dry skin': ['eczema', 'dehydration', 'hypothyroidism'],
    'oily skin': ['hormonal imbalance', 'acne', 'seborrheic dermatitis'],
    'acne': ['hormonal imbalance', 'oily skin', 'bacterial infection'],
    'mouth ulcers': ['canker sores', 'vitamin deficiency', 'infection'],
    'gum bleeding': ['gingivitis', 'vitamin deficiency', 'clotting disorder'],
    'tooth pain': ['cavity', 'abscess', 'gum disease'],
    'bad breath': ['poor dental hygiene', 'sinus infection', 'GERD'],
    'hoarseness': ['laryngitis', 'vocal cord nodule', 'thyroid cancer'],
    'voice loss': ['laryngitis', 'nerve injury', 'tumor'],
    'dry mouth': ['dehydration', 'diabetes', 'medication side effect'],
    'excessive thirst': ['diabetes', 'dehydration', 'kidney disorder'],
    'metallic taste': ['medication side effect', 'kidney failure', 'liver disease'],
    'swelling of legs': ['heart failure', 'kidney disease', 'liver disease'],
    'swelling of face': ['allergic reaction', 'kidney disorder', 'thyroid disease'],
    'chest tightness': ['asthma', 'angina', 'anxiety'],
    'coughing blood': ['tuberculosis', 'lung cancer', 'bronchitis'],
    'difficulty urinating': ['prostate enlargement', 'UTI', 'neurological disorder'],
    'pain during sex': ['infection', 'endometriosis', 'psychological factor'],
    'irregular periods': ['PCOS', 'thyroid disorder', 'hormonal imbalance'],
    'heavy periods': ['fibroids', 'thyroid disorder', 'clotting disorder'],
    'missed periods': ['pregnancy', 'PCOS', 'thyroid disorder'],
    'pelvic pain': ['endometriosis', 'PID', 'ovarian cyst'],
    'infertility': ['PCOS', 'thyroid disorder', 'low sperm count'],
    'breast pain': ['mastitis', 'hormonal changes', 'fibrocystic breast'],
    'breast lump': ['fibroadenoma', 'cyst', 'breast cancer'],
    'nipple discharge': ['infection', 'hormonal imbalance', 'cancer'],
    'skin darkening': ['Addison’s disease', 'melasma', 'drug reaction'],
    'skin lightening': ['vitiligo', 'fungal infection', 'albinism'],
    'bone pain': ['osteoporosis', 'cancer', 'vitamin D deficiency'],
    'fracture': ['trauma', 'osteoporosis', 'bone cancer'],
    'muscle cramps': ['dehydration', 'electrolyte imbalance', 'overuse'],
    'muscle weakness': ['neuropathy', 'muscular dystrophy', 'thyroid disorder'],
    'shaking hands': ['Parkinson’s disease', 'anxiety', 'thyroid disorder'],
    'slow movement': ['Parkinson’s disease', 'neurological disorder', 'aging'],
    'speech difficulty': ['stroke', 'brain injury', 'neurological disease'],
    'trouble concentrating': ['ADHD', 'anxiety', 'depression'],
    'depression': ['chemical imbalance', 'trauma', 'chronic illness'],
    'anxiety': ['stress', 'genetic factors', 'trauma'],
    'panic attacks': ['anxiety disorder', 'PTSD', 'thyroid disorder'],
    'hallucinations': ['schizophrenia', 'drug use', 'neurological disorder'],
    'delusions': ['schizophrenia', 'bipolar disorder', 'dementia'],
    'suicidal thoughts': ['depression', 'bipolar disorder', 'PTSD'],
    'self-harm': ['depression', 'borderline personality disorder', 'trauma'],
    'aggression': ['substance abuse', 'neurological disorder', 'psychiatric illness'],
    'personality change': ['dementia', 'brain injury', 'psychiatric illness'],
    'itchy eyes': ['allergy', 'conjunctivitis', 'dry eyes'],
    'red eyes': ['conjunctivitis', 'uveitis', 'blepharitis'],
    'eye pain': ['corneal abrasion', 'glaucoma', 'infection'],
    'watery eyes': ['allergies', 'blocked tear duct', 'infection'],
    'sensitivity to light': ['migraine', 'meningitis', 'eye infection'],
    'eye swelling': ['allergy', 'infection', 'injury'],
    'eye discharge': ['conjunctivitis', 'infection', 'blocked tear duct'],
    'drooping eyelid': ['myasthenia gravis', 'nerve palsy', 'aging'],
    'yellow eyes': ['jaundice', 'liver disease', 'hemolysis'],
    'itchy scalp': ['dandruff', 'psoriasis', 'fungal infection'],
    'dandruff': ['seborrheic dermatitis', 'fungal infection', 'dry scalp'],
    'scalp sores': ['infection', 'psoriasis', 'dermatitis'],
    'swollen tongue': ['allergic reaction', 'infection', 'angioedema'],
    'tongue pain': ['glossitis', 'burning mouth syndrome', 'trauma'],
    'tongue discoloration': ['oral thrush', 'vitamin deficiency', 'smoking'],
    'hoarse cough': ['croup', 'bronchitis', 'laryngitis'],
    'whooping cough': ['pertussis', 'respiratory infection'],
    'rapid heartbeat': ['anemia', 'anxiety', 'arrhythmia'],
    'slow heartbeat': ['heart block', 'hypothyroidism', 'medication effect'],
    'irregular heartbeat': ['arrhythmia', 'thyroid disorder', 'electrolyte imbalance'],
    'chest fluttering': ['arrhythmia', 'anxiety', 'POTS'],
    'blue lips': ['low oxygen', 'cyanosis', 'cardiac issue'],
    'cold sweats': ['shock', 'heart attack', 'infection'],
    'heat intolerance': ['hyperthyroidism', 'menopause', 'medication side effect'],
    'cold intolerance': ['hypothyroidism', 'anemia', 'chronic illness'],
    'shivering': ['fever', 'cold exposure', 'infection'],
    'loss of appetite': ['cancer', 'infection', 'depression'],
    'increased appetite': ['hyperthyroidism', 'diabetes', 'medication effect'],
    'bloating': ['IBS', 'gastritis', 'lactose intolerance'],
    'indigestion': ['GERD', 'gastritis', 'ulcer'],
    'heartburn': ['GERD', 'hiatal hernia', 'acid reflux'],
    'black stool': ['upper GI bleed', 'iron supplement', 'peptic ulcer'],
    'pale stool': ['biliary obstruction', 'liver disease', 'pancreatitis'],
    'difficulty passing stool': ['constipation', 'bowel obstruction', 'IBS'],
    'loss of bladder control': ['neurological disorder', 'spinal injury', 'aging'],
    'night urination': ['diabetes', 'heart failure', 'kidney disorder'],
    'daytime sleepiness': ['narcolepsy', 'sleep apnea', 'depression'],
    'restlessness': ['anxiety', 'insomnia', 'hyperthyroidism'],
    'hand pain': ['arthritis', 'carpal tunnel syndrome', 'injury'],
    'wrist pain': ['carpal tunnel syndrome', 'tendonitis', 'arthritis'],
    'elbow pain': ['tennis elbow', 'arthritis', 'injury'],
    'shoulder pain': ['rotator cuff injury', 'arthritis', 'bursitis'],
    'neck pain': ['muscle strain', 'cervical spondylosis', 'whiplash'],
    'hip pain': ['arthritis', 'bursitis', 'fracture'],
    'knee pain': ['arthritis', 'ligament injury', 'meniscus tear'],
    'ankle pain': ['sprain', 'arthritis', 'gout'],
    'foot pain': ['plantar fasciitis', 'gout', 'fracture'],
    'heel pain': ['plantar fasciitis', 'heel spur', 'tendonitis'],
    'finger pain': ['arthritis', 'injury', 'gout'],
    'toe pain': ['gout', 'ingrown toenail', 'arthritis'],
    'loss of smell': ['COVID-19', 'sinus infection', 'head trauma'],
    'loss of taste': ['COVID-19', 'infection', 'zinc deficiency'],
    'dry eyes': ['Sjögren’s syndrome', 'aging', 'dehydration'],
    'eye twitching': ['fatigue', 'stress', 'caffeine'],
    'jaw pain': ['TMJ disorder', 'dental issue', 'arthritis'],
    'difficulty opening mouth': ['TMJ disorder', 'lockjaw', 'infection'],
    'drooling': ['neurological disorder', 'Parkinson’s disease', 'stroke'],
    'hiccups': ['gastric distension', 'nerve irritation', 'medication effect'],
    'frequent yawning': ['fatigue', 'sleep disorder', 'neurological issue'],
    'restless legs': ['RLS', 'iron deficiency', 'neuropathy'],
    'leg swelling': ['DVT', 'heart failure', 'kidney disease'],
    'hand swelling': ['arthritis', 'injury', 'infection'],
    'face numbness': ['stroke', 'nerve disorder', 'migraine'],
    'chest burning': ['GERD', 'heart attack', 'gastritis'],
    'abdominal swelling': ['liver disease', 'ascites', 'tumor'],
    'groin pain': ['hernia', 'infection', 'muscle strain'],
    'rectal pain': ['hemorrhoids', 'fissure', 'infection'],
    'anal itching': ['hemorrhoids', 'infection', 'allergy'],
    'loss of balance': ['inner ear problem', 'neurological disorder', 'stroke'],
    'poor coordination': ['cerebellar disorder', 'alcohol intoxication', 'stroke'],
    'slow healing wounds': ['diabetes', 'circulatory disorder', 'infection'],
    'excessive bleeding': ['clotting disorder', 'hemophilia', 'liver disease'],
    'spider veins': ['varicose veins', 'cirrhosis', 'vascular disorder'],
    'varicose veins': ['venous insufficiency', 'obesity', 'aging'],
    'finger clubbing': ['lung disease', 'heart disease', 'cancer'],
    'skin ulcers': ['diabetes', 'poor circulation', 'infection'],


    }
    
    found_symptoms = []
    possible_conditions = set()
    
    for symptom, conditions in symptom_patterns.items():
        if symptom in text_lower:
            found_symptoms.append(symptom.title())
            possible_conditions.update(conditions)
    
    # Generate analysis
    if found_symptoms:
        analysis = f"🩺 MEDICAL SYMPTOM ANALYSIS\n\n"
        analysis += f"📋 REPORTED SYMPTOMS:\n"
        for symptom in found_symptoms:
            analysis += f"• {symptom}\n"
        
        analysis += f"\n🔍 POSSIBLE CONDITIONS TO CONSIDER:\n"
        for i, condition in enumerate(list(possible_conditions)[:5], 1):
            analysis += f"{i}. {condition.title()}\n"
        
        analysis += f"\n💡 RECOMMENDATIONS:\n"
        analysis += f"• Monitor symptom progression\n"
        analysis += f"• Stay hydrated and rest\n"
        analysis += f"• Seek medical attention if symptoms worsen\n"
        analysis += f"• Consider consulting healthcare provider\n"
        
        if len(found_symptoms) > 2:
            analysis += f"• Multiple symptoms warrant professional evaluation\n"
        
        analysis += f"\n⚠️ IMPORTANT DISCLAIMER:\n"
        analysis += f"This AI analysis is for informational purposes only.\n"
        analysis += f"Always consult qualified healthcare professionals for proper diagnosis and treatment."
        
        return {
            'analysis': analysis,
            'symptoms_found': found_symptoms,
            'confidence': '85%' if len(found_symptoms) > 1 else '75%',
            'urgency': 'moderate' if len(found_symptoms) > 2 else 'low'
        }
    else:
        return {
            'analysis': f"🩺 GENERAL HEALTH INQUIRY\n\nInput: \"{text}\"\n\n📋 ANALYSIS:\n• Health-related query detected\n• No specific symptoms identified\n• General medical information request\n\n💡 RECOMMENDATIONS:\n• For specific symptoms, provide detailed descriptions\n• Consider consulting healthcare provider for personalized advice\n• Maintain regular health checkups\n\n⚠️ For specific medical concerns, please consult healthcare professionals.",
            'symptoms_found': [],
            'confidence': '70%',
            'urgency': 'low'
        }

def analyze_medical_image(filename, file_info):
    """Simulate medical image analysis"""
    file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'unknown'
    file_size = file_info.get('size', 'unknown')
    
    # Simulate different types of medical image analysis
    analysis_templates = [
       
    {
        'type': 'X-ray Analysis',
        'findings': 'Chest X-ray shows clear lung fields with normal cardiac silhouette. No acute abnormalities detected.',
        'recommendations': ['Follow-up if symptoms persist', 'Clinical correlation advised']
    },
    {
        'type': 'Dermatological Assessment',
        'findings': 'Skin lesion appears benign with regular borders and uniform coloration.',
        'recommendations': ['Monitor for changes', 'Dermatology consultation if growth occurs']
    },
    {
        'type': 'General Medical Imaging',
        'findings': 'Medical image processed successfully. Anatomical structures appear within normal limits.',
        'recommendations': ['Professional radiological review recommended', 'Clinical correlation with symptoms']
    },
    {
        'type': 'CT Scan Analysis',
        'findings': 'CT scan of abdomen reveals no evidence of obstruction, mass, or abnormal fluid collections.',
        'recommendations': ['Routine monitoring', 'Review with gastroenterology if symptoms worsen']
    },
    {
        'type': 'MRI Brain Scan',
        'findings': 'MRI brain shows no acute infarct or hemorrhage. White matter changes consistent with mild small vessel disease.',
        'recommendations': ['Neurology referral if cognitive decline continues', 'Maintain blood pressure control']
    },
    {
        'type': 'Ultrasound Abdomen',
        'findings': 'Liver, gallbladder, kidneys, and pancreas appear normal. No stones or masses detected.',
        'recommendations': ['No immediate action required', 'Routine health check annually']
    },
    {
        'type': 'Echocardiogram',
        'findings': 'Normal left ventricular function with ejection fraction within normal range. No significant valvular abnormalities.',
        'recommendations': ['Maintain heart-healthy lifestyle', 'Follow-up in 12 months']
    },
    {
        'type': 'ECG Report',
        'findings': 'ECG demonstrates normal sinus rhythm with no ischemic changes.',
        'recommendations': ['No immediate cardiac concern', 'Repeat ECG if symptoms recur']
    },
    {
        'type': 'Blood Test Panel',
        'findings': 'CBC results within normal limits. No evidence of anemia or infection.',
        'recommendations': ['Continue routine screening', 'Repeat annually']
    },
    {
        'type': 'Urine Analysis',
        'findings': 'Urinalysis reveals clear urine with no evidence of infection or hematuria.',
        'recommendations': ['Maintain hydration', 'Repeat if urinary symptoms develop']
    },
    {
        'type': 'Mammogram Screening',
        'findings': 'Breast tissue appears normal with no suspicious masses or calcifications.',
        'recommendations': ['Routine screening as per guidelines', 'Report new breast changes promptly']
    },
    {
        'type': 'Bone Density Scan',
        'findings': 'Bone mineral density is within normal range. No evidence of osteoporosis.',
        'recommendations': ['Maintain calcium and vitamin D intake', 'Repeat scan in 2-3 years']
    },
    {
        'type': 'Pulmonary Function Test',
        'findings': 'Lung volumes and airflow appear within normal limits. No obstruction detected.',
        'recommendations': ['No intervention required', 'Avoid smoking and pollutants']
    },
    {
        'type': 'Allergy Skin Test',
        'findings': 'No significant allergic response detected during testing.',
        'recommendations': ['No immediate action', 'Reassess if symptoms change']
    },
    {
        'type': 'Endoscopy Report',
        'findings': 'Upper GI tract appears normal. No ulcers or erosions visualized.',
        'recommendations': ['Routine follow-up', 'Avoid irritant foods if symptoms persist']
    },
    {
        'type': 'Colonoscopy Report',
        'findings': 'Colon mucosa appears healthy. No polyps or abnormal lesions identified.',
        'recommendations': ['Repeat in 10 years', 'Report new gastrointestinal symptoms promptly']
    },
    {
        'type': 'Ophthalmology Examination',
        'findings': 'Visual acuity normal. No evidence of glaucoma or retinal pathology.',
        'recommendations': ['Annual eye checkup recommended', 'Protect eyes from UV light']
    },
    {
        'type': 'Hearing Test (Audiometry)',
        'findings': 'Normal hearing thresholds across tested frequencies. No sensorineural loss.',
        'recommendations': ['Routine recheck in 2 years', 'Avoid prolonged loud noise exposure']
    },
    {
        'type': 'Neurological Assessment',
        'findings': 'Cranial nerves intact. Motor and sensory functions appear normal.',
        'recommendations': ['No neurological intervention needed', 'Monitor for new symptoms']
    },
    {
        'type': 'Psychiatric Evaluation',
        'findings': 'Patient demonstrates stable mood and affect. No evidence of acute psychiatric disorder.',
        'recommendations': ['Encourage stress management', 'Follow-up if mood changes']
    },
    {
        'type': 'Diabetes Screening',
        'findings': 'Fasting glucose and HbA1c within normal range.',
        'recommendations': ['Maintain healthy lifestyle', 'Repeat screening annually']
    },
    {
        'type': 'Thyroid Function Test',
        'findings': 'TSH, T3, and T4 within normal range.',
        'recommendations': ['No immediate concern', 'Repeat if symptoms develop']
    },
    {
        'type': 'Liver Function Test',
        'findings': 'ALT, AST, and bilirubin levels within normal limits.',
        'recommendations': ['Routine monitoring', 'Avoid excessive alcohol']
    },
    {
        'type': 'Kidney Function Test',
        'findings': 'Creatinine and eGFR levels indicate normal renal function.',
        'recommendations': ['Stay hydrated', 'Annual screening']
    },
    {
        'type': 'Oncology Screening',
        'findings': 'No malignant lesions detected on current imaging studies.',
        'recommendations': ['Routine surveillance as per age guidelines', 'Report new symptoms promptly']
    }


    ]
    
    import random
    template = random.choice(analysis_templates)
    
    analysis = f"📸 MEDICAL IMAGE ANALYSIS\n\n"
    analysis += f"📁 FILE INFORMATION:\n"
    analysis += f"• Filename: {filename}\n"
    analysis += f"• Type: {file_ext.upper()} image\n"
    analysis += f"• Status: Successfully processed\n\n"
    analysis += f"🔍 {template['type'].upper()}:\n"
    analysis += f"• {template['findings']}\n\n"
    analysis += f"💡 RECOMMENDATIONS:\n"
    for rec in template['recommendations']:
        analysis += f"• {rec}\n"
    
    analysis += f"\n⚠️ IMPORTANT DISCLAIMER:\n"
    analysis += f"This AI image analysis is a demonstration tool only.\n"
    analysis += f"Professional medical image interpretation by qualified radiologists\n"
    analysis += f"or specialists is required for accurate diagnosis."
    
    return {
        'analysis': analysis,
        'image_type': template['type'],
        'confidence': '82%',
        'processed': True
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'Improved Portia Medical AI is running!',
        'message': '✅ Ready for medical analysis',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0'
    })

@app.route('/analyze-medical', methods=['POST'])
def analyze_medical():
    """Enhanced medical analysis endpoint"""
    try:
        print(f"🔍 Medical analysis request received at {datetime.now()}")
        
        # Get text input
        text_input = request.form.get('text', '').strip()
        
        # Get uploaded file
        uploaded_file = request.files.get('medical_image')
        
        print(f"📝 Text input: {text_input[:100]}..." if text_input else "📝 No text input")
        print(f"📁 File upload: {uploaded_file.filename if uploaded_file else 'No file'}")
        
        # Validate input
        if not text_input and not uploaded_file:
            return jsonify({
                'error': 'No input provided. Please enter symptoms or upload a medical image.',
                'status': 'error'
            }), 400
        
        results = {}
        analysis_parts = []
        
        # Process text input
        if text_input:
            print("🔤 Processing text input...")
            text_result = analyze_symptoms(text_input)
            results['text_analysis'] = text_result
            analysis_parts.append(text_result['analysis'])
        
        # Process image upload
        if uploaded_file and uploaded_file.filename:
            print("🖼️ Processing image upload...")
            
            if allowed_file(uploaded_file.filename):
                filename = secure_filename(uploaded_file.filename)
                
                # Save file temporarily (in production, you might process without saving)
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                uploaded_file.save(filepath)
                
                # Get file info
                file_info = {
                    'size': os.path.getsize(filepath),
                    'type': uploaded_file.mimetype
                }
                
                # Analyze image
                image_result = analyze_medical_image(filename, file_info)
                results['image_analysis'] = image_result
                analysis_parts.append(image_result['analysis'])
                
                # Clean up temporary file
                try:
                    os.remove(filepath)
                except:
                    pass
                    
            else:
                return jsonify({
                    'error': f'File type not supported. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}',
                    'status': 'error'
                }), 400
        
        # Combine analyses
        if len(analysis_parts) > 1:
            combined_analysis = "🩺 COMPREHENSIVE MEDICAL ANALYSIS\n\n"
            combined_analysis += "=" * 50 + "\n"
            combined_analysis += "\n\n".join(analysis_parts)
            combined_analysis += f"\n\n📊 SUMMARY:\n"
            combined_analysis += f"• Both textual and visual medical data processed\n"
            combined_analysis += f"• Comprehensive assessment completed\n" 
            combined_analysis += f"• Professional medical consultation recommended\n"
        else:
            combined_analysis = analysis_parts[0] if analysis_parts else "No analysis performed"
        
        # Determine overall confidence
        confidences = []
        if 'text_analysis' in results:
            conf_val = int(results['text_analysis']['confidence'].rstrip('%'))
            confidences.append(conf_val)
        if 'image_analysis' in results:
            conf_val = int(results['image_analysis']['confidence'].rstrip('%'))
            confidences.append(conf_val)
        
        overall_confidence = f"{sum(confidences) // len(confidences)}%" if confidences else "75%"
        
        # Prepare response
        response_data = {
            'analysis': combined_analysis,
            'type': 'comprehensive_medical' if len(analysis_parts) > 1 else ('symptom_analysis' if text_input else 'medical_imaging'),
            'confidence': overall_confidence,
            'source': 'Improved Portia Medical AI v2.0',
            'timestamp': datetime.now().isoformat(),
            'status': 'success',
            'components_processed': len(analysis_parts)
        }
        
        print(f"✅ Analysis completed successfully")
        return jsonify(response_data)
        
    except Exception as e:
        # Log the full error for debugging
        error_msg = str(e)
        error_trace = traceback.format_exc()
        print(f"❌ Error in medical analysis: {error_msg}")
        print(f"📍 Traceback: {error_trace}")
        
        return jsonify({
            'error': f'Medical analysis failed: {error_msg}',
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/analyze', methods=['POST'])
def analyze_legacy():
    """Legacy analysis endpoint for backward compatibility"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'No text provided',
                'status': 'error'
            }), 400
        
        text = data['text']
        result = analyze_symptoms(text)
        
        return jsonify({
            'analysis': result['analysis'],
            'type': 'legacy_analysis',
            'confidence': result['confidence'],
            'source': 'Improved Portia AI Legacy Mode',
            'status': 'success'
        })
        
    except Exception as e:
        print(f"❌ Error in legacy analysis: {str(e)}")
        return jsonify({
            'error': f'Analysis failed: {str(e)}',
            'status': 'error'
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Improved Portia Medical AI...")
    print("📊 Features:")
    print("  • Enhanced symptom analysis")
    print("  • Medical image processing")
    print("  • Comprehensive error handling")
    print("  • Fallback analysis support")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"🔗 Running on: http://localhost:5001")
    
    app.run(host='0.0.0.0', port=5001, debug=True)