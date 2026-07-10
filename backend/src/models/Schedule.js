const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },       // e.g. "Morning", "Evening"
    startTime: { type: String, required: true },  // "09:00"
    endTime: { type: String, required: true },    // "12:00"
  },
  { _id: false }
);

const breakSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const scheduleSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true, // one schedule config per doctor
    },
    workingDays: {
      type: [String],
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      required: true,
    },
    sessions: { type: [sessionSchema], required: true },
    breaks: { type: [breakSchema], default: [] },
    slotDuration: { type: Number, required: true, min: 5 }, // minutes
  },
  { timestamps: true }
);

module.exports = mongoose.model("Schedule", scheduleSchema);