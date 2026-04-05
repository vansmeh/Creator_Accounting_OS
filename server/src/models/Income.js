import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ["YouTube", "Instagram", "Affiliate", "Brand Deal", "Other"],
    required: true,
  },
  amount:    { type: Number, required: true, min: 0 },
  date:      { type: Date, default: Date.now },
  note:      { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export const Income = mongoose.model("Income", incomeSchema);
