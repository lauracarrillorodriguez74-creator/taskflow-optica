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
const TF_CATS     = ["Clinica", "Ventas", "Audiologia", "Taller", "Incidencias", "Seguimiento", "Administracion"];
const TF_PRIOS    = ["baja", "media", "alta", "critica"];
const TF_STATUSES = ["pendiente", "proceso", "bloqueada", "urgente", "completada"];

const TF_WORKERS_SEED = [
  { id: "w1", name: "Lucía Marín",   role: "Optometrista",         store: "Centro",   color: "#2E7BC4", status: "online",  initials: "LM" },
  { id: "w2", name: "Daniel Vega",   role: "Audioprotesista",      store: "Centro",   color: "#7A5AE0", status: "online",  initials: "DV" },
  { id: "w3", name: "Carla Ruiz",    role: "Asesora de ventas",    store: "Ensanche", color: "#1E8F73", status: "busy",    initials: "CR" },
  { id: "w4", name: "Mateo Torres",  role: "Técnico de taller",    store: "Centro",   color: "#C58A1B", status: "online",  initials: "MT" },
  { id: "w5", name: "Elena Bravo",   role: "Recepción",            store: "Norte",    color: "#D14B43", status: "online",  initials: "EB" },
  { id: "w6", name: "Hugo Salas",    role: "Optometrista",         store: "Ensanche", color: "#2A6FDB", status: "offline", initials: "HS" },
  { id: "w7", name: "Nora Aguilar",  role: "Asesora de ventas",    store: "Norte",    color: "#1E5B94", status: "online",  initials: "NA" },
  { id: "w8", name: "Iván Pardo",    role: "Gerente",              store: "Centro",   color: "#0B2F5B", status: "busy",    initials: "IP" },
];

// Generate a stable but realistic set of tasks
function tfDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

const TF_TASKS_SEED = [
  // CLINICA
  { title: "Revisión visual completa — Sra. Mendoza",        cat: "Clinica",        pri: "alta",    st: "proceso",     a: "w1", d: 0,  notes: "Cita 12:30. Revisar progresivos prescritos hace 6 meses." },
  { title: "Adaptación de lentes de contacto multifocales",  cat: "Clinica",        pri: "media",   st: "pendiente",   a: "w1", d: 1,  notes: "Primer ajuste, llevar muestra Air Optix Multifocal." },
  { title: "Control postoperatorio LASIK — D. Romero",       cat: "Clinica",        pri: "alta",    st: "pendiente",   a: "w6", d: 2,  notes: "Día 14 post-cirugía. Verificar agudeza visual." },
  { title: "Topografía corneal Sr. Ortega",                  cat: "Clinica",        pri: "media",   st: "completada",  a: "w1", d: -2 },
  { title: "Examen pediátrico — Familia Ribas",              cat: "Clinica",        pri: "media",   st: "pendiente",   a: "w6", d: 3 },

  // AUDIOLOGIA
  { title: "Adaptación audífonos Phonak Lumity",             cat: "Audiologia",     pri: "alta",    st: "proceso",     a: "w2", d: 0,  notes: "Cliente prueba 7 días, ajustar programas." },
  { title: "Revisión audiometría tonal Sra. Quirós",         cat: "Audiologia",     pri: "media",   st: "pendiente",   a: "w2", d: 1 },
  { title: "Mantenimiento técnico — audífonos Oticon",       cat: "Audiologia",     pri: "baja",    st: "pendiente",   a: "w2", d: 4 },
  { title: "Seguimiento 30 días — Sr. Iglesias",             cat: "Seguimiento",    pri: "media",   st: "completada",  a: "w2", d: -1 },

  // VENTAS
  { title: "Presupuesto Tom Ford TF5398 + cristales Zeiss",  cat: "Ventas",         pri: "media",   st: "proceso",     a: "w3", d: 0 },
  { title: "Llamada cliente — recordatorio gafas listas",    cat: "Ventas",         pri: "baja",    st: "pendiente",   a: "w7", d: 0 },
  { title: "Entrega monturas Persol — Sr. Bonilla",          cat: "Ventas",         pri: "alta",    st: "urgente",     a: "w3", d: 0,  notes: "Cliente llega a las 17:00, prioridad máxima." },
  { title: "Cierre venta progresivos premium familia López", cat: "Ventas",         pri: "alta",    st: "proceso",     a: "w7", d: 1 },
  { title: "Catálogo nuevas Lindberg para showcase",         cat: "Ventas",         pri: "baja",    st: "pendiente",   a: "w3", d: 5 },
  { title: "Devolución cristales defectuosos a proveedor",   cat: "Ventas",         pri: "media",   st: "bloqueada",   a: "w3", d: -1, notes: "Esperando autorización del proveedor." },

  // TALLER
  { title: "Montaje cristales Zeiss DriveSafe — pedido #4821", cat: "Taller",       pri: "alta",    st: "proceso",     a: "w4", d: 0 },
  { title: "Reparación bisagra montura Cartier",             cat: "Taller",         pri: "media",   st: "pendiente",   a: "w4", d: 1 },
  { title: "Calibrado biselador automático",                 cat: "Taller",         pri: "alta",    st: "bloqueada",   a: "w4", d: -1, notes: "Falta pieza, llega martes." },
  { title: "Tallado lentes pedido #4825",                    cat: "Taller",         pri: "media",   st: "pendiente",   a: "w4", d: 2 },
  { title: "Ajuste plaquetas titanium 12 monturas",          cat: "Taller",         pri: "baja",    st: "completada",  a: "w4", d: -3 },

  // INCIDENCIAS
  { title: "Cliente Sr. Vidal — queja por reflejos",         cat: "Incidencias",    pri: "critica", st: "urgente",     a: "w8", d: 0,  notes: "Llamar antes de las 11:00. Posible cambio de cristales." },
  { title: "Pedido extraviado — proveedor Essilor",          cat: "Incidencias",    pri: "alta",    st: "bloqueada",   a: "w8", d: -1 },
  { title: "Reclamación seguro Adeslas — Sra. Garrido",      cat: "Incidencias",    pri: "alta",    st: "proceso",     a: "w5", d: 1 },
  { title: "Cristal roto en montaje — pedido #4810",         cat: "Incidencias",    pri: "media",   st: "completada",  a: "w4", d: -2 },

  // SEGUIMIENTO
  { title: "Encuesta satisfacción 23 clientes Octubre",      cat: "Seguimiento",    pri: "baja",    st: "pendiente",   a: "w5", d: 6 },
  { title: "Recordatorio revisión anual — 14 pacientes",     cat: "Seguimiento",    pri: "media",   st: "proceso",     a: "w5", d: 2 },
  { title: "Confirmación citas semana próxima",              cat: "Seguimiento",    pri: "media",   st: "pendiente",   a: "w5", d: 1 },
  { title: "Llamada 6 meses post-adaptación lentillas",      cat: "Seguimiento",    pri: "baja",    st: "completada",  a: "w1", d: -4 },

  // ADMINISTRACION
  { title: "Cierre caja semanal — tienda Centro",            cat: "Administracion", pri: "alta",    st: "pendiente",   a: "w8", d: 0 },
  { title: "Subir facturas Octubre a gestoría",              cat: "Administracion", pri: "media",   st: "proceso",     a: "w8", d: 2 },
  { title: "Inventario monturas tienda Norte",               cat: "Administracion", pri: "media",   st: "pendiente",   a: "w5", d: 3 },
  { title: "Renovar contrato proveedor cristales Hoya",      cat: "Administracion", pri: "alta",    st: "pendiente",   a: "w8", d: 4 },
  { title: "Formación equipo — nueva caja registradora",     cat: "Administracion", pri: "baja",    st: "completada",  a: "w8", d: -5 },

  // Mix extra
  { title: "Reposición vitrina sol Ray-Ban — tienda Ensanche", cat: "Ventas",       pri: "baja",    st: "completada",  a: "w3", d: -1 },
  { title: "Visita comercial proveedor Lindberg",            cat: "Ventas",         pri: "media",   st: "pendiente",   a: "w8", d: 5 },
  { title: "Auditoría de lentes en stock",                   cat: "Administracion", pri: "media",   st: "proceso",     a: "w5", d: 1 },
  { title: "Cliente sin cita — Sr. Hernández",               cat: "Clinica",        pri: "media",   st: "pendiente",   a: "w1", d: 0 },
  { title: "Llamada técnica Phonak — software target",       cat: "Audiologia",     pri: "alta",    st: "proceso",     a: "w2", d: 0 },
  { title: "Recogida producto envío Norte → Centro",         cat: "Taller",         pri: "media",   st: "pendiente",   a: "w4", d: 1 },
];

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
  if (meta && meta.version === 1) return;
  const seed = tfBuildSeed();
  tfStorage.set(TF_KEYS.workers, seed.workers);
  tfStorage.set(TF_KEYS.tasks,   seed.tasks);
  tfStorage.set(TF_KEYS.history, [
    { id: "h1", at: new Date().toISOString(), actor: "w8", action: "seed", payload: { tasks: seed.tasks.length } }
  ]);
  tfStorage.set(TF_KEYS.meta, { version: 1, seededAt: new Date().toISOString() });
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
