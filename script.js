// My Goals Tracker — complete JavaScript
// Keeps the existing localStorage key "tasks" so previously saved goals can be migrated.

const taskInput = document.getElementById("taskInput");
const categoryInput = document.getElementById("categoryInput");
const dueDateInput = document.getElementById("dueDateInput");
const priorityInput = document.getElementById("priorityInput");
const goalForm = document.getElementById("goalForm");
const taskList = document.getElementById("taskList");
const progress = document.getElementById("progress");
const progressBar = document.getElementById("progressBar");
const percentageText = document.getElementById("percentage");
const progressTrack = document.getElementById("progressTrack");
const filterButtons = document.querySelectorAll(".filter-button");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");
const emptyState = document.getElementById("emptyState");
const totalCount = document.getElementById("totalCount");
const activeCount = document.getElementById("activeCount");
const completedCount = document.getElementById("completedCount");
const categorySummary = document.getElementById("categorySummary");
const formMessage = document.getElementById("formMessage");
const dataMessage = document.getElementById("dataMessage");
const themeToggle = document.getElementById("themeToggle");
const editDialog = document.getElementById("editDialog");
const editForm = document.getElementById("editForm");
const editId = document.getElementById("editId");
const editTaskInput = document.getElementById("editTaskInput");
const editDueDateInput = document.getElementById("editDueDateInput");
const editCategoryInput = document.getElementById("editCategoryInput");
const editPriorityInput = document.getElementById("editPriorityInput");

let tasks = loadTasks();
let currentFilter = "all";
let nextId = Math.max(0, ...tasks.map(task => Number(task.id) || 0)) + 1;

function loadTasks() {
    try {
        const saved = JSON.parse(localStorage.getItem("tasks")) || [];

        if (!Array.isArray(saved)) return [];

        return saved.map((task, index) => ({
            id: task.id ?? (Date.now() + index),
            text: String(task.text ?? "").trim(),
            category: task.category || "Personal",
            dueDate: task.dueDate || "",
            priority: task.priority || "Medium",
            completed: Boolean(task.completed),
            createdAt: task.createdAt || Date.now() + index
        })).filter(task => task.text);
    } catch (error) {
        console.error("Could not load saved goals:", error);
        return [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    } catch (error) {
        showMessage(
            dataMessage,
            "Could not save changes in this browser. Export a backup if possible."
        );

        console.error("Could not save goals:", error);
    }
}

function showMessage(element, message) {
    element.textContent = message;

    if (message) {
        window.setTimeout(() => {
            if (element.textContent === message) {
                element.textContent = "";
            }
        }, 3500);
    }
}

function dateAtLocalMidnight(dateString) {
    if (!dateString) return null;

    const parts = dateString.split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        return null;
    }

    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function startOfToday() {
    const today = new Date();

    return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );
}

function getDueStatus(task) {
    if (!task.dueDate || task.completed) {
        return {
            className: "due-none",
            label: task.dueDate || "No due date"
        };
    }

    const due = dateAtLocalMidnight(task.dueDate);

    if (!due) {
        return {
            className: "due-none",
            label: task.dueDate
        };
    }

    const today = startOfToday();
    const days = Math.round((due - today) / 86400000);

    if (days < 0) {
        return {
            className: "due-overdue",
            label: `Overdue · ${task.dueDate}`
        };
    }

    if (days === 0) {
        return {
            className: "due-today",
            label: "Due today"
        };
    }

    if (days <= 3) {
        return {
            className: "due-upcoming",
            label: `Due soon · ${task.dueDate}`
        };
    }

    return {
        className: "due-none",
        label: `Due · ${task.dueDate}`
    };
}

function priorityRank(priority) {
    return ({
        High: 0,
        Medium: 1,
        Low: 2
    })[priority] ?? 1;
}

function getVisibleTasks() {
    const search = searchInput.value.trim().toLowerCase();

    let visible = tasks.filter(task => {
        const matchesStatus =
            currentFilter === "all" ||
            (currentFilter === "active" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        const matchesCategory =
            categoryFilter.value === "all" ||
            task.category === categoryFilter.value;

        const matchesSearch =
            task.text.toLowerCase().includes(search);

        return matchesStatus && matchesCategory && matchesSearch;
    });

    visible.sort((a, b) => {
        switch (sortSelect.value) {
            case "dueDate":
                if (!a.dueDate && !b.dueDate) {
                    return Number(b.createdAt) - Number(a.createdAt);
                }

                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;

                return a.dueDate.localeCompare(b.dueDate);

            case "priority":
                return priorityRank(a.priority) - priorityRank(b.priority);

            case "alphabetical":
                return a.text.localeCompare(b.text);

            case "created":
            default:
                return Number(b.createdAt) - Number(a.createdAt);
        }
    });

    return visible;
}

function makeBadge(text, className = "") {
    const badge = document.createElement("span");

    badge.className = `badge ${className}`.trim();
    badge.textContent = text;

    return badge;
}

function displayTask(task) {
    const card = document.createElement("article");

    card.className = "goal-card";

    if (task.completed) {
        card.classList.add("completed");
    }

    const content = document.createElement("div");
    content.className = "goal-content";

    const title = document.createElement("span");
    title.className = "goal-title";
    title.textContent = task.text;

    const meta = document.createElement("div");
    meta.className = "goal-meta";

    meta.appendChild(makeBadge(task.category));

    meta.appendChild(
        makeBadge(
            `${task.priority} priority`,
            `priority-${task.priority.toLowerCase()}`
        )
    );

    const dueStatus = getDueStatus(task);

    meta.appendChild(
        makeBadge(dueStatus.label, dueStatus.className)
    );

    content.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "goal-actions";

    // Complete or undo button
    const completeButton = document.createElement("button");

    completeButton.type = "button";
    completeButton.className = "complete-button";
    completeButton.textContent = task.completed
        ? "↶ Undo"
        : "✓ Complete";

    completeButton.setAttribute(
        "aria-label",
        task.completed
            ? `Undo completion of ${task.text}`
            : `Complete ${task.text}`
    );

    completeButton.addEventListener("click", () => {
        task.completed = !task.completed;

        saveTasks();
        render();
    });

    // Edit button
    const editButton = document.createElement("button");

    editButton.type = "button";
    editButton.className = "edit-button";
    editButton.textContent = "✎ Edit";

    editButton.addEventListener("click", () => {
        openEditDialog(task);
    });

    // Delete button
    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
        const confirmed = window.confirm(
            `Delete "${task.text}"? This cannot be undone.`
        );

        if (!confirmed) return;

        tasks = tasks.filter(
            item => String(item.id) !== String(task.id)
        );

        saveTasks();
        render();

        showMessage(formMessage, "Goal deleted.");
    });

    actions.append(
        completeButton,
        editButton,
        deleteButton
    );

    card.append(content, actions);

    taskList.appendChild(card);
}

function updateSummary() {
    const completed = tasks.filter(task => task.completed).length;
    const active = tasks.length - completed;

    const percent = tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0;

    totalCount.textContent = tasks.length;
    activeCount.textContent = active;
    completedCount.textContent = completed;

    progress.textContent = `Completed: ${completed} of ${tasks.length}`;

    progressBar.style.width = `${percent}%`;
    percentageText.textContent = `${percent}%`;

    progressTrack.setAttribute(
        "aria-valuenow",
        String(percent)
    );

    categorySummary.replaceChildren();

    ["Personal", "Health", "Learning", "Work"].forEach(category => {
        const categoryTasks = tasks.filter(
            task => task.category === category
        );

        if (!categoryTasks.length) return;

        const categoryCompleted = categoryTasks.filter(
            task => task.completed
        ).length;

        const categoryPercent = Math.round(
            (categoryCompleted / categoryTasks.length) * 100
        );

        const wrap = document.createElement("div");
        wrap.className = "category-progress";

        const top = document.createElement("div");
        top.className = "category-progress-top";

        const name = document.createElement("span");
        name.textContent = category;

        const stats = document.createElement("strong");
        stats.textContent =
            `${categoryCompleted}/${categoryTasks.length}`;

        top.append(name, stats);

        const track = document.createElement("div");
        track.className = "mini-track";

        const fill = document.createElement("div");
        fill.className = "mini-fill";
        fill.style.width = `${categoryPercent}%`;

        track.appendChild(fill);
        wrap.append(top, track);

        categorySummary.appendChild(wrap);
    });
}

function render() {
    taskList.replaceChildren();

    const visible = getVisibleTasks();

    visible.forEach(displayTask);

    emptyState.hidden = visible.length > 0;

    updateSummary();
}

function openEditDialog(task) {
    editId.value = String(task.id);
    editTaskInput.value = task.text;
    editDueDateInput.value = task.dueDate || "";
    editCategoryInput.value = task.category || "Personal";
    editPriorityInput.value = task.priority || "Medium";

    if (typeof editDialog.showModal === "function") {
        editDialog.showModal();
    } else {
        window.alert(
            "Your browser does not support the edit dialog. Please use a modern browser."
        );

        return;
    }

    editTaskInput.focus();
}

// Add a new goal
goalForm.addEventListener("submit", event => {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (!text) {
        showMessage(formMessage, "Please enter a goal name.");
        taskInput.focus();
        return;
    }

    const duplicate = tasks.some(task =>
        task.text.toLowerCase() === text.toLowerCase() &&
        !task.completed
    );

    if (
        duplicate &&
        !window.confirm(
            "You already have an active goal with this name. Add another anyway?"
        )
    ) {
        return;
    }

    tasks.push({
        id: nextId++,
        text,
        category: categoryInput.value,
        dueDate: dueDateInput.value,
        priority: priorityInput.value,
        completed: false,
        createdAt: Date.now()
    });

    saveTasks();

    goalForm.reset();

    categoryInput.value = "Personal";
    priorityInput.value = "Medium";

    render();

    showMessage(formMessage, "Goal added successfully!");

    taskInput.focus();
});

// Filter goals by status
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(filterButton => {
            const active = filterButton === button;

            filterButton.classList.toggle("active", active);

            filterButton.setAttribute(
                "aria-pressed",
                String(active)
            );
        });

        render();
    });
});

// Search, category filter, and sorting
searchInput.addEventListener("input", render);
categoryFilter.addEventListener("change", render);
sortSelect.addEventListener("change", render);

// Close the edit dialog
function closeEditDialog() {
    if (typeof editDialog.close === "function") {
        editDialog.close();
    }
}

document
    .getElementById("closeEditButton")
    .addEventListener("click", closeEditDialog);

document
    .getElementById("cancelEditButton")
    .addEventListener("click", closeEditDialog);

// Save edits to a goal
editForm.addEventListener("submit", event => {
    event.preventDefault();

    const id = editId.value;

    const task = tasks.find(
        item => String(item.id) === String(id)
    );

    const text = editTaskInput.value.trim();

    if (!task || !text) {
        showMessage(dataMessage, "Please enter a goal name.");
        return;
    }

    task.text = text;
    task.dueDate = editDueDateInput.value;
    task.category = editCategoryInput.value;
    task.priority = editPriorityInput.value;

    saveTasks();
    closeEditDialog();
    render();

    showMessage(formMessage, "Goal updated successfully!");
});

// Dark mode
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const dark = document.body.classList.contains("dark-mode");

    themeToggle.textContent = dark
        ? "☀️ Light mode"
        : "🌙 Dark mode";

    localStorage.setItem(
        "goalsTrackerTheme",
        dark ? "dark" : "light"
    );
});

function applySavedTheme() {
    const theme = localStorage.getItem("goalsTrackerTheme");

    if (theme === "dark") {
        document.body.classList.add("dark-mode");
        themeToggle.textContent = "☀️ Light mode";
    }
}

// Download a file
function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// Export goals as CSV
document.getElementById("exportButton").addEventListener("click", () => {
    const headers = [
        "Goal",
        "Category",
        "Due date",
        "Priority",
        "Completed"
    ];

    const rows = tasks.map(task => [
        task.text,
        task.category,
        task.dueDate || "",
        task.priority,
        task.completed ? "Yes" : "No"
    ]);

    const csv = [headers, ...rows]
        .map(row =>
            row.map(value =>
                `"${String(value).replace(/"/g, '""')}"`
            ).join(",")
        )
        .join("\r\n");

    downloadFile(
        "goals-tracker.csv",
        csv,
        "text/csv;charset=utf-8;"
    );

    showMessage(dataMessage, "CSV export prepared.");
});

// Download a JSON backup
document.getElementById("backupButton").addEventListener("click", () => {
    downloadFile(
        "goals-tracker-backup.json",
        JSON.stringify(tasks, null, 2),
        "application/json"
    );

    showMessage(dataMessage, "Backup downloaded.");
});

// Restore goals from a JSON backup
document.getElementById("importInput").addEventListener(
    "change",
    async event => {
        const file = event.target.files[0];

        if (!file) return;

        try {
            const imported = JSON.parse(await file.text());

            if (!Array.isArray(imported)) {
                throw new Error("Backup must contain a list of goals.");
            }

            const cleaned = imported.map((task, index) => ({
                id: task.id ?? (Date.now() + index),

                text: String(task.text ?? "").trim(),

                category: [
                    "Personal",
                    "Health",
                    "Learning",
                    "Work"
                ].includes(task.category)
                    ? task.category
                    : "Personal",

                dueDate: typeof task.dueDate === "string"
                    ? task.dueDate
                    : "",

                priority: ["Low", "Medium", "High"].includes(task.priority)
                    ? task.priority
                    : "Medium",

                completed: Boolean(task.completed),

                createdAt: task.createdAt || Date.now() + index
            })).filter(task => task.text);

            const confirmed = window.confirm(
                `Restore ${cleaned.length} goals? This replaces the goals currently saved in this browser.`
            );

            if (!confirmed) {
                event.target.value = "";
                return;
            }

            tasks = cleaned;

            nextId =
                Math.max(0, ...tasks.map(task => Number(task.id) || 0)) + 1;

            saveTasks();
            render();

            showMessage(dataMessage, "Backup restored successfully.");
        } catch (error) {
            showMessage(
                dataMessage,
                `Could not restore backup: ${error.message}`
            );
        }

        event.target.value = "";
    }
);

// Start the app
applySavedTheme();
saveTasks();
render();