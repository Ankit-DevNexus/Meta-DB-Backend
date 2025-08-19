// models/Token.js
import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema({
  crm_user_id: String,
  page_id: String,
  page_name: String,
  page_access_token: String,
  user_access_token: String,
  token_created_at: Date,
});

const TokenModel = mongoose.model("Token", TokenSchema);
export default TokenModel;