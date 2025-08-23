import mongoose from 'mongoose';

const AnalysisSchema = new mongoose.Schema({
  userInput: {
    text: { type: String, default: null },
    imageFilename: { type: String, default: null },
  },
  userId: { type: String, default: null }, // For Auth0 user tracking
  aiResponse: { type: Object, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('Analysis', AnalysisSchema);