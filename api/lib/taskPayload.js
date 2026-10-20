const PRIORITIES = ["low", "normal", "high"];

function normalizePriority(value) {
  return PRIORITIES.includes(value) ? value : "normal";
}

function buildTaskUpdate(body = {}) {
  const update = {};
  if (typeof body.title === "string") update.title = body.title;
  if (typeof body.description === "string") update.description = body.description;
  if (typeof body.done === "boolean") update.done = body.done;
  if (PRIORITIES.includes(body.priority)) update.priority = body.priority;
  return update;
}

module.exports = {
  PRIORITIES,
  normalizePriority,
  buildTaskUpdate,
};
