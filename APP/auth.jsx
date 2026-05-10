// ─────────────────────────────────────────────────────────────────
// TASKFLOW · ÓPTICA PRO — Auth wrapper (Supabase)
// Login con magic-link. Envuelve tu <App/> y solo lo monta cuando
// hay sesión válida.
//
// Uso (en index.html, después de cargar supabase-js y data-supabase.jsx):
//   <AuthGate>
//     <App />
//   </AuthGate>
// ─────────────────────────────────────────────────────────────────

const { useState, useEffect } = React;

function getSupabaseClient() {
  if (window.__supabase) return window.__supabase;
  const cfg = window.SUPABASE_CONFIG;
  if (!cfg) throw new Error("Falta SUPABASE_CONFIG en window");
  // PKCE flow: más seguro que implicit (el code se intercambia por sesión).
  window.__supabase = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: "taskflow.auth",
    },
  });
  return window.__supabase;
}

function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = cargando
  const supa = getSupabaseClient();

  useEffect(() => {
    supa.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supa.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <Splash />;
  if (!session) return <LoginScreen supa={supa} />;
  return (
    <>
      {children}
      <SessionPill supa={supa} session={session} />
    </>
  );
}

// ─── Pantalla de carga ────────────────────────────────────────────
function Splash() {
  return (
    <div style={{
      position:"fixed", inset:0, display:"grid", placeItems:"center",
      background:"#F4F7FA", color:"#1F2933",
      fontFamily:'"Inter",system-ui,sans-serif',
    }}>
      <div style={{display:"flex", alignItems:"center", gap:12}}>
        <div style={{
          width:18, height:18, borderRadius:"50%",
          border:"2.5px solid rgba(11,47,91,.18)", borderTopColor:"#0B2F5B",
          animation:"taskflow-spin .9s linear infinite",
        }}/>
        <span style={{fontSize:14, color:"#6B7888"}}>Cargando sesión…</span>
      </div>
      <style>{`@keyframes taskflow-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Login (magic link) ──────────────────────────────────────────
function LoginScreen({ supa }) {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState("idle"); // idle · sending · sent · error
  const [error, setError] = useState(null);

  async function send(e) {
    e.preventDefault();
    setPhase("sending"); setError(null);
    const { error } = await supa.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
        // shouldCreateUser=false → si no existe ya en auth.users, falla.
        // Esto fuerza el flujo "solo invitados" del gerente.
        shouldCreateUser: false,
      },
    });
    if (error) { setError(error.message); setPhase("error"); }
    else setPhase("sent");
  }

  return (
    <div style={loginStyles.shell}>
      <div style={loginStyles.bgGlowA}/>
      <div style={loginStyles.bgGlowB}/>

      <div style={loginStyles.card}>
        <div style={loginStyles.brandRow}>
          <div style={loginStyles.logo}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 L20 7 V17 L12 22 L4 17 V7 Z"/>
              <path d="M12 22 V12"/><path d="M4 7 L12 12 L20 7"/>
            </svg>
          </div>
          <div>
            <div style={loginStyles.brand}>TASKFLOW</div>
            <div style={loginStyles.sub}>Óptica PRO · Acceso interno</div>
          </div>
        </div>

        {phase === "sent" ? (
          <SentState email={email} onBack={() => setPhase("idle")}/>
        ) : (
          <form onSubmit={send} style={{display:"grid", gap:14}}>
            <div>
              <div style={loginStyles.eyebrow}>Iniciar sesión</div>
              <h1 style={loginStyles.title}>Te enviamos un enlace mágico</h1>
              <p style={loginStyles.lede}>
                Introduce tu correo profesional. Si tu gerente te ha dado de alta,
                recibirás un enlace seguro para entrar sin contraseña.
              </p>
            </div>

            <label style={loginStyles.label}>
              <span style={loginStyles.labelText}>Correo electrónico</span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                placeholder="tu.nombre@opticapro.es"
                style={loginStyles.input}
              />
            </label>

            {error && <div style={loginStyles.error}>{error}</div>}

            <button type="submit" disabled={phase==="sending"} style={{
              ...loginStyles.cta,
              opacity: phase==="sending" ? .6 : 1,
              cursor: phase==="sending" ? "wait" : "pointer",
            }}>
              {phase==="sending" ? "Enviando…" : "Enviar enlace seguro →"}
            </button>

            <div style={loginStyles.foot}>
              <Lock/> Conexión cifrada · Acceso solo para personal autorizado
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function SentState({ email, onBack }) {
  return (
    <div style={{display:"grid", gap:14}}>
      <div style={loginStyles.successIcon}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E8F73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7l8 6 8-6"/><rect x="3" y="5" width="18" height="14" rx="2"/>
        </svg>
      </div>
      <h1 style={loginStyles.title}>Revisa tu correo</h1>
      <p style={loginStyles.lede}>
        Hemos enviado un enlace de acceso a <b style={{color:"#0B2F5B"}}>{email}</b>.
        Caduca en 1 hora y solo se puede usar una vez.
      </p>
      <button onClick={onBack} style={loginStyles.ghost}>← Usar otro correo</button>
    </div>
  );
}

// ─── Pill flotante con sesión activa + cerrar sesión ─────────────
function SessionPill({ supa, session }) {
  const [open, setOpen] = useState(false);
  const email = session.user?.email ?? "—";

  return (
    <div style={{position:"fixed", top:14, right:14, zIndex:60, fontFamily:'"Inter",sans-serif'}}>
      <button onClick={()=>setOpen(o=>!o)} style={pillStyles.btn}>
        <span style={pillStyles.dot}/>
        {email.split("@")[0]}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div style={pillStyles.menu}>
          <div style={pillStyles.email}>{email}</div>
          <button style={pillStyles.signout} onClick={async()=>{ await supa.auth.signOut(); }}>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

function Lock(){
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flex:"none"}}>
      <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/>
    </svg>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const loginStyles = {
  shell:{
    position:"fixed", inset:0, display:"grid", placeItems:"center",
    background:"linear-gradient(160deg,#F4F7FA 0%, #E6EEF7 100%)",
    fontFamily:'"Inter",system-ui,sans-serif', color:"#1F2933", padding:24,
    overflow:"hidden",
  },
  bgGlowA:{ position:"absolute", top:-180, left:-180, width:520, height:520, borderRadius:"50%",
    background:"radial-gradient(closest-side,rgba(64,180,255,.28),transparent 70%)", filter:"blur(2px)" },
  bgGlowB:{ position:"absolute", bottom:-200, right:-160, width:560, height:560, borderRadius:"50%",
    background:"radial-gradient(closest-side,rgba(30,143,115,.18),transparent 70%)", filter:"blur(2px)" },
  card:{
    position:"relative", width:"100%", maxWidth:440,
    background:"rgba(255,255,255,.86)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
    border:"1px solid rgba(255,255,255,.7)", borderRadius:22,
    padding:"32px 30px",
    boxShadow:"0 30px 80px rgba(11,47,91,.18), 0 1px 0 rgba(255,255,255,.6) inset",
  },
  brandRow:{display:"flex", alignItems:"center", gap:12, marginBottom:24},
  logo:{
    width:40, height:40, borderRadius:11,
    background:"linear-gradient(160deg,#1E5B94,#0B2F5B)",
    display:"grid", placeItems:"center",
    boxShadow:"0 8px 22px rgba(11,47,91,.28), inset 0 1px 0 rgba(255,255,255,.18)",
  },
  brand:{fontFamily:'"Inter Tight",sans-serif', fontWeight:600, letterSpacing:".06em", fontSize:14, color:"#0B2F5B"},
  sub:{fontSize:11.5, color:"#6B7888", letterSpacing:".02em"},
  eyebrow:{fontSize:11, fontWeight:600, letterSpacing:".12em", textTransform:"uppercase", color:"#1E5B94"},
  title:{fontFamily:'"Inter Tight",sans-serif', fontWeight:600, letterSpacing:"-0.02em", fontSize:26, margin:"4px 0 6px", lineHeight:1.15},
  lede:{fontSize:14, color:"#3E4C5E", margin:0, lineHeight:1.5},
  label:{display:"grid", gap:6, marginTop:6},
  labelText:{fontSize:12, fontWeight:600, color:"#3E4C5E"},
  input:{
    width:"100%", padding:"13px 14px", borderRadius:11,
    border:"1px solid #D9E1EB", background:"#fff",
    fontSize:14, fontFamily:"inherit", color:"#1F2933",
    outline:"none", transition:"box-shadow .15s, border-color .15s",
  },
  error:{
    background:"#FEF2F2", color:"#9F1F2C", borderRadius:10,
    padding:"10px 12px", fontSize:12.5, border:"1px solid #FAD2D6",
  },
  cta:{
    marginTop:6, padding:"13px 18px", borderRadius:11, border:"none",
    background:"linear-gradient(160deg,#1E5B94,#0B2F5B)", color:"#fff",
    fontWeight:600, fontSize:14, letterSpacing:".01em", fontFamily:"inherit",
    boxShadow:"0 10px 24px rgba(11,47,91,.28), inset 0 1px 0 rgba(255,255,255,.16)",
  },
  ghost:{
    marginTop:4, padding:"10px 14px", borderRadius:10,
    background:"transparent", border:"1px solid #D9E1EB", color:"#3E4C5E",
    fontSize:13, fontFamily:"inherit", cursor:"pointer",
  },
  foot:{
    marginTop:8, fontSize:12, color:"#6B7888", display:"flex", alignItems:"center", gap:8,
  },
  successIcon:{
    width:50, height:50, borderRadius:14, background:"#DCEFE8",
    display:"grid", placeItems:"center", border:"1px solid #BFE0D4",
  },
};

const pillStyles = {
  btn:{
    display:"inline-flex", alignItems:"center", gap:8,
    padding:"7px 12px 7px 10px", borderRadius:999,
    background:"rgba(255,255,255,.78)", backdropFilter:"blur(14px)",
    border:"1px solid rgba(217,225,235,.9)", color:"#1F2933",
    fontSize:12.5, fontWeight:600, fontFamily:'"Inter",sans-serif', cursor:"pointer",
    boxShadow:"0 1px 2px rgba(11,47,91,.06), 0 6px 18px rgba(11,47,91,.06)",
  },
  dot:{width:7, height:7, borderRadius:"50%", background:"#1E8F73", boxShadow:"0 0 0 3px rgba(30,143,115,.2)"},
  menu:{
    marginTop:8, width:220, background:"#fff", border:"1px solid #E3EAF2", borderRadius:12,
    padding:8, boxShadow:"0 18px 40px rgba(11,47,91,.16)",
  },
  email:{fontSize:11.5, color:"#6B7888", padding:"6px 8px", wordBreak:"break-all"},
  signout:{
    width:"100%", textAlign:"left", padding:"8px 10px", borderRadius:8,
    border:"none", background:"transparent", color:"#9F1F2C", fontWeight:600,
    fontSize:13, cursor:"pointer", fontFamily:"inherit",
  },
};

window.AuthGate = AuthGate;
