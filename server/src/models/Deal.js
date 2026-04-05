import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  text:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const dealSchema = new mongoose.Schema(
  {
    brandName:  { type: String, required: true, trim: true },
    deliverable: {
      type: String,
      enum: ["Reel", "YouTube Video", "Story", "Blog Post", "Podcast", "Other"],
      required: true,
    },
    amountAgreed:   { type: Number, required: true, min: 0 },
    amountReceived: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["draft", "sent", "follow-up", "partially-paid", "paid", "overdue"],
      default: "draft",
    },
    dueDate:       { type: Date },
    paymentLink:   { type: String, default: "", trim: true },
    contentLink:   { type: String, default: "", trim: true },
    lastFollowUpAt:{ type: Date, default: null },
    notes:         [noteSchema],
    createdAt:     { type: Date, default: Date.now },
  },
  { timestamps: false }
);

dealSchema.virtual("pendingAmount").get(function () {
  return Math.max(this.amountAgreed - (this.amountReceived || 0), 0);
});

dealSchema.virtual("isOverdue").get(function () {
  return this.status !== "paid" && this.dueDate && this.dueDate < new Date();
});

dealSchema.set("toJSON",   { virtuals: true });
dealSchema.set("toObject", { virtuals: true });

export const Deal = mongoose.model("Deal", dealSchema);
