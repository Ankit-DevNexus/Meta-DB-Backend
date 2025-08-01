import mongoose from 'mongoose';

const MetaLeadSchema = new mongoose.Schema({
  lead_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  form_id: { 
    type: String 
  },
  created_time: { 
    type: Date 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  // source: { type: Array },           // full field_data array
  AllFields: { 
    type: Object 
  }   // flattened key-value fields
});

const metaAdsLeadsModel = mongoose.model('MetaLead', MetaLeadSchema);
export default metaAdsLeadsModel;

