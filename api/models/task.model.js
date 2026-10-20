const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  done: { type: Boolean, default: false },
  priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
