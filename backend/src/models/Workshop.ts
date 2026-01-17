import mongoose, { Schema, Document } from 'mongoose';
import type { Behavior, SOPData } from '../types.js';

export interface IWorkshop extends Document {
  vision: string;
  behaviors: Behavior[];
  sopData?: SOPData;
}

const BehaviorSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  color: { type: String, required: true },
  intuitivePosition: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  rationalScore: {
    impact: Number,
    ability: Number
  },
  isEvaluated: { type: Boolean, default: false },
  isGolden: { type: Boolean, default: false },
  rotation: { type: Number, required: true },
  source: { type: String, enum: ['user', 'ai'], default: 'user' },
  aiEvaluation: {
    isBehavior: Boolean,
    suggestion: String,
    scores: {
      actionable: Number,
      specific: Number,
      tiny: Number,
      relevance: Number
    },
    chatHistory: [{
      role: { type: String, enum: ['ai', 'user'] },
      content: String
    }],
    finalSummary: String,
    isComplete: { type: Boolean, default: false },
    rationalScore: {
      impact: Number,
      ability: Number
    }
  }
}, { _id: false });

const WorkshopSchema: Schema = new Schema({
  vision: { type: String, default: '' },
  behaviors: [BehaviorSchema],
  sopData: {
    title: String,
    overview: String,
    sections: [{
      behaviorText: String,
      behaviorType: String,
      steps: [String],
      tips: [String],
      motivation: String
    }]
  }
}, { timestamps: true });

export default mongoose.model<IWorkshop>('Workshop', WorkshopSchema);
