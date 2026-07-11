const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
    },
    age: { type: Number, min: 0 },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    address: { type: String, trim: true },
  },
  { timestamps: true }
);

// Mobile is the most common lookup during booking — index it, but not unique
// since family members can share a number and we don't want false conflicts
patientSchema.index({ mobile: 1 });

// Supports "search by name" without a full-text index — good enough at this scale,
// documented in ENGINEERING_DECISIONS.md as a candidate for a text index later
patientSchema.index({ name: 1 });

module.exports = mongoose.model("Patient", patientSchema);