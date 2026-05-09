// TASKFLOW · Main App

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "blue",
  "density": "regular",
  "defaultView": "kanban",
  "theme": "light",
  "cards": "default",
  "frame": "ipad"
}/*EDITMODE-END*/;

const NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",  icon: "dashboard" },
  { id: "tasks",      label: "Tareas",     icon: "tasks" },
  { id: "workers",    label: "Equipo",     icon: "workers" },
  { id: "management", label: "Gerencia",   icon: "management" },
];

function Sidebar({ active, setActive, currentUser, workers, tasks, onSwitchUser }) {
  const counts = {
    tasks: tasks.filter(t => t.status !== "completada").length,
    workers: workers.filter(w => w.status === "online").length,
    management: tasks.filter(t => t.status === "urgente" || t.priority === "critica" || tfIsOverdue(t)).length,
  };

  return (
    <nav className="tf-side">
      <div className="tf-side-brand">
        <div className="tf-brandmark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M3 12 7 8l3 3 5-5 6 6"/>
            <circle cx="12" cy="12" r="9.5" opacity=".25"/>
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="tf-brand-name">TASKFLOW</div>
          <div className="tf-brand-sub">Óptica PRO</div>
        </div>
      </div>

      <div className="tf-nav-section">Espacio de trabajo</div>

      {NAV_ITEMS.map(item => (
        <div
          key={item.id}
          className={`tf-nav-item ${active === item.id ? "is-active" : ""}`}
          onClick={() => setActive(item.id)}
        >
          <Icon name={item.icon} size={16} stroke={1.7}/>
          <span>{item.label}</span>

          {counts[item.id] !== undefined && counts[item.id] > 0 && (
            <span className="tf-count">{counts[item.id]}</span>
          )}
        </div>
      ))}

      <div className="tf-nav-section">Categorías</div>

      {TF_CATS.slice(0, 5).map(c => {
        const count = tasks.filter(t => t.category === c && t.status !== "completada").length;

        return (
          <div
            key={c}
            className="tf-nav-item"
            style={{ fontSize: 12.5, padding: "7px 10px" }}
          >
            <span className={`tf-cat c-${c}`} style={{ fontSize: 0, padding: 0 }}></span>
            <span>{TF_LABELS.category[c]}</span>
            <span className="tf-count" style={{ fontSize: 10.5 }}>{count}</span>
          </div>
        );
      })}

      <div
        style={{
          marginTop: "auto",
          paddingTop: 12,
          borderTop: "1px solid var(--tf-line)"
        }}
      >
        <div
          onClick={onSwitchUser}
          style={{
            display:"flex",
            alignItems:"center",
            gap:10,
            padding:8,
            borderRadius:10,
            cursor:"default",
            background:"var(--tf-bg-2)"
          }}
        >
          <Avatar worker={currentUser} size={34} status/>

          <div style={{ minWidth:0, flex:1 }}>
            <div
              style={{
                fontSize:13,
                fontWeight:600,
                whiteSpace:"nowrap",
                textOverflow:"ellipsis",
                overflow:"hidden"
              }}
            >
              {currentUser.name}
            </div>

            <div style={{ fontSize:11, color:"var(--tf-mute)" }}>
              {currentUser.role}
            </div>
          </div>

          <Icon
            name="chevronDown"
            size={14}
            style={{ color:"var(--tf-mute)" }}
          />
        </div>
      </div>
    </nav>
  );
}

function App() {
  const { workers, tasks, history, upsertTask, updateTaskStatus, deleteTask, resetData } = useTaskflow();

  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [active, setActive] = useStored("taskflow:active", "dashboard");

  const [openTask, setOpenTask] = useState(null);

  const [creating, setCreating] = useState(false);

  const [showSwitcher, setShowSwitcher] = useState(false);

  const [currentUserId, setCurrentUserId] = useStored(
    "taskflow:currentUser",
    "11111111-1111-1111-1111-000000000008"
  );

  const currentUser =
    workers.find(w => w.id === currentUserId) ||
    workers[0] || {
      id: "11111111-1111-1111-1111-000000000008",
      name: "Gerencia",
      role: "Gerencia",
      store: "Óptica PRO",
      color: "#0B2F5B",
      initials: "GP",
      status: "online",
      isManager: true
    };

  useEffect(() => {
    const root = document.documentElement;

    root.dataset.theme = t.theme;
    root.dataset.density = t.density;
    root.dataset.cards = t.cards;
    root.dataset.accent = t.accent;

  }, [t]);

  const handleOpenTask = (task) => {
    setOpenTask(task);
    setCreating(false);
  };

  const handleCloseDrawer = () => {
    setOpenTask(null);
    setCreating(false);
  };

  const handleCreate = () => {
    setCreating(true);
    setOpenTask(null);
  };

  const handleSave = (draft) => {
    upsertTask(draft, currentUserId);
  };

  const handleSelectAssignee = () => {
    setActive("tasks");
  };

  const liveTask = openTask
    ? tasks.find(t => t.id === openTask.id)
    : null;

  return (
    <div className="tf-app">

      <Sidebar
        active={active}
        setActive={setActive}
        currentUser={currentUser}
        workers={workers}
        tasks={tasks}
        onSwitchUser={() => setShowSwitcher(true)}
      />

      <div className="tf-shell-inner">

        <TopBar
          active={active}
          onCreate={handleCreate}
          currentUser={currentUser}
          onSwitchUser={() => setShowSwitcher(true)}
        />

        <main className="tf-main tf-scroll">

          {active === "dashboard" && (
            <Dashboard
              tasks={tasks}
              workers={workers}
              onOpenTask={handleOpenTask}
              currentUser={currentUser}
            />
          )}

          {active === "tasks" && (
            <TasksScreen
              tasks={tasks}
              workers={workers}
              onOpenTask={handleOpenTask}
              defaultView={t.defaultView}
              onCreate={handleCreate}
            />
          )}

          {active === "workers" && (
            <WorkersScreen
              workers={workers}
              tasks={tasks}
              onSelectAssignee={handleSelectAssignee}
            />
          )}

          {active === "management" && (
            <ManagementScreen
              tasks={tasks}
              workers={workers}
              history={history}
            />
          )}

        </main>
      </div>

      <TaskDrawer
        task={liveTask}
        isCreating={creating}
        workers={workers}
        history={history}
        onClose={handleCloseDrawer}
        onSave={handleSave}
        onDelete={(id) => deleteTask(id, currentUserId)}
        onStatusChange={updateTaskStatus}
      />

      {showSwitcher && (
        <UserSwitcher
          workers={workers}
          currentUser={currentUser}
          onPick={(w) => setCurrentUserId(w.id)}
          onClose={() => setShowSwitcher(false)}
        />
      )}

      <TweaksPanel>

        <TweakSection label="Apariencia"/>

        <TweakRadio
          label="Tema"
          value={t.theme}
          options={[
            { value:"light", label:"Claro" },
            { value:"dark", label:"Oscuro" }
          ]}
          onChange={(v) => setTweak("theme", v)}
        />

        <TweakRadio
          label="Tarjetas"
          value={t.cards}
          options={[
            { value:"default", label:"Suave" },
            { value:"flat", label:"Plano" },
            { value:"glass", label:"Cristal" }
          ]}
          onChange={(v) => setTweak("cards", v)}
        />

        <TweakRadio
          label="Densidad"
          value={t.density}
          options={[
            { value:"compact", label:"Compacta" },
            { value:"regular", label:"Normal" },
            { value:"comfy", label:"Cómoda" }
          ]}
          onChange={(v) => setTweak("density", v)}
        />

      </TweaksPanel>

    </div>
  );
}

// Render
const root = ReactDOM.createRoot(document.getElementById("app-root"));
root.render(<App />);
