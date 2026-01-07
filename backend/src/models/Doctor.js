const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },

    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

// indexes (helpful for filtering)
doctorSchema.index({ facilityId: 1 });
doctorSchema.index({ fullName: 1 });

module.exports = mongoose.model("Doctor", doctorSchema);
