// TASKFLOW · App v3 — Auth-only mode
// - Acceso SOLO por Supabase Auth
// - currentUser vinculado a workers.auth_id
// - Managers ven todas las tareas; el resto solo las suyas
// - Sin UserSwitcher ni selector manual de usuario
// - Botón "Cerrar sesión" completo

const { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } = React;

/* ── Managers autorizados ───────────────────────── */
const MANAGER_NAMES = ["natalia", "álvaro", "alvaro", "laura"];
function checkIsManager(worker) {
  if (!worker) return false;
  if (worker.isManager) return true;
  const n = (worker.name || "").toLowerCase();
  return MANAGER_NAMES.some(m => n.startsWith(m));
}
window.checkIsManager = checkIsManager;

/* ── Sign-out helper ────────────────────────────── */
async function doSignOut() {
  const supa = window.__supabase || window.tfSupabase;
  if (supa) {
    try { await supa.auth.signOut(); } catch (e) { console.warn("signOut error", e); }
  }
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/";
}

/* ── Toast context ──────────────────────────────── */
const ToastCtx = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, type = "ok") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, out: true } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 260);
    }, 3000);
  }, []);

  const icons = {
    ok:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>,
    err: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>,
    inf: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
  };

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="tf-toasts">
        {toasts.map(t => (
          <div key={t.id} className={`tf-toast ${t.type} ${t.out ? "out" : ""}`}>
            <div className="tf-toast-icon">{icons[t.type] || icons.ok}</div>
            <span style={{ flex: 1 }}>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
function useToast() { return useContext(ToastCtx) || (() => {}); }
window.useToast = useToast;

/* ── Tweaks defaults ────────────────────────────── */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light", "density": "regular", "defaultView": "kanban", "cards": "default"
}/*EDITMODE-END*/;

/* ── Nav items ──────────────────────────────────── */
const ALL_NAV = [
  { id: "dashboard",  label: "Dashboard", icon: "dashboard" },
  { id: "tasks",      label: "Tareas",    icon: "tasks" },
  { id: "workers",    label: "Equipo",    icon: "workers" },
  { id: "management", label: "Gerencia",  icon: "management", mgr: true },
];

/* ════════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════════ */
function Sidebar({ active, setActive, currentUser, workers, tasks, collapsed, onToggle, mobileOpen, onMobileClose, onSignOut }) {
  const counts = {
    tasks:      tasks.filter(t => t.status !== "completada").length,
    workers:    workers.filter(w => w.status === "online").length,
    management: tasks.filter(t => t.status === "urgente" || t.priority === "critica" || tfIsOverdue(t)).length,
  };
  const isMgr = checkIsManager(currentUser);
  const navItems = ALL_NAV.filter(n => !n.mgr || isMgr);

  return (
    <>
      {/* Scrim móvil */}
      <div className={`tf-side-scrim ${mobileOpen ? "is-open" : ""}`} onClick={onMobileClose} />

      <nav className={`tf-side ${mobileOpen ? "is-open" : ""}`}
        style={{ width: collapsed ? 60 : "var(--tf-sidebar)" }}>

        {/* Toggle collapse (desktop) */}
        <button onClick={onToggle}
          style={{ position: "absolute", top: 18, right: -12, width: 22, height: 22, borderRadius: "50%", background: "var(--tf-surface)", border: "1.5px solid var(--tf-line)", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--tf-mute)", boxShadow: "var(--tf-sh-1)", zIndex: 10, transition: "all .2s" }}
          title={collapsed ? "Expandir" : "Colapsar"}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform .3s" }}>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        {/* Brand */}
        <div className="tf-side-brand">
          <div className="tf-brandmark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 12 7 8l3 3 5-5 6 6" /><circle cx="12" cy="12" r="9.5" opacity=".22" />
            </svg>
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <div className="tf-brand-name">TASKFLOW</div>
              <div className="tf-brand-sub">Óptica PRO</div>
            </div>
          )}
        </div>

        {/* Nav */}
        {!collapsed && <div className="tf-nav-section">Espacio de trabajo</div>}
        {navItems.map(item => (
          <div key={item.id}
            className={`tf-nav-item ${active === item.id ? "is-active" : ""}`}
            onClick={() => { setActive(item.id); onMobileClose(); }}
            title={collapsed ? item.label : ""}
            style={{ justifyContent: collapsed ? "center" : "flex-start", padding: collapsed ? "10px" : "8px 10px" }}>
            <Icon name={item.icon} size={17} stroke={active === item.id ? 2 : 1.7} />
            {!collapsed && <><span>{item.label}</span>{counts[item.id] > 0 && <span className="tf-count">{counts[item.id]}</span>}</>}
          </div>
        ))}

        {/* Categorías */}
        {!collapsed && (
          <>
            <div className="tf-nav-section">Categorías</div>
            {TF_CATS.map(c => {
              const count = tasks.filter(t => t.category === c && t.status !== "completada").length;
              return (
                <div key={c} className="tf-nav-item" style={{ fontSize: 12.5, padding: "6px 10px" }}>
                  <span className={`tf-cat c-${c}`} style={{ fontSize: 0, padding: 0, width: 8, height: 8, borderRadius: 3 }} />
                  <span>{TF_LABELS.category[c]}</span>
                  <span className="tf-count" style={{ fontSize: 9.5 }}>{count}</span>
                </div>
              );
            })}
          </>
        )}

        {/* Usuario actual + cerrar sesión */}
        <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--tf-line)" }}>
          {/* Info del usuario */}
          <div className="tf-side-user"
            style={{ justifyContent: collapsed ? "center" : "flex-start", cursor: "default" }}
            title={collapsed ? (currentUser?.name || "") : ""}>
            <Avatar worker={currentUser} size={33} status />
            {!collapsed && currentUser && (
              <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--tf-mute)", display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                  {currentUser.role}
                  {checkIsManager(currentUser) && <span className="tf-mgr-badge">Gerente</span>}
                </div>
              </div>
            )}
          </div>

          {/* Botón cerrar sesión */}
          <button
            onClick={onSignOut}
            title="Cerrar sesión"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: collapsed ? "9px 0" : "9px 10px",
              justifyContent: collapsed ? "center" : "flex-start",
              marginTop: 4, borderRadius: 9, border: "none",
              background: "transparent", color: "var(--tf-red-500)",
              fontSize: 12.5, fontWeight: 600, fontFamily: "inherit",
              cursor: "pointer", transition: "background .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--tf-red-100)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && "Cerrar sesión"}
          </button>
        </div>
      </nav>
    </>
  );
}

/* ════════════════════════════════════════════════
   BOTTOM NAV (móvil)
════════════════════════════════════════════════ */
function BottomNav({ active, setActive, tasks, currentUser }) {
  const counts = {
    tasks:      tasks.filter(t => t.status !== "completada").length,
    management: tasks.filter(t => t.status === "urgente" || t.priority === "critica" || tfIsOverdue(t)).length,
  };
  const isMgr = checkIsManager(currentUser);
  const navItems = ALL_NAV.filter(n => !n.mgr || isMgr);

  return (
    <nav className="tf-bottom-nav">
      {navItems.map(item => (
        <div key={item.id}
          className={`tf-bottom-nav-item ${active === item.id ? "active" : ""}`}
          onClick={() => setActive(item.id)}>
          <Icon name={item.icon} size={21} stroke={active === item.id ? 2.1 : 1.6} />
          <span>{item.label}</span>
          {counts[item.id] > 0 && <span className="tf-bottom-nav-badge">{Math.min(counts[item.id], 99)}</span>}
        </div>
      ))}
    </nav>
  );
}

/* ════════════════════════════════════════════════
   TOP BAR
════════════════════════════════════════════════ */
function TopBar({ active, onCreate, currentUser, onHamburger, onSignOut }) {
  const titles = {
    dashboard:  { title: "Dashboard",  crumb: "Resumen del día" },
    tasks:      { title: "Tareas",     crumb: "Gestión del trabajo" },
    workers:    { title: "Equipo",     crumb: "Personas y carga" },
    management: { title: "Gerencia",   crumb: "Métricas y rendimiento" },
  };
  const t = titles[active] || titles.dashboard;

  return (
    <header className="tf-top">
      {/* Hamburger (solo móvil) */}
      <button className="tf-btn-icon" onClick={onHamburger}
        style={{ display: "none" }} id="tf-ham">
        <Icon name="menu" size={19} />
      </button>
      <style>{`@media(max-width:768px){#tf-ham{display:inline-flex!important}}`}</style>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="tf-top-crumb">{t.crumb}</div>
        <div className="tf-top-title">{t.title}</div>
      </div>

      <div className="tf-search">
        <Icon name="search" size={14} /><input placeholder="Buscar tareas, personas…" /><span className="tf-kbd">⌘K</span>
      </div>

      <button className="tf-btn-icon" title="Notificaciones">
        <span style={{ position: "relative" }}>
          <Icon name="bell" size={17} />
          <span style={{ position: "absolute", top: -2, right: -2, width: 7, height: 7, background: "var(--tf-red-500)", borderRadius: 99, boxShadow: "0 0 0 2px var(--tf-surface)" }} />
        </span>
      </button>

      <button className="tf-btn tf-btn-pri" onClick={onCreate}>
        <Icon name="plus" size={14} />
        <span className="tf-btn-txt">Nueva tarea</span>
      </button>

      {/* Botón cerrar sesión en topbar */}
      <button
        className="tf-btn"
        onClick={onSignOut}
        title="Cerrar sesión"
        style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--tf-red-500)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span className="tf-btn-txt">Salir</span>
      </button>

      {/* Avatar en mobile */}
      <div style={{ display: "none" }} id="tf-mob-av">
        <Avatar worker={currentUser} size={31} status />
      </div>
      <style>{`@media(max-width:768px){#tf-mob-av{display:block!important}}`}</style>
    </header>
  );
}

/* ════════════════════════════════════════════════
   PANTALLA: usuario sin vincular
════════════════════════════════════════════════ */
function UnlinkedUserScreen({ email }) {
  return (
    <div style={{
      position: "fixed", inset: 0, display: "grid", placeItems: "center",
      background: "linear-gradient(160deg,#F4F7FA 0%,#E6EEF7 100%)",
      fontFamily: '"Inter",system-ui,sans-serif', padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 440, textAlign: "center",
        background: "rgba(255,255,255,.9)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,.7)", borderRadius: 22,
        padding: "40px 32px",
        boxShadow: "0 30px 80px rgba(11,47,91,.14)",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "#FEF2F2", border: "1px solid #FAD2D6",
          display: "grid", placeItems: "center", margin: "0 auto 20px",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D14B43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
            <line x1="18" y1="2" x2="22" y2="6" /><line x1="22" y1="2" x2="18" y2="6" />
          </svg>
        </div>
        <div style={{ fontFamily: '"Inter Tight",sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 10, color: "#1F2933" }}>
          Usuario no vinculado
        </div>
        <p style={{ fontSize: 14, color: "#3E4C5E", lineHeight: 1.6, margin: "0 0 8px" }}>
          Tu cuenta <strong style={{ color: "#0B2F5B" }}>{email}</strong> no está asociada
          a ningún trabajador en la base de datos.
        </p>
        <p style={{ fontSize: 13, color: "#6B7888", lineHeight: 1.5, margin: "0 0 24px" }}>
          Pide al gerente que vincule tu correo en la tabla <code style={{ background: "#F4F7FA", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>workers.auth_id</code>.
        </p>
        <button
          onClick={doSignOut}
          style={{
            padding: "11px 22px", borderRadius: 11, border: "none",
            background: "linear-gradient(160deg,#1E5B94,#0B2F5B)",
            color: "#fff", fontWeight: 600, fontSize: 14, fontFamily: "inherit",
            cursor: "pointer", boxShadow: "0 8px 22px rgba(11,47,91,.22)",
          }}
        >
          Cerrar sesión y volver
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   APP ROOT
════════════════════════════════════════════════ */
function App() {
  const {
    workers, tasks, history, loading, error,
    currentWorker, upsertTask, updateTaskStatus, deleteTask, resetData,
  } = useTaskflow();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const toast = useToast();

  const [active,     setActive]     = useStored("tf:active", "dashboard");
  const [openTask,   setOpenTask]   = useState(null);
  const [creating,   setCreating]   = useState(false);
  const [collapsed,  setCollapsed]  = useStored("tf:sidebar", false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // currentUser proviene SOLO de Supabase auth → workers.auth_id
  const currentUser = currentWorker || null;

  // Filtrado de tareas según rol
  const visibleTasks = useMemo(() => {
    if (!currentUser) return [];
    if (checkIsManager(currentUser)) return tasks;
    // No manager: solo tareas asignadas a él o creadas por él
    return tasks.filter(t =>
      t.assignee === currentUser.id || t.createdBy === currentUser.id
    );
  }, [tasks, currentUser]);

  // Aplicar tema
  useEffect(() => {
    const r = document.documentElement;
    r.dataset.theme   = t.theme;
    r.dataset.density = t.density;
    r.dataset.cards   = t.cards;
  }, [t]);

  // Cerrar sidebar móvil al navegar
  useEffect(() => { setMobileOpen(false); }, [active]);

  const handleOpenTask = (task) => { setOpenTask(task); setCreating(false); };
  const handleClose    = ()     => { setOpenTask(null); setCreating(false); };
  const handleCreate   = ()     => { setCreating(true); setOpenTask(null); };

  const handleSave = useCallback(async (draft) => {
    const isNew = !draft.id;
    await upsertTask(draft, currentUser?.id);
    toast(isNew ? "✓ Tarea creada" : "✓ Cambios guardados", "ok");
    handleClose();
  }, [upsertTask, currentUser, toast]);

  const handleDelete = useCallback(async (id) => {
    await deleteTask(id, currentUser?.id);
    toast("Tarea eliminada", "inf");
    handleClose();
  }, [deleteTask, currentUser, toast]);

  const liveTask = openTask ? visibleTasks.find(tt => tt.id === openTask.id) : null;

  /* ── Loading ── */
  if (loading) return (
    <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "var(--tf-bg)", fontFamily: "var(--tf-ui)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid rgba(11,47,91,.14)", borderTopColor: "var(--tf-blue-700)", animation: "spin .8s linear infinite" }} />
        <span style={{ fontSize: 14, color: "var(--tf-mute)" }}>Cargando…</span>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Error de conexión ── */
  if (error) return (
    <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "var(--tf-bg)", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 14, color: "var(--tf-red-500)", marginBottom: 12 }}>Error de conexión</div>
        <div style={{ fontSize: 13, color: "var(--tf-mute)", marginBottom: 18 }}>{error}</div>
        <button className="tf-btn tf-btn-pri" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    </div>
  );

  /* ── Sin worker vinculado ── */
  if (!currentUser) {
    const supa = window.__supabase || window.tfSupabase;
    const email = supa?._session?.user?.email
      || window.__currentEmail
      || "tu cuenta";
    return <UnlinkedUserScreen email={email} />;
  }

  const sideWidth = collapsed ? 60 : "var(--tf-sidebar)";

  return (
    <div className="tf-app" style={{ gridTemplateColumns: `${sideWidth} 1fr` }}>
      <Sidebar
        active={active} setActive={setActive}
        currentUser={currentUser} workers={workers} tasks={visibleTasks}
        collapsed={collapsed} onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)}
        onSignOut={doSignOut}
      />

      <div className="tf-shell-inner">
        <TopBar
          active={active} onCreate={handleCreate}
          currentUser={currentUser}
          onHamburger={() => setMobileOpen(true)}
          onSignOut={doSignOut}
        />

        <main className="tf-main tf-scroll">
          {active === "dashboard"  && <Dashboard  tasks={visibleTasks} workers={workers} onOpenTask={handleOpenTask} currentUser={currentUser} />}
          {active === "tasks"      && <TasksScreen tasks={visibleTasks} workers={workers} onOpenTask={handleOpenTask} defaultView={t.defaultView} onCreate={handleCreate} />}
          {active === "workers"    && <WorkersScreen workers={workers} tasks={visibleTasks} onSelectAssignee={() => setActive("tasks")} />}
          {active === "management" && checkIsManager(currentUser) && <ManagementScreen tasks={tasks} workers={workers} history={history} currentUser={currentUser} />}
          {active === "management" && !checkIsManager(currentUser) && (
            <div style={{ display: "grid", placeItems: "center", height: "100%", minHeight: 400 }}>
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>🔒</div>
                <div style={{ fontFamily: "var(--tf-display)", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Acceso restringido</div>
                <div style={{ color: "var(--tf-mute)", fontSize: 13.5, maxWidth: 320, lineHeight: 1.7 }}>
                  Este panel está disponible solo para gerentes.
                </div>
              </div>
            </div>
          )}
        </main>

        <BottomNav active={active} setActive={setActive} tasks={visibleTasks} currentUser={currentUser} />
      </div>

      <TaskDrawer
        task={liveTask} isCreating={creating}
        workers={workers} history={history}
        currentUser={currentUser}
        onClose={handleClose}
        onSave={handleSave}
        onDelete={handleDelete}
        onStatusChange={updateTaskStatus}
      />

      <TweaksPanel>
        <TweakSection label="Apariencia" />
        <TweakRadio label="Tema"     value={t.theme}   options={[{ value: "light", label: "Claro" }, { value: "dark", label: "Oscuro" }]} onChange={v => setTweak("theme", v)} />
        <TweakRadio label="Tarjetas" value={t.cards}   options={[{ value: "default", label: "Suave" }, { value: "flat", label: "Plano" }, { value: "glass", label: "Cristal" }]} onChange={v => setTweak("cards", v)} />
        <TweakRadio label="Densidad" value={t.density} options={[{ value: "compact", label: "Compacta" }, { value: "regular", label: "Normal" }, { value: "comfy", label: "Cómoda" }]} onChange={v => setTweak("density", v)} />
        <TweakSection label="Vistas" />
        <TweakRadio label="Vista por defecto" value={t.defaultView} options={[{ value: "kanban", label: "Kanban" }, { value: "list", label: "Lista" }]} onChange={v => setTweak("defaultView", v)} />
        <TweakSection label="Datos" />
        <TweakButton label="Resetear datos demo" onClick={() => { if (confirm("¿Restaurar datos?")) resetData(); }} />
      </TweaksPanel>
    </div>
  );
}

/* ── Render ─────────────────────────────────────── */
function Root() {
  const app = React.createElement(ToastProvider, null, React.createElement(App, null));

  if (window.__SUPABASE_READY && window.AuthGate) {
    return React.createElement(window.AuthGate, null, app);
  }

  return React.createElement(
    "div",
    { style: { padding: 30, fontFamily: "Arial" } },
    "Error: el sistema de acceso no se ha cargado."
  );
}

const root = ReactDOM.createRoot(document.getElementById("app-root"));
root.render(React.createElement(Root, null));
