const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  student_id: String,
  subject_id: String,
  date: String,
  status: String // P or A
});

module.exports = mongoose.model("Attendance", attendanceSchema);