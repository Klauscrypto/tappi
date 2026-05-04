import { useState, useEffect } from "react";

const STORAGE_KEY = "stempelkarte-v3";

const defaultData = {
  restaurants: [
    { id: "r1", name: "Döner Palace",  category: "Döner",   emoji: "🥙", color: "#e63946", colorDark: "#b02030", username: "doener", password: "1234", stampsForReward: 10, reward: "1 Döner gratis" },
    { id: "r2", name: "La Bella Pizza",category: "Pizzeria", emoji: "🍕", color: "#f4a261", colorDark: "#c07030", username: "pizza",  password: "1234", stampsForReward: 8,  reward: "1 Pizza gratis" },
    { id: "r3", name: "Kieferbladen",  category: "Burger",   emoji: "🍔", color: "#2a9d8f", colorDark: "#1a6d62", username: "burger", password: "1234", stampsForReward: 6,  reward: "1 Burger gratis" },
  ],
  customers: {},
  activeCodes: {},
};

function genCode() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function timeLeft(exp) {
  const d = Math.max(0, exp - Date.now());
  return `${Math.floor(d/60000)}:${String(Math.floor((d%60000)/1000)).padStart(2,"0")}`;
}

/* ─── Root ─────────────────────────────────────────────────────────────── */
export default function App() {
  const [data, setData]   = useState(null);
  const [view, setView]   = useState("home");
  const [curR, setCurR]   = useState(null);
  const [curC, setCurC]   = useState(null);
  const [toast, setToast] = useState(null);
  const [tick,  setTick]  = useState(0);

  useEffect(() => {
    try { const d = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (d) { setData(d); return; } } catch {}
    setData(JSON.parse(JSON.stringify(defaultData)));
  }, []);
  useEffect(() => { if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => { const t = setInterval(() => setTick(n=>n+1), 1000); return ()=>clearInterval(t); }, []);
  useEffect(() => {
    if (!data) return;
    const now = Date.now(), nc = {...data.activeCodes}; let ch = false;
    Object.entries(nc).forEach(([c,v]) => { if (v.expiresAt < now && !v.usedBy) { delete nc[c]; ch=true; } });
    if (ch) setData(d => ({...d, activeCodes: nc}));
  }, [tick]);

  const notify = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  if (!data) return <div className="loading">Laden…</div>;

  const go = (v) => setView(v);
  const shared = { data, setData, notify };

  return (
    <div style={{minHeight:"100vh",background:"#0d0d1a",color:"#f0eee8",fontFamily:"'Syne','Trebuchet MS',sans-serif",position:"relative"}}>
      <style>{CSS}</style>

      {toast && (
        <div className="toast" style={{background: toast.type==="err" ? "#e63946" : "#2a9d8f"}}>
          {toast.msg}
        </div>
      )}

      {view==="home"          && <Home      setView={go} />}
      {view==="r-login"       && <RLogin    {...shared} onBack={()=>go("home")} onLogin={id=>{setCurR(id);go("r-dash");}} />}
      {view==="c-login"       && <CLogin    {...shared} onBack={()=>go("home")} onLogin={u=>{setCurC(u);go("c-dash");}} onReg={()=>go("register")} />}
      {view==="register"      && <CRegister {...shared} onBack={()=>go("c-login")} onDone={u=>{setCurC(u);go("c-dash");}} />}
      {view==="r-dash" && curR && <RDash    {...shared} rId={curR} tick={tick} onLogout={()=>{setCurR(null);go("home");}} />}
      {view==="c-dash" && curC && <CDash    {...shared} cKey={curC} onLogout={()=>{setCurC(null);go("home");}} />}
    </div>
  );
}

/* ─── HOME ──────────────────────────────────────────────────────────────── */
function Home({ setView }) {
  return (
    <div className="page-center">
      <div className="blob" />
      <div className="home-icon">🎯</div>
      <h1 className="home-title">STEMPELKARTE</h1>
      <p className="home-sub">Deine digitale Treuekarte für alle Restaurants</p>
      <div className="btn-col">
        <button className="btn-grad" onClick={()=>setView("c-login")}>👤 Ich bin Kunde</button>
        <button className="btn-out"  onClick={()=>setView("r-login")}>🏪 Ich bin Restaurant</button>
      </div>
      <p className="demo-hint">Demo: doener · pizza · burger / Passwort: 1234</p>
    </div>
  );
}

/* ─── AUTH CARD wrapper ──────────────────────────────────────────────────── */
function AuthWrap({ children }) {
  return (
    <div className="page-center">
      <div className="auth-card">{children}</div>
    </div>
  );
}

/* ─── RESTAURANT LOGIN ───────────────────────────────────────────────────── */
function RLogin({ data, onLogin, onBack, notify }) {
  const [u,setU]=useState(""), [p,setP]=useState("");
  const go = () => {
    const r = data.restaurants.find(r=>r.username===u&&r.password===p);
    if (!r) return notify("Falscher Benutzername oder Passwort","err");
    onLogin(r.id);
  };
  return (
    <AuthWrap>
      <button className="back-btn" onClick={onBack}>← Zurück</button>
      <div className="auth-icon">🏪</div>
      <h2 className="auth-title">Restaurant Login</h2>
      <input className="inp" placeholder="Benutzername" value={u} onChange={e=>setU(e.target.value)} />
      <input className="inp" placeholder="Passwort" type="password" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} />
      <button className="btn-grad w-full" onClick={go}>Einloggen</button>
    </AuthWrap>
  );
}

/* ─── CUSTOMER LOGIN ─────────────────────────────────────────────────────── */
function CLogin({ data, onLogin, onBack, onReg, notify }) {
  const [u,setU]=useState(""), [p,setP]=useState("");
  const go = () => {
    const c = data.customers[u];
    if (!c||c.password!==p) return notify("Falscher Benutzername oder Passwort","err");
    onLogin(u);
  };
  return (
    <AuthWrap>
      <button className="back-btn" onClick={onBack}>← Zurück</button>
      <div className="auth-icon">👤</div>
      <h2 className="auth-title">Kunden Login</h2>
      <input className="inp" placeholder="Benutzername" value={u} onChange={e=>setU(e.target.value)} />
      <input className="inp" placeholder="Passwort" type="password" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} />
      <button className="btn-grad w-full" onClick={go}>Einloggen</button>
      <button className="btn-ghost" onClick={onReg}>Noch kein Konto? Registrieren →</button>
    </AuthWrap>
  );
}

/* ─── REGISTER ───────────────────────────────────────────────────────────── */
function CRegister({ data, setData, onBack, onDone, notify }) {
  const [n,setN]=useState(""), [u,setU]=useState(""), [p,setP]=useState("");
  const go = () => {
    if (!n||!u||!p) return notify("Bitte alle Felder ausfüllen","err");
    if (data.customers[u]) return notify("Benutzername bereits vergeben","err");
    setData(d=>({...d,customers:{...d.customers,[u]:{password:p,name:n,stamps:{},redeemedRewards:[]}}}));
    notify("Konto erstellt 🎉"); onDone(u);
  };
  return (
    <AuthWrap>
      <button className="back-btn" onClick={onBack}>← Zurück</button>
      <div className="auth-icon">✨</div>
      <h2 className="auth-title">Konto erstellen</h2>
      <input className="inp" placeholder="Dein Name"     value={n} onChange={e=>setN(e.target.value)} />
      <input className="inp" placeholder="Benutzername"  value={u} onChange={e=>setU(e.target.value)} />
      <input className="inp" placeholder="Passwort" type="password" value={p} onChange={e=>setP(e.target.value)} />
      <button className="btn-grad w-full" onClick={go}>Registrieren</button>
    </AuthWrap>
  );
}

/* ─── RESTAURANT DASHBOARD ───────────────────────────────────────────────── */
function RDash({ data, setData, notify, rId, tick, onLogout }) {
  const r = data.restaurants.find(x=>x.id===rId);
  const codes = Object.entries(data.activeCodes).filter(([,v])=>v.restaurantId===rId&&!v.usedBy&&v.expiresAt>Date.now());
  const usedToday = Object.values(data.activeCodes).filter(c=>c.restaurantId===rId&&c.usedBy&&c.expiresAt>Date.now()-86400000).length;
  const recent = Object.values(data.activeCodes).filter(c=>c.restaurantId===rId&&c.usedBy).slice(-5).reverse();

  const makeCode = () => {
    const code=genCode(), exp=Date.now()+5*60*1000;
    setData(d=>({...d,activeCodes:{...d.activeCodes,[code]:{restaurantId:rId,expiresAt:exp,usedBy:null}}}));
    notify("Code generiert! Gültig 5 Minuten.");
  };

  return (
    <div className="dash-wrap">
      {/* Header */}
      <div className="dash-head" style={{background:`linear-gradient(135deg,${r.color},${r.colorDark})`}}>
        <button className="logout-btn" onClick={onLogout}>Ausloggen</button>
        <div style={{fontSize:56}}>{r.emoji}</div>
        <div className="dash-name">{r.name}</div>
        <span className="dash-badge">{r.category}</span>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <Stat label="Heute" val={usedToday} />
        <Stat label="Für Belohnung" val={r.stampsForReward} />
        <Stat label="Belohnung" val={r.reward} sm />
      </div>

      {/* Generate */}
      <div className="section">
        <div className="section-title">🎫 Stempel-Code generieren</div>
        <p className="hint-text">Zeige den Code dem Kunden – er ist 5 Minuten gültig und nur einmal verwendbar.</p>
        <button className="gen-btn" style={{background:r.color}} onClick={makeCode}>✦ Code generieren</button>

        {codes.length > 0 && (
          <div className="code-box">
            {codes.map(([code,info])=>(
              <div key={code} className="code-row">
                <span className="code-num">{code.slice(0,3)} {code.slice(3)}</span>
                <div className="code-meta">
                  <div className="code-timer">⏱ {timeLeft(info.expiresAt)}</div>
                  <div className="code-sub">Noch gültig</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent */}
      <div className="section">
        <div className="section-title">📋 Zuletzt eingelöst</div>
        <div className="list-box">
          {recent.length===0
            ? <p className="empty-text">Noch keine Stempel eingelöst</p>
            : recent.map((c,i)=><div key={i} className="list-item">✅ Stempel für <b>{c.usedBy}</b></div>)
          }
        </div>
      </div>
    </div>
  );
}

/* ─── CUSTOMER DASHBOARD ─────────────────────────────────────────────────── */
function CDash({ data, setData, notify, cKey, onLogout }) {
  const cust = data.customers[cKey];
  const [code, setCode] = useState("");
  const [tab, setTab]   = useState("cards");

  const redeem = () => {
    const t = code.trim();
    if (!t) return notify("Bitte Code eingeben","err");
    const e = data.activeCodes[t];
    if (!e)         return notify("Ungültiger oder abgelaufener Code","err");
    if (e.usedBy)   return notify("Code bereits verwendet","err");
    if (e.expiresAt < Date.now()) return notify("Code abgelaufen","err");
    const rid = e.restaurantId;
    const rest = data.restaurants.find(r=>r.id===rid);
    const n = (cust.stamps[rid]||0)+1;
    setData(d=>({
      ...d,
      activeCodes:{...d.activeCodes,[t]:{...d.activeCodes[t],usedBy:cKey}},
      customers:{...d.customers,[cKey]:{...d.customers[cKey],stamps:{...d.customers[cKey].stamps,[rid]:n}}}
    }));
    setCode(""); notify(`✅ Stempel bei ${rest.name}! (${n}/${rest.stampsForReward})`);
  };

  const claimReward = (rid) => {
    const rest = data.restaurants.find(r=>r.id===rid);
    setData(d=>({
      ...d,
      customers:{...d.customers,[cKey]:{
        ...d.customers[cKey],
        stamps:{...d.customers[cKey].stamps,[rid]:0},
        redeemedRewards:[...(d.customers[cKey].redeemedRewards||[]),{restaurantId:rid,reward:rest.reward,date:new Date().toLocaleDateString("de-DE")}]
      }}
    }));
    notify(`🎉 Belohnung eingelöst: ${rest.reward}!`);
  };

  return (
    <div className="dash-wrap">
      {/* Header */}
      <div className="dash-head" style={{background:"linear-gradient(135deg,#1a1a3e,#0d0d1a)"}}>
        <button className="logout-btn" onClick={onLogout}>Ausloggen</button>
        <div style={{fontSize:56}}>👤</div>
        <div className="dash-name">{cust.name}</div>
        <span className="dash-badge">Meine Stempelkarten</span>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab==="cards"?"tab-on":""}`} onClick={()=>setTab("cards")}>🃏 Karten</button>
        <button className={`tab ${tab==="code"?"tab-on":""}`}  onClick={()=>setTab("code")}>🎫 Code eingeben</button>
      </div>

      {/* Code entry */}
      {tab==="code" && (
        <div className="section">
          <div className="section-title">Code vom Restaurant eingeben</div>
          <p className="hint-text">Lass dir einen 6-stelligen Code geben und gib ihn hier ein.</p>
          <div className="code-entry-row">
            <input
              className="inp code-inp"
              placeholder="_ _ _ _ _ _"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e=>setCode(e.target.value.replace(/\D/g,""))}
              onKeyDown={e=>e.key==="Enter"&&redeem()}
            />
            <button className="btn-grad redeem-btn" onClick={redeem}>✅ Einlösen</button>
          </div>
        </div>
      )}

      {/* Cards */}
      {tab==="cards" && (
        <>
          <div className="cards-grid">
            {data.restaurants.map(r=>{
              const stamps = cust.stamps[r.id]||0;
              const full   = stamps>=r.stampsForReward;
              const pct    = Math.min(100,(stamps/r.stampsForReward)*100);
              return (
                <div key={r.id} className="s-card" style={{borderColor:r.color}}>
                  {/* card header */}
                  <div className="s-card-head" style={{background:`linear-gradient(135deg,${r.color},${r.colorDark})`}}>
                    <span style={{fontSize:30}}>{r.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="s-card-name">{r.name}</div>
                      <div className="s-card-cat">{r.category}</div>
                    </div>
                    <span className="s-card-count">{stamps}/{r.stampsForReward}</span>
                  </div>

                  {/* progress bar */}
                  <div className="prog-wrap">
                    <div className="prog-track">
                      <div className="prog-fill" style={{width:`${pct}%`,background:r.color}} />
                    </div>
                  </div>

                  {/* dots */}
                  <div className="dots-wrap">
                    {Array.from({length:r.stampsForReward}).map((_,i)=>(
                      <div key={i} className="dot" style={{
                        background: i<stamps ? r.color : "#2a2a3e",
                        boxShadow:  i<stamps ? `0 0 8px ${r.color}aa` : "none",
                        transform:  i<stamps ? "scale(1.1)" : "scale(1)",
                      }}>
                        {i<stamps ? "✦" : "·"}
                      </div>
                    ))}
                  </div>

                  <div className="s-card-reward">{r.reward}</div>

                  {full && (
                    <button
                      className="btn-grad"
                      style={{background:r.color,margin:"0 14px 14px",width:"calc(100% - 28px)"}}
                      onClick={()=>claimReward(r.id)}
                    >
                      🎁 Belohnung einlösen!
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* History */}
          {cust.redeemedRewards?.length>0 && (
            <div className="section" style={{marginTop:12}}>
              <div className="section-title">🏆 Eingelöste Belohnungen</div>
              {cust.redeemedRewards.slice().reverse().map((rw,i)=>{
                const rest=data.restaurants.find(x=>x.id===rw.restaurantId);
                return (
                  <div key={i} className="hist-item">
                    {rest?.emoji} <b>{rw.reward}</b>
                    <span className="hist-date">{rw.date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({label,val,sm}) {
  return (
    <div className="stat-box">
      <div className="stat-val" style={{fontSize:sm?"12px":undefined}}>{val}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ─── CSS ───────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{margin:0;-webkit-font-smoothing:antialiased;}

/* toast */
.toast{
  position:fixed;top:14px;left:50%;transform:translateX(-50%);
  color:#fff;border-radius:14px;padding:12px 20px;font-weight:700;
  font-size:14px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,.5);
  white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis;
  animation:sd .22s ease;
}
@keyframes sd{from{opacity:0;transform:translateX(-50%) translateY(-10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}

/* page center */
.page-center{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:100vh;padding:24px 16px;
}

/* home */
.blob{position:fixed;top:-100px;right:-100px;width:320px;height:320px;
  background:radial-gradient(circle,rgba(244,162,97,.15),transparent 70%);
  border-radius:50%;pointer-events:none;}
.home-icon{font-size:64px;line-height:1;margin-bottom:10px;}
.home-title{
  font-size:clamp(28px,9vw,52px);font-weight:900;
  letter-spacing:clamp(3px,1.5vw,9px);margin-bottom:10px;text-align:center;
  background:linear-gradient(135deg,#f4a261,#e63946);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
}
.home-sub{color:#a0a0c0;font-size:clamp(13px,3.5vw,16px);text-align:center;max-width:320px;margin-bottom:36px;}
.btn-col{display:flex;flex-direction:column;gap:12px;width:100%;max-width:320px;}
.demo-hint{color:#444;font-size:11px;margin-top:28px;text-align:center;}

/* auth */
.auth-card{
  display:flex;flex-direction:column;align-items:center;gap:12px;
  width:100%;max-width:400px;
  background:#13132a;border-radius:22px;
  padding:clamp(22px,5vw,40px) clamp(18px,5vw,36px);
  box-shadow:0 20px 60px rgba(0,0,0,.55);
}
.auth-icon{font-size:50px;margin:6px 0;}
.auth-title{font-size:clamp(20px,5vw,26px);font-weight:800;margin-bottom:4px;}
.back-btn{background:none;border:none;color:#777;cursor:pointer;font-size:13px;align-self:flex-start;font-family:inherit;}

/* buttons */
.btn-grad{
  background:linear-gradient(135deg,#f4a261,#e63946);color:#fff;border:none;
  border-radius:13px;padding:14px 22px;font-size:15px;font-weight:700;
  cursor:pointer;font-family:inherit;transition:transform .13s,box-shadow .13s;
  width:100%;
}
.btn-grad:hover{transform:scale(1.03);box-shadow:0 4px 18px rgba(230,57,70,.35);}
.btn-grad:active{transform:scale(.97);}
.btn-out{
  background:transparent;color:#f0eee8;border:2px solid #f4a261;
  border-radius:13px;padding:13px 22px;font-size:15px;font-weight:700;
  cursor:pointer;font-family:inherit;width:100%;transition:transform .13s;
}
.btn-out:hover{transform:scale(1.03);}
.btn-ghost{background:none;border:none;color:#777;font-size:13px;cursor:pointer;font-family:inherit;padding:4px 0;}
.w-full{width:100%;}

/* inputs */
.inp{
  background:#1e1e30;border:2px solid #2a2a3e;border-radius:12px;
  color:#f0eee8;font-size:15px;padding:13px 15px;width:100%;
  font-family:inherit;outline:none;transition:border-color .18s;
}
.inp:focus{border-color:#f4a261;}
.code-inp{font-size:clamp(20px,6vw,30px);letter-spacing:clamp(5px,2vw,12px);text-align:center;font-weight:900;flex:1;}

/* dashboard */
.dash-wrap{width:100%;max-width:680px;margin:0 auto;padding-bottom:48px;}
.dash-head{
  padding:clamp(24px,5vw,40px) 20px clamp(18px,4vw,26px);
  border-radius:0 0 26px 26px;display:flex;flex-direction:column;align-items:center;
  position:relative;margin-bottom:14px;
}
.dash-name{font-size:clamp(18px,5vw,26px);font-weight:800;margin:8px 0 5px;text-align:center;}
.dash-badge{background:rgba(255,255,255,.2);border-radius:20px;padding:4px 13px;font-size:clamp(10px,2.8vw,13px);}
.logout-btn{position:absolute;top:13px;right:13px;background:rgba(0,0,0,.3);border:none;color:#fff;border-radius:18px;padding:5px 13px;font-size:12px;cursor:pointer;font-family:inherit;}

/* stats */
.stats-row{display:flex;gap:8px;padding:0 14px 14px;}
.stat-box{flex:1;background:#1e1e30;border-radius:13px;padding:11px 6px;text-align:center;min-width:0;}
.stat-val{font-weight:900;color:#f4a261;font-size:clamp(16px,5vw,24px);word-break:break-word;line-height:1.2;}
.stat-label{font-size:clamp(8px,2.2vw,11px);color:#666;margin-top:3px;}

/* section */
.section{padding:0 14px clamp(18px,4vw,26px);}
.section-title{font-size:clamp(14px,4vw,17px);font-weight:800;margin-bottom:7px;}
.hint-text{color:#888;font-size:clamp(11px,3vw,13px);margin-bottom:13px;line-height:1.5;}

/* gen button */
.gen-btn{
  border:none;border-radius:15px;
  padding:clamp(15px,4vw,19px) 20px;
  font-size:clamp(15px,4vw,19px);font-weight:900;cursor:pointer;color:#fff;
  width:100%;letter-spacing:1px;font-family:inherit;transition:transform .13s,box-shadow .13s;
}
.gen-btn:hover{transform:scale(1.03);box-shadow:0 4px 20px rgba(0,0,0,.3);}
.gen-btn:active{transform:scale(.97);}

/* active codes */
.code-box{margin-top:14px;background:#1e1e30;border-radius:15px;padding:16px;display:flex;flex-direction:column;gap:10px;}
.code-row{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;}
.code-num{font-size:clamp(26px,7vw,42px);font-weight:900;letter-spacing:clamp(5px,2vw,12px);color:#f4a261;font-family:monospace;}
.code-timer{color:#e63946;font-weight:700;font-size:clamp(14px,4vw,19px);}
.code-meta{text-align:right;}
.code-sub{font-size:10px;color:#555;margin-top:2px;}

/* list */
.list-box{background:#1e1e30;border-radius:13px;padding:14px;display:flex;flex-direction:column;gap:8px;}
.list-item{font-size:clamp(12px,3vw,14px);color:#a0a0c0;}
.empty-text{color:#555;font-size:12px;}

/* tabs */
.tabs{display:flex;margin:0 14px 14px;background:#1e1e30;border-radius:15px;padding:4px;}
.tab{flex:1;background:transparent;border:none;color:#666;padding:11px 8px;border-radius:12px;cursor:pointer;font-size:clamp(11px,3vw,14px);font-weight:700;font-family:inherit;transition:all .18s;}
.tab-on{background:#2a2a3e;color:#f4a261;}

/* code entry */
.code-entry-row{display:flex;gap:10px;align-items:stretch;flex-wrap:wrap;}
.redeem-btn{flex-shrink:0;width:auto;padding-left:18px;padding-right:18px;}
@media(max-width:380px){.code-entry-row{flex-direction:column;}.redeem-btn{width:100%;}}

/* stamp cards grid */
.cards-grid{padding:0 14px;display:grid;gap:14px;grid-template-columns:1fr;}
@media(min-width:540px){.cards-grid{grid-template-columns:1fr 1fr;}}

.s-card{background:#1a1a2e;border-radius:18px;border:2px solid;overflow:hidden;transition:transform .18s;}
.s-card:hover{transform:translateY(-2px);}
.s-card-head{padding:14px 16px;display:flex;align-items:center;gap:12px;}
.s-card-name{font-weight:800;font-size:clamp(13px,3.8vw,17px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.s-card-cat{font-size:clamp(9px,2.5vw,11px);opacity:.7;margin-top:2px;}
.s-card-count{background:rgba(0,0,0,.25);border-radius:18px;padding:3px 9px;font-size:clamp(10px,2.8vw,12px);font-weight:800;white-space:nowrap;flex-shrink:0;}

/* progress */
.prog-wrap{padding:0 16px;margin:9px 0 3px;}
.prog-track{height:5px;background:#2a2a3e;border-radius:5px;overflow:hidden;}
.prog-fill{height:100%;border-radius:5px;transition:width .5s ease;}

/* dots */
.dots-wrap{display:flex;flex-wrap:wrap;gap:clamp(5px,1.5vw,8px);padding:10px 16px 4px;}
.dot{
  width:clamp(28px,7vw,36px);height:clamp(28px,7vw,36px);
  border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:clamp(12px,3vw,16px);font-weight:900;color:#fff;transition:all .28s;flex-shrink:0;
}

.s-card-reward{padding:5px 16px 11px;color:#666;font-size:clamp(10px,2.8vw,12px);}

/* history */
.hist-item{background:#1e1e30;border-radius:11px;padding:10px 14px;margin-bottom:6px;font-size:clamp(12px,3vw,14px);}
.hist-date{color:#555;font-size:11px;margin-left:8px;}

/* scrollbar */
::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-track{background:#0d0d1a;}
::-webkit-scrollbar-thumb{background:#2a2a3e;border-radius:3px;}
`;
