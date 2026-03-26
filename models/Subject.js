const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: String,
  teacher_id: String
});

module.exports = mongoose.model("Subject", subjectSchema);