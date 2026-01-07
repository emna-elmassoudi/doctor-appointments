const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    // ✅ facility optional (private doctor => null)
    facility: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Facility",
  default: null,
  required: false,
},


    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

/**
 * ✅ Prevent double booking:
 * - Same doctor + same date cannot exist twice if status != "cancelled"
 * - If cancelled, new appointment same slot is allowed
 */
appointmentSchema.index(
  { doctor: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed"] },
    },
  }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
