/* =========================================================
   AmitOS — Main Application
   Vanilla JavaScript / localStorage / Offline
   ========================================================= */

"use strict";

/* =========================================================
   STATE
   ========================================================= */

let state = loadData();
let currentPage = "dashboard";
let currentModalCleanup = null;

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", init);

function init() {
    normalizeState();
    applyTheme();
    setupNavigation();
    setupGlobalEvents();
    render();
}

/* =========================================================
   DATA STORAGE
   ========================================================= */

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            const fresh = createDefaultData();

            /* Demo data makes first launch visually useful. */
            const demo = createDemoData();

            fresh.studySessions = demo.studySessions;
            fresh.tasks = demo.tasks;
            fresh.journalEntries = demo.journalEntries;
            fresh.goals = demo.goals;
            fresh.habitLogs = demo.habitLogs;
            fresh.settings.demoDataLoaded = true;

            localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
            return fresh;
        }

        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object"
            ? parsed
            : createDefaultData();

    } catch (error) {
        console.error("Could not load AmitOS data:", error);
        return createDefaultData();
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error(error);
        toast("Could not save data. Browser storage may be full.", "error");
    }
}

function normalizeState() {
    const defaults = createDefaultData();

    Object.keys(defaults).forEach(key => {
        if (state[key] === undefined || state[key] === null) {
            state[key] = defaults[key];
        }
    });

    if (!state.profile || typeof state.profile !== "object") {
        state.profile = defaults.profile;
    }

    if (!Array.isArray(state.studySessions)) state.studySessions = [];
    if (!Array.isArray(state.subjects)) state.subjects = [...DEFAULT_SUBJECTS];
    if (!Array.isArray(state.habits)) state.habits = defaults.habits;
    if (!state.habitLogs || typeof state.habitLogs !== "object") state.habitLogs = {};
    if (!Array.isArray(state.improvements)) state.improvements = defaults.improvements;
    if (!Array.isArray(state.tasks)) state.tasks = [];
    if (!Array.isArray(state.journalEntries)) state.journalEntries = [];
    if (!Array.isArray(state.goals)) state.goals = [];
    if (!Array.isArray(state.achievements)) state.achievements = defaults.achievements;

    if (!state.settings || typeof state.settings !== "object") {
        state.settings = defaults.settings;
    }

    if (!Number.isFinite(Number(state.settings.dailyStudyTarget))) {
        state.settings.dailyStudyTarget = 4;
    }

    if (!["dark", "light"].includes(state.settings.theme)) {
        state.settings.theme = "dark";
    }

    /* Add missing achievements from future versions safely. */
    defaults.achievements.forEach(defaultAchievement => {
        if (!state.achievements.some(a => a.id === defaultAchievement.id)) {
            state.achievements.push({ ...defaultAchievement });
        }
    });

    saveData();
}

/* =========================================================
   UTILITIES
   ========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function today() {
    return new Date().toISOString().slice(0, 10);
}

function uidSafe() {
    if (typeof uid === "function") return uid();
    return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}

function formatDate(dateString) {
    if (!dateString) return "—";

    const date = new Date(dateString + "T00:00:00");

    if (Number.isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function formatLongDate(dateString = today()) {
    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function formatMinutes(minutes) {
    minutes = Math.max(0, Math.round(Number(minutes) || 0));

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours && mins) return `${hours}h ${mins}m`;
    if (hours) return `${hours}h`;
    return `${mins}m`;
}

function calculateDuration(start, end) {
    if (!start || !end) return 0;

    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    if (![sh, sm, eh, em].every(Number.isFinite)) return 0;

    let startMinutes = sh * 60 + sm;
    let endMinutes = eh * 60 + em;

    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
    }

    return endMinutes - startMinutes;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
}

function startOfWeek(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function startOfMonth(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isoDateFromDate(date) {
    return date.toISOString().slice(0, 10);
}

function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 5) return "Good night";
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
}

function getDailyMessage() {
    const hour = new Date().getHours();

    if (hour < 5) return "The day is quiet. Rest is part of the process.";
    if (hour < 12) return "A new day is another chance to move forward.";
    if (hour < 17) return "Keep the important things important.";
    if (hour < 21) return "Small progress still counts.";
    return "Review the day, learn from it, and prepare for tomorrow.";
}

function toast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;

    container.appendChild(el);

    setTimeout(() => {
        el.remove();
    }, 3000);
}

function emptyState(title, text) {
    return `
        <div class="empty">
            <strong>${escapeHTML(title)}</strong>
            <span>${escapeHTML(text)}</span>
        </div>
    `;
}

function priorityClass(priority) {
    if (priority === "High") return "danger";
    if (priority === "Medium") return "warning";
    return "info";
}

/* =========================================================
   CALCULATIONS
   ========================================================= */

function getStudyMinutes(filter = "all") {
    const now = new Date();
    let sessions = state.studySessions;

    if (filter === "today") {
        sessions = sessions.filter(s => s.date === today());
    }

    if (filter === "week") {
        const start = startOfWeek(now);
        sessions = sessions.filter(s => {
            const d = new Date(s.date + "T00:00:00");
            return d >= start;
        });
    }

    if (filter === "month") {
        const start = startOfMonth(now);
        sessions = sessions.filter(s => {
            const d = new Date(s.date + "T00:00:00");
            return d >= start;
        });
    }

    return sessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
}

function getSubjectStudyMinutes(subject) {
    return state.studySessions
        .filter(s => s.subject === subject)
        .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
}

function getTodayHabitStats() {
    const logs = state.habitLogs[today()] || {};
    const total = state.habits.length;
    const completed = state.habits.filter(h => logs[h.id]).length;

    return {
        total,
        completed,
        percent: total ? Math.round(completed / total * 100) : 0
    };
}

function getHabitCompletionForDate(date) {
    const logs = state.habitLogs[date] || {};
    const total = state.habits.length;

    if (!total) return 0;

    return Math.round(
        state.habits.filter(h => logs[h.id]).length / total * 100
    );
}

function getHabitStreak() {
    if (!state.habits.length) return 0;

    let streak = 0;
    const date = new Date();

    while (true) {
        const iso = isoDateFromDate(date);

        if (getHabitCompletionForDate(iso) < 100) break;

        streak++;
        date.setDate(date.getDate() - 1);

        if (streak > 10000) break;
    }

    return streak;
}

function getBestHabitStreak() {
    const dates = Object.keys(state.habitLogs).sort();

    let best = 0;
    let current = 0;
    let previous = null;

    dates.forEach(date => {
        if (getHabitCompletionForDate(date) === 100) {
            if (previous) {
                const a = new Date(previous + "T00:00:00");
                const b = new Date(date + "T00:00:00");
                const difference = Math.round((b - a) / 86400000);

                current = difference === 1 ? current + 1 : 1;
            } else {
                current = 1;
            }

            best = Math.max(best, current);
            previous = date;
        }
    });

    return best;
}

function getTodayTasks() {
    return state.tasks.filter(t => t.dueDate === today());
}

function getDailyProgress() {
    const habit = getTodayHabitStats().percent;
    const target = Math.max(1, Number(state.settings.dailyStudyTarget) || 4);
    const study = Math.min(100, getStudyMinutes("today") / (target * 60) * 100);

    const todayTasks = getTodayTasks();
    const task = todayTasks.length
        ? Math.round(todayTasks.filter(t => t.completed).length / todayTasks.length * 100)
        : 0;

    /*
       Study = 40%
       Habits = 40%
       Tasks = 20%
    */
    return Math.round(study * .4 + habit * .4 + task * .2);
}

function getOverallTaskStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;

    return {
        total,
        completed,
        pending: total - completed,
        percent: total ? Math.round(completed / total * 100) : 0
    };
}

function getAchievementValue(achievement) {
    switch (achievement.type) {
        case "studyCount":
            return state.studySessions.length;

        case "studyHours":
            return getStudyMinutes("all") / 60;

        case "streak":
            return Math.max(getHabitStreak(), getBestHabitStreak());

        case "tasks":
            return state.tasks.filter(t => t.completed).length;

        case "journal":
            return state.journalEntries.length;

        default:
            return 0;
    }
}

function isAchievementUnlocked(achievement) {
    return getAchievementValue(achievement) >= achievement.target;
}

/* =========================================================
   THEME
   ========================================================= */

function applyTheme() {
    document.body.classList.toggle("light", state.settings.theme === "light");
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {
    document.addEventListener("click", event => {
        const pageButton = event.target.closest("[data-page]");

        if (pageButton) {
            navigate(pageButton.dataset.page);
        }
    });
}

function navigate(page) {
    const validPages = [
        "dashboard",
        "portfolio",
        "study",
        "habits",
        "improvements",
        "tasks",
        "journal",
        "goals",
        "achievements",
        "statistics",
        "settings"
    ];

    if (!validPages.includes(page)) return;

    currentPage = page;

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === currentPage
        );
    });

    closeMobileMenu();
    render();
}

function setupGlobalEvents() {
    const mobileMenu = document.getElementById("mobileMenuBtn");
    const overlay = document.getElementById("overlay");

    mobileMenu?.addEventListener("click", openMobileMenu);
    overlay?.addEventListener("click", closeMobileMenu);

    document.addEventListener("click", event => {
        if (event.target.closest("[data-close-modal]")) {
            closeModal();
        }
    });
}

function openMobileMenu() {
    document.getElementById("sidebar")?.classList.add("open");
    document.getElementById("overlay")?.classList.add("show");
}

function closeMobileMenu() {
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("overlay")?.classList.remove("show");
}

/* =========================================================
   RENDER ENGINE
   ========================================================= */

function render() {
    const container = document.getElementById("pageContent");

    if (!container) return;

    const pages = {
        dashboard: renderDashboard,
        portfolio: renderPortfolio,
        study: renderStudy,
        habits: renderHabits,
        improvements: renderImprovements,
        tasks: renderTasks,
        journal: renderJournal,
        goals: renderGoals,
        achievements: renderAchievements,
        statistics: renderStatistics,
        settings: renderSettings
    };

    try {
        container.innerHTML = pages[currentPage]();
        updateSidebarProgress();
        updateAchievements();
    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <div class="page">
                <div class="card">
                    <h2>Something went wrong</h2>
                    <p class="muted mt">
                        AmitOS could not render this page.
                    </p>
                    <button class="btn mt" onclick="location.reload()">
                        Reload
                    </button>
                </div>
            </div>
        `;
    }
}

function updateSidebarProgress() {
    const progress = getDailyProgress();

    const text = document.getElementById("sidebarProgressText");
    const bar = document.getElementById("sidebarProgressBar");

    if (text) text.textContent = `${progress}%`;
    if (bar) bar.style.width = `${progress}%`;
}

function updateAchievements() {
    let changed = false;

    state.achievements.forEach(a => {
        const unlocked = isAchievementUnlocked(a);

        if (unlocked && !a.unlockedAt) {
            a.unlockedAt = new Date().toISOString();
            changed = true;
        }
    });

    if (changed) saveData();
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {
    const habitStats = getTodayHabitStats();
    const todayTasks = getTodayTasks();
    const completedTasks = todayTasks.filter(t => t.completed).length;
    const progress = getDailyProgress();

    return `
        <div class="page">

            <section class="hero">
                <div class="date-text">${escapeHTML(formatLongDate())}</div>
                <h1>${escapeHTML(getGreeting())}, ${escapeHTML(state.profile.name || "Amit")}.</h1>
                <p>${escapeHTML(getDailyMessage())}</p>
            </section>

            <div class="grid grid-4">
                ${statCard("📚", "Study today", formatMinutes(getStudyMinutes("today")))}
                ${statCard("🔥", "Current streak", `${getHabitStreak()} days`)}
                ${statCard("✓", "Habits", `${habitStats.completed} / ${habitStats.total}`)}
                ${statCard("🎯", "Tasks", `${completedTasks} / ${todayTasks.length}`)}
            </div>

            <h2 class="section-title">Today's Progress</h2>

            <div class="card">
                <div class="progress-row-top">
                    <strong>Daily Progress</strong>
                    <strong>${progress}%</strong>
                </div>
                <div class="progress-track progress-large">
                    <div class="progress-fill" style="width:${progress}%"></div>
                </div>

                <div class="grid grid-3 mt">
                    <div class="info-box">
                        <span>Study target</span>
                        <strong>${formatMinutes(getStudyMinutes("today"))} / ${state.settings.dailyStudyTarget}h</strong>
                    </div>
                    <div class="info-box">
                        <span>Habits</span>
                        <strong>${habitStats.percent}% complete</strong>
                    </div>
                    <div class="info-box">
                        <span>Tasks</span>
                        <strong>${todayTasks.length ? Math.round(completedTasks / todayTasks.length * 100) : 0}% complete</strong>
                    </div>
                </div>
            </div>

            <h2 class="section-title">Quick Actions</h2>

            <div class="quick-actions">
                <button class="quick-action" onclick="openStudyModal()">
                    <span>📚</span>
                    <small>Add Study Session</small>
                </button>

                <button class="quick-action" onclick="openHabitModal()">
                    <span>✓</span>
                    <small>Add Habit</small>
                </button>

                <button class="quick-action" onclick="openTaskModal()">
                    <span>🎯</span>
                    <small>Add Task</small>
                </button>

                <button class="quick-action" onclick="openJournalModal()">
                    <span>📖</span>
                    <small>Write Journal</small>
                </button>

                <button class="quick-action" onclick="openImprovementModal()">
                    <span>📈</span>
                    <small>Add Improvement</small>
                </button>
            </div>

            <div class="grid grid-2">
                <section>
                    <h2 class="section-title">Today's Tasks</h2>
                    <div class="card">
                        ${renderTodayTasksPreview()}
                    </div>
                </section>

                <section>
                    <h2 class="section-title">Recent Study</h2>
                    <div class="card">
                        ${renderRecentStudyPreview()}
                    </div>
                </section>
            </div>
        </div>
    `;
}

function statCard(icon, label, value) {
    return `
        <div class="card stat-card">
            <div class="stat-icon">${icon}</div>
            <div class="stat-label">${escapeHTML(label)}</div>
            <div class="stat-value">${escapeHTML(value)}</div>
        </div>
    `;
}

function renderTodayTasksPreview() {
    const tasks = getTodayTasks().slice(0, 5);

    if (!tasks.length) {
        return emptyState(
            "No tasks for today.",
            "Add a task to give your day a clear target."
        );
    }

    return `
        <div class="list">
            ${tasks.map(task => `
                <div class="data-row list-item">
                    <div>
                        <strong class="${task.completed ? "muted" : ""}">
                            ${task.completed ? "✓ " : ""}${escapeHTML(task.title)}
                        </strong>
                        <span class="badge ${priorityClass(task.priority)}">
                            ${escapeHTML(task.priority)}
                        </span>
                    </div>
                    <button class="btn small ${task.completed ? "secondary" : "success"}"
                        onclick="toggleTask('${task.id}')">
                        ${task.completed ? "Undo" : "Done"}
                    </button>
                </div>
            `).join("")}
        </div>
    `;
}

function renderRecentStudyPreview() {
    const sessions = [...state.studySessions]
        .sort((a, b) => `${b.date}${b.start || ""}`.localeCompare(`${a.date}${a.start || ""}`))
        .slice(0, 5);

    if (!sessions.length) {
        return emptyState(
            "No study sessions yet.",
            "Start your first session today."
        );
    }

    return `
        <div class="list">
            ${sessions.map(s => `
                <div class="list-item">
                    <strong>${escapeHTML(s.subject)} — ${escapeHTML(s.topic)}</strong>
                    <div class="small-text muted">
                        ${formatDate(s.date)} · ${formatMinutes(s.duration)}
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}
/* =========================================================
   PORTFOLIO
   ========================================================= */

function renderPortfolio() {
    const p = state.profile;

    return `
        <div class="page">
            <div class="page-header">
                <div>
                    <h1>Portfolio</h1>
                    <p>Your personal identity, journey and direction.</p>
                </div>
                <button class="btn" onclick="openProfileModal()">Edit Profile</button>
            </div>

            <div class="card">
                <div class="portfolio-header">
                    <div class="avatar">
                        ${escapeHTML((p.name || "A").charAt(0).toUpperCase())}
                    </div>
                    <div>
                        <h2>${escapeHTML(p.name)}</h2>
                        <p class="muted">${escapeHTML(p.education)}</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-2">
                ${portfolioCard("About", p.about)}
                ${portfolioCard("Education", p.education)}
                ${portfolioCard("Skills", p.skills)}
                ${portfolioCard("Projects", p.projects)}
                ${portfolioCard("Achievements", p.achievements)}
                ${portfolioCard("Goals", p.goals)}
                ${portfolioCard("Future Plans", p.futurePlans)}
            </div>
        </div>
    `;
}

function portfolioCard(title, content) {
    return `
        <section class="card portfolio-section">
            <div class="card-header">
                <h3>${escapeHTML(title)}</h3>
            </div>
            <p class="muted">${escapeHTML(content || "Not added yet.")}</p>
        </section>
    `;
}

/* =========================================================
   STUDY
   ========================================================= */

function renderStudy() {
    const sessions = [...state.studySessions]
        .sort((a, b) => `${b.date}${b.start || ""}`.localeCompare(`${a.date}${a.start || ""}`));

    const subjects = state.subjects.map(subject => `
        <div class="info-box">
            <span>${escapeHTML(subject)}</span>
            <strong>${formatMinutes(getSubjectStudyMinutes(subject))}</strong>
        </div>
    `).join("");

    return `
        <div class="page">
            <div class="page-header">
                <div>
                    <h1>Study Tracker</h1>
                    <p>Record focused work and see where your time goes.</p>
                </div>
                <button class="btn" onclick="openStudyModal()">+ Add Session</button>
            </div>

            <div class="grid grid-4">
                ${statCard("☀️", "Today", formatMinutes(getStudyMinutes("today")))}
                ${statCard("📅", "This week", formatMinutes(getStudyMinutes("week")))}
                ${statCard("🗓️", "This month", formatMinutes(getStudyMinutes("month")))}
                ${statCard("∞", "Total", formatMinutes(getStudyMinutes("all")))}
            </div>

            <h2 class="section-title">Subject Statistics</h2>
            <div class="grid grid-4">${subjects}</div>

            <h2 class="section-title">Study Sessions</h2>
            <div class="card">
                ${sessions.length
                    ? `<div class="list">${sessions.map(studyItem).join("")}</div>`
                    : emptyState("No study sessions yet.", "Start your first session today.")
                }
            </div>
        </div>
    `;
}

function studyItem(s) {
    return `
        <div class="list-item">
            <div class="data-row">
                <div>
                    <strong>${escapeHTML(s.subject)} — ${escapeHTML(s.topic)}</strong>
                    <div class="small-text muted">
                        ${formatDate(s.date)}
                        ${s.start ? ` · ${escapeHTML(s.start)}${s.end ? `–${escapeHTML(s.end)}` : ""}` : ""}
                        · ${formatMinutes(s.duration)}
                    </div>
                    ${s.type ? `<span class="badge info">${escapeHTML(s.type)}</span>` : ""}
                    ${s.notes ? `<p class="small-text muted mt">${escapeHTML(s.notes)}</p>` : ""}
                </div>
                <div class="actions">
                    <button class="btn small secondary" onclick="openStudyModal('${s.id}')">Edit</button>
                    <button class="btn small danger" onclick="deleteStudy('${s.id}')">Delete</button>
                </div>
            </div>
        </div>
    `;
}
/* =========================================================
   HABITS
   ========================================================= */

function renderHabits() {
    const stats = getTodayHabitStats();

    return `
        <div class="page">
            <div class="page-header">
                <div>
                    <h1>Habit Tracker</h1>
                    <p>Consistency beats intensity.</p>
                </div>
                <button class="btn" onclick="openHabitModal()">+ Add Habit</button>
            </div>

            <div class="grid grid-4">
                ${statCard("✓", "Today", `${stats.completed}/${stats.total}`)}
                ${statCard("📊", "Completion", `${stats.percent}%`)}
                ${statCard("🔥", "Current streak", `${getHabitStreak()} days`)}
                ${statCard("🏆", "Best streak", `${getBestHabitStreak()} days`)}
            </div>

            <h2 class="section-title">Today — ${formatDate(today())}</h2>

            <div class="grid grid-2">
                ${state.habits.length
                    ? state.habits.map(habitCard).join("")
                    : emptyState("No habits yet.", "Add your first habit.")
                }
            </div>
        </div>
    `;
}

function habitCard(habit) {
    const completed = Boolean(
        (state.habitLogs[today()] || {})[habit.id]
    );

    return `
        <div class="card habit-card">
            <button
                class="habit-check ${completed ? "completed" : ""}"
                onclick="toggleHabit('${habit.id}')"
                aria-label="${completed ? "Unmark" : "Mark"} ${escapeHTML(habit.name)}"
                title="${completed ? "Unmark complete" : "Mark complete"}">
                ✓
            </button>

            <div class="habit-info">
                <strong>${escapeHTML(habit.icon || "✓")} ${escapeHTML(habit.name)}</strong>
                <span class="small-text muted">
                    ${completed ? "Completed today" : "Not completed yet"}
                </span>
            </div>

            <div class="habit-actions">
                <button class="btn small secondary" onclick="openHabitModal('${habit.id}')">Edit</button>
                <button class="btn small danger" onclick="deleteHabit('${habit.id}')">Delete</button>
            </div>
        </div>
    `;
}

/* =========================================================
   IMPROVEMENTS
   ========================================================= */

function renderImprovements() {
    return `
        <div class="page">
            <div class="page-header">
                <div>
                    <h1>Improvement Tracker</h1>
                    <p>Measure direction, not perfection.</p>
                </div>
                <button class="btn" onclick="openImprovementModal()">+ Add Improvement</button>
            </div>

            <div class="grid grid-2">
                ${state.improvements.length
                    ? state.improvements.map(improvementCard).join("")
                    : emptyState("No improvement areas yet.", "Add your first area.")
                }
            </div>
        </div>
    `;
}

function improvementCard(item) {
    const difference = Number(item.current) - Number(item.previous);

    return `
        <div class="card">
            <div class="card-header">
                <div>
                    <h3>${escapeHTML(item.category)}</h3>
                    <span class="small-text muted">
                        Updated ${formatDate(item.updated)}
                    </span>
                </div>

                <div class="actions">
                    <button class="btn small secondary"
                        onclick="openImprovementModal('${item.id}')">Edit</button>
                    <button class="btn small danger"
                        onclick="deleteImprovement('${item.id}')">Delete</button>
                </div>
            </div>

            <div class="progress-row-top">
                <span>Current</span>
                <strong>${item.current}/10</strong>
            </div>

            <div class="progress-track progress-large">
                <div class="progress-fill" style="width:${item.current * 10}%"></div>
            </div>

            <div class="info-grid mt">
                <div class="info-box">
                    <span>Previous</span>
                    <strong>${item.previous}/10</strong>
                </div>
                <div class="info-box">
                    <span>Goal</span>
                    <strong>${item.goal}/10</strong>
                </div>
                <div class="info-box">
                    <span>Change</span>
                    <strong class="${difference >= 0 ? "text-success" : "text-danger"}">
                        ${difference > 0 ? "+" : ""}${difference}
                    </strong>
                </div>
                <div class="info-box">
                    <span>Notes</span>
                    <strong>${escapeHTML(item.notes || "—")}</strong>
                </div>
            </div>
        </div>
    `;
}
/* =========================================================
   TASKS
   ========================================================= */

function renderTasks() {
    const tasks = [...state.tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed - b.completed;

        const priority = { High: 1, Medium: 2, Low: 3 };
        return priority[a.priority] - priority[b.priority] ||
            String(a.dueDate).localeCompare(String(b.dueDate));
    });

    const stats = getOverallTaskStats();

    return `
        <div class="page">
            <div class="page-header">
                <div>
                    <h1>Tasks</h1>
                    <p>Turn intentions into concrete actions.</p>
                </div>
                <button class="btn" onclick="openTaskModal()">+ Add Task</button>
            </div>

            <div class="grid grid-4">
                ${statCard("🎯", "Total", stats.total)}
                ${statCard("✓", "Completed", stats.completed)}
                ${statCard("⏳", "Pending", stats.pending)}
                ${statCard("📊", "Completion", `${stats.percent}%`)}
            </div>

            <h2 class="section-title">All Tasks</h2>

            <div class="card">
                <div class="toolbar">
                    <select id="taskFilter" onchange="renderTaskList()">
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="high">High Priority</option>
                    </select>

                    <select id="taskSort" onchange="renderTaskList()">
                        <option value="due">Sort by Due Date</option>
                        <option value="priority">Sort by Priority</option>
                        <option value="created">Newest First</option>
                    </select>
                </div>

                <div id="taskList">
                    ${renderTaskListHTML(tasks)}
                </div>
            </div>
        </div>
    `;
}

function renderTaskList() {
    const list = document.getElementById("taskList");
    if (!list) return;

    let tasks = [...state.tasks];

    const filter = document.getElementById("taskFilter")?.value || "all";
    const sort = document.getElementById("taskSort")?.value || "due";

    if (filter === "pending") tasks = tasks.filter(t => !t.completed);
    if (filter === "completed") tasks = tasks.filter(t => t.completed);
    if (filter === "high") tasks = tasks.filter(t => t.priority === "High");

    const priority = { High: 1, Medium: 2, Low: 3 };

    if (sort === "due") {
        tasks.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
    }

    if (sort === "priority") {
        tasks.sort((a, b) => priority[a.priority] - priority[b.priority]);
    }

    if (sort === "created") {
        tasks.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    }

    list.innerHTML = renderTaskListHTML(tasks);
}

function renderTaskListHTML(tasks) {
    if (!tasks.length) {
        return emptyState("No matching tasks.", "Create a task or change the filter.");
    }

    return `
        <div class="list">
            ${tasks.map(task => `
                <div class="list-item">
                    <div class="data-row">
                        <div>
                            <strong class="${task.completed ? "muted" : ""}">
                                ${task.completed ? "✓ " : ""}
                                ${escapeHTML(task.title)}
                            </strong>

                            <div class="small-text muted">
                                ${task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
                            </div>

                            <span class="badge ${priorityClass(task.priority)}">
                                ${escapeHTML(task.priority)}
                            </span>

                            ${task.description
                                ? `<p class="small-text muted mt">${escapeHTML(task.description)}</p>`
                                : ""}
                        </div>

                        <div class="actions">
                            <button class="btn small ${task.completed ? "secondary" : "success"}"
                                onclick="toggleTask('${task.id}')">
                                ${task.completed ? "Undo" : "Complete"}
                            </button>

                            <button class="btn small secondary"
                                onclick="openTaskModal('${task.id}')">Edit</button>

                            <button class="btn small danger"
                                onclick="deleteTask('${task.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}/* =========================================================
   JOURNAL
   ========================================================= */

function renderJournal() {
    const entries = [...state.journalEntries]
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    return `
        <div class="page">
            <div class="page-header">
                <div>
                    <h1>Journal</h1>
                    <p>A private space for reflection.</p>
                </div>
                <button class="btn" onclick="openJournalModal()">+ Write Entry</button>
            </div>

            <div class="card">
                <div class="toolbar">
                    <input id="journalSearch"
                        type="search"
                        placeholder="Search title, content or tags..."
                        oninput="renderJournalList()">

                    <input id="journalDate"
                        type="date"
                        onchange="renderJournalList()">
                </div>

                <div id="journalList">
                    ${renderJournalListHTML(entries)}
                </div>
            </div>
        </div>
    `;
}

function renderJournalList() {
    const list = document.getElementById("journalList");
    if (!list) return;

    const search = (document.getElementById("journalSearch")?.value || "")
        .trim()
        .toLowerCase();

    const date = document.getElementById("journalDate")?.value || "";

    let entries = [...state.journalEntries];

    if (search) {
        entries = entries.filter(e =>
            `${e.title} ${e.content} ${(e.tags || []).join(" ")}`
                .toLowerCase()
                .includes(search)
        );
    }

    if (date) {
        entries = entries.filter(e => e.date === date);
    }

    entries.sort((a, b) => String(b.date).localeCompare(String(a.date)));

    list.innerHTML = renderJournalListHTML(entries);
}

function renderJournalListHTML(entries) {
    if (!entries.length) {
        return emptyState(
            "No journal entries found.",
            "Write your first entry and keep a record of your journey."
        );
    }

    return `
        <div class="list">
            ${entries.map(e => `
                <article class="list-item journal-entry">
                    <div class="data-row">
                        <div>
                            <strong>${escapeHTML(e.title)}</strong>

                            <div class="small-text muted">
                                ${formatDate(e.date)}
                                · ${escapeHTML(e.mood)}
                            </div>

                            ${(e.tags || []).map(tag =>
                                `<span class="badge">${escapeHTML(tag)}</span>`
                            ).join(" ")}

                            <p class="mt">${escapeHTML(e.content)}</p>
                        </div>

                        <div class="actions">
                            <button class="btn small secondary"
                                onclick="openJournalModal('${e.id}')">Edit</button>

                            <button class="btn small danger"
                                onclick="deleteJournal('${e.id}')">Delete</button>
                        </div>
                    </div>
                </article>
            `).join("")}
        </div>
    `;
}
/* =========================================================
   GOALS
   ========================================================= */

function renderGoals() {
    return `
        <div class="page">
            <div class="page-header">
                <div>
                    <h1>Goals</h1>
                    <p>Give your effort a direction.</p>
                </div>
                <button class="btn" onclick="openGoalModal()">+ Add Goal</button>
            </div>

            <div class="grid grid-2">
                ${state.goals.length
                    ? state.goals.map(goalCard).join("")
                    : emptyState("No goals yet.", "Define something worth working toward.")
                }
            </div>
        </div>
    `;
}

function goalCard(goal) {
    const progress = clamp(goal.progress, 0, 100);

    return `
        <div class="card">
            <div class="card-header">
                <div>
                    <h3>${escapeHTML(goal.title)}</h3>
                    <span class="badge">${escapeHTML(goal.category)}</span>
                    <span class="badge ${goal.status === "Completed" ? "success" : "info"}">
                        ${escapeHTML(goal.status)}
                    </span>
                </div>

                <div class="actions">
                    <button class="btn small secondary"
                        onclick="openGoalModal('${goal.id}')">Edit</button>
                    <button class="btn small danger"
                        onclick="deleteGoal('${goal.id}')">Delete</button>
                </div>
            </div>

            <p class="muted">${escapeHTML(goal.description || "No description.")}</p>

            <div class="progress-row">
                <div class="progress-row-top">
                    <span>Progress</span>
                    <strong>${progress}%</strong>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width:${progress}%"></div>
                </div>
            </div>

            <div class="small-text muted">
                Target: ${goal.targetDate ? formatDate(goal.targetDate) : "No date"}
            </div>
        </div>
    `;
}/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

function renderAchievements() {
    updateAchievements();

    const unlocked = state.achievements.filter(isAchievementUnlocked).length;

    return `
        <div class="page">
            <div class="page-header">
                <div>
                    <h1>Achievements</h1>
                    <p>Milestones earned through actual activity.</p>
                </div>
                <span class="badge success">${unlocked}/${state.achievements.length} unlocked</span>
            </div>

            <div class="grid grid-3">
                ${state.achievements.map(achievementCard).join("")}
            </div>
        </div>
    `;
}

function achievementCard(a) {
    const unlocked = isAchievementUnlocked(a);
    const value = getAchievementValue(a);

    return `
        <div class="card achievement ${unlocked ? "" : "locked"}">
            <div class="achievement-icon">${escapeHTML(a.icon)}</div>

            <h3>${escapeHTML(a.title)}</h3>
            <p>${escapeHTML(a.description)}</p>

            <div class="unlock">
                ${unlocked
                    ? `✓ Unlocked`
                    : `${Math.min(value, a.target)} / ${a.target}`
                }
            </div>
        </div>
    `;
}/* =========================================================
   STATISTICS
   ========================================================= */

function renderStatistics() {
    const todayStudy = getStudyMinutes("today");
    const weekStudy = getStudyMinutes("week");
    const monthStudy = getStudyMinutes("month");
    const totalStudy = getStudyMinutes("all");

    const habitToday = getTodayHabitStats();
    const tasks = getOverallTaskStats();

    return `
        <div class="page">
            <div class="page-header">
                <div>
                    <h1>Statistics</h1>
                    <p>A wider view of your progress.</p>
                </div>
            </div>

            <h2 class="section-title">Study</h2>

            <div class="grid grid-4">
                ${statCard("☀️", "Today", formatMinutes(todayStudy))}
                ${statCard("📅", "Week", formatMinutes(weekStudy))}
                ${statCard("🗓️", "Month", formatMinutes(monthStudy))}
                ${statCard("∞", "Total", formatMinutes(totalStudy))}
            </div>

            <div class="grid grid-2">
                <section>
                    <h2 class="section-title">Last 7 Days</h2>
                    <div class="card">
                        ${renderStudyChart()}
                    </div>
                </section>

                <section>
                    <h2 class="section-title">Subject Distribution</h2>
                    <div class="card">
                        ${renderSubjectChart()}
                    </div>
                </section>
            </div>

            <h2 class="section-title">Habits</h2>

            <div class="grid grid-4">
                ${statCard("✓", "Today", `${habitToday.percent}%`)}
                ${statCard("📅", "7-day avg", `${getWeeklyHabitPercent()}%`)}
                ${statCard("🔥", "Current streak", `${getHabitStreak()} days`)}
                ${statCard("🏆", "Best streak", `${getBestHabitStreak()} days`)}
            </div>

            <h2 class="section-title">Tasks</h2>

            <div class="grid grid-3">
                ${statCard("✓", "Completed", tasks.completed)}
                ${statCard("⏳", "Pending", tasks.pending)}
                ${statCard("📊", "Completion", `${tasks.percent}%`)}
            </div>

            <h2 class="section-title">Personal Improvement</h2>

            <div class="card">
                ${state.improvements.map(item => `
                    <div class="progress-row">
                        <div class="progress-row-top">
                            <span>${escapeHTML(item.category)}</span>
                            <strong>${item.current}/10</strong>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width:${item.current * 10}%"></div>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

function getWeeklyHabitPercent() {
    let total = 0;

    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        total += getHabitCompletionForDate(isoDateFromDate(d));
    }

    return Math.round(total / 7);
}

function renderStudyChart() {
    const values = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);

        const date = isoDateFromDate(d);

        const minutes = state.studySessions
            .filter(s => s.date === date)
            .reduce((sum, s) => sum + Number(s.duration || 0), 0);

        values.push({
            date,
            minutes
        });
    }

    const max = Math.max(...values.map(v => v.minutes), 60);

    return `
        <div class="chart">
            ${values.map(v => `
                <div class="chart-column">
                    <div class="chart-bar-wrap">
                        <div class="chart-bar"
                            style="height:${Math.max(2, v.minutes / max * 100)}%"
                            title="${formatMinutes(v.minutes)}">
                        </div>
                    </div>
                    <span>${v.minutes ? formatMinutes(v.minutes) : "0m"}</span>
                    <small>${new Date(v.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" })}</small>
                </div>
            `).join("")}
        </div>
    `;
}

function renderSubjectChart() {
    const data = state.subjects
        .map(subject => ({
            subject,
            minutes: getSubjectStudyMinutes(subject)
        }))
        .filter(x => x.minutes > 0)
        .sort((a, b) => b.minutes - a.minutes);

    if (!data.length) {
        return emptyState(
            "No subject data yet.",
            "Complete some study sessions first."
        );
    }

    const max = Math.max(...data.map(x => x.minutes));

    return data.map(x => `
        <div class="progress-row">
            <div class="progress-row-top">
                <span>${escapeHTML(x.subject)}</span>
                <strong>${formatMinutes(x.minutes)}</strong>
            </div>

            <div class="progress-track">
                <div class="progress-fill"
                    style="width:${x.minutes / max * 100}%"></div>
            </div>
        </div>
    `).join("");
}
/* =========================================================
   SETTINGS
   ========================================================= */

function renderSettings() {
    return `
        <div class="page">
            <div class="page-header">
                <div>
                    <h1>Settings</h1>
                    <p>Configure AmitOS and manage your local data.</p>
                </div>
            </div>

            <div class="grid grid-2">

                <section class="card">
                    <div class="card-header">
                        <h3>Preferences</h3>
                    </div>

                    <div class="form-group">
                        <label for="settingsName">User name</label>
                        <input id="settingsName"
                            value="${escapeHTML(state.profile.name)}">
                    </div>

                    <div class="form-group mt">
                        <label for="settingsStudyTarget">Daily study target (hours)</label>
                        <input id="settingsStudyTarget"
                            type="number"
                            min="0.25"
                            max="24"
                            step="0.25"
                            value="${state.settings.dailyStudyTarget}">
                    </div>

                    <div class="form-group mt">
                        <label for="settingsTheme">Theme</label>
                        <select id="settingsTheme">
                            <option value="dark" ${state.settings.theme === "dark" ? "selected" : ""}>Dark</option>
                            <option value="light" ${state.settings.theme === "light" ? "selected" : ""}>Light</option>
                        </select>
                    </div>

                    <button class="btn mt" onclick="saveSettings()">Save Settings</button>
                </section>

                <section class="card">
                    <div class="card-header">
                        <h3>Data Management</h3>
                    </div>

                    <p class="muted small-text">
                        AmitOS stores your data only in this browser using localStorage.
                    </p>

                    <div class="btn-group mt">
                        <button class="btn secondary" onclick="exportData()">
                            ↓ Export JSON
                        </button>

                        <button class="btn secondary" onclick="document.getElementById('importFile').click()">
                            ↑ Import JSON
                        </button>

                        <input id="importFile"
                            class="hidden"
                            type="file"
                            accept=".json,application/json"
                            onchange="importData(event)">
                    </div>

                    <hr>

                    <button class="btn secondary" onclick="removeDemoData()">
                        Remove Demo Data
                    </button>

                    <button class="btn danger mt" onclick="resetAllData()">
                        Reset All Data
                    </button>
                </section>

            </div>

            <section class="card mt">
                <h3>About AmitOS</h3>
                <p class="muted small-text mt">
                    Version ${AMITOS_VERSION}. Offline-first personal growth dashboard.
                </p>
            </section>
        </div>
    `;
}
/* =========================================================
   MODAL SYSTEM
   ========================================================= */

function openModal(title, html, onSubmit) {
    const modal = document.getElementById("modal");
    const titleEl = document.getElementById("modalTitle");
    const body = document.getElementById("modalBody");

    if (!modal || !titleEl || !body) return;

    if (currentModalCleanup) {
        currentModalCleanup();
        currentModalCleanup = null;
    }

    titleEl.textContent = title;
    body.innerHTML = html;
    modal.classList.remove("hidden");

    const form = body.querySelector("form");

    if (form && onSubmit) {
        const handler = event => {
            event.preventDefault();

            try {
                onSubmit(new FormData(form));
            } catch (error) {
                console.error(error);
                toast("Something went wrong.", "error");
            }
        };

        form.addEventListener("submit", handler);

        currentModalCleanup = () => {
            form.removeEventListener("submit", handler);
        };
    }
}

function closeModal() {
    const modal = document.getElementById("modal");

    if (currentModalCleanup) {
        currentModalCleanup();
        currentModalCleanup = null;
    }

    modal?.classList.add("hidden");
}

/* =========================================================
   CONFIRMATION
   ========================================================= */

function confirmAction(title, message, callback) {
    const modal = document.getElementById("confirmModal");
    const titleEl = document.getElementById("confirmTitle");
    const messageEl = document.getElementById("confirmMessage");
    const ok = document.getElementById("confirmOk");
    const cancel = document.getElementById("confirmCancel");

    titleEl.textContent = title;
    messageEl.textContent = message;

    modal.classList.remove("hidden");

    const close = () => {
        modal.classList.add("hidden");
        ok.onclick = null;
        cancel.onclick = null;
    };

    cancel.onclick = close;

    ok.onclick = () => {
        close();
        callback();
    };
}
/* =========================================================
   PROFILE MODAL
   ========================================================= */

function openProfileModal() {
    const p = state.profile;

    openModal(
        "Edit Portfolio",
        `
        <form>
            <div class="form-grid">

                ${field("name", "Name", p.name, true)}
                ${field("education", "Education", p.education)}

                ${textareaField("about", "About", p.about)}
                ${textareaField("skills", "Skills", p.skills)}
                ${textareaField("projects", "Projects", p.projects)}
                ${textareaField("achievements", "Achievements", p.achievements)}
                ${textareaField("goals", "Goals", p.goals)}
                ${textareaField("futurePlans", "Future Plans", p.futurePlans)}

                <div class="form-actions">
                    <button type="button" class="btn secondary" data-close-modal>Cancel</button>
                    <button class="btn">Save Profile</button>
                </div>
            </div>
        </form>
        `,
        form => {
            state.profile.name = form.get("name").trim() || "Amit";
            state.profile.education = form.get("education").trim();
            state.profile.about = form.get("about").trim();
            state.profile.skills = form.get("skills").trim();
            state.profile.projects = form.get("projects").trim();
            state.profile.achievements = form.get("achievements").trim();
            state.profile.goals = form.get("goals").trim();
            state.profile.futurePlans = form.get("futurePlans").trim();

            saveData();
            closeModal();
            render();
            toast("Profile updated.");
        }
    );
}
/* =========================================================
   STUDY MODAL
   ========================================================= */

function openStudyModal(id = null) {
    const existing = state.studySessions.find(s => s.id === id);

    const subjectOptions = state.subjects.map(s => `
        <option value="${escapeHTML(s)}"
            ${existing?.subject === s ? "selected" : ""}>
            ${escapeHTML(s)}
        </option>
    `).join("");

    openModal(
        existing ? "Edit Study Session" : "Add Study Session",
        `
        <form>
            <div class="form-grid">

                <div class="form-group">
                    <label>Subject *</label>
                    <select name="subject" required>
                        ${subjectOptions}
                    </select>
                </div>

                ${field("topic", "Topic *", existing?.topic || "", true)}

                ${field("date", "Date *", existing?.date || today(), true, "date")}

                ${field("start", "Start Time", existing?.start || "", false, "time")}

                ${field("end", "End Time", existing?.end || "", false, "time")}

                ${field("duration", "Duration (minutes)", existing?.duration || "", false, "number")}

                <div class="form-group">
                    <label>Study Type</label>
                    <select name="type">
                        ${["Concept", "Practice", "Revision", "Mock Test", "Reading", "Other"]
                            .map(x => `<option ${existing?.type === x ? "selected" : ""}>${x}</option>`)
                            .join("")}
                    </select>
                </div>

                ${textareaField("notes", "Notes", existing?.notes || "")}

                <div class="form-actions">
                    <button type="button" class="btn secondary" data-close-modal>Cancel</button>
                    <button class="btn">${existing ? "Save Changes" : "Add Session"}</button>
                </div>
            </div>
        </form>
        `,
        form => {
            const subject = form.get("subject").trim();
            const topic = form.get("topic").trim();
            const date = form.get("date");

            if (!subject || !topic || !date) {
                toast("Please fill the required fields.", "error");
                return;
            }

            let duration = Number(form.get("duration"));

            const start = form.get("start");
            const end = form.get("end");

            if ((!duration || duration <= 0) && start && end) {
                duration = calculateDuration(start, end);
            }

            if (!duration || duration <= 0) {
                toast("Enter a valid duration or start/end time.", "error");
                return;
            }

            const session = {
                id: existing?.id || uidSafe(),
                subject,
                topic,
                date,
                start,
                end,
                duration: Math.round(duration),
                type: form.get("type"),
                notes: form.get("notes").trim()
            };

            if (existing) {
                Object.assign(existing, session);
            } else {
                state.studySessions.push(session);
            }

            saveData();
            closeModal();
            render();
            toast(existing ? "Study session updated." : "Study session added.");
        }
    );
}

function deleteStudy(id) {
    confirmAction(
        "Delete study session?",
        "This study session will be permanently removed.",
        () => {
            state.studySessions = state.studySessions.filter(s => s.id !== id);
            saveData();
            render();
            toast("Study session deleted.");
        }
    );
}
/* =========================================================
   HABIT MODAL
   ========================================================= */

function openHabitModal(id = null) {
    const existing = state.habits.find(h => h.id === id);

    openModal(
        existing ? "Edit Habit" : "Add Habit",
        `
        <form>
            <div class="form-grid">
                ${field("name", "Habit name *", existing?.name || "", true)}
                ${field("icon", "Icon", existing?.icon || "✓")}

                <div class="form-actions">
                    <button type="button" class="btn secondary" data-close-modal>Cancel</button>
                    <button class="btn">${existing ? "Save Changes" : "Add Habit"}</button>
                </div>
            </div>
        </form>
        `,
        form => {
            const name = form.get("name").trim();

            if (!name) {
                toast("Habit name is required.", "error");
                return;
            }

            const duplicate = state.habits.some(
                h => h.name.toLowerCase() === name.toLowerCase() &&
                    h.id !== existing?.id
            );

            if (duplicate) {
                toast("A habit with that name already exists.", "error");
                return;
            }

            if (existing) {
                existing.name = name;
                existing.icon = form.get("icon").trim() || "✓";
            } else {
                state.habits.push({
                    id: uidSafe(),
                    name,
                    icon: form.get("icon").trim() || "✓"
                });
            }

            saveData();
            closeModal();
            render();
            toast(existing ? "Habit updated." : "Habit added.");
        }
    );
}

function toggleHabit(id) {
    const date = today();

    if (!state.habitLogs[date]) {
        state.habitLogs[date] = {};
    }

    state.habitLogs[date][id] = !state.habitLogs[date][id];

    saveData();
    render();
}

function deleteHabit(id) {
    confirmAction(
        "Delete habit?",
        "The habit will be removed. Existing historical logs will remain harmlessly stored.",
        () => {
            state.habits = state.habits.filter(h => h.id !== id);

            Object.keys(state.habitLogs).forEach(date => {
                if (state.habitLogs[date]) {
                    delete state.habitLogs[date][id];
                }
            });

            saveData();
            render();
            toast("Habit deleted.");
        }
    );
}
/* =========================================================
   IMPROVEMENT MODAL
   ========================================================= */

function openImprovementModal(id = null) {
    const existing = state.improvements.find(i => i.id === id);

    openModal(
        existing ? "Edit Improvement" : "Add Improvement",
        `
        <form>
            <div class="form-grid">
                ${field("category", "Category *", existing?.category || "", true)}
                ${field("previous", "Previous score", existing?.previous ?? 1, true, "number", "1", "10")}
                ${field("current", "Current score", existing?.current ?? 1, true, "number", "1", "10")}
                ${field("goal", "Goal score", existing?.goal ?? 10, true, "number", "1", "10")}
                ${field("updated", "Date updated", existing?.updated || today(), true, "date")}
                ${textareaField("notes", "Notes", existing?.notes || "")}

                <div class="form-actions">
                    <button type="button" class="btn secondary" data-close-modal>Cancel</button>
                    <button class="btn">${existing ? "Save Changes" : "Add Improvement"}</button>
                </div>
            </div>
        </form>
        `,
        form => {
            const category = form.get("category").trim();

            if (!category) {
                toast("Category is required.", "error");
                return;
            }

            const current = clamp(form.get("current"), 1, 10);
            const previous = clamp(form.get("previous"), 1, 10);
            const goal = clamp(form.get("goal"), 1, 10);

            if (existing) {
                Object.assign(existing, {
                    category,
                    previous,
                    current,
                    goal,
                    updated: form.get("updated") || today(),
                    notes: form.get("notes").trim()
                });
            } else {
                state.improvements.push({
                    id: uidSafe(),
                    category,
                    previous,
                    current,
                    goal,
                    updated: form.get("updated") || today(),
                    notes: form.get("notes").trim()
                });
            }

            saveData();
            closeModal();
            render();
            toast(existing ? "Improvement updated." : "Improvement added.");
        }
    );
}

function deleteImprovement(id) {
    confirmAction(
        "Delete improvement area?",
        "This improvement category will be removed.",
        () => {
            state.improvements = state.improvements.filter(i => i.id !== id);
            saveData();
            render();
            toast("Improvement deleted.");
        }
    );
}
/* =========================================================
   TASK MODAL
   ========================================================= */

function openTaskModal(id = null) {
    const existing = state.tasks.find(t => t.id === id);

    openModal(
        existing ? "Edit Task" : "Add Task",
        `
        <form>
            <div class="form-grid">
                ${field("title", "Title *", existing?.title || "", true)}
                ${field("dueDate", "Due date", existing?.dueDate || today(), false, "date")}

                <div class="form-group">
                    <label>Priority</label>
                    <select name="priority">
                        ${["Low", "Medium", "High"].map(p =>
                            `<option ${existing?.priority === p ? "selected" : ""}>${p}</option>`
                        ).join("")}
                    </select>
                </div>

                ${textareaField("description", "Description", existing?.description || "")}

                <div class="form-actions">
                    <button type="button" class="btn secondary" data-close-modal>Cancel</button>
                    <button class="btn">${existing ? "Save Changes" : "Add Task"}</button>
                </div>
            </div>
        </form>
        `,
        form => {
            const title = form.get("title").trim();

            if (!title) {
                toast("Task title is required.", "error");
                return;
            }

            const task = {
                id: existing?.id || uidSafe(),
                title,
                description: form.get("description").trim(),
                priority: form.get("priority"),
                dueDate: form.get("dueDate"),
                completed: existing?.completed || false,
                createdAt: existing?.createdAt || new Date().toISOString()
            };

            if (existing) {
                Object.assign(existing, task);
            } else {
                state.tasks.push(task);
            }

            saveData();
            closeModal();
            render();
            toast(existing ? "Task updated." : "Task added.");
        }
    );
}

function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;

    saveData();
    render();
}

function deleteTask(id) {
    confirmAction(
        "Delete task?",
        "This task will be permanently removed.",
        () => {
            state.tasks = state.tasks.filter(t => t.id !== id);
            saveData();
            render();
            toast("Task deleted.");
        }
    );
}
/* =========================================================
   JOURNAL MODAL
   ========================================================= */

function openJournalModal(id = null) {
    const existing = state.journalEntries.find(e => e.id === id);

    openModal(
        existing ? "Edit Journal Entry" : "Write Journal Entry",
        `
        <form>
            <div class="form-grid">
                ${field("date", "Date *", existing?.date || today(), true, "date")}
                ${field("title", "Title *", existing?.title || "", true)}

                <div class="form-group">
                    <label>Mood</label>
                    <select name="mood">
                        ${["Great", "Good", "Neutral", "Bad", "Very Bad"]
                            .map(m => `<option ${existing?.mood === m ? "selected" : ""}>${m}</option>`)
                            .join("")}
                    </select>
                </div>

                ${field("tags", "Tags", (existing?.tags || []).join(", "))}

                ${textareaField("content", "Content *", existing?.content || "", true)}

                <div class="form-actions">
                    <button type="button" class="btn secondary" data-close-modal>Cancel</button>
                    <button class="btn">${existing ? "Save Changes" : "Save Entry"}</button>
                </div>
            </div>
        </form>
        `,
        form => {
            const title = form.get("title").trim();
            const content = form.get("content").trim();

            if (!title || !content) {
                toast("Title and content are required.", "error");
                return;
            }

            const tags = form.get("tags")
                .split(",")
                .map(x => x.trim())
                .filter(Boolean);

            const entry = {
                id: existing?.id || uidSafe(),
                date: form.get("date") || today(),
                title,
                mood: form.get("mood"),
                content,
                tags
            };

            if (existing) {
                Object.assign(existing, entry);
            } else {
                state.journalEntries.push(entry);
            }

            saveData();
            closeModal();
            render();
            toast(existing ? "Journal entry updated." : "Journal entry saved.");
        }
    );
}

function deleteJournal(id) {
    confirmAction(
        "Delete journal entry?",
        "This journal entry will be permanently removed.",
        () => {
            state.journalEntries = state.journalEntries.filter(e => e.id !== id);
            saveData();
            render();
            toast("Journal entry deleted.");
        }
    );
}
/* =========================================================
   GOAL MODAL
   ========================================================= */

function openGoalModal(id = null) {
    const existing = state.goals.find(g => g.id === id);

    const categories = [
        "Education",
        "Health",
        "Career",
        "Finance",
        "Personal",
        "Coding",
        "Other"
    ];

    const statuses = [
        "Not Started",
        "In Progress",
        "Completed"
    ];

    openModal(
        existing ? "Edit Goal" : "Add Goal",
        `
        <form>
            <div class="form-grid">
                ${field("title", "Title *", existing?.title || "", true)}
                ${field("targetDate", "Target date", existing?.targetDate || "", false, "date")}

                <div class="form-group">
                    <label>Category</label>
                    <select name="category">
                        ${categories.map(c =>
                            `<option ${existing?.category === c ? "selected" : ""}>${c}</option>`
                        ).join("")}
                    </select>
                </div>

                <div class="form-group">
                    <label>Status</label>
                    <select name="status">
                        ${statuses.map(s =>
                            `<option ${existing?.status === s ? "selected" : ""}>${s}</option>`
                        ).join("")}
                    </select>
                </div>

                ${field("progress", "Progress %", existing?.progress ?? 0, false, "number", "0", "100")}

                ${textareaField("description", "Description", existing?.description || "")}

                <div class="form-actions">
                    <button type="button" class="btn secondary" data-close-modal>Cancel</button>
                    <button class="btn">${existing ? "Save Changes" : "Add Goal"}</button>
                </div>
            </div>
        </form>
        `,
        form => {
            const title = form.get("title").trim();

            if (!title) {
                toast("Goal title is required.", "error");
                return;
            }

            let progress = clamp(form.get("progress"), 0, 100);
            const status = form.get("status");

            if (status === "Completed") progress = 100;

            if (status === "Not Started" && progress > 0) {
                progress = 0;
            }

            const goal = {
                id: existing?.id || uidSafe(),
                title,
                description: form.get("description").trim(),
                category: form.get("category"),
                targetDate: form.get("targetDate"),
                progress,
                status
            };

            if (existing) {
                Object.assign(existing, goal);
            } else {
                state.goals.push(goal);
            }

            saveData();
            closeModal();
            render();
            toast(existing ? "Goal updated." : "Goal added.");
        }
    );
}

function deleteGoal(id) {
    confirmAction(
        "Delete goal?",
        "This goal will be permanently removed.",
        () => {
            state.goals = state.goals.filter(g => g.id !== id);
            saveData();
            render();
            toast("Goal deleted.");
        }
    );
}/* =========================================================
   GOAL MODAL
   ========================================================= */

function openGoalModal(id = null) {
    const existing = state.goals.find(g => g.id === id);

    const categories = [
        "Education",
        "Health",
        "Career",
        "Finance",
        "Personal",
        "Coding",
        "Other"
    ];

    const statuses = [
        "Not Started",
        "In Progress",
        "Completed"
    ];

    openModal(
        existing ? "Edit Goal" : "Add Goal",
        `
        <form>
            <div class="form-grid">
                ${field("title", "Title *", existing?.title || "", true)}
                ${field("targetDate", "Target date", existing?.targetDate || "", false, "date")}

                <div class="form-group">
                    <label>Category</label>
                    <select name="category">
                        ${categories.map(c =>
                            `<option ${existing?.category === c ? "selected" : ""}>${c}</option>`
                        ).join("")}
                    </select>
                </div>

                <div class="form-group">
                    <label>Status</label>
                    <select name="status">
                        ${statuses.map(s =>
                            `<option ${existing?.status === s ? "selected" : ""}>${s}</option>`
                        ).join("")}
                    </select>
                </div>

                ${field("progress", "Progress %", existing?.progress ?? 0, false, "number", "0", "100")}

                ${textareaField("description", "Description", existing?.description || "")}

                <div class="form-actions">
                    <button type="button" class="btn secondary" data-close-modal>Cancel</button>
                    <button class="btn">${existing ? "Save Changes" : "Add Goal"}</button>
                </div>
            </div>
        </form>
        `,
        form => {
            const title = form.get("title").trim();

            if (!title) {
                toast("Goal title is required.", "error");
                return;
            }

            let progress = clamp(form.get("progress"), 0, 100);
            const status = form.get("status");

            if (status === "Completed") progress = 100;

            if (status === "Not Started" && progress > 0) {
                progress = 0;
            }

            const goal = {
                id: existing?.id || uidSafe(),
                title,
                description: form.get("description").trim(),
                category: form.get("category"),
                targetDate: form.get("targetDate"),
                progress,
                status
            };

            if (existing) {
                Object.assign(existing, goal);
            } else {
                state.goals.push(goal);
            }

            saveData();
            closeModal();
            render();
            toast(existing ? "Goal updated." : "Goal added.");
        }
    );
}

function deleteGoal(id) {
    confirmAction(
        "Delete goal?",
        "This goal will be permanently removed.",
        () => {
            state.goals = state.goals.filter(g => g.id !== id);
            saveData();
            render();
            toast("Goal deleted.");
        }
    );
}
/* =========================================================
   FORM HELPERS
   ========================================================= */

function field(
    name,
    label,
    value = "",
    required = false,
    type = "text",
    min = "",
    max = ""
) {
    return `
        <div class="form-group">
            <label for="field-${escapeHTML(name)}">${escapeHTML(label)}</label>
            <input
                id="field-${escapeHTML(name)}"
                name="${escapeHTML(name)}"
                type="${escapeHTML(type)}"
                value="${escapeHTML(value)}"
                ${required ? "required" : ""}
                ${min !== "" ? `min="${escapeHTML(min)}"` : ""}
                ${max !== "" ? `max="${escapeHTML(max)}"` : ""}
            >
        </div>
    `;
}

function textareaField(name, label, value = "", required = false) {
    return `
        <div class="form-group full">
            <label for="textarea-${escapeHTML(name)}">${escapeHTML(label)}</label>
            <textarea
                id="textarea-${escapeHTML(name)}"
                name="${escapeHTML(name)}"
                ${required ? "required" : ""}
            >${escapeHTML(value)}</textarea>
        </div>
    `;
}
/* =========================================================
   SETTINGS / EXPORT / IMPORT
   ========================================================= */

function saveSettings() {
    const name = document.getElementById("settingsName")?.value.trim();
    const target = Number(document.getElementById("settingsStudyTarget")?.value);
    const theme = document.getElementById("settingsTheme")?.value;

    if (!name) {
        toast("Name cannot be empty.", "error");
        return;
    }

    if (!Number.isFinite(target) || target <= 0 || target > 24) {
        toast("Study target must be between 0.25 and 24 hours.", "error");
        return;
    }

    state.profile.name = name;
    state.settings.dailyStudyTarget = target;
    state.settings.theme = ["dark", "light"].includes(theme)
        ? theme
        : "dark";

    applyTheme();
    saveData();
    render();

    toast("Settings saved.");
}

function exportData() {
    try {
        const payload = {
            exportedAt: new Date().toISOString(),
            app: "AmitOS",
            version: AMITOS_VERSION,
            data: state
        };

        const blob = new Blob(
            [JSON.stringify(payload, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `AmitOS-backup-${today()}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        toast("Data exported successfully.");
    } catch (error) {
        console.error(error);
        toast("Could not export data.", "error");
    }
}

function importData(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const parsed = JSON.parse(reader.result);

            const imported = parsed?.data || parsed;

            if (!imported || typeof imported !== "object") {
                throw new Error("Invalid data structure");
            }

            confirmAction(
                "Import this backup?",
                "Your current AmitOS data will be replaced by the imported backup.",
                () => {
                    state = imported;
                    normalizeState();
                    applyTheme();
                    render();
                    toast("Backup imported successfully.");
                }
            );

        } catch (error) {
            console.error(error);
            toast("Invalid or corrupted JSON file.", "error");
        } finally {
            event.target.value = "";
        }
    };

    reader.onerror = () => {
        toast("Could not read the file.", "error");
        event.target.value = "";
    };

    reader.readAsText(file);
}

function removeDemoData() {
    if (!state.settings.demoDataLoaded) {
        toast("Demo data has already been removed.");
        return;
    }

    confirmAction(
        "Remove demo data?",
        "Known demo entries will be removed. Your other data will remain.",
        () => {
            const demoTitle = "A new beginning";

            state.studySessions = state.studySessions.filter(
                s => !String(s.notes || "").includes("Demo")
            );

            state.tasks = state.tasks.filter(
                t => !String(t.description || "").includes("Demo")
            );

            state.journalEntries = state.journalEntries.filter(
                e => e.title !== demoTitle
            );

            state.goals = state.goals.filter(
                g => g.title !== "Build AmitOS"
            );

            state.habitLogs = {};

            state.settings.demoDataLoaded = false;

            saveData();
            render();

            toast("Demo data removed.");
        }
    );
}

function resetAllData() {
    confirmAction(
        "Reset AmitOS?",
        "ALL AmitOS data stored in this browser will be deleted. This cannot be undone unless you have an export.",
        () => {
            state = createDefaultData();
            saveData();
            applyTheme();
            navigate("dashboard");
            toast("AmitOS has been reset.");
        }
    );
}

/* =========================================================
   END
   ========================================================= */