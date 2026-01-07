require("dotenv").config();
const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const User = require("../models/User");

const makeDoctorEmail = (doctor) =>
  `${doctor.fullName}`.toLowerCase().replace(/\s+/g, ".") +
  `.${String(doctor.facilityId).slice(-4)}@doctor.local`;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // ensure index exists (safe)
  try {
    await Doctor.collection.createIndex({ user: 1 }, { unique: true, sparse: true });
  } catch (e) {
    console.log("ℹ️ Index maybe already exists:", e.message);
  }

  const docs = await Doctor.find({ user: { $exists: false } });
  console.log("👨‍⚕️ Doctors to migrate:", docs.length);

  let created = 0;
  let linked = 0;

  for (const doc of docs) {
    const email = makeDoctorEmail(doc);

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        fullName: doc.fullName,
        email,
        password: "doctor123", // ✅ default password
        role: "doctor",
        facilityId: doc.facilityId,
      });
      created++;
    }

    doc.user = user._id;
    await doc.save();
    linked++;

    console.log(`✅ Linked Doctor(${doc._id}) -> User(${user._id}) email=${email}`);
  }

  console.log(`\n✅ Migration done. Users created: ${created}, Doctors linked: ${linked}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("❌ Migration failed:", err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
