const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String, // student or teacher
  roll_no: String
});

module.exports = mongoose.model("User", userSchema);