// TASKFLOW · Supabase data layer
// ─────────────────────────────────────────────────────────────────
// DROP-IN REPLACEMENT for data.jsx.
// Same exposed API: useTaskflow(), TF_LABELS, tfFmtDate, tfIsOverdue, etc.
// To activate: in index.html, replace <script src="src/data.jsx"> with this file.
//
// Requires:
//   1. Supabase project created.
//   2. SQL files supabase/01_schema.sql, 02_policies.sql executed.
//   3. <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> loaded BEFORE this file.
//   4. window.SUPABASE_CONFIG = { url, anonKey } set before this loads.
// ─────────────────────────────────────────────────────────────────

const TF_STORES   = ["Centro", "Ensanche", "Norte"];
const TF_CATS = ["Clinica", "Ventas", "Audiologia", "Taller", "Incidencias", "Seguimiento", "Inventario", "Limpieza", "Administracion"];
const TF_PRIOS    = ["baja", "media", "alta", "critica"];
const TF_STATUSES = ["pendiente", "proceso", "bloqueada", "urgente", "completada"];

const TF_LABELS = {
  status: { pendiente: "Pendiente", proceso: "En proceso", bloqueada: "Bloqueada", urgente: "Urgente", completada: "Completada" },
  priority: { baja: "Baja", media: "Media", alta: "Alta", critica: "Crítica" },
  category: {
  Clinica: "Clínica",
  Ventas: "Ventas",
  Audiologia: "Audiología",
  Taller: "Taller",
  Incidencias: "Incidencias",
  Seguimiento: "Seguimiento",
  Inventario: "Inventario",
  Limpieza: "Limpieza",
  Administracion: "Administración"
}

};

// ── Supabase client ──────────────────────────────────────────────
const tfSupabase = (() => {
  const cfg = window.SUPABASE_CONFIG;
  if (!cfg?.url || !cfg?.anonKey) {
    console.error("[TASKFLOW] Falta window.SUPABASE_CONFIG = { url, anonKey } antes de cargar data-supabase.jsx");
    return null;
  }
  if (!window.supabase?.createClient) {
    console.error("[TASKFLOW] Falta supabase-js. Añade <script src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'></script>");
    return null;
  }
  window.__supabase = window.supabase.createClient(cfg.url, cfg.anonKey, {
  auth: {
    flowType: "pkce",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "taskflow.auth",
  },
  realtime: { params: { eventsPerSecond: 10 } },
});

return window.__supabase;
})();

// Map row → in-memory task object (camelCase) consistent with data.jsx
const rowToTask = (r) => ({
  id: r.id,
  title: r.title,
  notes: r.notes || "",
  category: r.category,
  priority: r.priority,
  status: r.status,
  dueDate: r.due_date,
  assignee: r.assignee_id,
  createdBy: r.created_by,
  checklist: r.checklist || [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
const taskToRow = (t) => ({
  title: t.title,
  notes: t.notes ?? "",
  category: t.category,
  priority: t.priority,
  status: t.status,
  due_date: t.dueDate,
  assignee_id: t.assignee || null,
  created_by: t.createdBy || null,
  checklist: t.checklist ?? [],
});
const rowToWorker = (r) => ({
  id: r.id, name: r.name, role: r.role, store: r.store,
  color: r.color, initials: r.initials, status: r.status,
  isManager: r.is_manager, authId: r.auth_id, avatarUrl: r.avatar_url,
});
const rowToHistory = (r) => ({
  id: r.id, at: r.created_at, action: r.action,
  payload: r.payload || {}, actor: r.actor_id,
});

// ── Hook ─────────────────────────────────────────────────────────
const { useState, useEffect, useMemo, useCallback, useRef } = React;

function useTaskflow() {
  const [workers, setWorkers] = useState([]);
  const [tasks, setTasks]     = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [session, setSession] = useState(null);
 useEffect(() => {
  if (!tfSupabase) return;

  tfSupabase.auth.getSession().then(({ data }) => {
    setSession(data.session ?? null);
  });

  const { data: sub } = tfSupabase.auth.onAuthStateChange((_event, s) => {
    setSession(s);
  });

  return () => sub?.subscription?.unsubscribe();
}, []);
  // Initial fetch + realtime subscriptions
  useEffect(() => {
    if (!tfSupabase) { setError("Supabase no configurado"); setLoading(false); return; }
    let mounted = true;

    (async () => {
      try {
        const [w, t, h] = await Promise.all([
          tfSupabase.from("workers").select("*").order("name"),
          tfSupabase.from("tasks").select("*").order("created_at", { ascending: false }),
          tfSupabase.from("task_history").select("*").order("created_at", { ascending: false }).limit(200),
        ]);
        if (!mounted) return;
        if (w.error) throw w.error;
        if (t.error) throw t.error;
        if (h.error) throw h.error;
        setWorkers(w.data.map(rowToWorker));
        setTasks(t.data.map(rowToTask));
        setHistory(h.data.map(rowToHistory));
      } catch (err) {
        console.error("[TASKFLOW] fetch error", err);
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Realtime
    const ch = tfSupabase
      .channel("taskflow")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (p) => {
        setTasks(prev => {
          if (p.eventType === "INSERT") return [rowToTask(p.new), ...prev];
          if (p.eventType === "UPDATE") return prev.map(x => x.id === p.new.id ? rowToTask(p.new) : x);
          if (p.eventType === "DELETE") return prev.filter(x => x.id !== p.old.id);
          return prev;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "workers" }, (p) => {
        setWorkers(prev => {
          if (p.eventType === "INSERT") return [...prev, rowToWorker(p.new)];
          if (p.eventType === "UPDATE") return prev.map(x => x.id === p.new.id ? rowToWorker(p.new) : x);
          if (p.eventType === "DELETE") return prev.filter(x => x.id !== p.old.id);
          return prev;
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "task_history" }, (p) => {
        setHistory(prev => [rowToHistory(p.new), ...prev].slice(0, 200));
      })
      .subscribe();

    return () => { mounted = false; tfSupabase.removeChannel(ch); };
  }, []);

  // ── Mutations ──────────────────────────────────────────────────
  const upsertTask = useCallback(async (task, actor) => {
  try {
    const row = taskToRow(task);

    // Si es tarea nueva, no mandamos id vacío
    if (!task.id && row.id) {
      delete row.id;
    }

    if (task.id) {
      const { error } = await tfSupabase
        .from("tasks")
        .update(row)
        .eq("id", task.id);

      if (error) {
        console.error("Error actualizando tarea:", error);
        alert("Error actualizando tarea: " + error.message);
        return;
      }

      await tfSupabase.from("task_history").insert({
        task_id: task.id,
        actor_id: actor || null,
        action: "update",
        payload: { title: task.title }
      });

    } else {
      const { data, error } = await tfSupabase
        .from("tasks")
        .insert([row])
        .select()
        .single();

      if (error) {
        console.error("Error creando tarea:", error);
        alert("Error creando tarea: " + error.message);
        return;
      }

      if (data) {
        setTasks(prev => [rowToTask(data), ...prev]);

        await tfSupabase.from("task_history").insert({
          task_id: data.id,
          actor_id: actor || null,
          action: "create",
          payload: { title: task.title }
        });
      }
    }

  } catch (e) {
    console.error("Error inesperado guardando tarea:", e);
    alert("Error inesperado guardando tarea: " + e.message);
  }
}, []);

  const updateTaskStatus = useCallback(async (taskId, status) => {
    // Trigger log_task_status_change in DB will record history automatically
    const { error } = await tfSupabase.from("tasks").update({ status }).eq("id", taskId);
    if (error) console.error(error);
  }, []);

  const deleteTask = useCallback(async (taskId, actor) => {
    await tfSupabase.from("task_history").insert({
      task_id: taskId, actor_id: actor || null, action: "delete", payload: {}
    });
    const { error } = await tfSupabase.from("tasks").delete().eq("id", taskId);
    if (error) console.error(error);
  }, []);

  const setWorkerStatus = useCallback(async (workerId, status) => {
    const { error } = await tfSupabase.from("workers").update({ status }).eq("id", workerId);
    if (error) console.error(error);
  }, []);

  const resetData = useCallback(() => {
    alert("En modo Supabase los datos viven en la base. Resetea desde el SQL editor si lo necesitas.");
  }, []);

  const addHistory = useCallback(async (action, payload, actor) => {
    await tfSupabase.from("task_history").insert({
      task_id: payload?.taskId || null, actor_id: actor || null, action, payload
    });
  }, []);

  const currentWorker = useMemo(() => {
  const uid = session?.user?.id;
  if (!uid) return null;
  return workers.find(w => w.authId === uid) || null;
}, [workers, session]);

return {
  workers,
  tasks,
  history,
  loading,
  error,
  currentWorker,
  upsertTask,
  updateTaskStatus,
  deleteTask,
  setWorkerStatus,
  resetData,
  addHistory,
};
}

// ── Helpers (same as data.jsx) ──────────────────────────────────
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
function tfFmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function tfIsOverdue(task) {
  if (task.status === "completada" || !task.dueDate) return false;
  return new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
}

// ── Stub useStored — Supabase mode keeps UI prefs in localStorage still ──
function useStored(key, fallback) {
  const [value, setValue] = useState(() => {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
  });
  const update = useCallback((updater) => {
    setValue(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [value, update];
}

Object.assign(window, {
  TF_STORES, TF_CATS, TF_PRIOS, TF_STATUSES, TF_LABELS,
  useTaskflow, useStored, tfFmtDate, tfFmtDateTime, tfIsOverdue,
  tfSupabase
});
