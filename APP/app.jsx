// TASKFLOW · App v3
// - Gerencia solo para managers (Laura, Álvaro, Natalia + is_manager=true)
// - Sidebar colapsable en desktop
// - Hamburger + overlay en móvil
// - Toast system integrado

const { useState, useEffect, useCallback, useRef, createContext, useContext } = React;

/* ── Managers autorizados ───────────────────────── */
const MANAGER_NAMES = ["natalia","álvaro","alvaro","laura"];
function checkIsManager(worker) {
  if (!worker) return false;
  if (worker.isManager) return true;
  const n = (worker.name || "").toLowerCase();
  return MANAGER_NAMES.some(m => n.startsWith(m));
}
window.checkIsManager = checkIsManager;

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
            <span style={{ flex:1 }}>{t.msg}</span>
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
  "theme":"light","density":"regular","defaultView":"kanban","cards":"default"
}/*EDITMODE-END*/;

/* ── Nav items ──────────────────────────────────── */
const ALL_NAV = [
  { id:"dashboard",  label:"Dashboard", icon:"dashboard" },
  { id:"tasks",      label:"Tareas",    icon:"tasks" },
  { id:"workers",    label:"Equipo",    icon:"workers" },
  { id:"management", label:"Gerencia",  icon:"management", mgr:true },
];

/* ════════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════════ */
function Sidebar({ active, setActive, currentUser, workers, tasks, onSwitchUser, collapsed, onToggle, mobileOpen, onMobileClose }) {
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
      <div className={`tf-side-scrim ${mobileOpen ? "is-open" : ""}`} onClick={onMobileClose}/>

      <nav className={`tf-side ${mobileOpen ? "is-open" : ""}`}
           style={{ width: collapsed ? 60 : "var(--tf-sidebar)" }}>

        {/* Toggle collapse (desktop) */}
        <button onClick={onToggle}
                style={{ position:"absolute", top:18, right:-12, width:22, height:22, borderRadius:"50%", background:"var(--tf-surface)", border:"1.5px solid var(--tf-line)", display:"grid", placeItems:"center", cursor:"pointer", color:"var(--tf-mute)", boxShadow:"var(--tf-sh-1)", zIndex:10, transition:"all .2s" }}
                title={collapsed ? "Expandir" : "Colapsar"}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
               style={{ transform: collapsed ? "rotate(180deg)" : "none", transition:"transform .3s" }}>
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        {/* Brand */}
        <div className="tf-side-brand">
          <div className="tf-brandmark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 12 7 8l3 3 5-5 6 6"/><circle cx="12" cy="12" r="9.5" opacity=".22"/>
            </svg>
          </div>
          {!collapsed && (
            <div style={{ minWidth:0, overflow:"hidden" }}>
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
            <Icon name={item.icon} size={17} stroke={active === item.id ? 2 : 1.7}/>
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
                <div key={c} className="tf-nav-item" style={{ fontSize:12.5, padding:"6px 10px" }}>
                  <span className={`tf-cat c-${c}`} style={{ fontSize:0, padding:0, width:8, height:8, borderRadius:3 }}/>
                  <span>{TF_LABELS.category[c]}</span>
                  <span className="tf-count" style={{ fontSize:9.5 }}>{count}</span>
                </div>
              );
            })}
          </>
        )}

        {/* Usuario */}
        <div style={{ marginTop:"auto", paddingTop:10, borderTop:"1px solid var(--tf-line)" }}>
          <div className="tf-side-user" onClick={onSwitchUser}
               style={{ justifyContent: collapsed ? "center" : "flex-start" }}
               title={collapsed ? (currentUser?.name || "") : ""}>
            <Avatar worker={currentUser} size={33} status/>
            {!collapsed && currentUser && (
              <div style={{ minWidth:0, flex:1, overflow:"hidden" }}>
                <div style={{ fontSize:13, fontWeight:700, whiteSpace:"nowrap", textOverflow:"ellipsis", overflow:"hidden" }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize:11, color:"var(--tf-mute)", display:"flex", alignItems:"center", gap:5, marginTop:1 }}>
                  {currentUser.role}
                  {checkIsManager(currentUser) && <span className="tf-mgr-badge">Gerente</span>}
                </div>
              </div>
            )}
            {!collapsed && <Icon name="chevronDown" size={13} style={{ color:"var(--tf-mute)", flexShrink:0 }}/>}
          </div>
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
          <Icon name={item.icon} size={21} stroke={active === item.id ? 2.1 : 1.6}/>
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
function TopBar({ active, onCreate, currentUser, onHamburger, onSwitchUser }) {
  const titles = {
    dashboard:  { title:"Dashboard",     crumb:"Resumen del día" },
    tasks:      { title:"Tareas",        crumb:"Gestión del trabajo" },
    workers:    { title:"Equipo",        crumb:"Personas y carga" },
    management: { title:"Gerencia",      crumb:"Métricas y rendimiento" },
  };
  const t = titles[active] || titles.dashboard;

  return (
    <header className="tf-top">
      {/* Hamburger (solo móvil) */}
      <button className="tf-btn-icon" onClick={onHamburger}
              style={{ display:"none" }} id="tf-ham">
        <Icon name="menu" size={19}/>
      </button>
      <style>{`@media(max-width:768px){#tf-ham{display:inline-flex!important}}`}</style>

      <div style={{ flex:1, minWidth:0 }}>
        <div className="tf-top-crumb">{t.crumb}</div>
        <div className="tf-top-title">{t.title}</div>
      </div>

      <div className="tf-search">
        <Icon name="search" size={14}/><input placeholder="Buscar tareas, personas…"/><span className="tf-kbd">⌘K</span>
      </div>

      <button className="tf-btn-icon" title="Notificaciones">
        <span style={{ position:"relative" }}>
          <Icon name="bell" size={17}/>
          <span style={{ position:"absolute", top:-2, right:-2, width:7, height:7, background:"var(--tf-red-500)", borderRadius:99, boxShadow:"0 0 0 2px var(--tf-surface)" }}/>
        </span>
      </button>

      <button className="tf-btn tf-btn-pri" onClick={onCreate}>
  <Icon name="plus" size={14}/>
  <span className="tf-btn-txt">Nueva tarea</span>
</button>

<button
  className="tf-btn"
  onClick={async () => {
    const supa = window.__supabase || window.tfSupabase;

    if (supa) {
      await supa.auth.signOut();
    }

    localStorage.clear();
    sessionStorage.clear();

    window.location.reload();
  }}
>
  Salir
</button>

      {/* Avatar en mobile */}
      <div style={{ display:"none" }} id="tf-mob-av">
        <div onClick={onSwitchUser} style={{ cursor:"pointer" }}><Avatar worker={currentUser} size={31} status/></div>
      </div>
      <style>{`@media(max-width:768px){#tf-mob-av{display:block!important}}`}</style>
    </header>
  );
}

/* ════════════════════════════════════════════════
   USER SWITCHER / LOGOUT
════════════════════════════════════════════════ */
function UserSwitcher({ workers, currentUser, onPick, onClose }) {
  const supa = window.__supabase || window.tfSupabase;
  return (
    <div className="tf-drawer-scrim is-open" onClick={onClose}
         style={{ display:"grid", placeItems:"center" }}>
      <div className="tf-card is-elevated" onClick={e => e.stopPropagation()}
           style={{ width:370, maxWidth:"calc(100vw - 28px)", padding:14, animation:"tf-fade-up .22s ease" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ fontFamily:"var(--tf-display)", fontWeight:700, fontSize:15 }}>Cambiar usuario</div>
          <button className="tf-btn-icon" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:2, maxHeight:340, overflowY:"auto" }}>
          {workers.map(w => (
            <div key={w.id} onClick={() => { onPick(w); onClose(); }}
                 style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:9, background: currentUser?.id===w.id?"var(--tf-blue-100)":"transparent", cursor:"pointer", transition:"background .12s" }}>
              <Avatar worker={w} size={31} status/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                  {w.name}
                  {checkIsManager(w) && <span className="tf-mgr-badge">Gerente</span>}
                </div>
                <div style={{ fontSize:11.5, color:"var(--tf-mute)" }}>{w.role} · {w.store}</div>
              </div>
              {currentUser?.id===w.id && <Icon name="check" size={15} style={{ color:"var(--tf-blue-700)", flexShrink:0 }}/>}
            </div>
          ))}
        </div>

        {supa && (
          <div style={{ borderTop:"1px solid var(--tf-line)", paddingTop:10, marginTop:8 }}>
            <button
  onClick={async () => {
    await supa.auth.signOut();

    localStorage.removeItem("taskflow.auth");
    localStorage.removeItem("tf:uid");

    window.location.reload();
  }}
                    style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:"none", background:"var(--tf-red-100)", color:"var(--tf-red-700)", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
              <Icon name="logout" size={14}/>Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   APP ROOT
════════════════════════════════════════════════ */
function App() {
  const { workers, tasks, history, loading, error, currentWorker, upsertTask, updateTaskStatus, deleteTask, resetData } = useTaskflow();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const toast = useToast();

  const [active,        setActive]        = useStored("tf:active", "dashboard");
  const [openTask,      setOpenTask]      = useState(null);
  const [creating,      setCreating]      = useState(false);
  const [showSwitcher,  setShowSwitcher]  = useState(false);
  const [currentUserId, setCurrentUserId] = useStored("tf:uid", null);
  React.useEffect(() => {
  if (!currentWorker) {
    setCurrentUserId(null);
  }
}, [currentWorker]);
  const [collapsed,     setCollapsed]     = useStored("tf:sidebar", false);
  const [mobileOpen,    setMobileOpen]    = useState(false);

 // currentUser: SOLO trabajador autenticado
const currentUser = currentWorker || null;

if (!loading && !currentUser) {
  return <AuthGate />;
}
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

  const liveTask = openTask ? tasks.find(tt => tt.id === openTask.id) : null;

  /* ── Loading ── */
  if (loading) return (
    <div style={{ position:"fixed", inset:0, display:"grid", placeItems:"center", background:"var(--tf-bg)", fontFamily:"var(--tf-ui)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:18, height:18, borderRadius:"50%", border:"2.5px solid rgba(11,47,91,.14)", borderTopColor:"var(--tf-blue-700)", animation:"spin .8s linear infinite" }}/>
        <span style={{ fontSize:14, color:"var(--tf-mute)" }}>Cargando…</span>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div style={{ position:"fixed", inset:0, display:"grid", placeItems:"center", background:"var(--tf-bg)", padding:24 }}>
      <div style={{ textAlign:"center", maxWidth:400 }}>
        <div style={{ fontSize:14, color:"var(--tf-red-500)", marginBottom:12 }}>Error de conexión</div>
        <div style={{ fontSize:13, color:"var(--tf-mute)", marginBottom:18 }}>{error}</div>
        <button className="tf-btn tf-btn-pri" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    </div>
  );

  const sideWidth = collapsed ? 60 : "var(--tf-sidebar)";

  return (
    <div className="tf-app" style={{ gridTemplateColumns:`${sideWidth} 1fr` }}>
      <button
  onClick={async () => {
    const supa = window.__supabase || window.tfSupabase;

    if (supa) {
      await supa.auth.signOut();
    }

    localStorage.clear();
    sessionStorage.clear();

    window.location.href = "/";
  }}
  style={{
    position: "fixed",
    right: 16,
    bottom: 80,
    zIndex: 99999,
    background: "#D14B43",
    color: "white",
    border: "none",
    borderRadius: 999,
    padding: "12px 18px",
    fontWeight: 800,
    boxShadow: "0 8px 24px rgba(0,0,0,.25)",
    cursor: "pointer"
  }}
>
  Salir
</button>
      <Sidebar
        active={active} setActive={setActive}
        currentUser={currentUser} workers={workers} tasks={tasks}
        onSwitchUser={() => setShowSwitcher(true)}
        collapsed={collapsed} onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)}
      />

      <div className="tf-shell-inner">
        <TopBar
          active={active} onCreate={handleCreate}
          currentUser={currentUser}
          onHamburger={() => setMobileOpen(true)}
          onSwitchUser={() => setShowSwitcher(true)}
        />

        <main className="tf-main tf-scroll">
          {active==="dashboard"  && <Dashboard  tasks={tasks} workers={workers} onOpenTask={handleOpenTask} currentUser={currentUser}/>}
          {active==="tasks"      && <TasksScreen tasks={tasks} workers={workers} onOpenTask={handleOpenTask} defaultView={t.defaultView} onCreate={handleCreate}/>}
          {active==="workers"    && <WorkersScreen workers={workers} tasks={tasks} onSelectAssignee={() => setActive("tasks")}/>}
          {active==="management" && checkIsManager(currentUser) && <ManagementScreen tasks={tasks} workers={workers} history={history} currentUser={currentUser}/>}
          {active==="management" && !checkIsManager(currentUser) && (
            <div style={{ display:"grid", placeItems:"center", height:"100%", minHeight:400 }}>
              <div style={{ textAlign:"center", padding:40 }}>
                <div style={{ fontSize:40, marginBottom:14 }}>🔒</div>
                <div style={{ fontFamily:"var(--tf-display)", fontWeight:700, fontSize:20, marginBottom:8 }}>Acceso restringido</div>
                <div style={{ color:"var(--tf-mute)", fontSize:13.5, maxWidth:320, lineHeight:1.7 }}>
                  Este panel está disponible solo para gerentes. Contacta con Natalia, Álvaro o Laura.
                </div>
              </div>
            </div>
          )}
        </main>

        <BottomNav active={active} setActive={setActive} tasks={tasks} currentUser={currentUser}/>
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

      {showSwitcher && (
        <UserSwitcher workers={workers} currentUser={currentUser}
          onPick={w => setCurrentUserId(w.id)}
          onClose={() => setShowSwitcher(false)}/>
      )}

      <TweaksPanel>
        <TweakSection label="Apariencia"/>
        <TweakRadio label="Tema"     value={t.theme}   options={[{value:"light",label:"Claro"},{value:"dark",label:"Oscuro"}]} onChange={v => setTweak("theme",v)}/>
        <TweakRadio label="Tarjetas" value={t.cards}   options={[{value:"default",label:"Suave"},{value:"flat",label:"Plano"},{value:"glass",label:"Cristal"}]} onChange={v => setTweak("cards",v)}/>
        <TweakRadio label="Densidad" value={t.density} options={[{value:"compact",label:"Compacta"},{value:"regular",label:"Normal"},{value:"comfy",label:"Cómoda"}]} onChange={v => setTweak("density",v)}/>
        <TweakSection label="Vistas"/>
        <TweakRadio label="Vista por defecto" value={t.defaultView} options={[{value:"kanban",label:"Kanban"},{value:"list",label:"Lista"}]} onChange={v => setTweak("defaultView",v)}/>
        <TweakSection label="Datos"/>
        <TweakButton label="Resetear datos demo" onClick={() => { if (confirm("¿Restaurar datos?")) resetData(); }}/>
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
