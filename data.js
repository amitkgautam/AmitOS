/* =========================================================
   AmitOS — Default Data & Configuration
   ========================================================= */

const AMITOS_VERSION = 1;
const STORAGE_KEY = "amitos_data_v1";

const DEFAULT_SUBJECTS = [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Computer Science",
    "Other"
];

const DEFAULT_HABITS = [
    { id: "habit-study", name: "Study", icon: "📚" },
    { id: "habit-exercise", name: "Exercise", icon: "🏃" },
    { id: "habit-read", name: "Read", icon: "📖" },
    { id: "habit-water", name: "Drink Water", icon: "💧" },
    { id: "habit-sleep", name: "Sleep on Time", icon: "😴" },
    { id: "habit-screen", name: "Limit Screen Time", icon: "📱" }
];

const DEFAULT_IMPROVEMENTS = [
    { id: "imp-discipline", category: "Discipline", previous: 4, current: 6, goal: 9, notes: "", updated: todayISO() },
    { id: "imp-communication", category: "Communication", previous: 4, current: 5, goal: 9, notes: "", updated: todayISO() },
    { id: "imp-confidence", category: "Confidence", previous: 4, current: 5, goal: 9, notes: "", updated: todayISO() },
    { id: "imp-fitness", category: "Fitness", previous: 5, current: 6, goal: 9, notes: "", updated: todayISO() },
    { id: "imp-coding", category: "Coding", previous: 2, current: 4, goal: 9, notes: "", updated: todayISO() },
    { id: "imp-knowledge", category: "Knowledge", previous: 5, current: 6, goal: 9, notes: "", updated: todayISO() },
    { id: "imp-focus", category: "Focus", previous: 3, current: 5, goal: 9, notes: "", updated: todayISO() },
    { id: "imp-emotional", category: "Emotional control", previous: 4, current: 5, goal: 9, notes: "", updated: todayISO() }
];

const DEFAULT_ACHIEVEMENTS = [
    {
        id: "first-study",
        icon: "📚",
        title: "First Study Session",
        description: "Complete your first study session.",
        type: "studyCount",
        target: 1
    },
    {
        id: "study-10",
        icon: "📖",
        title: "10 Hours Studied",
        description: "Study for a total of 10 hours.",
        type: "studyHours",
        target: 10
    },
    {
        id: "study-50",
        icon: "🔥",
        title: "50 Hours Studied",
        description: "Study for a total of 50 hours.",
        type: "studyHours",
        target: 50
    },
    {
        id: "study-100",
        icon: "🧠",
        title: "100 Hours Studied",
        description: "Study for a total of 100 hours.",
        type: "studyHours",
        target: 100
    },
    {
        id: "streak-3",
        icon: "🔥",
        title: "3 Day Streak",
        description: "Maintain a 3-day habit streak.",
        type: "streak",
        target: 3
    },
    {
        id: "streak-7",
        icon: "🔥",
        title: "7 Day Streak",
        description: "Maintain a 7-day habit streak.",
        type: "streak",
        target: 7
    },
    {
        id: "tasks-10",
        icon: "🎯",
        title: "10 Tasks Completed",
        description: "Complete 10 tasks.",
        type: "tasks",
        target: 10
    },
    {
        id: "tasks-100",
        icon: "🏆",
        title: "100 Tasks Completed",
        description: "Complete 100 tasks.",
        type: "tasks",
        target: 100
    },
    {
        id: "journal-10",
        icon: "📔",
        title: "10 Journal Entries",
        description: "Write 10 journal entries.",
        type: "journal",
        target: 10
    },
    {
        id: "journal-30",
        icon: "📖",
        title: "30 Journal Entries",
        description: "Write 30 journal entries.",
        type: "journal",
        target: 30
    }
];

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function createDefaultData() {
    return {
        version: AMITOS_VERSION,

        profile: {
            name: "Amit",
            about: "Building myself one day at a time.",
            education: "Competitive exam preparation",
            skills: "Learning • Coding • Problem Solving",
            projects: "AmitOS",
            achievements: "",
            goals: "Become disciplined, knowledgeable and independent.",
            futurePlans: ""
        },

        studySessions: [],

        subjects: [...DEFAULT_SUBJECTS],

        habits: DEFAULT_HABITS.map(h => ({ ...h })),

        habitLogs: {},

        improvements: DEFAULT_IMPROVEMENTS.map(i => ({ ...i })),

        tasks: [],

        journalEntries: [],

        goals: [],

        achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),

        settings: {
            dailyStudyTarget: 4,
            theme: "dark",
            demoDataLoaded: false
        }
    };
}

/* Small optional demo dataset.
   It is deliberately generic and does not create fake personal achievements. */

function createDemoData() {
    const today = todayISO();

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    return {
        studySessions: [
            {
                id: uid(),
                subject: "Physics",
                topic: "Kinematics",
                date: today,
                start: "08:00",
                end: "09:15",
                duration: 75,
                type: "Concept",
                notes: "Demo session — replace with your own data."
            },
            {
                id: uid(),
                subject: "Mathematics",
                topic: "Functions",
                date: yesterday,
                start: "17:00",
                end: "18:00",
                duration: 60,
                type: "Practice",
                notes: "Demo session."
            }
        ],

        tasks: [
            {
                id: uid(),
                title: "Review today's notes",
                description: "Demo task.",
                priority: "Medium",
                dueDate: today,
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: uid(),
                title: "Solve practice questions",
                description: "Demo task.",
                priority: "High",
                dueDate: today,
                completed: true,
                createdAt: new Date().toISOString()
            }
        ],

        journalEntries: [
            {
                id: uid(),
                date: today,
                title: "A new beginning",
                mood: "Good",
                content: "This is a demo journal entry. Replace it with your own thoughts.",
                tags: ["demo"]
            }
        ],

        goals: [
            {
                id: uid(),
                title: "Build AmitOS",
                description: "Finish and understand my personal dashboard.",
                category: "Coding",
                targetDate: today,
                progress: 20,
                status: "In Progress"
            }
        ],

        habitLogs: {
            [yesterday]: {
                "habit-study": true,
                "habit-exercise": true,
                "habit-read": false,
                "habit-water": true,
                "habit-sleep": true,
                "habit-screen": false
            }
        }
    };
}

function uid() {
    return "id-" + Date.now().toString(36) + "-" +
        Math.random().toString(36).slice(2, 9);
}