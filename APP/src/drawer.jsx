// TASKFLOW · Task drawer (detail / edit panel)

const TaskDrawer = ({ task, isCreating, workers, history, onClose, onSave, onDelete, onStatusChange }) => {
  const [draft, setDraft] = useState(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (task) {
      setDraft({ ...task });
      setConfirm(false);
    } else if (isCreating) {
      setDraft({
        title: "",
        notes: "",
        category: "Clinica",
        priority: "media",
        status: "pendiente",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        assignee: workers[0]?.id || "",
        checklist: [],
      });
    }
  }, [task, isCreating, workers]);

  const isOpen = !!(task || isCreating);
  if (!draft) return null;

  const w = workers.find(x => x.id === draft.assignee);
  const taskHistory = task ? history.filter(h => h.payload?.taskId === task.id).slice(0, 8) : [];

  const update = (field, value) => setDraft(d => ({ ...d, [field]: value }));
  const handleSave = () => {
    if (!draft.title.trim()) return;
    onSave(draft);
    onClose();
  };

  const toggleChecklist = (id) => {
    setDraft(d => ({
      ...d,
      checklist: d.checklist.map(c => c.id === id ? { ...c, done: !c.done } : c)
    }));
  };
  const addChecklist = () => {
    setDraft(d => ({
      ...d,
      checklist: [...(d.checklist || []), { id: `c${Date.now()}`, label: "Nuevo paso", done: false }]
    }));
  };

  return (
    <>
      <div className={`tf-drawer-scrim ${isOpen ? "is-open" : ""}`} onClick={onClose}></div>
      <aside className={`tf-drawer ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
        <div className="tf-drawer-hd">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "var(--tf-mute)", textTransform:"uppercase", letterSpacing:".07em", fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
              {isCreating ? "Nueva tarea" : <>Tarea · <span style={{ fontFamily:"var(--tf-mono)" }}>#{draft.id?.replace("t","")}</span></>}
            </div>
            <input
              className="tf-input"
              value={draft.title}
              onChange={e => update("title", e.target.value)}
              placeholder="Título de la tarea..."
              style={{ marginTop: 6, fontFamily:"var(--tf-display)", fontWeight: 600, fontSize: 18, background:"transparent", border:0, padding:0, outline:0 }}
            />
          </div>
          <button className="tf-btn-icon" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" size={18}/>
          </button>
        </div>

        <div className="tf-drawer-body tf-scroll">
          {/* Status row */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <select className="tf-select" value={draft.status} onChange={e => update("status", e.target.value)} style={{ flex: "0 1 180px" }}>
              {TF_STATUSES.map(s => <option key={s} value={s}>{TF_LABELS.status[s]}</option>)}
            </select>
            <select className="tf-select" value={draft.priority} onChange={e => update("priority", e.target.value)} style={{ flex: "0 1 140px" }}>
              {TF_PRIOS.map(p => <option key={p} value={p}>Prioridad: {TF_LABELS.priority[p]}</option>)}
            </select>
            <select className="tf-select" value={draft.category} onChange={e => update("category", e.target.value)} style={{ flex: "0 1 180px" }}>
              {TF_CATS.map(c => <option key={c} value={c}>{TF_LABELS.category[c]}</option>)}
            </select>
          </div>

          {/* Assignee + due date */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 14 }}>
            <Field label="Asignado a">
              <select className="tf-select" value={draft.assignee} onChange={e => update("assignee", e.target.value)}>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name} · {w.role}</option>)}
              </select>
            </Field>
            <Field label="Fecha límite">
              <input type="date" className="tf-input"
                     value={draft.dueDate ? new Date(draft.dueDate).toISOString().slice(0, 10) : ""}
                     onChange={e => update("dueDate", new Date(e.target.value).toISOString())}/>
            </Field>
          </div>

          {/* Notes */}
          <Field label="Notas">
            <textarea
              className="tf-textarea"
              value={draft.notes || ""}
              onChange={e => update("notes", e.target.value)}
              placeholder="Detalles, contexto, próximos pasos..."
            />
          </Field>

          {/* Checklist */}
          <div className="tf-field">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span className="tf-field-label">Checklist</span>
              <button className="tf-btn tf-btn-ghost" style={{ padding:"4px 8px", fontSize: 12 }} onClick={addChecklist}>
                <Icon name="plus" size={12}/>Añadir paso
              </button>
            </div>
            {draft.checklist?.length ? (
              <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop: 4 }}>
                {draft.checklist.map(c => (
                  <label key={c.id}
                         style={{ display:"flex", alignItems:"center", gap: 10, padding: "8px 10px", background:"var(--tf-bg-2)",
                                  borderRadius: 8, cursor:"default", fontSize: 13 }}>
                    <span onClick={() => toggleChecklist(c.id)}
                          style={{ width: 18, height: 18, borderRadius: 5, border: "1.5px solid var(--tf-line-2)",
                                   background: c.done ? "var(--tf-green-500)" : "transparent",
                                   borderColor: c.done ? "var(--tf-green-500)" : "var(--tf-line-2)",
                                   display:"grid", placeItems:"center", flex:"none", transition:"all .15s ease" }}>
                      {c.done && <Icon name="check" size={12} stroke={2.5} style={{ color:"#fff" }}/>}
                    </span>
                    <span style={{ flex: 1, color: c.done ? "var(--tf-mute)" : "var(--tf-ink)", textDecoration: c.done ? "line-through" : "none" }}>
                      {c.label}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color:"var(--tf-mute-2)", padding:"6px 0" }}>Sin pasos. Añade uno para dividir la tarea.</div>
            )}
          </div>

          {/* Activity */}
          {!isCreating && taskHistory.length > 0 && (
            <div className="tf-field">
              <span className="tf-field-label">Actividad</span>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {taskHistory.map(h => (
                  <div key={h.id} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:"1px solid var(--tf-line)", fontSize:12.5, color:"var(--tf-mute)" }}>
                    <Icon name={h.action === "status" ? "refresh" : h.action === "create" ? "plus" : h.action === "delete" ? "trash" : "edit"} size={13} style={{ marginTop:2, color:"var(--tf-mute-2)" }}/>
                    <div>
                      <div style={{ color:"var(--tf-ink-2)" }}>
                        {h.action === "status" ? <>cambió estado a <strong>{TF_LABELS.status[h.payload.status]}</strong></> :
                         h.action === "create" ? "creó la tarea" :
                         h.action === "update" ? "editó la tarea" :
                         "actualizó la tarea"}
                      </div>
                      <div style={{ fontSize: 11, marginTop: 2 }}>{tfFmtDateTime(h.at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick info card */}
          {!isCreating && (
            <div className="tf-card" style={{ padding: 14, background:"var(--tf-bg-2)", border:"1px solid var(--tf-line)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {w && <Avatar worker={w} size={32} status/>}
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{w?.name}</div>
                    <div style={{ fontSize:11.5, color:"var(--tf-mute)" }}>{w?.role} · {w?.store}</div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize: 11, color:"var(--tf-mute)", textTransform:"uppercase", letterSpacing:".06em", fontWeight:600 }}>Vence</div>
                  <div style={{ fontSize: 13, fontWeight:600, color: tfIsOverdue(draft) ? "var(--tf-red-500)" : "var(--tf-ink)" }}>
                    {tfFmtDate(draft.dueDate)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="tf-drawer-foot">
          {!isCreating ? (
            <button className="tf-btn tf-btn-ghost" style={{ color: "var(--tf-red-500)" }}
                    onClick={() => setConfirm(true)}>
              <Icon name="trash" size={14}/>Eliminar
            </button>
          ) : <span></span>}
          <div style={{ display:"flex", gap:8 }}>
            <button className="tf-btn" onClick={onClose}>Cancelar</button>
            <button className="tf-btn tf-btn-pri" onClick={handleSave}>
              <Icon name="check" size={14}/>{isCreating ? "Crear tarea" : "Guardar"}
            </button>
          </div>
        </div>

        {confirm && (
          <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,.85)", backdropFilter:"blur(8px)",
                        display:"grid", placeItems:"center", zIndex: 5 }}>
            <div className="tf-card tf-card-pad is-elevated" style={{ width: 280, textAlign:"center" }}>
              <div style={{ fontFamily:"var(--tf-display)", fontWeight:600, fontSize:16 }}>¿Eliminar tarea?</div>
              <div style={{ fontSize:12.5, color:"var(--tf-mute)", marginTop: 6 }}>Esta acción no se puede deshacer.</div>
              <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop: 14 }}>
                <button className="tf-btn" onClick={() => setConfirm(false)}>Cancelar</button>
                <button className="tf-btn" style={{ background:"var(--tf-red-500)", color:"#fff" }}
                        onClick={() => { onDelete(task.id); onClose(); }}>Eliminar</button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

Object.assign(window, { TaskDrawer });
