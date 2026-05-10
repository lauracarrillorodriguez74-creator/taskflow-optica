// TASKFLOW · Screens

// ─── Dashboard ──────────────────────────────────────────────────
const Dashboard = ({ tasks, workers, onOpenTask, currentUser }) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today.getTime() + 86400000);

  const pendientes = tasks.filter(t => t.status !== "completada");
  const urgentes = tasks.filter(t => t.status === "urgente" || t.priority === "critica");
  const vencidas = tasks.filter(t => tfIsOverdue(t));
  const hoyTasks = tasks.filter(t => {
    const d = new Date(t.dueDate);
    return d >= today && d < tomorrow && t.status !== "completada";
  });
  const completadasSemana = tasks.filter(t => {
    if (t.status !== "completada") return false;
    const d = new Date(t.updatedAt);
    return d >= new Date(today.getTime() - 6 * 86400000);
  });

  // Workload per worker (top 5)
  const workload = workers.map(w => ({
    worker: w,
    open: tasks.filter(t => t.assignee === w.id && t.status !== "completada").length,
    done: tasks.filter(t => t.assignee === w.id && t.status === "completada").length,
  })).sort((a, b) => b.open - a.open);

  // 7-day trend (open tasks per day-of-week, simulated from real data)
  const trend = Array.from({ length: 7 }, (_, i) => {
    return tasks.filter(t => {
      const d = new Date(t.dueDate);
      const diff = Math.floor((d - new Date(today.getTime() - (6 - i) * 86400000)) / 86400000);
      return diff === 0;
    }).length;
  });

  // Distribution by category
  const catColors = { Clinica:"#2E7BC4", Ventas:"#1E8F73", Audiologia:"#7A5AE0", Taller:"#C58A1B", Incidencias:"#D14B43", Seguimiento:"#2A6FDB", Administracion:"#6B7888" };
  const distribution = TF_CATS.map(c => ({
    label: TF_LABELS.category[c],
    value: pendientes.filter(t => t.category === c).length,
    color: catColors[c],
  })).filter(x => x.value > 0);

  // Recent activity (just latest 5 tasks updated)
  const activity = [...tasks].sort((a,b)=> new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6);

  return (
    <div className="tf-fade" style={{ display:"flex", flexDirection:"column", gap: 22 }}>
      <header style={{ display:"flex", alignItems:"end", justifyContent:"space-between", gap:24, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--tf-mute)", textTransform:"uppercase", letterSpacing:".07em", fontWeight:600 }}>
            {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1 style={{ margin:"6px 0 0", fontFamily:"var(--tf-display)", fontWeight:600, fontSize:30, letterSpacing:"-0.02em" }}>
            Buenas {new Date().getHours() < 14 ? "días" : "tardes"}, {currentUser?.name?.split(" ")[0]}
          </h1>
          <div style={{ marginTop: 6, color: "var(--tf-mute)", fontSize: 14 }}>
            Tienes <strong style={{ color:"var(--tf-ink)" }}>{hoyTasks.length} tareas para hoy</strong>
            {urgentes.length > 0 && <> · <span style={{ color: "var(--tf-red-500)", fontWeight:600 }}>{urgentes.length} urgentes</span> requieren atención</>}.
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="tf-btn tf-btn-ghost"><Icon name="refresh" size={14}/>Actualizar</button>
          <button className="tf-btn tf-btn-pri"><Icon name="plus" size={14}/>Nueva tarea</button>
        </div>
      </header>

      {/* KPI grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
        <KPI label="Pendientes" value={pendientes.length}
             sub={<><Icon name="trending" size={12}/><span style={{color:"var(--tf-blue-700)"}}>+{Math.max(0, pendientes.length - completadasSemana.length)}</span><span>esta semana</span></>}
             trend={trend} color="#2E7BC4" icon="tasks"/>
        <KPI label="Urgentes" value={urgentes.length}
             sub={<><span style={{color:"var(--tf-red-500)", fontWeight:600}}>● </span><span>requieren acción inmediata</span></>}
             trend={[2,3,1,4,2,3,urgentes.length]} color="#D14B43" icon="alert"/>
        <KPI label="Vencidas" value={vencidas.length}
             sub={<><Icon name="clock" size={12}/><span>fuera de plazo</span></>}
             trend={[1,1,2,2,3,2,vencidas.length]} color="#C58A1B" icon="clock"/>
        <KPI label="Completadas (7d)" value={completadasSemana.length}
             sub={<><Icon name="check" size={12}/><span style={{color:"var(--tf-green-700)"}}>+{Math.round(completadasSemana.length/Math.max(1, tasks.length)*100)}%</span><span>cumplimiento</span></>}
             trend={[3,4,2,5,4,6,completadasSemana.length]} color="#1E8F73" icon="check"/>
      </div>

      {/* Two column row */}
      <div style={{ display:"grid", gridTemplateColumns:"minmax(0, 1.4fr) minmax(0, 1fr)", gap:14 }}>
        {/* Today's tasks */}
        <section className="tf-card tf-card-pad">
          <div className="tf-section-h" style={{ margin: 0, marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 17 }}>Para hoy</h2>
              <div className="tf-section-sub" style={{ fontSize: 12.5 }}>Tareas con vencimiento hoy o en proceso</div>
            </div>
            <span className="tf-pill s-proceso">{hoyTasks.length} activas</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {hoyTasks.slice(0, 5).map(t => (
              <TaskCard key={t.id} task={t} workers={workers} onOpen={onOpenTask}/>
            ))}
            {hoyTasks.length === 0 && (
              <div className="tf-empty">Nada urgente para hoy. Buen momento para preparar mañana.</div>
            )}
          </div>
        </section>

        {/* Right column */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Donut: distribution */}
          <section className="tf-card tf-card-pad">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 14 }}>
              <div>
                <h2 style={{ fontFamily:"var(--tf-display)", fontWeight:600, fontSize:17, margin:0 }}>Distribución por categoría</h2>
                <div style={{ fontSize:12, color:"var(--tf-mute)", marginTop:2 }}>Tareas activas</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap: 18 }}>
              <Donut segments={distribution} size={132} thickness={14}
                     label={pendientes.length} sub="activas"/>
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6, minWidth: 0 }}>
                {distribution.map((d, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, fontSize:12.5 }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:8, color:"var(--tf-ink-2)", minWidth: 0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      <span style={{ width:9, height:9, borderRadius:3, background:d.color, flex:"none" }}></span>
                      {d.label}
                    </span>
                    <span style={{ color:"var(--tf-mute)", fontVariantNumeric:"tabular-nums" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Workload */}
          <section className="tf-card tf-card-pad">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 12 }}>
              <h2 style={{ fontFamily:"var(--tf-display)", fontWeight:600, fontSize:17, margin:0 }}>Carga del equipo</h2>
              <span style={{ fontSize:12, color:"var(--tf-mute)" }}>tareas abiertas</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap: 10 }}>
              {workload.slice(0, 5).map(({ worker, open, done }) => (
                <div key={worker.id} style={{ display:"grid", gridTemplateColumns:"auto 1fr auto", alignItems:"center", gap: 10 }}>
                  <Avatar worker={worker} size={28} status/>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize:13, fontWeight:500, whiteSpace:"nowrap", textOverflow:"ellipsis", overflow:"hidden" }}>{worker.name}</div>
                    <div style={{ marginTop:5, position:"relative" }}>
                      <ProgressBar value={open} max={Math.max(...workload.map(w => w.open), 1)} color={`linear-gradient(90deg, ${worker.color}, ${worker.color}aa)`}/>
                    </div>
                  </div>
                  <div style={{ fontFamily:"var(--tf-display)", fontWeight:600, fontVariantNumeric:"tabular-nums", fontSize:14, minWidth: 32, textAlign:"right" }}>{open}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Activity */}
      <section className="tf-card tf-card-pad">
        <div className="tf-section-h" style={{ margin: 0, marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 17 }}>Actividad reciente</h2>
            <div className="tf-section-sub" style={{ fontSize: 12.5 }}>Últimos cambios en tareas</div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column" }}>
          {activity.map((t, i) => {
            const w = workers.find(x => x.id === t.assignee);
            return (
              <div key={t.id}
                   onClick={()=> onOpenTask(t)}
                   style={{ display:"grid", gridTemplateColumns:"auto 1fr auto auto auto", alignItems:"center",
                            gap:14, padding:"10px 0", borderBottom: i < activity.length - 1 ? "1px solid var(--tf-line)" : "none" }}>
                <Avatar worker={w} size={28} status/>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize:13.5, fontWeight:500, whiteSpace:"nowrap", textOverflow:"ellipsis", overflow:"hidden" }}>{t.title}</div>
                  <div style={{ fontSize:11.5, color:"var(--tf-mute)", marginTop:2, display:"flex", gap:6 }}>
                    <CategoryChip category={t.category}/>
                    <span>·</span>
                    <span>actualizada {tfFmtDate(t.updatedAt)}</span>
                  </div>
                </div>
                <PriorityChip priority={t.priority}/>
                <StatusPill status={t.status}/>
                <Icon name="chevron" size={14} style={{ color:"var(--tf-mute-2)" }}/>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

// ─── Tasks (Kanban + List) ───────────────────────────────────────
const TasksScreen = ({ tasks, workers, onOpenTask, defaultView, onCreate }) => {
  const [view, setView] = useState(defaultView || "kanban");
  const [filterCat, setFilterCat] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => { setView(defaultView || "kanban"); }, [defaultView]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (filterCat !== "all" && t.category !== filterCat) return false;
      if (filterAssignee !== "all" && t.assignee !== filterAssignee) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filterCat, filterAssignee, search]);

  const cols = [
    { id: "pendiente",  label: "Pendiente",  color: "#9AA5B5" },
    { id: "proceso",    label: "En proceso", color: "#2E7BC4" },
    { id: "bloqueada",  label: "Bloqueada",  color: "#C58A1B" },
    { id: "urgente",    label: "Urgente",    color: "#D14B43" },
    { id: "completada", label: "Completada", color: "#1E8F73" },
  ];

  return (
    <div className="tf-fade" style={{ display:"flex", flexDirection:"column", gap: 18 }}>
      <header style={{ display:"flex", alignItems:"end", justifyContent:"space-between", gap:24, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--tf-mute)", textTransform:"uppercase", letterSpacing:".07em", fontWeight:600 }}>Equipo · Óptica PRO</div>
          <h1 style={{ margin:"6px 0 0", fontFamily:"var(--tf-display)", fontWeight:600, fontSize:28, letterSpacing:"-0.02em" }}>Tareas</h1>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <SegmentTabs
            tabs={[
              { id: "kanban", label: "Kanban" },
              { id: "list",   label: "Lista" },
            ]}
            value={view}
            onChange={setView}
          />
          <button className="tf-btn tf-btn-pri" onClick={onCreate}><Icon name="plus" size={14}/>Nueva tarea</button>
        </div>
      </header>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
        <div className="tf-search" style={{ maxWidth: 280 }}>
          <Icon name="search" size={15}/>
          <input placeholder="Buscar tareas..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="tf-select" style={{ maxWidth: 200 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">Todas las categorías</option>
          {TF_CATS.map(c => <option key={c} value={c}>{TF_LABELS.category[c]}</option>)}
        </select>
        <select className="tf-select" style={{ maxWidth: 220 }} value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
          <option value="all">Todo el equipo</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "var(--tf-mute)", marginLeft: "auto" }}>
          {filtered.length} de {tasks.length} tareas
        </span>
      </div>

      {view === "kanban" ? (
        <div className="tf-kanban">
          {cols.map(col => {
            const colTasks = filtered.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="tf-col">
                <div className="tf-col-hd">
                  <div className="tf-col-title">
                    <span style={{ width:8, height:8, borderRadius:999, background:col.color, boxShadow:`0 0 0 3px ${col.color}30` }}></span>
                    {col.label}
                  </div>
                  <span className="tf-col-count">{colTasks.length}</span>
                </div>
                {colTasks.map(t => (
                  <TaskCard key={t.id} task={t} workers={workers} onOpen={onOpenTask}/>
                ))}
                {colTasks.length === 0 && (
                  <div style={{ fontSize:12, color:"var(--tf-mute-2)", textAlign:"center", padding:"24px 8px", fontStyle:"italic" }}>
                    Sin tareas
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="tf-card" style={{ padding: "0 4px" }}>
          <table className="tf-table">
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Categoría</th>
                <th>Asignado</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Vencimiento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const w = workers.find(x => x.id === t.assignee);
                return (
                  <tr key={t.id} onClick={() => onOpenTask(t)} style={{ cursor: "default" }}>
                    <td style={{ fontWeight: 500, color: "var(--tf-ink)", maxWidth: 320 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span className="tf-rail" style={{ position:"static", width:3, height:18, borderRadius:3, background: t.priority === "critica" ? "var(--tf-red-500)" : t.priority === "alta" ? "var(--tf-amber-500)" : t.priority === "media" ? "var(--tf-blue-500)" : "var(--tf-mute-2)" }}></span>
                        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</span>
                      </div>
                    </td>
                    <td><CategoryChip category={t.category}/></td>
                    <td>{w && <span style={{ display:"inline-flex", alignItems:"center", gap:8 }}><Avatar worker={w} size={24}/>{w.name.split(" ")[0]}</span>}</td>
                    <td><PriorityChip priority={t.priority}/></td>
                    <td><StatusPill status={t.status}/></td>
                    <td style={{ color: tfIsOverdue(t) ? "var(--tf-red-500)" : "var(--tf-mute)", fontWeight: tfIsOverdue(t) ? 600 : 400 }}>{tfFmtDate(t.dueDate)}</td>
                    <td><Icon name="chevron" size={14} style={{ color:"var(--tf-mute-2)" }}/></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="7"><div className="tf-empty" style={{ margin: "16px 0" }}>Ninguna tarea coincide con los filtros</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Workers ────────────────────────────────────────────────────
const WorkersScreen = ({ workers, tasks, onSelectAssignee }) => {
  return (
    <div className="tf-fade" style={{ display:"flex", flexDirection:"column", gap: 18 }}>
      <header>
        <div style={{ fontSize: 12, color: "var(--tf-mute)", textTransform:"uppercase", letterSpacing:".07em", fontWeight:600 }}>Personas</div>
        <h1 style={{ margin:"6px 0 0", fontFamily:"var(--tf-display)", fontWeight:600, fontSize:28, letterSpacing:"-0.02em" }}>Equipo</h1>
        <div style={{ marginTop: 6, color: "var(--tf-mute)", fontSize: 14 }}>
          {workers.length} personas · {workers.filter(w => w.status === "online").length} disponibles ahora
        </div>
      </header>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {workers.map(w => {
          const open = tasks.filter(t => t.assignee === w.id && t.status !== "completada").length;
          const done = tasks.filter(t => t.assignee === w.id && t.status === "completada").length;
          const overdue = tasks.filter(t => t.assignee === w.id && tfIsOverdue(t)).length;
          return (
            <div key={w.id} className="tf-worker" style={{ ["--worker-tint"]: `${w.color}24` }}>
              <div className="tf-worker-meta">
                <Avatar worker={w} size={50} status/>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily:"var(--tf-display)", fontWeight:600, fontSize:15.5, letterSpacing:"-0.01em" }}>{w.name}</div>
                  <div style={{ fontSize:12.5, color:"var(--tf-mute)" }}>{w.role}</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:12.5, color:"var(--tf-mute)" }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                  <span style={{ width:6, height:6, borderRadius:999, background: w.status === "online" ? "var(--tf-green-500)" : w.status === "busy" ? "var(--tf-amber-500)" : "var(--tf-mute-2)" }}></span>
                  {w.status === "online" ? "Disponible" : w.status === "busy" ? "Ocupado" : "Fuera"} · {w.store}
                </span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10, marginTop:4 }}>
                <div style={{ background:"var(--tf-bg-2)", borderRadius:10, padding:"10px 12px" }}>
                  <div style={{ fontSize:11, color:"var(--tf-mute)", textTransform:"uppercase", letterSpacing:".06em", fontWeight:600 }}>Abiertas</div>
                  <div style={{ fontFamily:"var(--tf-display)", fontWeight:600, fontSize:20, marginTop:2 }}>{open}</div>
                </div>
                <div style={{ background:"var(--tf-bg-2)", borderRadius:10, padding:"10px 12px" }}>
                  <div style={{ fontSize:11, color:"var(--tf-mute)", textTransform:"uppercase", letterSpacing:".06em", fontWeight:600 }}>Cerradas</div>
                  <div style={{ fontFamily:"var(--tf-display)", fontWeight:600, fontSize:20, marginTop:2, color:"var(--tf-green-700)" }}>{done}</div>
                </div>
                <div style={{ background: overdue ? "var(--tf-red-100)" : "var(--tf-bg-2)", borderRadius:10, padding:"10px 12px" }}>
                  <div style={{ fontSize:11, color: overdue ? "var(--tf-red-700)" : "var(--tf-mute)", textTransform:"uppercase", letterSpacing:".06em", fontWeight:600 }}>Vencidas</div>
                  <div style={{ fontFamily:"var(--tf-display)", fontWeight:600, fontSize:20, marginTop:2, color: overdue ? "var(--tf-red-700)" : "var(--tf-ink)" }}>{overdue}</div>
                </div>
              </div>
              <button className="tf-btn tf-btn-ghost" style={{ alignSelf:"flex-start", marginTop:4 }} onClick={() => onSelectAssignee(w.id)}>
                Ver tareas asignadas
                <Icon name="chevron" size={14}/>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Management ─────────────────────────────────────────────────
const ManagementScreen = ({ tasks, workers, history }) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const completed = tasks.filter(t => t.status === "completada");
  const open = tasks.filter(t => t.status !== "completada");
  const onTime = completed.filter(t => new Date(t.updatedAt) <= new Date(t.dueDate));
  const onTimePct = completed.length ? Math.round(onTime.length / completed.length * 100) : 0;

  const byStore = TF_STORES.map(s => {
    const wIds = workers.filter(w => w.store === s).map(w => w.id);
    const sTasks = tasks.filter(t => wIds.includes(t.assignee));
    return {
      store: s,
      open: sTasks.filter(t => t.status !== "completada").length,
      overdue: sTasks.filter(t => tfIsOverdue(t)).length,
      done: sTasks.filter(t => t.status === "completada").length,
      workers: wIds.length,
    };
  });

  // Performance ranking
  const ranking = workers.map(w => {
    const wTasks = tasks.filter(t => t.assignee === w.id);
    const done = wTasks.filter(t => t.status === "completada").length;
    const open = wTasks.filter(t => t.status !== "completada").length;
    const overdue = wTasks.filter(t => tfIsOverdue(t)).length;
    const total = wTasks.length;
    const score = total === 0 ? 0 : Math.round((done / total) * 100 - overdue * 8);
    return { w, done, open, overdue, total, score };
  }).sort((a, b) => b.score - a.score);

  const incidents = tasks.filter(t => t.category === "Incidencias" || t.status === "bloqueada");

  // Bar chart data: throughput per day this week
  const throughput = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today.getTime() - (6 - i) * 86400000);
    const next = new Date(day.getTime() + 86400000);
    const count = tasks.filter(t => {
      const u = new Date(t.updatedAt);
      return t.status === "completada" && u >= day && u < next;
    }).length;
    return { value: count, label: ["L","M","X","J","V","S","D"][day.getDay() === 0 ? 6 : day.getDay() - 1] };
  });

  return (
    <div className="tf-fade" style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <header style={{ display:"flex", alignItems:"end", justifyContent:"space-between", gap:24, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--tf-mute)", textTransform:"uppercase", letterSpacing:".07em", fontWeight:600 }}>Gerencia</div>
          <h1 style={{ margin:"6px 0 0", fontFamily:"var(--tf-display)", fontWeight:600, fontSize:28, letterSpacing:"-0.02em" }}>Panel ejecutivo</h1>
          <div style={{ marginTop: 6, color: "var(--tf-mute)", fontSize: 14 }}>
            Visión global de rendimiento, carga e incidencias
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="tf-btn tf-btn-ghost"><Icon name="receipt" size={14}/>Exportar informe</button>
          <button className="tf-btn"><Icon name="calendar" size={14}/>Esta semana</button>
        </div>
      </header>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
        <KPI label="Cumplimiento on-time" value={`${onTimePct}%`}
             sub={<><Icon name="trending" size={12}/><span style={{color:"var(--tf-green-700)"}}>+4 pts</span><span>vs sem. anterior</span></>}
             trend={[68,72,70,75,77,76,onTimePct]} color="#1E8F73" icon="check"/>
        <KPI label="Carga abierta" value={open.length}
             sub={<span>{Math.round(open.length / Math.max(1, workers.length))} por persona</span>}
             trend={[20,22,18,24,27,25,open.length]} color="#2E7BC4" icon="tasks"/>
        <KPI label="Incidencias" value={incidents.length}
             sub={<><Icon name="alert" size={12}/><span style={{color:"var(--tf-red-500)"}}>2 críticas</span></>}
             trend={[3,5,4,6,5,4,incidents.length]} color="#D14B43" icon="alert"/>
        <KPI label="Throughput semana" value={completed.length}
             sub={<span>tareas cerradas</span>}
             trend={throughput.map(t => t.value)} color="#7A5AE0" icon="pulse"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"minmax(0, 1.3fr) minmax(0, 1fr)", gap:14 }}>
        {/* Throughput */}
        <section className="tf-card tf-card-pad">
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontFamily:"var(--tf-display)", fontWeight:600, fontSize:17, margin:0 }}>Throughput diario</h2>
              <div style={{ fontSize:12, color:"var(--tf-mute)", marginTop:2 }}>Tareas completadas por día · últimos 7 días</div>
            </div>
            <div className="tf-tabs">
              <span className="tf-tab is-active">Semana</span>
              <span className="tf-tab">Mes</span>
              <span className="tf-tab">Trimestre</span>
            </div>
          </div>
          <BarChart data={throughput} height={170}/>
        </section>

        {/* Stores */}
        <section className="tf-card tf-card-pad">
          <h2 style={{ fontFamily:"var(--tf-display)", fontWeight:600, fontSize:17, margin:"0 0 14px" }}>Carga por tienda</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {byStore.map(s => (
              <div key={s.store}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 6, fontSize:13 }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
                    <span style={{ width:6, height:6, borderRadius:999, background:"var(--tf-blue-500)" }}></span>
                    <strong>{s.store}</strong>
                    <span style={{ color:"var(--tf-mute)", fontSize:11.5 }}>· {s.workers} personas</span>
                  </span>
                  <span style={{ fontFamily:"var(--tf-display)", fontVariantNumeric:"tabular-nums" }}>{s.open}</span>
                </div>
                <ProgressBar value={s.open} max={Math.max(...byStore.map(x => x.open), 1)}/>
                {s.overdue > 0 && (
                  <div style={{ fontSize:11, color:"var(--tf-red-500)", marginTop: 4 }}>
                    <Icon name="alert" size={11}/> {s.overdue} vencidas
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Ranking + Incidents */}
      <div style={{ display:"grid", gridTemplateColumns:"minmax(0, 1.3fr) minmax(0, 1fr)", gap:14 }}>
        <section className="tf-card tf-card-pad">
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily:"var(--tf-display)", fontWeight:600, fontSize:17, margin:0 }}>Rendimiento del equipo</h2>
            <span style={{ fontSize:12, color:"var(--tf-mute)" }}>basado en cumplimiento + cierre + retrasos</span>
          </div>
          <table className="tf-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Persona</th>
                <th style={{textAlign:"right"}}>Cerradas</th>
                <th style={{textAlign:"right"}}>Abiertas</th>
                <th style={{textAlign:"right"}}>Vencidas</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={r.w.id}>
                  <td style={{ width: 36, color:"var(--tf-mute)", fontFamily:"var(--tf-mono)" }}>{(i+1).toString().padStart(2, "0")}</td>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar worker={r.w} size={26} status/>
                      <div>
                        <div style={{ fontWeight:500, color:"var(--tf-ink)" }}>{r.w.name}</div>
                        <div style={{ fontSize:11, color:"var(--tf-mute)" }}>{r.w.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign:"right", fontVariantNumeric:"tabular-nums", color:"var(--tf-green-700)" }}>{r.done}</td>
                  <td style={{ textAlign:"right", fontVariantNumeric:"tabular-nums" }}>{r.open}</td>
                  <td style={{ textAlign:"right", fontVariantNumeric:"tabular-nums", color: r.overdue > 0 ? "var(--tf-red-500)" : "var(--tf-mute)" }}>{r.overdue}</td>
                  <td style={{ width: 140 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <ProgressBar value={Math.max(0, r.score)} max={100}/>
                      <span style={{ fontVariantNumeric:"tabular-nums", fontSize:12, color:"var(--tf-ink-2)", minWidth: 26 }}>{r.score}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="tf-card tf-card-pad">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily:"var(--tf-display)", fontWeight:600, fontSize:17, margin:0 }}>Alertas e incidencias</h2>
            <span className="tf-pill s-urgente">{incidents.length}</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {incidents.slice(0, 6).map(t => {
              const w = workers.find(x => x.id === t.assignee);
              return (
                <div key={t.id} style={{ display:"flex", gap:10, padding:"10px 12px", borderRadius:10, background:"var(--tf-bg-2)", border:"1px solid var(--tf-line)" }}>
                  <div style={{ width:6, alignSelf:"stretch", borderRadius:3, background: t.priority === "critica" ? "var(--tf-red-500)" : t.status === "bloqueada" ? "var(--tf-amber-500)" : "var(--tf-blue-500)", flex:"none" }}></div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize:13, fontWeight:500, lineHeight:1.35 }}>{t.title}</div>
                    <div style={{ fontSize:11, color:"var(--tf-mute)", marginTop:4, display:"flex", alignItems:"center", gap:8 }}>
                      <CategoryChip category={t.category}/>
                      {w && <><span>·</span><span>{w.name.split(" ")[0]}</span></>}
                      <span>·</span>
                      <span style={{ color: tfIsOverdue(t) ? "var(--tf-red-500)" : "var(--tf-mute)" }}>{tfFmtDate(t.dueDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

Object.assign(window, { Dashboard, TasksScreen, WorkersScreen, ManagementScreen });
