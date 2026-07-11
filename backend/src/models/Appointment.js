const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    department: { type: String, required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    slotStartTime: { type: String, required: true }, // "09:15"
    slotEndTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["Scheduled", "Arrived", "Completed", "Cancelled"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

// Speeds up the exact query slot generation runs on every request
appointmentSchema.index({ doctor: 1, date: 1, status: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);