import mongoose from 'mongoose';

const SubPointSchema = new mongoose.Schema({
  point: { type: String, required: true },
  sourceId: { type: String, required: true },
  footnote: { type: String, required: true }
}, { _id: false });

const SuggestedFootnoteSchema = new mongoose.Schema({
  sourceId: { type: String, required: true },
  text: { type: String, required: true }
}, { _id: false });

const PlanItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  // تم إضافة 'problem_statement' للأنواع المدعومة
  type: { 
    type: String, 
    enum: ['introduction', 'section', 'demand', 'conclusion', 'references', 'problem_statement'], 
    required: true 
  },
  order: Number,
  status: { 
    type: String, 
    enum: ['pending', 'generating', 'completed', 'failed'], 
    default: 'pending' 
  },
  content: { type: String, default: '' },
  // ⭐ نقاط فرعية مهيكلة مع ربط صارم بالمراجع العالمية
  subPoints: { type: [SubPointSchema], default: [] },
  openingDirective: { type: String, default: '' },
  closingDirective: { type: String, default: '' },
  suggestedFootnotes: { type: [SuggestedFootnoteSchema], default: [] },
  footnotes: [{ 
    id: Number, 
    text: String,
  }],
  retryCount: { type: Number, default: 0 }
});

const ResearchSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creatorRole: String,
  title: String,
  university: String,
  faculty: String,
  department: String,
  level: String,
  doctorName: String,
  universityLogo: String,
  students: [String],
  discipline: String,
  methodology: {
    problemStatement: String,
    hypotheses: [String],
    approach: { type: String, default: 'تحليلي' },
    // ⭐ إضافة المراجع العالمية التي تولد في المرحلة الأولى لتستخدم في كل البحث
    globalSources: [{ id: String, text: String }] 
  },
  settings: {
    depth: { type: String, default: 'standard' },
    tone: { type: String, default: 'academic_dry' },
    citationStyle: { type: String, default: 'قانوني جزائري' },
    language: { type: String, default: 'ar' }
  },
  plan: [PlanItemSchema],
  status: {
    stage: { type: String, default: 'problem_statement' },
    progress: { type: Number, default: 0 }
  },
  metadata: {
    downloadCount: { type: Number, default: 0 }
  }
}, { timestamps: true });

// إضافة index لتحسين سرعة البحث للمستخدم
ResearchSchema.index({ creatorId: 1, createdAt: -1 });

export const Research = mongoose.model('Research', ResearchSchema);
