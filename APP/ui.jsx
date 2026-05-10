// TASKFLOW · UI primitives
// Shared components used across screens.

const Icon = ({ name, size = 16, stroke = 1.7, className = "", style }) => {
  // Minimal inline icon set drawn with SVG paths (Lucide-like).
  const paths = {
    dashboard:   <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    tasks:       <><path d="M9 5h11M9 12h11M9 19h11"/><path d="M4 5l1.5 1.5L8 4"/><path d="M4 12l1.5 1.5L8 11"/><path d="M4 19l1.5 1.5L8 18"/></>,
    workers:     <><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="6" r="2.4"/><path d="M14.5 13.5c1-.9 2.4-1.5 4-1.5s2.4.4 3 1"/></>,
    management:  <><path d="M3 21V11"/><path d="M9 21V7"/><path d="M15 21V13"/><path d="M21 21V4"/><path d="M2 21h20"/></>,
    plus:        <><path d="M12 5v14M5 12h14"/></>,
    search:      <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    settings:    <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>,
    bell:        <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
    calendar:    <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    clock:       <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    chevron:     <><path d="m9 18 6-6-6-6"/></>,
    chevronDown: <><path d="m6 9 6 6 6-6"/></>,
    close:       <><path d="M18 6 6 18M6 6l12 12"/></>,
    check:       <><path d="M20 6 9 17l-5-5"/></>,
    flag:        <><path d="M4 22V4"/><path d="M4 4h13l-2 4 2 4H4"/></>,
    paperclip:   <><path d="M21 12.5 12 21a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8.5-8.5"/></>,
    user:        <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></>,
    filter:      <><path d="M3 4h18l-7 9v7l-4-2v-5L3 4Z"/></>,
    sparkles:    <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>,
    moreH:       <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
    list:        <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></>,
    kanban:      <><rect x="3" y="4" width="6" height="14" rx="1.5"/><rect x="11" y="4" width="6" height="9" rx="1.5"/><rect x="19" y="4" width="2" height="6" rx="1"/></>,
    arrowUp:     <><path d="M12 19V5M5 12l7-7 7 7"/></>,
    arrowDown:   <><path d="M12 5v14M5 12l7 7 7-7"/></>,
    pulse:       <><path d="M3 12h4l2-7 4 14 2-7h6"/></>,
    eye:         <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
    ear:         <><path d="M6 18a6 6 0 1 1 12 0 4 4 0 0 1-4 4c-1.5 0-2-1-2-2 0-2 2-2 2-4a2 2 0 0 0-4 0"/></>,
    wrench:      <><path d="M14.7 6.3a4 4 0 0 0 5 5L21 13a8 8 0 0 1-9.3 9.3l-1.4-1.4a4 4 0 0 0-5-5L4 14.6A8 8 0 0 1 13.3 5.3Z"/></>,
    alert:       <><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></>,
    refresh:     <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>,
    trending:    <><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></>,
    block:       <><circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/></>,
    dot:         <><circle cx="12" cy="12" r="3.5" fill="currentColor"/></>,
    trash:       <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/></>,
    edit:        <><path d="M12 20h9"/><path d="M16.5 3.5 20 7l-12 12H5v-3.5Z"/></>,
    receipt:     <><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 V2H4Z"/><path d="M8 7h9M8 11h9M8 15h6"/></>,
    barChart:    <><rect x="3" y="11" width="4" height="10" rx="1"/><rect x="10" y="6" width="4" height="15" rx="1"/><rect x="17" y="14" width="4" height="7" rx="1"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
         className={className} style={style} aria-hidden="true">
      {paths[name] || null}
    </svg>
  );
};

const Avatar = ({ worker, size = 30, status = false }) => {
  if (!worker) return null;
  return (
    <span className={`tf-av ${status ? "is-status s-" + worker.status : ""}`}
          style={{ background: worker.color, width: size, height: size, fontSize: size * 0.38 }}
          title={worker.name}>
      {worker.initials}
    </span>
  );
};

const AvatarStack = ({ workers, max = 3 }) => {
  const list = workers.slice(0, max);
  const extra = workers.length - max;
  return (
    <span className="tf-av-stack">
      {list.map(w => <Avatar key={w.id} worker={w} size={26} />)}
      {extra > 0 && (
        <span className="tf-av" style={{ background: "#E3EAF2", color: "#3E4C5E", width: 26, height: 26, fontSize: 10 }}>+{extra}</span>
      )}
    </span>
  );
};

const StatusPill = ({ status }) => (
  <span className={`tf-pill s-${status}`}>
    <i className="dot"></i>{TF_LABELS.status[status]}
  </span>
);
const PriorityChip = ({ priority }) => (
  <span className={`tf-pri p-${priority}`}>
    <span className="tf-pri-bar"></span>{TF_LABELS.priority[priority]}
  </span>
);
const CategoryChip = ({ category }) => (
  <span className={`tf-cat c-${category}`}>{TF_LABELS.category[category]}</span>
);

const Sparkline = ({ values = [], width = 80, height = 28, color = "#2E7BC4" }) => {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = width / (values.length - 1 || 1);
  const points = values.map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`).join(" ");
  const area = `0,${height} ${points} ${width},${height}`;
  return (
    <svg width={width} height={height}>
      <polygon points={area} fill={color} opacity="0.10"/>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

const KPI = ({ label, value, sub, trend, color = "#2E7BC4", icon }) => (
  <div className="tf-kpi tf-fade">
    <div className="tf-kpi-label" style={{ display:"flex", alignItems:"center", gap:8 }}>
      {icon && <Icon name={icon} size={14} />}
      <span>{label}</span>
    </div>
    <div className="tf-kpi-value">{value}</div>
    {sub && <div className="tf-kpi-sub">{sub}</div>}
    {trend && (
      <div className="tf-kpi-spark">
        <Sparkline values={trend} color={color} width={88} height={32} />
      </div>
    )}
  </div>
);

const ProgressBar = ({ value, max = 100, color }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="tf-bar">
      <i style={{ width: `${pct}%`, background: color || undefined }}></i>
    </div>
  );
};

const SegmentTabs = ({ tabs, value, onChange }) => (
  <div className="tf-tabs">
    {tabs.map(t => (
      <span key={t.id} className={`tf-tab ${value === t.id ? "is-active" : ""}`}
            onClick={() => onChange(t.id)}>
        {t.label}
      </span>
    ))}
  </div>
);

const Field = ({ label, children }) => (
  <label className="tf-field">
    <span className="tf-field-label">{label}</span>
    {children}
  </label>
);

const TaskCard = ({ task, workers, onOpen, isSelected }) => {
  const w = workers.find(x => x.id === task.assignee);
  const overdue = tfIsOverdue(task);
  return (
    <div className={`tf-task p-${task.priority} ${isSelected ? "is-selected" : ""}`}
         onClick={() => onOpen(task)}>
      <span className="tf-rail"></span>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <CategoryChip category={task.category} />
        <PriorityChip priority={task.priority} />
      </div>
      <div className="tf-task-title">{task.title}</div>
      {task.notes && (
        <div style={{ fontSize: 12, color: "var(--tf-mute)", lineHeight: 1.4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {task.notes}
        </div>
      )}
      <div className="tf-task-foot">
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {w && <Avatar worker={w} size={24} status />}
          <span style={{ fontSize: 11.5, color: "var(--tf-mute)", display:"inline-flex", alignItems:"center", gap:4 }}>
            <Icon name="calendar" size={11} />
            <span style={{ color: overdue ? "var(--tf-red-500)" : "inherit", fontWeight: overdue ? 600 : 400 }}>
              {tfFmtDate(task.dueDate)}
            </span>
          </span>
        </div>
        {task.checklist?.length > 0 && (
          <span style={{ fontSize:11, color:"var(--tf-mute)", display:"inline-flex", alignItems:"center", gap:3 }}>
            <Icon name="check" size={11} />
            {task.checklist.filter(c => c.done).length}/{task.checklist.length}
          </span>
        )}
      </div>
    </div>
  );
};

// Donut chart
const Donut = ({ segments, size = 120, thickness = 14, label, sub }) => {
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--tf-line)" strokeWidth={thickness}/>
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const dasharray = `${len} ${C}`;
          const dashoffset = -acc;
          acc += len;
          return (
            <circle key={i}
              cx={size/2} cy={size/2} r={r} fill="none"
              stroke={s.color} strokeWidth={thickness}
              strokeDasharray={dasharray} strokeDashoffset={dashoffset}
              transform={`rotate(-90 ${size/2} ${size/2})`}
              strokeLinecap="butt"/>
          );
        })}
      </svg>
      <div style={{ position:"absolute", inset:0, display:"grid", placeItems:"center", textAlign:"center" }}>
        <div>
          <div style={{ fontFamily: "var(--tf-display)", fontSize: 26, fontWeight:600, letterSpacing:"-0.02em" }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color:"var(--tf-mute)", textTransform:"uppercase", letterSpacing:".06em", marginTop:2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
};

// Bar chart (vertical)
const BarChart = ({ data, height = 140, colorPositive = "#2E7BC4", colorAccent = "#40B4FF" }) => {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:10, height, padding:"0 4px" }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 24);
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, color: "var(--tf-mute)", fontVariantNumeric:"tabular-nums" }}>{d.value}</div>
            <div style={{
              width: "100%", maxWidth: 36, height: Math.max(4, h),
              background: `linear-gradient(180deg, ${colorAccent}, ${colorPositive})`,
              borderRadius: "6px 6px 2px 2px",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.3)"
            }}></div>
            <div style={{ fontSize: 10.5, color:"var(--tf-mute)", textAlign:"center", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"100%" }} title={d.label}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
};

Object.assign(window, {
  Icon, Avatar, AvatarStack, StatusPill, PriorityChip, CategoryChip,
  Sparkline, KPI, ProgressBar, SegmentTabs, Field, TaskCard, Donut, BarChart
});
