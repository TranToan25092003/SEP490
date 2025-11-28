const mongoose = require("mongoose");
const { Schema } = mongoose;

const AttendanceEntrySchema = new Schema(
  {
    staffId: {
      type: String,
      required: true,
      index: true,
    },
    staffName: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      default: "Technician",
    },
    morningShift: {
      type: Boolean,
      default: false,
    },
    afternoonShift: {
      type: Boolean,
      default: false,
    },
    totalWork: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    notes: {
      type: String,
    },
  },
  { _id: false, isEmbedded: true, embeddedModelName: "Attendance" }
);

const AttendanceStatsSchema = new Schema(
  {
    totalEmployees: { type: Number, default: 0 },
    presentMorning: { type: Number, default: 0 },
    presentAfternoon: { type: Number, default: 0 },
    fullDay: { type: Number, default: 0 },
  },
  { _id: false, isEmbedded: true, embeddedModelName: "Attendance" }
);

const AttendanceSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    entries: {
      type: [AttendanceEntrySchema],
      default: [],
    },
    stats: {
      type: AttendanceStatsSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ["draft", "saved"],
      default: "draft",
    },
    savedAt: {
      type: Date,
    },
    savedBy: {
      type: String,
    },
  },
  { timestamps: true }
);

const Attendance = mongoose.model("Attendance", AttendanceSchema);

module.exports = Attendance;
