require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const doctorService = require("../services/doctor.service");
const scheduleService = require("../services/schedule.service");
const receptionistService = require("../services/receptionist.service");
const patientService = require("../services/patient.service");

const log = (msg) => console.log(`  ${msg}`);

const seedSuperAdmin = async () => {
  const email = "admin@emr.com";
  const existing = await User.findOne({ email });
  if (existing) {
    log("✔ Super Admin already exists — skipping");
    return;
  }
  await User.create({
    name: "Super Admin",
    email,
    password: "Admin@123",
    role: "superadmin",
  });
  log("✅ Super Admin created: admin@emr.com / Admin@123");
};

const seedReceptionist = async () => {
  const email = "priya@emr.com";
  const existing = await User.findOne({ email });
  if (existing) {
    log("✔ Receptionist already exists — skipping");
    return;
  }
  await receptionistService.createReceptionist({
    name: "Priya Nair",
    email,
    password: "Reception@123",
  });
  log("✅ Receptionist created: priya@emr.com / Reception@123");
};

const seedDoctorWithSchedule = async () => {
  const email = "anu@emr.com";
  const existingUser = await User.findOne({ email });

  let doctor;
  if (existingUser) {
    log("✔ Doctor account already exists — skipping creation");
    doctor = await Doctor.findOne({ user: existingUser._id });
  } else {
    const result = await doctorService.createDoctor({
      name: "Dr. Anu Nair",
      email,
      password: "Doctor@123",
      department: "Cardiology",
      specialization: "Interventional Cardiology",
      phone: "9000000000",
    });
    doctor = result.doctor;
    log("✅ Doctor created: anu@emr.com / Doctor@123");
  }

  const existingSchedule = await scheduleService
    .getScheduleByDoctor(doctor._id)
    .catch(() => null);

  if (existingSchedule) {
    log("✔ Schedule already configured — skipping");
  } else {
    await scheduleService.upsertSchedule(doctor._id, {
      workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      sessions: [
        { name: "Morning", startTime: "09:00", endTime: "12:00" },
        { name: "Evening", startTime: "13:00", endTime: "17:00" },
      ],
      breaks: [{ startTime: "12:00", endTime: "13:00" }],
      slotDuration: 15,
    });
    log("✅ Schedule configured: Mon–Fri, 09:00–12:00 & 13:00–17:00, 15-min slots");
  }

  return doctor;
};

const seedPatients = async () => {
  const samplePatients = [
    { name: "Ravi Kumar", mobile: "9876543210", age: 34, gender: "Male" },
    { name: "Meena Pillai", mobile: "9123456780", age: 29, gender: "Female" },
  ];

  for (const p of samplePatients) {
    const existing = await Patient.findOne({ mobile: p.mobile, name: p.name });
    if (existing) {
      log(`✔ Patient "${p.name}" already exists — skipping`);
      continue;
    }
    await patientService.createPatient(p);
    log(`✅ Patient created: ${p.name} (${p.mobile})`);
  }
};

const run = async () => {
  await connectDB();
  console.log("\n🌱 Seeding demo data...\n");

  await seedSuperAdmin();
  await seedReceptionist();
  await seedDoctorWithSchedule();
  await seedPatients();

  console.log("\n✅ Demo data ready. Login credentials:\n");
  console.log("  Super Admin   → admin@emr.com   / Admin@123");
  console.log("  Receptionist  → priya@emr.com   / Reception@123");
  console.log("  Doctor        → anu@emr.com     / Doctor@123");
  console.log("\nDoctor \"Dr. Anu Nair\" (Cardiology) has a working schedule");
  console.log("configured for Mon–Fri, so slots are immediately bookable.\n");

  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});