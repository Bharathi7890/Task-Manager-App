function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Get task index from URL
const params = new URLSearchParams(window.location.search);
const taskIndex = parseInt(params.get("index"), 10);

// Get tasks
const taskList = JSON.parse(localStorage.getItem("tasks")) || [];
const task = taskList[taskIndex];

// DOM elements
const titleEl = document.getElementById("task-title");
const startEl = document.getElementById("task-start");
const deadlineEl = document.getElementById("task-deadline");
const priorityEl = document.getElementById("task-priority");
const historyListEl = document.getElementById("completion-history");
const suggestionEl = document.getElementById("task-suggestion");

if (task) {
  if (!task.completedByDate) task.completedByDate = {};

  // Show task info
  titleEl.innerText = task.title || "N/A";
  startEl.innerText = formatDate(task.startDate) || "N/A";
  deadlineEl.innerText = formatDate(task.deadline) || "N/A";
  priorityEl.innerText = task.priority || "Medium";

  const completedByDate = task.completedByDate;
  const sortedDates = Object.keys(completedByDate).sort();

  if (sortedDates.length === 0) {
    historyListEl.innerHTML = "<li>No completion history yet.</li>";
    suggestionEl.innerText = "No history to analyze yet. Try starting this task!";
  } else {
    sortedDates.forEach(date => {
      const li = document.createElement("li");
      li.innerText = `${formatDate(date)}: ${completedByDate[date] ? "Completed" : "Not completed"}`;
      historyListEl.appendChild(li);
    });

    // ====== Generate Suggestions ======
    const totalDays = sortedDates.length;
    const completedDays = sortedDates.filter(d => completedByDate[d]).length;
    const completionRate = completedDays / totalDays;

    if (completionRate === 1) {
      suggestionEl.innerText = "Excellent! You are fully consistent with this task.";
    } else if (completionRate >= 0.7) {
      suggestionEl.innerText = "Good consistency. Keep it up and stay on track!";
    } else if (completionRate >= 0.4) {
      suggestionEl.innerText = "You’re lacking consistency. Try focusing more on this task.";
    } else {
      suggestionEl.innerText = "Bad performance. You must prioritize completing this task.";
    }
  }
} else {
  titleEl.innerText = "Task not found";
  startEl.innerText = "-";
  deadlineEl.innerText = "-";
  priorityEl.innerText = "-";
  historyListEl.innerHTML = "<li>No completion history available.</li>";
  suggestionEl.innerText = "No suggestions available.";
}
