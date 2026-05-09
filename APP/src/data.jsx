// TASKFLOW · Data layer
// ─────────────────────────────────────────────────────────────────
// Storage abstraction. Today: localStorage. Tomorrow: Supabase.
// To migrate, swap implementations of `tfStorage.get/set`.
// ─────────────────────────────────────────────────────────────────

const TF_KEYS = {
  workers: "taskflow:workers",
  tasks:   "taskflow:tasks",
  history: "taskflow:history",
  meta:    "taskflow:meta",
};

const tfStorage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  reset() {
    Object.values(TF_KEYS).forEach(k => localStorage.removeItem(k));
  }
};

// ── Seed data ────────────────────────────────────────────────────
const TF_STORES   = ["Centro", "Ensanche", "Norte"];
const TF_CATS     = ["Clinica", "Ventas", "Audiologia", "Taller", "Incidencias", "Seguimiento", "Inventario", "Limpieza", "Administracion"];
const TF_PRIOS    = ["baja", "media", "alta", "critica"];
const TF_STATUSES = ["pendiente", "proceso", "bloqueada", "urgente", "completada"];

const TF_WORKERS_SEED = [
  {
  id: "w0",
  name: "Sin asignar",
  role: "Pendiente de asignación",
  store: "3 Centros",
  color: "#94A3B8",
  status: "online"
},

  {
    id: "w1",
    name: "Laura C.",
    role: "Directora General",
    store: "3 Centros",
    color: "#0B2F5B",
    status: "online"
  },

  {
    id: "w2",
    name: "Natalia M.",
    role: "Directora · Optometrista · Audio",
    store: "3 Centros",
    color: "#2E7BC4",
    status: "online"
  },

  {
    id: "w3",
    name: "Raquel L.",
    role: "Vendedora",
    store: "3 Centros",
    color: "#7A5AE0",
    status: "online"
  },

  {
    id: "w4",
    name: "María del Mar L.",
    role: "Adjunta · Vendedora · Audio",
    store: "3 Centros",
    color: "#1E8F73",
    status: "online"
  },

  {
    id: "w5",
    name: "María Angeles C.",
    role: "Optometrista",
    store: "3 Centros",
    color: "#C58A1B",
    status: "online"
  },

  {
    id: "w6",
    name: "Mercedes M.",
    role: "Vendedora",
    store: "3 Centros",
    color: "#D14B43",
    status: "online"
  },

  {
    id: "w7",
    name: "Raúl T.",
    role: "Optometrista · Audio",
    store: "3 Centros",
    color: "#2A6FDB",
    status: "online"
  },

  {
    id: "w8",
    name: "Montse G.",
    role: "Optometrista",
    store: "3 Centros",
    color: "#1E5B94",
    status: "online"
  },

  {
    id: "w9",
    name: "Álvaro M.",
    role: "CEO",
    store: "3 Centros",
    color: "#0E7490",
    status: "busy"
  },

  {
    id: "w10",
    name: "Arwa A.",
    role: "Optometrista · Audio",
    store: "3 Centros",
    color: "#9333EA",
    status: "online"
  }
];

// Generate a stable but realistic set of tasks
function tfDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

const TF_TASKS_SEED = [];
function tfBuildSeed() {
  const tasks = TF_TASKS_SEED.map((t, i) => ({
    id: `t${(i + 1).toString().padStart(3, "0")}`,
    title: t.title,
    notes: t.notes || "",
    category: t.cat,
    priority: t.pri,
    status:   t.st,
    dueDate:  tfDays(t.d ?? 0),
    assignee: t.a,
    createdBy: "w8",
    createdAt: new Date(Date.now() - (40 - i) * 86400000 / 4).toISOString(),
    updatedAt: new Date(Date.now() - (40 - i) * 86400000 / 8).toISOString(),
    checklist: t.cat === "Clinica" ? [
      { id: "c1", label: "Confirmar cita por SMS", done: i % 2 === 0 },
      { id: "c2", label: "Preparar historial clínico", done: i % 3 === 0 },
    ] : [],
  }));
  return { workers: TF_WORKERS_SEED, tasks };
}

function tfEnsureSeed() {
  const meta = tfStorage.get(TF_KEYS.meta, null);
  if (meta && meta.version === 4) return;
  const seed = tfBuildSeed();
  tfStorage.set(TF_KEYS.workers, seed.workers);
  tfStorage.set(TF_KEYS.tasks,   seed.tasks);
  tfStorage.set(TF_KEYS.history, [
    { id: "h1", at: new Date().toISOString(), actor: "w8", action: "seed", payload: { tasks: seed.tasks.length } }
  ]);
  tfStorage.set(TF_KEYS.meta, { version: 4, seededAt: new Date().toISOString() });
}

// ── React hooks ──────────────────────────────────────────────────
const { useState, useEffect, useMemo, useCallback, useRef } = React;

function useStored(key, fallback) {
  const [value, setValue] = useState(() => tfStorage.get(key, fallback));
  const update = useCallback((updater) => {
    setValue(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      tfStorage.set(key, next);
      return next;
    });
  }, [key]);
  return [value, update];
}

function useTaskflow() {
  tfEnsureSeed();
  const [workers, setWorkers] = useStored(TF_KEYS.workers, []);
  const [tasks, setTasks]     = useStored(TF_KEYS.tasks, []);
  const [history, setHistory] = useStored(TF_KEYS.history, []);

  const addHistory = useCallback((action, payload, actor) => {
    setHistory(h => [
      { id: `h${Date.now()}`, at: new Date().toISOString(), action, payload, actor: actor || "w8" },
      ...h,
    ].slice(0, 200));
  }, [setHistory]);

  const upsertTask = useCallback((task, actor) => {
    setTasks(ts => {
      const exists = ts.find(t => t.id === task.id);
      if (exists) {
        return ts.map(t => t.id === task.id ? { ...t, ...task, updatedAt: new Date().toISOString() } : t);
      }
      const newTask = {
        id: `t${Date.now().toString(36)}`,
        notes: "",
        checklist: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actor || "w8",
        ...task,
      };
      return [newTask, ...ts];
    });
    addHistory(task.id ? "update" : "create", { taskId: task.id, title: task.title }, actor);
  }, [setTasks, addHistory]);

  const updateTaskStatus = useCallback((taskId, status, actor) => {
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
    addHistory("status", { taskId, status }, actor);
  }, [setTasks, addHistory]);

  const deleteTask = useCallback((taskId, actor) => {
    setTasks(ts => ts.filter(t => t.id !== taskId));
    addHistory("delete", { taskId }, actor);
  }, [setTasks, addHistory]);

  const setWorkerStatus = useCallback((workerId, status) => {
    setWorkers(ws => ws.map(w => w.id === workerId ? { ...w, status } : w));
  }, [setWorkers]);

  const resetData = useCallback(() => {
    tfStorage.reset();
    const seed = tfBuildSeed();
    setWorkers(seed.workers);
    setTasks(seed.tasks);
    setHistory([{ id: "h1", at: new Date().toISOString(), actor: "w8", action: "reset", payload: {} }]);
    tfStorage.set(TF_KEYS.meta, { version: 1, seededAt: new Date().toISOString() });
  }, [setWorkers, setTasks, setHistory]);

  return { workers, tasks, history, upsertTask, updateTaskStatus, deleteTask, setWorkerStatus, resetData, addHistory };
}

// ── Helpers ──────────────────────────────────────────────────────
const TF_LABELS = {
  status: {
    pendiente: "Pendiente",
    proceso: "En proceso",
    bloqueada: "Bloqueada",
    urgente: "Urgente",
    completada: "Completada",
  },
  priority: {
    baja: "Baja",
    media: "Media",
    alta: "Alta",
    critica: "Crítica",
  },
  category: {
    Clinica: "Clínica",
    Ventas: "Ventas",
    Audiologia: "Audiología",
    Taller: "Taller",
    Incidencias: "Incidencias",
    Seguimiento: "Seguimiento",
    Seguimiento: "Seguimiento",
    Inventario: "Inventario",
    Limpieza: "Limpieza",
    Administracion: "Administración",
  }
};

function tfFmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.round((d - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  const dayNames = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff > 1 && diff < 7) return `${dayNames[d.getDay()]} ${d.getDate()}`;
  if (diff < -1 && diff > -7) return `Hace ${-diff} días`;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}
function tfIsOverdue(task) {
  if (task.status === "completada") return false;
  return new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
}
function tfFmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

Object.assign(window, {
  TF_KEYS, tfStorage, TF_STORES, TF_CATS, TF_PRIOS, TF_STATUSES,
  TF_WORKERS_SEED, useTaskflow, TF_LABELS, tfFmtDate, tfFmtDateTime, tfIsOverdue, useStored
});
