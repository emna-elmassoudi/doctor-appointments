const mongoose = require("mongoose");

const facilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["clinic", "hospital"], required: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

facilitySchema.index({ name: 1 });

module.exports = mongoose.model("Facility", facilitySchema);
