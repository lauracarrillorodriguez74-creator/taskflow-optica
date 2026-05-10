// TASKFLOW · Drawer v3
// - Gerentes pueden editar cualquier tarea
// - Spinner al guardar / anti-doble-clic
// - Auto-cierre con toast (gestionado por App)

const { useState, useEffect, useRef } = React;

const TaskDrawer = ({ task, isCreating, workers, history, currentUser, onClose, onSave, onDelete, onStatusChange }) => {
  const [draft,    setDraft]   = useState(null);
  const [confirm,  setConfirm] = useState(false);
  const [saving,   setSaving]  = useState(false);
  const [deleting, setDeleting]= useState(false);

  const isMgr = typeof checkIsManager === "function" && checkIsManager(currentUser);
  // Categorías que un no-gerente puede usar al crear tareas
  const workerCats = (typeof TF_WORKER_CATS !== "undefined" && TF_WORKER_CATS) || ["LlamarCliente", "Reclamar"];
  const allowedCreateCats = isMgr ? TF_CATS : workerCats;

  useEffect(() => {
    if (task) {
      setDraft({ ...task }); setConfirm(false); setSaving(false);
    } else if (isCreating) {
      // Los trabajadores solo pueden crear tareas en sus categorías permitidas y
      // auto-asignarse — los gerentes pueden elegir cualquier cosa.
      const defaultCat = isMgr ? (TF_CATS[0] || "Clinica") : workerCats[0];
      setDraft({
        title:"",
        notes:"",
        category: defaultCat,
        priority:"media",
        status:"pendiente",
        dueDate:new Date(Date.now()+86400000).toISOString(),
        assignee: isMgr ? (currentUser?.id || workers[0]?.id || "") : (currentUser?.id || ""),
        createdBy: currentUser?.id || null,
        checklist:[]
      });
      setSaving(false);
    }
  }, [task, isCreating]);

  if (!draft) return null;

  const isOpen = !!(task || isCreating);
  const w = workers.find(x => x.id === draft.assignee);

  // ¿Puede editar esta tarea?
  // Puede si: es nueva, es el creador, es el asignado, o es gerente
  const canEdit = isCreating
    || isMgr
    || draft.createdBy === currentUser?.id
    || draft.assignee  === currentUser?.id;

  // Historial de esta tarea
  const taskHistory = task
    ? history.filter(h => h.taskId === task.id || h.payload?.taskId === task.id).slice(0, 8)
    : [];

  const set = (f, v) => setDraft(d => ({ ...d, [f]: v }));

  const handleSave = async () => {
    if (!draft.title.trim() || saving || !canEdit) return;
    setSaving(true);
    try { await onSave(draft); } catch { setSaving(false); }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try { await onDelete(task.id); } catch { setDeleting(false); setConfirm(false); }
  };

  const handleStatusChange = async (status) => {
    set("status", status);
    if (task?.id && onStatusChange) await onStatusChange(task.id, status);
  };

  const addCheck    = () => setDraft(d => ({ ...d, checklist:[...(d.checklist||[]),{ id:`c${Date.now()}`, label:"Nuevo paso", done:false }] }));
  const toggleCheck = id => setDraft(d => ({ ...d, checklist:d.checklist.map(c => c.id===id ? {...c,done:!c.done} : c) }));
  const removeCheck = id => setDraft(d => ({ ...d, checklist:d.checklist.filter(c => c.id!==id) }));

  const statColors = { pendiente:"#9AA5B5", proceso:"#2E7BC4", bloqueada:"#C58A1B", urgente:"#D14B43", completada:"#1E8F73" };

  return (
    <>
      <div className={`tf-drawer-scrim ${isOpen?"is-open":""}`} onClick={onClose}/>
      <aside className={`tf-drawer ${isOpen?"is-open":""}`}>

        {/* ── Header ── */}
        <div className="tf-drawer-hd">
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:10.5, color:"var(--tf-mute)", textTransform:"uppercase", letterSpacing:".08em", fontWeight:700, marginBottom:7, display:"flex", alignItems:"center", gap:6 }}>
              {isCreating ? "Nueva tarea" : "Editar tarea"}
              {isMgr && !isCreating && (
                <span style={{ fontSize:9, fontWeight:800, letterSpacing:".07em", color:"var(--tf-blue-700)", background:"var(--tf-blue-100)", borderRadius:4, padding:"1px 5px" }}>
                  Acceso gerente
                </span>
              )}
              {isCreating && !isMgr && (
                <span style={{ fontSize:9, fontWeight:800, letterSpacing:".07em", color:"var(--tf-blue-700)", background:"var(--tf-blue-100)", borderRadius:4, padding:"1px 5px" }}>
                  Llamar a cliente · Reclamar
                </span>
              )}
            </div>
            <input
              value={draft.title}
              onChange={e => set("title", e.target.value)}
              placeholder="Título de la tarea…"
              disabled={!canEdit}
              autoFocus={isCreating}
              onKeyDown={e => e.key==="Enter" && handleSave()}
              style={{ width:"100%", fontFamily:"var(--tf-display)", fontWeight:700, fontSize:18, background:"transparent", border:0, padding:0, outline:0, color:"var(--tf-ink)", opacity: canEdit ? 1 : .65 }}
            />
          </div>
          <button className="tf-btn-icon" onClick={onClose}><Icon name="close" size={18}/></button>
        </div>

        {/* ── Body ── */}
        <div className="tf-drawer-body tf-scroll">

          {/* Cambio rápido de estado */}
          {!isCreating && (
            <div>
              <div style={{ fontSize:10.5, fontWeight:700, color:"var(--tf-mute)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:8 }}>Estado</div>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {TF_STATUSES.map(s => (
                  <button key={s} onClick={() => canEdit && handleStatusChange(s)} disabled={!canEdit}
                          style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 11px", borderRadius:99, fontSize:11.5, fontWeight:700, cursor:canEdit?"pointer":"default",
                                   border:`2px solid ${draft.status===s ? statColors[s] : "transparent"}`,
                                   background: draft.status===s ? `${statColors[s]}18` : "var(--tf-bg-2)",
                                   color: draft.status===s ? statColors[s] : "var(--tf-mute)",
                                   transition:"all .15s" }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background: draft.status===s ? statColors[s] : "var(--tf-mute-2)", flex:"none" }}/>
                    {TF_LABELS.status[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prioridad + Categoría */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <label className="tf-field">
              <span className="tf-field-label">Prioridad</span>
              <select className="tf-select" value={draft.priority} onChange={e => set("priority",e.target.value)} disabled={!canEdit}>
                {TF_PRIOS.map(p => <option key={p} value={p}>{TF_LABELS.priority[p]}</option>)}
              </select>
            </label>
            <label className="tf-field">
              <span className="tf-field-label">Categoría</span>
              <select
                className="tf-select"
                value={draft.category}
                onChange={e => set("category",e.target.value)}
                disabled={!canEdit || (isCreating && !isMgr)}
              >
                {(isCreating && !isMgr ? allowedCreateCats : TF_CATS).map(c => (
                  <option key={c} value={c}>{TF_LABELS.category[c]}</option>
                ))}
              </select>
            </label>
          </div>

          {isCreating && (
            <label className="tf-field">
              <span className="tf-field-label">Estado inicial</span>
              <select className="tf-select" value={draft.status} onChange={e => set("status",e.target.value)}>
                {TF_STATUSES.map(s => <option key={s} value={s}>{TF_LABELS.status[s]}</option>)}
              </select>
            </label>
          )}

          {/* Asignado + Fecha */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <label className="tf-field">
              <span className="tf-field-label">Asignado a</span>
              <select
                className="tf-select"
                value={draft.assignee||""}
                onChange={e => set("assignee",e.target.value)}
                disabled={!canEdit || (isCreating && !isMgr)}
                title={isCreating && !isMgr ? "Solo gerentes pueden asignar tareas a otras personas" : ""}
              >
                {isCreating && !isMgr ? (
                  currentUser && <option value={currentUser.id}>{currentUser.name} · {currentUser.store}</option>
                ) : (
                  <>
                    <option value="">Sin asignar</option>
                    {workers.map(wk => <option key={wk.id} value={wk.id}>{wk.name} · {wk.store}</option>)}
                  </>
                )}
              </select>
            </label>
            <label className="tf-field">
              <span className="tf-field-label">Fecha límite</span>
              <input type="date" className="tf-input" disabled={!canEdit}
                     value={draft.dueDate ? new Date(draft.dueDate).toISOString().slice(0,10) : ""}
                     onChange={e => set("dueDate", e.target.value ? new Date(e.target.value).toISOString() : null)}/>
            </label>
          </div>

          {/* Notas */}
          <label className="tf-field">
            <span className="tf-field-label">Notas</span>
            <textarea className="tf-textarea" value={draft.notes||""} disabled={!canEdit}
                      onChange={e => set("notes",e.target.value)}
                      placeholder="Contexto, detalles, próximos pasos…"/>
          </label>

          {/* Checklist */}
          <div className="tf-field">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
              <span className="tf-field-label">
                Checklist
                {draft.checklist?.length > 0 && ` (${draft.checklist.filter(c=>c.done).length}/${draft.checklist.length})`}
              </span>
              {canEdit && (
                <button className="tf-btn tf-btn-ghost" style={{ padding:"2px 8px", fontSize:12, height:26 }} onClick={addCheck}>
                  <Icon name="plus" size={11}/>Añadir
                </button>
              )}
            </div>
            {draft.checklist?.length > 0 ? (
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {draft.checklist.map(c => (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 10px", background:"var(--tf-bg-2)", borderRadius:8, border:"1px solid var(--tf-line)" }}>
                    <button onClick={() => toggleCheck(c.id)} style={{ width:18, height:18, borderRadius:5, border:`1.5px solid ${c.done?"var(--tf-green-500)":"var(--tf-line-2)"}`, background:c.done?"var(--tf-green-500)":"transparent", display:"grid", placeItems:"center", flex:"none", cursor:"pointer", transition:"all .14s" }}>
                      {c.done && <Icon name="check" size={10} stroke={3} style={{ color:"#fff" }}/>}
                    </button>
                    <input value={c.label} disabled={!canEdit}
                           onChange={e => setDraft(d => ({ ...d, checklist:d.checklist.map(x => x.id===c.id?{...x,label:e.target.value}:x) }))}
                           style={{ flex:1, border:"none", background:"transparent", fontFamily:"var(--tf-ui)", fontSize:13, color:c.done?"var(--tf-mute)":"var(--tf-ink)", outline:"none", textDecoration:c.done?"line-through":"none" }}/>
                    {canEdit && (
                      <button onClick={() => removeCheck(c.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--tf-mute-2)", lineHeight:0, padding:2 }}>
                        <Icon name="close" size={11}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize:12, color:"var(--tf-mute-2)", fontStyle:"italic" }}>Sin pasos todavía.</div>
            )}
          </div>

          {/* Info worker */}
          {!isCreating && w && (
            <div className="tf-card" style={{ padding:13, background:"var(--tf-bg-2)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <Avatar worker={w} size={32} status/>
                  <div>
                    <div style={{ fontSize:13.5, fontWeight:600 }}>{w.name}</div>
                    <div style={{ fontSize:11.5, color:"var(--tf-mute)" }}>{w.role} · {w.store}</div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:10, color:"var(--tf-mute)", textTransform:"uppercase", letterSpacing:".06em", fontWeight:700 }}>Vence</div>
                  <div style={{ fontSize:14, fontWeight:700, marginTop:2, color:tfIsOverdue(draft)?"var(--tf-red-500)":"var(--tf-ink)" }}>
                    {tfFmtDate(draft.dueDate)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historial */}
          {!isCreating && taskHistory.length > 0 && (
            <div className="tf-field">
              <span className="tf-field-label" style={{ display:"block", marginBottom:8 }}>Historial</span>
              <div style={{ display:"flex", flexDirection:"column" }}>
                {taskHistory.map((h, i) => (
                  <div key={h.id} style={{ display:"flex", gap:9, padding:"8px 0", borderBottom:i<taskHistory.length-1?"1px solid var(--tf-line)":"none", fontSize:12.5, color:"var(--tf-mute)", alignItems:"flex-start" }}>
                    <div style={{ width:22, height:22, borderRadius:6, background:"var(--tf-bg-2)", display:"grid", placeItems:"center", flex:"none", marginTop:1 }}>
                      <Icon name={h.action==="create"?"plus":h.action==="delete"?"trash":"refresh"} size={11} style={{ color:"var(--tf-mute)" }}/>
                    </div>
                    <div>
                      <div style={{ color:"var(--tf-ink-2)", fontWeight:500 }}>
                        {h.action==="create"  && "Tarea creada"}
                        {h.action==="update"  && "Tarea actualizada"}
                        {h.action==="delete"  && "Tarea eliminada"}
                        {(h.action==="status_change"||h.action==="update_status") && <>Estado → <strong>{TF_LABELS.status[h.payload?.status]||h.payload?.status}</strong></>}
                        {!["create","update","delete","status_change","update_status"].includes(h.action) && h.action}
                      </div>
                      <div style={{ fontSize:11, marginTop:2 }}>{tfFmtDateTime(h.at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aviso si no puede editar */}
          {!canEdit && !isCreating && (
            <div style={{ padding:"10px 14px", background:"var(--tf-amber-100)", borderRadius:"var(--tf-r-sm)", fontSize:13, color:"var(--tf-amber-600)", border:"1px solid var(--tf-amber-500)30", display:"flex", alignItems:"center", gap:8 }}>
              <Icon name="alert" size={14}/>
              Solo puedes editar tus propias tareas o las que te están asignadas. Los gerentes pueden editar cualquier tarea.
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="tf-drawer-foot">
          {!isCreating && (isMgr || draft.createdBy === currentUser?.id) ? (
            <button className="tf-btn tf-btn-ghost" style={{ color:"var(--tf-red-500)" }}
                    onClick={() => setConfirm(true)} disabled={deleting}>
              {deleting ? <div className="tf-spin"/> : <Icon name="trash" size={13}/>}Eliminar
            </button>
          ) : <span/>}
          <div style={{ display:"flex", gap:8 }}>
            <button className="tf-btn" onClick={onClose} disabled={saving}>Cancelar</button>
            {canEdit && (
              <button className="tf-btn tf-btn-pri" onClick={handleSave}
                      disabled={saving || !draft.title?.trim()}
                      style={{ minWidth:108, justifyContent:"center" }}>
                {saving ? <><div className="tf-spin"/>Guardando…</> : <><Icon name="check" size={13}/>{isCreating?"Crear tarea":"Guardar"}</>}
              </button>
            )}
          </div>
        </div>

        {/* ── Confirm delete ── */}
        {confirm && (
          <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,.9)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", display:"grid", placeItems:"center", zIndex:5 }}>
            <div className="tf-card tf-card-pad is-elevated" style={{ width:290, textAlign:"center" }}>
              <div style={{ width:46, height:46, borderRadius:13, background:"var(--tf-red-100)", display:"grid", placeItems:"center", margin:"0 auto 13px" }}>
                <Icon name="trash" size={20} style={{ color:"var(--tf-red-500)" }}/>
              </div>
              <div style={{ fontFamily:"var(--tf-display)", fontWeight:700, fontSize:16, marginBottom:6 }}>¿Eliminar tarea?</div>
              <div style={{ fontSize:12.5, color:"var(--tf-mute)", lineHeight:1.55 }}>Esta acción no se puede deshacer.</div>
              <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:16 }}>
                <button className="tf-btn" onClick={() => setConfirm(false)}>Cancelar</button>
                <button className="tf-btn" style={{ background:"var(--tf-red-500)", color:"#fff", border:"none", minWidth:88, justifyContent:"center" }}
                        onClick={handleDelete} disabled={deleting}>
                  {deleting ? <div className="tf-spin"/> : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

Object.assign(window, { TaskDrawer });