const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    specialization: { type: String, trim: true },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Speeds up "filter by department" queries required by the scheduler
doctorSchema.index({ department: 1 });

module.exports = mongoose.model("Doctor", doctorSchema);