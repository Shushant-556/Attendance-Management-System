const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

// Models
const User = require("./models/User");
const Subject = require("./models/Subject");
const Attendance = require("./models/Attendance");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 MongoDB Connection
mongoose.connect("mongodb+srv://shushant_556:Satu123@cluster0.nkxwcjs.mongodb.net/attendanceDB")
.then(() => console.log("✅ DB Connected"))
.catch(err => console.log("❌ DB Error:", err));


// 🏠 Test Route
app.get("/", (req, res) => {
  res.send("🚀 Server is running");
});


// ================= USER =================

// ➕ Add User (with hashing)
app.post("/add-user", async (req, res) => {
  try {
    const { name, email, password, role, roll_no } = req.body;

    // 🔒 Hash password (roll no)
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      roll_no
    });

    await user.save();

    res.send("✅ User added");
  } catch (err) {
    res.status(500).send(err);
  }
});


// 🔐 Login (with hash compare)
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.send("❌ User not found");

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.send("❌ Wrong password");

    res.send(user);
  } catch (err) {
    res.status(500).send(err);
  }
});


// ================= SUBJECT =================

// ➕ Add Subject
app.post("/add-subject", async (req, res) => {
  try {
    const subject = new Subject(req.body);
    await subject.save();
    res.send("✅ Subject added");
  } catch (err) {
    res.status(500).send(err);
  }
});


// ================= ATTENDANCE =================

// 📅 Mark Attendance (with duplicate check)
app.post("/mark-attendance", async (req, res) => {
  try {
    const records = req.body;

    for (let record of records) {
      const exists = await Attendance.findOne({
        student_id: record.student_id,
        subject_id: record.subject_id,
        date: record.date
      });

      if (!exists) {
        await new Attendance(record).save();
      }
    }

    res.send("✅ Attendance marked");
  } catch (err) {
    res.status(500).send(err);
  }
});


// 📊 Get Today's Attendance
app.get("/attendance/today/:studentId", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  try {
    const data = await Attendance.find({
      student_id: req.params.studentId,
      date: today
    });

    res.send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});


// 📊 Get Percentage
app.get("/attendance/percentage/:studentId", async (req, res) => {
  try {
    const data = await Attendance.find({ student_id: req.params.studentId });

    const result = {};

    data.forEach(r => {
      if (!result[r.subject_id]) {
        result[r.subject_id] = { total: 0, present: 0 };
      }

      result[r.subject_id].total++;
      if (r.status === "P") result[r.subject_id].present++;
    });

    const final = [];

    for (let sub in result) {
      const { total, present } = result[sub];
      const percent = ((present / total) * 100).toFixed(2);

      final.push({
        subject: sub,
        present,
        total,
        percentage: percent + "%"
      });
    }

    res.send(final);
  } catch (err) {
    res.status(500).send(err);
  }
});


// 🔥 FINAL STUDENT DASHBOARD API
app.get("/student-dashboard/:studentId", async (req, res) => {
  const studentId = req.params.studentId;
  const today = new Date().toISOString().split("T")[0];

  try {
    const todayData = await Attendance.find({
      student_id: studentId,
      date: today
    });

    const allData = await Attendance.find({ student_id: studentId });
    const subjects = await Subject.find();

    // 🔄 Subject Map
    const subjectMap = {};
    subjects.forEach(sub => {
      subjectMap[sub._id] = sub.name;
      subjectMap[sub.name] = sub.name;
    });

    // 🔹 TODAY FORMAT
    const todayFormatted = todayData.map(item => ({
      subject: subjectMap[item.subject_id] || item.subject_id,
      status: item.status
    }));

    // 🔹 TODAY SUMMARY
    const totalClasses = todayData.length;
    const presentCount = todayData.filter(i => i.status === "P").length;

    // 🔹 OVERALL %
    const result = {};

    allData.forEach(r => {
      if (!result[r.subject_id]) {
        result[r.subject_id] = { total: 0, present: 0 };
      }
      result[r.subject_id].total++;
      if (r.status === "P") result[r.subject_id].present++;
    });

    const overall = [];

    for (let sub in result) {
      const { total, present } = result[sub];
      const percent = ((present / total) * 100).toFixed(2);

      overall.push({
        subject: subjectMap[sub] || sub,
        percentage: percent + "%"
      });
    }

    // 🔹 WEEKLY DATA (last 7 days)
    const weeklyMap = {};

    allData.forEach(r => {
      if (!weeklyMap[r.date]) {
        weeklyMap[r.date] = { total: 0, present: 0 };
      }

      weeklyMap[r.date].total++;
      if (r.status === "P") weeklyMap[r.date].present++;
    });

    const weekly = Object.keys(weeklyMap)
      .sort((a, b) => new Date(b) - new Date(a))
      .slice(0, 7)
      .map(date => ({
        date,
        total: weeklyMap[date].total,
        present: weeklyMap[date].present
      }));

    // 🔥 FINAL RESPONSE
    res.send({
      today: todayFormatted,
      todaySummary: {
        totalClasses,
        present: presentCount
      },
      overall,
      weekly
    });

  } catch (err) {
    res.status(500).send(err);
  }
});

// 🚀 Start Server
app.listen(5000, () => {
  console.log("🔥 Server running on port 5000");
});