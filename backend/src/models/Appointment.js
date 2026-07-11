const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    department: { type: String, required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    slotStartTime: { type: String, required: true }, // "09:15"
    slotEndTime: { type: String, required: true },
    purpose: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Scheduled", "Arrived", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cancelReason: { type: String, trim: true },
  },
  { timestamps: true }
);

// THE concurrency guarantee: MongoDB enforces this at the storage engine level.
// Only ONE active (non-cancelled) appointment can exist for a given
// doctor + date + slot combination. If two requests race to insert the
// same slot, the second one gets a duplicate-key error (code 11000) —
// guaranteed by MongoDB itself, not by application logic.
// partialFilterExpression means a Cancelled appointment doesn't block rebooking the same slot.
appointmentSchema.index(
  { doctor: 1, date: 1, slotStartTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["Scheduled", "Arrived", "Completed"] } },
  }
);

// Supports search/filter/pagination in Step 9
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);