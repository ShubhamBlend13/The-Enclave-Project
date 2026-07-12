import React, { useState, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────
   THE ENCLAVE · Villa community management
   8 villas (S1–S8) + Clubhouse · Site manager
   Design: limestone / deep courtyard green / brass
   ───────────────────────────────────────────── */

const T = {
  bg: "#F4F2EC",
  card: "#FFFFFF",
  ink: "#1C2B26",
  green: "#1F4438",
  greenSoft: "#E4ECE6",
  brass: "#A8813C",
  brassSoft: "#F3EBDA",
  line: "#E3DFD4",
  mute: "#6E7A72",
  red: "#B3432B",
  amber: "#B07A1E",
  blue: "#2D5B8A",
  ok: "#2E6B4F",
};

const VILLAS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];
const CATEGORIES = [
  { id: "electrical", label: "Electrical", icon: "⚡" },
  { id: "plumbing", label: "Plumbing", icon: "🚿" },
  { id: "automation", label: "Home automation", icon: "🎛️" },
  { id: "hvac", label: "AC / Ventilation", icon: "❄️" },
  { id: "housekeeping", label: "Housekeeping", icon: "🧹" },
  { id: "landscape", label: "Garden / Landscape", icon: "🌿" },
  { id: "clubhouse", label: "Clubhouse / Amenity", icon: "🏊" },
  { id: "security", label: "Security / Gate", icon: "🛡️" },
  { id: "other", label: "Something else", icon: "📋" },
];
const STATUS = {
  open: { label: "Open", color: T.amber, bg: "#F6EEDC" },
  progress: { label: "In progress", color: T.blue, bg: "#E3ECF5" },
  resolved: { label: "Resolved", color: T.ok, bg: "#E2EFE7" },
};
const PRIORITIES = ["Low", "Normal", "Urgent"];

/* ── scheduled upkeep ── */
const DAY = 24 * 60 * 60 * 1000;
const FREQS = [
  { id: "weekly", label: "Weekly", days: 7 },
  { id: "monthly", label: "Monthly", days: 30 },
  { id: "quarterly", label: "Every 3 months", days: 91 },
  { id: "halfyearly", label: "Every 6 months", days: 182 },
  { id: "yearly", label: "Yearly", days: 365 },
];
const PRESETS = [
  { group: "Villa systems", items: [
    { title: "AC deep service (all bedrooms & lounges)", icon: "❄️", freq: "quarterly" },
    { title: "Basalte automation & switch panel check", icon: "🎛️", freq: "monthly" },
    { title: "Music zone streamer & speaker test", icon: "🎵", freq: "monthly" },
    { title: "Home theatre check (3rd floor lounge)", icon: "🎬", freq: "halfyearly" },
    { title: "Inverter / UPS battery check", icon: "🔋", freq: "quarterly" },
  ]},
  { group: "Water & kitchen", items: [
    { title: "Overhead water tank cleaning", icon: "💧", freq: "halfyearly" },
    { title: "RO / water purifier filter change", icon: "🚰", freq: "halfyearly" },
    { title: "Kitchen chimney deep clean", icon: "🍳", freq: "quarterly" },
    { title: "Geyser service & descaling", icon: "🔥", freq: "yearly" },
  ]},
  { group: "House & exterior", items: [
    { title: "Pest control (all floors)", icon: "🐜", freq: "quarterly" },
    { title: "Terrace waterproofing inspection", icon: "🏠", freq: "yearly" },
    { title: "Garden & planter maintenance", icon: "🌿", freq: "monthly" },
    { title: "Deep cleaning — sofas, carpets, curtains", icon: "🛋️", freq: "quarterly" },
  ]},
  { group: "Safety", items: [
    { title: "Fire extinguisher check", icon: "🧯", freq: "halfyearly" },
    { title: "CCTV & video door phone check", icon: "📹", freq: "monthly" },
    { title: "Gas pipeline / cylinder safety check", icon: "⛽", freq: "halfyearly" },
  ]},
];
const freqDays = (id) => (FREQS.find((f) => f.id === id) || FREQS[1]).days;
const freqLabel = (id) => (FREQS.find((f) => f.id === id) || FREQS[1]).label;
const dueInfo = (task) => {
  const days = Math.ceil((task.nextDue - Date.now()) / DAY);
  if (days < 0) return { text: `Overdue by ${-days} day${days < -1 ? "s" : ""}`, color: T.red, bg: "#F7E6E0", overdue: true };
  if (days === 0) return { text: "Due today", color: T.amber, bg: "#F6EEDC", overdue: false };
  if (days <= 7) return { text: `Due in ${days} day${days > 1 ? "s" : ""}`, color: T.amber, bg: "#F6EEDC", overdue: false };
  return { text: `Due ${new Date(task.nextDue).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`, color: T.mute, bg: "#EFEDE5", overdue: false };
};

/* ── storage helpers ── */
async function loadKey(key, shared = false) {
  try {
    const r = await window.storage.get(key, shared);
    return r ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}
async function saveKey(key, value, shared = false) {
  try {
    await window.storage.set(key, JSON.stringify(value), shared);
    return true;
  } catch {
    return false;
  }
}

const fmtDate = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
    ", " + d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ── tiny UI atoms ── */
const Chip = ({ children, color, bg }) => (
  <span style={{
    fontSize: 11, fontWeight: 600, letterSpacing: 0.4, color, background: bg,
    padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap",
  }}>{children}</span>
);

const Btn = ({ children, onClick, variant = "primary", disabled, style }) => {
  const base = {
    fontFamily: "'Inter', system-ui, sans-serif", fontSize: 15, fontWeight: 600,
    padding: "14px 20px", borderRadius: 12, border: "none", cursor: disabled ? "default" : "pointer",
    width: "100%", opacity: disabled ? 0.45 : 1, transition: "transform .12s ease",
  };
  const kinds = {
    primary: { background: T.green, color: "#F7F5EE" },
    ghost: { background: "transparent", color: T.green, border: `1.5px solid ${T.green}` },
    brass: { background: T.brass, color: "#FFF" },
    quiet: { background: T.greenSoft, color: T.green },
  };
  return (
    <button disabled={disabled} onClick={onClick}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{ ...base, ...kinds[variant], ...style }}>
      {children}
    </button>
  );
};

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: T.mute, marginBottom: 7 }}>{label}</div>
    {children}
  </div>
);

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "13px 14px", fontSize: 16,
  fontFamily: "'Inter', system-ui, sans-serif", border: `1.5px solid ${T.line}`,
  borderRadius: 12, background: "#FFF", color: T.ink, outline: "none",
};

/* ── Villa strip: the community, drawn as a row of keys ── */
const VillaStrip = ({ mine }) => (
  <div style={{ display: "flex", gap: 6, alignItems: "flex-end", padding: "4px 0 0" }}>
    {VILLAS.map((v) => {
      const isMine = v === mine;
      return (
        <div key={v} style={{ flex: 1, textAlign: "center" }}>
          <div style={{
            height: isMine ? 44 : 32, borderRadius: "8px 8px 3px 3px",
            background: isMine ? T.brass : T.greenSoft,
            border: `1.5px solid ${isMine ? T.brass : T.line}`,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            transition: "height .3s ease", position: "relative",
          }}>
            <div style={{
              position: "absolute", top: -7, left: "50%", transform: "translateX(-50%) rotate(45deg)",
              width: isMine ? 16 : 12, height: isMine ? 16 : 12, borderRadius: 3,
              background: isMine ? T.brass : T.greenSoft,
              borderTop: `1.5px solid ${isMine ? T.brass : T.line}`,
              borderLeft: `1.5px solid ${isMine ? T.brass : T.line}`,
            }} />
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5, paddingBottom: 5,
              color: isMine ? "#FFF" : T.mute,
            }}>{v}</span>
          </div>
        </div>
      );
    })}
    <div style={{ flex: 1.4, textAlign: "center" }}>
      <div style={{
        height: 28, borderRadius: 6, background: T.green,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#EFE9DA" }}>CLUB</span>
      </div>
    </div>
  </div>
);

/* ── LOGIN FLOW ── */
function Login({ onDone }) {
  const [step, setStep] = useState("phone"); // phone → otp → details
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [villa, setVilla] = useState("");
  const [role, setRole] = useState("resident");

  const validPhone = /^\d{10}$/.test(phone);

  return (
    <div style={{ minHeight: "100vh", background: T.green, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "64px 28px 36px", color: "#F2EEE2" }}>
        <div style={{ fontSize: 11, letterSpacing: 3.5, opacity: 0.75, marginBottom: 10 }}>EIGHT VILLAS · ONE CLUBHOUSE</div>
        <div style={{ fontFamily: "'Marcellus', serif", fontSize: 42, lineHeight: 1.05 }}>The<br />Enclave</div>
      </div>
      <div style={{
        flex: 1, background: T.bg, borderRadius: "28px 28px 0 0", padding: "32px 24px 40px",
      }}>
        {step === "phone" && (
          <>
            <div style={{ fontFamily: "'Marcellus', serif", fontSize: 24, color: T.ink, marginBottom: 6 }}>Sign in</div>
            <div style={{ fontSize: 14, color: T.mute, marginBottom: 24 }}>Use the mobile number registered with your villa.</div>
            <Field label="Mobile number">
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ ...inputStyle, width: 72, textAlign: "center", color: T.mute }}>+91</div>
                <input style={inputStyle} inputMode="numeric" maxLength={10} placeholder="98XXXXXXXX"
                  value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
              </div>
            </Field>
            <Btn disabled={!validPhone} onClick={() => setStep("otp")}>Send code</Btn>
          </>
        )}
        {step === "otp" && (
          <>
            <div style={{ fontFamily: "'Marcellus', serif", fontSize: 24, color: T.ink, marginBottom: 6 }}>Verify</div>
            <div style={{ fontSize: 14, color: T.mute, marginBottom: 24 }}>Code sent to +91 {phone}. <span style={{ color: T.brass, fontWeight: 600 }}>Demo — enter any 4 digits.</span></div>
            <Field label="One-time code">
              <input style={{ ...inputStyle, letterSpacing: 12, textAlign: "center", fontSize: 22 }}
                inputMode="numeric" maxLength={4} placeholder="••••"
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Btn disabled={otp.length !== 4} onClick={() => setStep("details")}>Verify</Btn>
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={() => setStep("phone")} style={{ background: "none", border: "none", color: T.mute, fontSize: 13, cursor: "pointer" }}>Change number</button>
            </div>
          </>
        )}
        {step === "details" && (
          <>
            <div style={{ fontFamily: "'Marcellus', serif", fontSize: 24, color: T.ink, marginBottom: 6 }}>Welcome</div>
            <div style={{ fontSize: 14, color: T.mute, marginBottom: 24 }}>Tell us who you are — just this once.</div>
            <Field label="Your name">
              <input style={inputStyle} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="I am a">
              <div style={{ display: "flex", gap: 8 }}>
                {[["resident", "Villa resident"], ["admin", "Site manager"]].map(([k, l]) => (
                  <button key={k} onClick={() => setRole(k)} style={{
                    flex: 1, padding: "12px 8px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'Inter', system-ui, sans-serif",
                    border: `1.5px solid ${role === k ? T.green : T.line}`,
                    background: role === k ? T.greenSoft : "#FFF", color: role === k ? T.green : T.mute,
                  }}>{l}</button>
                ))}
              </div>
            </Field>
            {role === "resident" && (
              <Field label="Your villa">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {VILLAS.map((v) => (
                    <button key={v} onClick={() => setVilla(v)} style={{
                      padding: "12px 0", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer",
                      fontFamily: "'Inter', system-ui, sans-serif",
                      border: `1.5px solid ${villa === v ? T.brass : T.line}`,
                      background: villa === v ? T.brassSoft : "#FFF", color: villa === v ? T.brass : T.mute,
                    }}>{v}</button>
                  ))}
                </div>
              </Field>
            )}
            <Btn disabled={!name.trim() || (role === "resident" && !villa)}
              onClick={() => onDone({ phone, name: name.trim(), role, villa: role === "admin" ? "SITE" : villa })}>
              Enter The Enclave
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}

/* ── REPORT ISSUE ── */
function ReportIssue({ profile, onSubmit, onCancel }) {
  const [cat, setCat] = useState(null);
  const [desc, setDesc] = useState("");
  const [where, setWhere] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [villa, setVilla] = useState(profile.role === "admin" ? "S1" : profile.villa);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    await onSubmit({
      id: uid(), villa, category: cat, location: where.trim(), description: desc.trim(),
      priority, status: "open", by: profile.name, phone: profile.phone,
      createdAt: Date.now(),
      updates: [{ ts: Date.now(), text: "Issue reported", by: profile.name }],
    });
  };

  return (
    <div style={{ padding: "20px 20px 110px" }}>
      <div style={{ fontFamily: "'Marcellus', serif", fontSize: 26, color: T.ink, marginBottom: 4 }}>Report an issue</div>
      <div style={{ fontSize: 14, color: T.mute, marginBottom: 22 }}>The site manager is notified the moment you submit.</div>

      <Field label="What kind of issue?">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              padding: "12px 6px", borderRadius: 12, cursor: "pointer", textAlign: "center",
              fontFamily: "'Inter', system-ui, sans-serif",
              border: `1.5px solid ${cat === c.id ? T.green : T.line}`,
              background: cat === c.id ? T.greenSoft : "#FFF",
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: cat === c.id ? T.green : T.mute, lineHeight: 1.25 }}>{c.label}</div>
            </button>
          ))}
        </div>
      </Field>

      {profile.role === "admin" && (
        <Field label="Villa">
          <select style={inputStyle} value={villa} onChange={(e) => setVilla(e.target.value)}>
            {VILLAS.map((v) => <option key={v}>{v}</option>)}
            <option value="CLUB">Clubhouse</option>
          </select>
        </Field>
      )}

      <Field label="Where exactly?">
        <input style={inputStyle} placeholder="e.g. 2nd floor master bedroom, kids' room, terrace lounge"
          value={where} onChange={(e) => setWhere(e.target.value)} />
      </Field>

      <Field label="Describe the issue">
        <textarea style={{ ...inputStyle, minHeight: 96, resize: "vertical" }}
          placeholder="What's happening? Since when? Anything already tried?"
          value={desc} onChange={(e) => setDesc(e.target.value)} />
      </Field>

      <Field label="Priority">
        <div style={{ display: "flex", gap: 8 }}>
          {PRIORITIES.map((p) => (
            <button key={p} onClick={() => setPriority(p)} style={{
              flex: 1, padding: "11px 0", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Inter', system-ui, sans-serif",
              border: `1.5px solid ${priority === p ? (p === "Urgent" ? T.red : T.green) : T.line}`,
              background: priority === p ? (p === "Urgent" ? "#F7E6E0" : T.greenSoft) : "#FFF",
              color: priority === p ? (p === "Urgent" ? T.red : T.green) : T.mute,
            }}>{p}</button>
          ))}
        </div>
      </Field>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Btn variant="ghost" onClick={onCancel} style={{ flex: 1 }}>Cancel</Btn>
        <Btn disabled={!cat || !desc.trim() || saving} onClick={submit} style={{ flex: 2 }}>
          {saving ? "Submitting…" : "Submit issue"}
        </Btn>
      </div>
    </div>
  );
}

/* ── ISSUE CARD + DETAIL ── */
function IssueCard({ issue, onOpen }) {
  const st = STATUS[issue.status];
  const cat = CATEGORIES.find((c) => c.id === issue.category) || CATEGORIES[8];
  return (
    <div onClick={onOpen} style={{
      background: T.card, borderRadius: 16, padding: 16, marginBottom: 12, cursor: "pointer",
      border: `1px solid ${T.line}`, boxShadow: "0 1px 3px rgba(28,43,38,.05)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: T.greenSoft, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19,
          }}>{cat.icon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {cat.label}{issue.location ? ` · ${issue.location}` : ""}
            </div>
            <div style={{ fontSize: 12.5, color: T.mute, marginTop: 2 }}>
              Villa {issue.villa} · {fmtDate(issue.createdAt)}
            </div>
          </div>
        </div>
        <Chip color={st.color} bg={st.bg}>{st.label}</Chip>
      </div>
      <div style={{ fontSize: 13.5, color: "#42504A", marginTop: 10, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {issue.description}
      </div>
      {issue.priority === "Urgent" && issue.status !== "resolved" && (
        <div style={{ marginTop: 8 }}><Chip color={T.red} bg="#F7E6E0">Urgent</Chip></div>
      )}
    </div>
  );
}

function IssueDetail({ issue, profile, onBack, onUpdate }) {
  const [note, setNote] = useState("");
  const st = STATUS[issue.status];
  const cat = CATEGORIES.find((c) => c.id === issue.category) || CATEGORIES[8];
  const isAdmin = profile.role === "admin";

  const push = (status, text) => {
    const upd = { ...issue };
    if (status) upd.status = status;
    upd.updates = [...issue.updates, { ts: Date.now(), text, by: profile.name }];
    onUpdate(upd);
    setNote("");
  };

  return (
    <div style={{ padding: "20px 20px 110px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: T.green, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 16 }}>← All issues</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ fontFamily: "'Marcellus', serif", fontSize: 24, color: T.ink, lineHeight: 1.2 }}>
          {cat.icon} {cat.label}
        </div>
        <Chip color={st.color} bg={st.bg}>{st.label}</Chip>
      </div>
      <div style={{ fontSize: 13.5, color: T.mute, margin: "8px 0 18px" }}>
        Villa {issue.villa}{issue.location ? ` · ${issue.location}` : ""} · Reported by {issue.by} · {fmtDate(issue.createdAt)}
        {issue.priority === "Urgent" ? " · " : ""}{issue.priority === "Urgent" && <span style={{ color: T.red, fontWeight: 700 }}>Urgent</span>}
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16, fontSize: 14.5, lineHeight: 1.55, color: T.ink }}>
        {issue.description}
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: T.mute, margin: "24px 0 12px" }}>Timeline</div>
      <div style={{ borderLeft: `2px solid ${T.line}`, marginLeft: 7, paddingLeft: 18 }}>
        {[...issue.updates].reverse().map((u, i) => (
          <div key={i} style={{ position: "relative", marginBottom: 16 }}>
            <div style={{ position: "absolute", left: -24.5, top: 4, width: 11, height: 11, borderRadius: 6, background: i === 0 ? T.brass : T.line }} />
            <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.4 }}>{u.text}</div>
            <div style={{ fontSize: 12, color: T.mute, marginTop: 2 }}>{u.by} · {fmtDate(u.ts)}</div>
          </div>
        ))}
      </div>

      {isAdmin ? (
        <div style={{ marginTop: 20 }}>
          <Field label="Add an update">
            <input style={inputStyle} placeholder="e.g. Electrician visiting tomorrow 10 AM" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {note.trim() && <Btn variant="quiet" style={{ width: "auto", flex: 1 }} onClick={() => push(null, note.trim())}>Post note</Btn>}
            {issue.status === "open" && <Btn variant="brass" style={{ width: "auto", flex: 1 }} onClick={() => push("progress", note.trim() || "Work started")}>Start work</Btn>}
            {issue.status !== "resolved" && <Btn style={{ width: "auto", flex: 1 }} onClick={() => push("resolved", note.trim() || "Issue resolved")}>Mark resolved</Btn>}
            {issue.status === "resolved" && <Btn variant="ghost" style={{ width: "auto", flex: 1 }} onClick={() => push("open", "Reopened")}>Reopen</Btn>}
          </div>
        </div>
      ) : (
        issue.status === "resolved" && issue.villa === profile.villa && (
          <div style={{ marginTop: 20 }}>
            <Btn variant="ghost" onClick={() => push("open", "Reopened by resident — issue persists")}>Not fixed? Reopen</Btn>
          </div>
        )
      )}
    </div>
  );
}

/* ── HOME ── */
function Home({ profile, issues, announcements, checklist, go }) {
  const mine = profile.role === "admin" ? issues : issues.filter((i) => i.villa === profile.villa);
  const open = mine.filter((i) => i.status !== "resolved");
  const latest = announcements[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ padding: "24px 20px 110px" }}>
      <div style={{ fontSize: 12, letterSpacing: 2.5, color: T.brass, fontWeight: 700, marginBottom: 4 }}>THE ENCLAVE</div>
      <div style={{ fontFamily: "'Marcellus', serif", fontSize: 28, color: T.ink, lineHeight: 1.15 }}>
        {greet},<br />{profile.name.split(" ")[0]}
      </div>
      <div style={{ fontSize: 13.5, color: T.mute, marginTop: 6, marginBottom: 18 }}>
        {profile.role === "admin" ? "Site manager · all 8 villas & clubhouse" : `Villa ${profile.villa}`}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, padding: "18px 16px 14px", marginBottom: 16 }}>
        <VillaStrip mine={profile.role === "admin" ? null : profile.villa} />
      </div>

      <Btn variant="brass" onClick={() => go("report")} style={{ marginBottom: 12, fontSize: 16 }}>
        ＋ Report an issue
      </Btn>

      <div onClick={() => go("issues")} style={{
        background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16,
        display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: 12,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>
            {open.length === 0 ? "No open issues" : `${open.length} open issue${open.length > 1 ? "s" : ""}`}
          </div>
          <div style={{ fontSize: 12.5, color: T.mute, marginTop: 2 }}>
            {mine.length} total {profile.role === "admin" ? "across the site" : "for your villa"}
          </div>
        </div>
        <span style={{ color: T.green, fontSize: 20 }}>→</span>
      </div>

      {checklist.length > 0 && (() => {
        const next = [...checklist].sort((a, b) => a.nextDue - b.nextDue)[0];
        const d = dueInfo(next);
        const dueSoon = checklist.filter((t) => dueInfo(t).overdue || (t.nextDue - Date.now()) / DAY <= 7).length;
        return (
          <div onClick={() => go("upkeep")} style={{
            background: T.card, border: `1px solid ${d.overdue ? "#E7C4B8" : T.line}`, borderRadius: 16, padding: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: 12,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {next.icon} {next.title}
              </div>
              <div style={{ fontSize: 12.5, marginTop: 3 }}>
                <span style={{ color: d.color, fontWeight: 600 }}>{d.text}</span>
                <span style={{ color: T.mute }}>{dueSoon > 1 ? ` · ${dueSoon} tasks due this week` : " · Upkeep checklist"}</span>
              </div>
            </div>
            <span style={{ color: T.green, fontSize: 20, flexShrink: 0, marginLeft: 10 }}>→</span>
          </div>
        );
      })()}

      <div style={{ background: T.green, borderRadius: 16, padding: 18, color: "#EFEAE0", marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.7, marginBottom: 6 }}>ANNOUNCEMENT</div>
        {latest ? (
          <>
            <div style={{ fontFamily: "'Marcellus', serif", fontSize: 18, marginBottom: 4 }}>{latest.title}</div>
            <div style={{ fontSize: 13.5, opacity: 0.85, lineHeight: 1.5 }}>{latest.body}</div>
            <div style={{ fontSize: 11.5, opacity: 0.6, marginTop: 8 }}>{fmtDate(latest.ts)}</div>
          </>
        ) : (
          <div style={{ fontSize: 14, opacity: 0.8 }}>Nothing from the site office yet. Announcements will appear here.</div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[["🛂", "Visitor pass", "Coming soon"], ["🎾", "Book amenity", "Coming soon"]].map(([ic, t, s]) => (
          <div key={t} style={{ background: T.card, border: `1px dashed ${T.line}`, borderRadius: 16, padding: 14, opacity: 0.75 }}>
            <div style={{ fontSize: 20 }}>{ic}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginTop: 6 }}>{t}</div>
            <div style={{ fontSize: 11.5, color: T.brass, fontWeight: 600, marginTop: 2 }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── ISSUES LIST ── */
function Issues({ profile, issues, openDetail }) {
  const isAdmin = profile.role === "admin";
  const [scope, setScope] = useState(isAdmin ? "all" : "mine");
  const [filter, setFilter] = useState("active");

  let list = issues;
  if (scope === "mine" && !isAdmin) list = list.filter((i) => i.villa === profile.villa);
  if (filter === "active") list = list.filter((i) => i.status !== "resolved");
  if (filter === "resolved") list = list.filter((i) => i.status === "resolved");
  list = [...list].sort((a, b) => (a.priority === "Urgent" && a.status !== "resolved" ? -1 : 0) - (b.priority === "Urgent" && b.status !== "resolved" ? -1 : 0) || b.createdAt - a.createdAt);

  return (
    <div style={{ padding: "24px 20px 110px" }}>
      <div style={{ fontFamily: "'Marcellus', serif", fontSize: 26, color: T.ink, marginBottom: 16 }}>Issues</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {!isAdmin && [["mine", `Villa ${profile.villa}`], ["all", "Whole site"]].map(([k, l]) => (
          <button key={k} onClick={() => setScope(k)} style={{
            padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Inter', system-ui, sans-serif",
            border: `1.5px solid ${scope === k ? T.green : T.line}`,
            background: scope === k ? T.greenSoft : "#FFF", color: scope === k ? T.green : T.mute,
          }}>{l}</button>
        ))}
        <div style={{ width: 1, background: isAdmin ? "transparent" : T.line, margin: "4px 2px" }} />
        {[["active", "Active"], ["resolved", "Resolved"], ["everything", "All"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Inter', system-ui, sans-serif",
            border: `1.5px solid ${filter === k ? T.brass : T.line}`,
            background: filter === k ? T.brassSoft : "#FFF", color: filter === k ? T.brass : T.mute,
          }}>{l}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: T.mute }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>🌿</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>All quiet</div>
          <div style={{ fontSize: 13.5, marginTop: 4 }}>No issues here. Report one anytime from the home screen.</div>
        </div>
      ) : (
        list.map((i) => <IssueCard key={i.id} issue={i} onOpen={() => openDetail(i.id)} />)
      )}
    </div>
  );
}

/* ── MORE (announcements + profile + roadmap) ── */
function More({ profile, announcements, postAnnouncement, logout }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const isAdmin = profile.role === "admin";

  return (
    <div style={{ padding: "24px 20px 110px" }}>
      <div style={{ fontFamily: "'Marcellus', serif", fontSize: 26, color: T.ink, marginBottom: 16 }}>Community</div>

      {isAdmin && (
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: T.mute, marginBottom: 10 }}>Post an announcement</div>
          <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Title (e.g. Pool maintenance Friday)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical", marginBottom: 10 }} placeholder="Details for all residents…" value={body} onChange={(e) => setBody(e.target.value)} />
          <Btn disabled={!title.trim() || !body.trim()} onClick={() => { postAnnouncement({ id: uid(), title: title.trim(), body: body.trim(), ts: Date.now(), by: profile.name }); setTitle(""); setBody(""); }}>
            Publish to all villas
          </Btn>
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: T.mute, marginBottom: 10 }}>Announcements</div>
      {announcements.length === 0 ? (
        <div style={{ fontSize: 14, color: T.mute, marginBottom: 24 }}>Nothing posted yet.</div>
      ) : (
        announcements.map((a) => (
          <div key={a.id} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16, marginBottom: 10 }}>
            <div style={{ fontFamily: "'Marcellus', serif", fontSize: 17, color: T.ink }}>{a.title}</div>
            <div style={{ fontSize: 13.5, color: "#42504A", lineHeight: 1.5, marginTop: 4 }}>{a.body}</div>
            <div style={{ fontSize: 11.5, color: T.mute, marginTop: 8 }}>{a.by} · {fmtDate(a.ts)}</div>
          </div>
        ))
      )}

      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: T.mute, margin: "24px 0 10px" }}>On the roadmap</div>
      {[["🛂", "Visitor authorization", "Pre-approve guests & deliveries at the gate"],
        ["🎾", "Amenity booking", "Reserve the pool, court & party lawn"],
        ["👥", "Staff management", "Attendance & access for household staff"],
        ["💳", "Maintenance dues", "Bills, receipts & community fund"]].map(([ic, t, d]) => (
        <div key={t} style={{ display: "flex", gap: 12, alignItems: "center", background: T.card, border: `1px dashed ${T.line}`, borderRadius: 14, padding: "12px 14px", marginBottom: 8, opacity: 0.8 }}>
          <div style={{ fontSize: 20 }}>{ic}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{t}</div>
            <div style={{ fontSize: 12, color: T.mute }}>{d}</div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 28, background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>{profile.name}</div>
        <div style={{ fontSize: 13, color: T.mute, marginTop: 2 }}>
          +91 {profile.phone} · {isAdmin ? "Site manager" : `Villa ${profile.villa}`}
        </div>
        <div style={{ marginTop: 14 }}>
          <Btn variant="ghost" onClick={logout}>Sign out</Btn>
        </div>
      </div>
    </div>
  );
}

/* ── UPKEEP: scheduled maintenance checklists ── */
function Upkeep({ profile, tasks, saveTasks, showToast }) {
  const [mode, setMode] = useState("list"); // list | add | custom
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("🔧");
  const [freq, setFreq] = useState("monthly");
  const [firstDue, setFirstDue] = useState("");

  const addTask = (t) => {
    const next = [...tasks, t].sort((a, b) => a.nextDue - b.nextDue);
    saveTasks(next);
  };
  const addPreset = (p) => {
    if (tasks.some((t) => t.title === p.title)) { showToast("Already on your checklist"); return; }
    addTask({ id: uid(), title: p.title, icon: p.icon, freq: p.freq, nextDue: Date.now() + freqDays(p.freq) * DAY, lastDone: null, history: [], preset: true });
    showToast(`Added — first due ${freqLabel(p.freq).toLowerCase()} from today`);
  };
  const addCustom = () => {
    const due = firstDue ? new Date(firstDue + "T09:00:00").getTime() : Date.now() + freqDays(freq) * DAY;
    addTask({ id: uid(), title: title.trim(), icon, freq, nextDue: due, lastDone: null, history: [] });
    setTitle(""); setFirstDue(""); setMode("list");
    showToast("Added to your checklist");
  };
  const markDone = (task) => {
    const now = Date.now();
    const next = tasks.map((t) => t.id === task.id
      ? { ...t, lastDone: now, nextDue: now + freqDays(t.freq) * DAY, history: [...(t.history || []), now].slice(-12) }
      : t).sort((a, b) => a.nextDue - b.nextDue);
    saveTasks(next);
    showToast(`Done ✓ Next due ${new Date(now + freqDays(task.freq) * DAY).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`);
  };
  const removeTask = (task) => saveTasks(tasks.filter((t) => t.id !== task.id));

  const overdue = tasks.filter((t) => dueInfo(t).overdue);

  if (mode === "add") return (
    <div style={{ padding: "24px 20px 110px" }}>
      <button onClick={() => setMode("list")} style={{ background: "none", border: "none", color: T.green, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 16 }}>← My checklist</button>
      <div style={{ fontFamily: "'Marcellus', serif", fontSize: 26, color: T.ink, marginBottom: 4 }}>Add from library</div>
      <div style={{ fontSize: 14, color: T.mute, marginBottom: 20 }}>Recommended upkeep for a villa like yours. Tap to add — you can adjust anytime.</div>
      {PRESETS.map((g) => (
        <div key={g.group} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: T.mute, marginBottom: 8 }}>{g.group}</div>
          {g.items.map((p) => {
            const added = tasks.some((t) => t.title === p.title);
            return (
              <div key={p.title} style={{ display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: "12px 14px", marginBottom: 8, opacity: added ? 0.55 : 1 }}>
                <div style={{ fontSize: 20 }}>{p.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: T.mute, marginTop: 1 }}>{freqLabel(p.freq)}</div>
                </div>
                <button onClick={() => addPreset(p)} disabled={added} style={{
                  border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: added ? "default" : "pointer",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  background: added ? T.greenSoft : T.green, color: added ? T.green : "#F7F5EE",
                }}>{added ? "✓" : "Add"}</button>
              </div>
            );
          })}
        </div>
      ))}
      <Btn variant="ghost" onClick={() => setMode("custom")}>＋ Create my own schedule</Btn>
    </div>
  );

  if (mode === "custom") return (
    <div style={{ padding: "24px 20px 110px" }}>
      <button onClick={() => setMode("add")} style={{ background: "none", border: "none", color: T.green, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 16 }}>← Library</button>
      <div style={{ fontFamily: "'Marcellus', serif", fontSize: 26, color: T.ink, marginBottom: 4 }}>Custom schedule</div>
      <div style={{ fontSize: 14, color: T.mute, marginBottom: 20 }}>Anything you want reminded about, on your own rhythm.</div>
      <Field label="What needs doing?">
        <input style={inputStyle} placeholder="e.g. Aquarium cleaning, car service, temple flowers" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Icon">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["🔧", "🧹", "🌿", "🚗", "🐠", "🪔", "🧺", "💊", "📦", "✨"].map((e) => (
            <button key={e} onClick={() => setIcon(e)} style={{
              width: 44, height: 44, borderRadius: 12, fontSize: 20, cursor: "pointer",
              border: `1.5px solid ${icon === e ? T.brass : T.line}`, background: icon === e ? T.brassSoft : "#FFF",
            }}>{e}</button>
          ))}
        </div>
      </Field>
      <Field label="How often?">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {FREQS.map((f) => (
            <button key={f.id} onClick={() => setFreq(f.id)} style={{
              padding: "11px 8px", borderRadius: 12, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Inter', system-ui, sans-serif",
              border: `1.5px solid ${freq === f.id ? T.green : T.line}`,
              background: freq === f.id ? T.greenSoft : "#FFF", color: freq === f.id ? T.green : T.mute,
            }}>{f.label}</button>
          ))}
        </div>
      </Field>
      <Field label="First due date (optional)">
        <input type="date" style={inputStyle} value={firstDue} onChange={(e) => setFirstDue(e.target.value)} />
      </Field>
      <Btn disabled={!title.trim()} onClick={addCustom}>Add to my checklist</Btn>
    </div>
  );

  return (
    <div style={{ padding: "24px 20px 110px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontFamily: "'Marcellus', serif", fontSize: 26, color: T.ink }}>Upkeep</div>
        <button onClick={() => setMode("add")} style={{
          border: "none", borderRadius: 20, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          fontFamily: "'Inter', system-ui, sans-serif", background: T.brass, color: "#FFF",
        }}>＋ Add</button>
      </div>
      <div style={{ fontSize: 14, color: T.mute, marginBottom: 18 }}>
        {profile.role === "admin" ? "Your site & clubhouse maintenance schedule." : `Scheduled care for Villa ${profile.villa} — personal to you.`}
      </div>

      {overdue.length > 0 && (
        <div style={{ background: "#F7E6E0", border: `1px solid #E7C4B8`, borderRadius: 14, padding: "12px 14px", marginBottom: 14, fontSize: 13.5, color: T.red, fontWeight: 600 }}>
          {overdue.length} task{overdue.length > 1 ? "s" : ""} overdue — worth scheduling this week.
        </div>
      )}

      {tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: T.mute }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>🗓️</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>No schedules yet</div>
          <div style={{ fontSize: 13.5, margin: "6px 0 20px" }}>Start with our recommended villa upkeep, or build your own.</div>
          <Btn onClick={() => setMode("add")}>Browse the upkeep library</Btn>
        </div>
      ) : (
        tasks.map((t) => {
          const d = dueInfo(t);
          return (
            <div key={t.id} style={{ background: T.card, border: `1px solid ${d.overdue ? "#E7C4B8" : T.line}`, borderRadius: 16, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: T.greenSoft, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>{t.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: T.ink, lineHeight: 1.3 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: T.mute, marginTop: 3 }}>
                    {freqLabel(t.freq)}{t.lastDone ? ` · Last done ${new Date(t.lastDone).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : " · Not done yet"}
                  </div>
                  <div style={{ marginTop: 8 }}><Chip color={d.color} bg={d.bg}>{d.text}</Chip></div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => markDone(t)} style={{
                  flex: 1, border: "none", borderRadius: 10, padding: "10px 0", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Inter', system-ui, sans-serif", background: T.green, color: "#F7F5EE",
                }}>✓ Mark done</button>
                <button onClick={() => removeTask(t)} style={{
                  border: `1.5px solid ${T.line}`, borderRadius: 10, padding: "10px 14px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Inter', system-ui, sans-serif", background: "#FFF", color: T.mute,
                }}>Remove</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ── SHELL ── */
export default function App() {
  const [profile, setProfile] = useState(undefined); // undefined = loading
  const [tab, setTab] = useState("home");
  const [detailId, setDetailId] = useState(null);
  const [issues, setIssues] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(async () => {
    const [iss, ann] = await Promise.all([
      loadKey("enclave-issues", true),
      loadKey("enclave-announcements", true),
    ]);
    setIssues(iss || []);
    setAnnouncements(ann || []);
  }, []);

  useEffect(() => {
    (async () => {
      const p = await loadKey("enclave-profile");
      setProfile(p || null);
      const cl = await loadKey("enclave-checklist");
      setChecklist((cl || []).sort((a, b) => a.nextDue - b.nextDue));
      await refresh();
    })();
  }, [refresh]);

  const saveChecklist = async (next) => {
    setChecklist(next);
    await saveKey("enclave-checklist", next);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const login = async (p) => { setProfile(p); await saveKey("enclave-profile", p); };
  const logout = async () => {
    try { await window.storage.delete("enclave-profile"); } catch {}
    setProfile(null); setTab("home");
  };

  const addIssue = async (issue) => {
    const latest = (await loadKey("enclave-issues", true)) || [];
    const next = [issue, ...latest];
    setIssues(next);
    await saveKey("enclave-issues", next, true);
    setTab("issues");
    showToast("Issue submitted — the site manager has been notified");
  };
  const updateIssue = async (upd) => {
    const latest = (await loadKey("enclave-issues", true)) || [];
    const next = latest.map((i) => (i.id === upd.id ? upd : i));
    setIssues(next);
    await saveKey("enclave-issues", next, true);
  };
  const postAnnouncement = async (a) => {
    const latest = (await loadKey("enclave-announcements", true)) || [];
    const next = [a, ...latest];
    setAnnouncements(next);
    await saveKey("enclave-announcements", next, true);
    showToast("Announcement published to all villas");
  };

  if (profile === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: T.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'Marcellus', serif", color: "#EFEAE0", fontSize: 22, animation: "pulse 1.4s ease infinite" }}>The Enclave</div>
        <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
      </div>
    );
  }

  const detail = detailId ? issues.find((i) => i.id === detailId) : null;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      {!profile ? (
        <Login onDone={login} />
      ) : (
        <>
          {tab === "home" && <Home profile={profile} issues={issues} announcements={announcements} checklist={checklist} go={setTab} />}
          {tab === "report" && <ReportIssue profile={profile} onSubmit={addIssue} onCancel={() => setTab("home")} />}
          {tab === "issues" && !detail && <Issues profile={profile} issues={issues} openDetail={(id) => setDetailId(id)} />}
          {tab === "issues" && detail && <IssueDetail issue={detail} profile={profile} onBack={() => setDetailId(null)} onUpdate={updateIssue} />}
          {tab === "upkeep" && <Upkeep profile={profile} tasks={checklist} saveTasks={saveChecklist} showToast={showToast} />}
          {tab === "more" && <More profile={profile} announcements={announcements} postAnnouncement={postAnnouncement} logout={logout} />}

          {/* bottom nav */}
          <div style={{
            position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: "100%", maxWidth: 480, background: "#FFFFFFF2", backdropFilter: "blur(10px)",
            borderTop: `1px solid ${T.line}`, display: "flex", padding: "10px 8px calc(12px + env(safe-area-inset-bottom))",
          }}>
            {[["home", "⌂", "Home"], ["report", "＋", "Report"], ["issues", "☰", "Issues"], ["upkeep", "✓", "Upkeep"], ["more", "◎", "More"]].map(([k, ic, l]) => {
              const active = tab === k;
              return (
                <button key={k} onClick={() => { setTab(k); setDetailId(null); }} style={{
                  flex: 1, background: "none", border: "none", cursor: "pointer", padding: "4px 0",
                  color: active ? T.green : T.mute, fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  <div style={{ fontSize: 20, lineHeight: 1 }}>{ic}</div>
                  <div style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, marginTop: 3, letterSpacing: 0.3 }}>{l}</div>
                  {active && <div style={{ width: 16, height: 3, borderRadius: 2, background: T.brass, margin: "4px auto 0" }} />}
                </button>
              );
            })}
          </div>
        </>
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: 92, left: "50%", transform: "translateX(-50%)",
          background: T.ink, color: "#F2EEE2", fontSize: 13.5, fontWeight: 500,
          padding: "12px 18px", borderRadius: 12, maxWidth: 340, width: "calc(100% - 48px)",
          boxShadow: "0 6px 20px rgba(28,43,38,.25)", textAlign: "center", zIndex: 50,
        }}>{toast}</div>
      )}
    </div>
  );
}
