const mongoose = require("mongoose");

const assignedTechnicianSchema = new mongoose.Schema(
  {
    technician_clerk_id: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["lead", "assistant"],
      required: true,
    },
  },
  { _id: false }
);

const serviceOrderTaskSchema = new mongoose.Schema({
  service_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceOrder",
    required: true,
  },
  expected_start_time: {
    // This will be used to avoid conflicts when scheduling tasks
    type: Date,
    required: true,
  },
  expected_end_time: {
    // This will be used to avoid conflicts when scheduling tasks
    type: Date,
    required: true,
  },
  actual_start_time: {
    type: Date,
  },
  actual_end_time: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["scheduled", "rescheduled", "in_progress", "completed"],
    default: "scheduled",
  },
  assigned_technicians: [assignedTechnicianSchema],
  assigned_bay_id: {
    // I assume every task will be done on a bay
    // The system will automatically assign a bay when scheduling tasks
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bay",
    required: true,
  },
});

const ServiceOrderTask = mongoose.model(
  "ServiceOrderTask",
  serviceOrderTaskSchema,
  "service_order_tasks"
);

const InspectionTask = ServiceOrderTask.discriminator(
  "inspection",
  new mongoose.Schema({
    media: [
      {
        type: mongoose.Types.ObjectId,
        ref: "MediaAsset",
      },
    ],
    comment: String,
  })
);

const ServicingTask = ServiceOrderTask.discriminator(
  "servicing",
  new mongoose.Schema({
    timeline: {
      type: [
        {
          title: { type: String, required: true },
          comment: { type: String, required: true },
          timestamp: { type: Date, required: true, default: Date.now },
          media: [
            {
              type: mongoose.Types.ObjectId,
              ref: "MediaAsset",
            },
          ],
        },
      ],
      default: [],
    },
  })
);

module.exports = {
  InspectionTask,
  ServicingTask,
  ServiceOrderTask,
};
