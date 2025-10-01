// ======== Variables ========
let taskList = JSON.parse(localStorage.getItem("tasks")) || [];

// ======== Date Formatter ========
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

// ======== Helper: Get Today String ========
function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

// ======== Helper: Check if task active on date ========
function isTaskActiveOnDate(task, dateStr) {
  const current = new Date(dateStr);
  const start = task.startDate ? new Date(task.startDate) : null;
  const end = task.deadline ? new Date(task.deadline) : null;

  if (start && end) return current >= start && current <= end;
  if (start) return current >= start;
  if (end) return current <= end;
  return true; // always active if no dates
}

// ======== Save Tasks ========
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(taskList));
  updateProgress(getTodayStr());
}

// ======== Update Progress Bar ========
function updateProgress(dateStr) {
  const todayStr = dateStr || getTodayStr();

  const tasksForToday = taskList.filter(task => isTaskActiveOnDate(task, todayStr));

  const completed = tasksForToday.reduce((acc, task) => {
    if (!task.completedByDate) return acc;
    return acc + (task.completedByDate[todayStr] ? 1 : 0);
  }, 0);

  const total = tasksForToday.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  if (progressBar) progressBar.style.width = progress + "%";
  if (progressText) progressText.innerText = progress + "% completed";
}

// ======== Render All Tasks Grouped (tasks.html) ========
function renderTasks(filter = "all", listElementId = "task-list") {
  const listElement = document.getElementById(listElementId);
  if (!listElement) return;
  listElement.innerHTML = "";

  const todayStr = getTodayStr();
  const tomorrowStr = new Date(new Date().setDate(new Date().getDate() + 1))
    .toISOString()
    .split("T")[0];

  // Group tasks
  const todayTasks = taskList.filter(task => isTaskActiveOn(task, todayStr));
  const tomorrowTasks = taskList.filter(task => isTaskActiveOn(task, tomorrowStr) && !isTaskActiveOn(task, todayStr));
  const futureTasks = taskList.filter(task => task.startDate && task.startDate > tomorrowStr);

  // Render sections
  renderTaskSection("Today", todayTasks, listElement, filter, todayStr);
  renderTaskSection("Tomorrow", tomorrowTasks, listElement, filter, tomorrowStr);
  renderTaskSection("Upcoming", futureTasks, listElement, filter);
}

// ======== Helper: Check if task is active on a given date ========
function isTaskActiveOn(task, dateStr) {
  const startDate = task.startDate ? task.startDate.trim() : "";
  const deadline = task.deadline ? task.deadline.trim() : "";
  return (
    (!startDate || startDate <= dateStr) &&
    (!deadline || deadline >= dateStr)
  );
}

// ======== Render a Section ========
function renderTaskSection(title, tasks, container, filter, dateStr = null) {
  const section = document.createElement("div");
  section.className = "task-section";

  const heading = document.createElement("h3");
  heading.innerText = title;
  section.appendChild(heading);

  const ul = document.createElement("ul");

  if (tasks.length === 0) {
    const li = document.createElement("li");
    li.innerText = `No ${title.toLowerCase()} tasks.`;
    ul.appendChild(li);
  } else {
    tasks.forEach((task, index) => {
      if (!task.completedByDate) task.completedByDate = {};
      const dayStr = dateStr || getTodayStr();
      const isCompleted = task.completedByDate[dayStr] || false;

      // Apply filters
      if (filter === "pending" && isCompleted) return;
      if (filter === "completed" && !isCompleted) return;

      const li = document.createElement("li");
      li.className = isCompleted ? "completed" : "";

      li.innerHTML = `
        <input type="checkbox" class="task-checkbox" id="task-${index}-${title}" ${isCompleted ? "checked" : ""}>
        <label for="task-${index}-${title}">${task.title}</label>
        <span>Start: ${task.startDate ? formatDate(task.startDate) : "N/A"} | Deadline: ${task.deadline ? formatDate(task.deadline) : "No deadline"}</span>
        <p>${task.description || "No description"}</p>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
        <button class="view-detail-btn">View Analysis</button>
      `;

      // Checkbox
      li.querySelector(".task-checkbox").addEventListener("change", e => {
        task.completedByDate[dayStr] = e.target.checked;
        saveTasks();
        renderTasks(filter, container.id);
      });

      // Edit
      li.querySelector(".edit-btn").addEventListener("click", () => {
        const newTitle = prompt("Edit task title", task.title);
        if (newTitle) {
          task.title = newTitle;
          saveTasks();
          renderTasks(filter, container.id);
        }
      });

      // Delete
      li.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm("Delete this task?")) {
          taskList.splice(taskList.indexOf(task), 1);
          saveTasks();
          renderTasks(filter, container.id);
        }
      });

      // View detail
      li.querySelector(".view-detail-btn").addEventListener("click", () => {
        window.location.href = `task-detail.html?index=${taskList.indexOf(task)}`;
      });

      ul.appendChild(li);
    });
  }

  section.appendChild(ul);
  container.appendChild(section);
}



// ======== Generate Next 10 Days Buttons (Dashboard) ========
function generateDateButtons() {
  const container = document.getElementById("date-buttons");
  if (!container) return;
  container.innerHTML = "";

  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const btn = document.createElement("button");
    btn.innerText = i === 0 ? "Today" : formatDate(dateStr);
    btn.dataset.date = dateStr;

    btn.addEventListener("click", () => {
      renderQuickTasks(dateStr);
      updateProgress(dateStr);
      document.querySelectorAll("#date-buttons button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });

    if (i === 0) btn.classList.add("active"); // Auto-select today

    container.appendChild(btn);
  }
}

// ======== Render Quick Tasks (Dashboard) ========
function renderQuickTasks(selectedDate = null) {
  const quickList = document.getElementById("quick-task-list");
  if (!quickList) return;

  quickList.innerHTML = "";
  const dateStr = selectedDate || getTodayStr();

  const tasksForDate = taskList.filter(task => isTaskActiveOnDate(task, dateStr));

  if (tasksForDate.length === 0) {
    const li = document.createElement("li");
    li.innerText = "No tasks scheduled for this day.";
    quickList.appendChild(li);
    return;
  }

  tasksForDate.forEach((task, index) => {
    if (!task.completedByDate) task.completedByDate = {};
    const isCompleted = task.completedByDate[dateStr] || false;

    const li = document.createElement("li");
    li.className = isCompleted ? "completed" : "";

    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" id="quick-${index}" ${isCompleted ? "checked" : ""}>
      <label for="quick-${index}">${task.title}</label>
      <span>
        ${task.startDate ? formatDate(task.startDate) : "No start"} → 
        ${task.deadline ? formatDate(task.deadline) : "No deadline"}
      </span>
      <p>${task.description || "No description"}</p>
      <button class="view-detail-btn">View Analysis</button>
    `;

    li.querySelector(".task-checkbox").addEventListener("change", e => {
      task.completedByDate[dateStr] = e.target.checked;
      saveTasks();
      renderQuickTasks(dateStr);
    });

    li.querySelector(".view-detail-btn").addEventListener("click", () => {
      window.location.href = `task-detail.html?index=${taskList.indexOf(task)}`;
    });

    quickList.appendChild(li);
  });
}

// ======== Task Form Submission ========
const taskForm = document.getElementById("task-form");
if (taskForm) {
  taskForm.addEventListener("submit", e => {
    e.preventDefault();
    const title = document.getElementById("task-title").value.trim();
    let startDate = document.getElementById("task-start").value;
    const deadline = document.getElementById("task-deadline").value;
    const description = document.getElementById("task-desc").value.trim();

    if (!title) return;

    if (!startDate) startDate = new Date().toISOString().split("T")[0];

    taskList.push({
      title,
      startDate,
      deadline,
      description,
      completedByDate: {}
    });

    saveTasks();
    renderTasks();
    renderQuickTasks();
    taskForm.reset();
  });
}

// ======== Get Missed Tasks ========
function getMissedTasks() {
  const today = getTodayStr();
  return taskList.filter(task => {
    const deadline = task.deadline ? task.deadline.trim() : "";
    if (!deadline) return false; // no deadline = can't miss
    return deadline < today && !(task.completedByDate && task.completedByDate[deadline]);
  });
}
// ======== Render Missed Tasks ========
function renderMissedTasks() {
  const listEl = document.getElementById("missed-task-list");
  if (!listEl) return;

  listEl.innerHTML = "";
  const missedTasks = getMissedTasks();

  if (missedTasks.length === 0) {
    listEl.innerHTML = "";
    return;
  }

  missedTasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <label>${task.title}</label>
      <span>Deadline: ${formatDate(task.deadline)}</span>
      <p>${task.description || "No description"}</p>
      <button class="reschedule-btn">Reschedule</button>
    `;




    // Reschedule button → pick new deadline
    li.querySelector(".reschedule-btn").addEventListener("click", () => {
      const newDate = prompt("Enter new deadline (YYYY-MM-DD):", getTodayStr());
      if (newDate) {
        task.deadline = newDate;
        saveTasks();
        renderMissedTasks();
        renderTasks();
      }
    });

    listEl.appendChild(li);
  });
}

function updateMissedLink() {
  const missedLink = document.querySelector(".missed-link");
  if (!missedLink) return;

  const missedTasks = getMissedTasks();
  if (missedTasks.length === 0) {
    missedLink.textContent = "✅ No Missed Tasks";
    missedLink.classList.add("success");
  } else {
    missedLink.textContent = "❌ See Missed Tasks";
    missedLink.classList.remove("success");
  }
}

// ======== Filters for All Tasks Page ========
document.querySelectorAll("#filters button").forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.getAttribute("data-filter");
    renderTasks(filter);
  });
});

// ======== Initial Render ========



document.addEventListener("DOMContentLoaded", () => {
  generateDateButtons();
  renderQuickTasks();
  renderTasks();
  renderMissedTasks(); 
  updateMissedLink();  // ✅ add this
  updateProgress();
});
