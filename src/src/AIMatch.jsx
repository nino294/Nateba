// AIMatch.jsx — AI Teacher Matching + Smart Search for Nateba
// Drop this file into src/ and import it in nateba.jsx
//
// Usage in nateba.jsx:
//   import AIMatch from "./AIMatch";
//   // In your Home component, add anywhere:
//   <AIMatch lang={lang} teachers={allTeachers} onSelect={openT} />

import { useState } from "react";

const C = {
  bg:"#FFFFFF", bg2:"#F0F8FF", card:"#FFFFFF",
  primary:"#1CB0F6", primaryLight:"#E0F4FF",
  accent:"#E9A520", accentLight:"#FFF3E0",
  text:"#1A1A1A", mid:"#3A3A3A", muted:"#777777",
  border:"#E0EEF7",
  red:"#FF4B4B",
  ok:"#58CC02",
  shadow:"0 2px 8px rgba(28,176,246,0.10)",
  shadowLg:"0 8px 40px rgba(0,0,0,0.14)",
  fb:"'Nunito',sans-serif",
  radius:"14px", radiusSm:"10px", radiusLg:"20px",
};

const CAT_COLORS = {
  school:"#4A90D9", music:"#A259FF", arts:"#FF6B6B",
  floristry:"#58CC02", fitness:"#FF7A00", dance:"#F759AB",
  cooking:"#FA8C16", tech:"#1CB0F6", photo:"#722ED1",
  languages:"#13C2C2", beauty:"#EB2F96", culture:"#D4380D",
  mind:"#7C3AED",
};

const LABELS = {
  en: {
    btn: "Find my perfect teacher ✦",
    title: "AI Teacher Matching",
    sub: "Tell us what you want and we'll find the best teachers for you",
    what: "What do you want to learn?",
    whatPh: "e.g. I want to learn piano, I'm a complete beginner",
    level: "Your level",
    levels: ["Complete beginner", "Some experience", "Intermediate", "Advanced"],
    hours: "Hours per week",
    hourOpts: ["1-2 hours", "3-4 hours", "5+ hours"],
    budget: "Budget per session (GEL)",
    budgetPh: "e.g. 40",
    mode: "How do you want to learn?",
    modes: ["Online", "In-person", "Both"],
    go: "Find my teachers",
    thinking: "Finding your perfect match...",
    results: "Your top matches",
    why: "Why this teacher",
    book: "Book trial",
    tryAgain: "Try again",
    close: "✕",
    error: "Something went wrong. Please try again.",
    placeholder_results: "No matches found. Try different criteria.",
  },
  ka: {
    btn: "იპოვე შენი მასწავლებელი ✦",
    title: "AI მასწავლებლის შერჩევა",
    sub: "გვიამბე რის სწავლა გინდა და ჩვენ შევარჩევთ საუკეთესო მასწავლებლებს",
    what: "რის სწავლა გინდა?",
    whatPh: "მაგ: მინდა ვისწავლო პიანო, სრული დამწყები ვარ",
    level: "შენი დონე",
    levels: ["სრული დამწყები", "გარკვეული გამოცდილება", "საშუალო დონე", "მოწინავე"],
    hours: "საათი კვირაში",
    hourOpts: ["1-2 საათი", "3-4 საათი", "5+ საათი"],
    budget: "ბიუჯეტი სესიაზე (GEL)",
    budgetPh: "მაგ: 40",
    mode: "სად გინდა სწავლა?",
    modes: ["ონლაინ", "ოფლაინ", "ორივე"],
    go: "მასწავლებლების პოვნა",
    thinking: "ვეძებ შენთვის საუკეთესო მასწავლებელს...",
    results: "შენთვის საუკეთესო მასწავლებლები",
    why: "რატომ ეს მასწავლებელი",
    book: "საცდელი გაკვეთილი",
    tryAgain: "სცადე ხელახლა",
    close: "✕",
    error: "შეცდომა. სცადე ხელახლა.",
    placeholder_results: "შედეგი ვერ მოიძებნა. სცადე სხვა კრიტერიუმები.",
  }
};

const Stars = ({ r, s = 13 }) => (
  <span style={{ display: "inline-flex", gap: 1 }}>
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{ color: i <= Math.round(r) ? "#FFD700" : "#E0E0E0", fontSize: s }}>★</span>
    ))}
  </span>
);

const Av = ({ initials, bg, size = 48 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.32, fontWeight: 900, fontFamily: C.fb, flexShrink: 0 }}>
    {initials}
  </div>
);

const PBtn = ({ children, onClick, full, disabled, loading, size = "md", variant = "accent" }) => {
  const bg = variant === "primary" ? C.primary : C.accent;
  const shadow = variant === "primary" ? "#0A9FE0" : "#D4941A";
  const pad = size === "sm" ? "9px 18px" : size === "lg" ? "16px 36px" : "13px 24px";
  const fz = size === "sm" ? 13 : size === "lg" ? 16 : 14;
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ background: disabled || loading ? "#CCCCCC" : bg, color: "#fff", border: "none", borderRadius: C.radiusLg, padding: pad, fontSize: fz, fontWeight: 900, fontFamily: C.fb, cursor: disabled || loading ? "not-allowed" : "pointer", width: full ? "100%" : "auto", transition: "all 0.15s", boxShadow: disabled || loading ? "none" : `0 4px 0 ${shadow}` }}
      onMouseEnter={e => { if (!disabled && !loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 0 ${shadow}`; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = disabled || loading ? "none" : `0 4px 0 ${shadow}`; }}>
      {loading ? "..." : children}
    </button>
  );
};

// ── Smart Search Bar ──────────────────────────────────────────
// Drop-in replacement for the regular search bar
// Uses Claude to find teachers even if keywords don't match exactly
export function SmartSearch({ lang, teachers, onSelect }) {
  const L = LABELS[lang] || LABELS.en;
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults(null);

    const teacherList = teachers.map(t => ({
      id: t.id,
      name: t.name,
      skill: t.skill,
      skillKa: t.ska,
      cat: t.cat,
      price: t.price,
      bio: t.bio,
      bioKa: t.bka,
      online: t.online,
      offline: t.offline,
      rating: t.rating,
    }));

    const prompt = `You are a teacher matching assistant for Nateba, a Georgian skills marketplace.

A student searched for: "${query}"

Here are all available teachers (JSON):
${JSON.stringify(teacherList, null, 2)}

Return a JSON array of the best matching teacher IDs (up to 5), ordered by relevance. The student may be writing in Georgian or English. Match by subject, style, keywords, or related concepts — not just exact keyword match.

Return ONLY valid JSON like this, nothing else:
{"matches": [1, 3, 7]}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const matchedIds = parsed.matches || [];
      const matched = matchedIds.map(id => teachers.find(t => t.id === id)).filter(Boolean);
      setResults(matched);
    } catch (e) {
      console.error(e);
      setError(L.error);
    }
    setLoading(false);
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setResults(null); }}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder={lang === "ka" ? "მინდა ვისწავლო გიტარა, ქართული მუსიკა..." : "I want to learn guitar, Georgian music..."}
            style={{ width: "100%", padding: "13px 16px 13px 44px", background: C.bg2, border: `2px solid ${C.border}`, borderRadius: C.radiusLg, fontSize: 14, fontFamily: C.fb, color: C.text, outline: "none", boxSizing: "border-box", fontWeight: 600 }}
            onFocus={e => e.target.style.borderColor = C.primary}
            onBlur={e => e.target.style.borderColor = C.border}
          />
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>
            {loading ? "⏳" : "✦"}
          </span>
        </div>
        <PBtn onClick={search} loading={loading} disabled={!query.trim()} variant="primary" size="md">
          {lang === "ka" ? "AI ძიება" : "AI Search"}
        </PBtn>
      </div>

      {error && (
        <div style={{ marginTop: 10, padding: "10px 14px", background: "#FFF0F0", borderRadius: C.radius, fontSize: 13, color: C.red, fontFamily: C.fb, fontWeight: 700 }}>
          {error}
        </div>
      )}

      {results !== null && results.length === 0 && (
        <div style={{ marginTop: 10, padding: "10px 14px", background: C.bg2, borderRadius: C.radius, fontSize: 13, color: C.muted, fontFamily: C.fb, fontWeight: 600 }}>
          {L.placeholder_results}
        </div>
      )}

      {results && results.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: C.primary, fontFamily: C.fb, fontWeight: 800, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.8px" }}>
            ✦ AI {lang === "ka" ? "შედეგები" : "Results"} — {results.length} {lang === "ka" ? "მასწავლებელი" : "teachers found"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map(tv => {
              const catColor = CAT_COLORS[tv.cat] || C.primary;
              return (
                <div key={tv.id} onClick={() => onSelect(tv)}
                  style={{ background: C.card, border: `2px solid ${C.border}`, borderRadius: C.radiusLg, padding: "14px 16px", cursor: "pointer", display: "flex", gap: 12, alignItems: "center", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = catColor; e.currentTarget.style.transform = "translateX(4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
                  <Av initials={tv.av} bg={catColor} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.text, fontFamily: C.fb }}>{tv.name}</div>
                    <div style={{ fontSize: 12, color: catColor, fontFamily: C.fb, fontWeight: 800 }}>{lang === "ka" ? tv.ska : tv.skill}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <Stars r={tv.rating} s={11} />
                      <span style={{ fontSize: 11, color: C.muted, fontFamily: C.fb }}>{tv.rating}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: C.text, fontFamily: C.fb }}>₾{tv.price}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: C.fb }}>{lang === "ka" ? "/ სესია" : "/ session"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Teacher Matching Modal ─────────────────────────────────
export default function AIMatch({ lang, teachers, onSelect }) {
  const L = LABELS[lang] || LABELS.en;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("form"); // form | loading | results
  const [form, setForm] = useState({ what: "", level: "", hours: "", budget: "", mode: "" });
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const valid = form.what && form.level && form.hours && form.budget && form.mode;

  const match = async () => {
    if (!valid) return;
    setStep("loading");
    setError("");

    const teacherList = teachers.map(t => ({
      id: t.id,
      name: t.name,
      skill: t.skill,
      skillKa: t.ska,
      cat: t.cat,
      price: t.price,
      trial: t.trial,
      bio: t.bio,
      bioKa: t.bka,
      online: t.online,
      offline: t.offline,
      rating: t.rating,
      reviews: t.reviews,
      speaks: t.speaks,
    }));

    const prompt = `You are an expert teacher matching assistant for Nateba, a Georgian skills marketplace.

A student is looking for a teacher with these requirements:
- What they want to learn: ${form.what}
- Their level: ${form.level}
- Hours per week available: ${form.hours}
- Budget per session: ₾${form.budget} GEL
- Preferred mode: ${form.mode}

Here are all available teachers (JSON):
${JSON.stringify(teacherList, null, 2)}

Pick the 3 best matching teachers. Consider:
1. Subject match (exact or related)
2. Price fit (within budget)
3. Mode match (online/offline)
4. Rating and reviews
5. Bio relevance to the student's goals

For each teacher, write a short 1-sentence explanation of why they're a good match. Be specific and personal.

Return ONLY valid JSON, nothing else:
{
  "matches": [
    {"id": 1, "reason": "Perfect for beginners — Nino specializes in exam prep and her ₾35 rate fits your budget."},
    {"id": 3, "reason": "..."},
    {"id": 7, "reason": "..."}
  ]
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const matches = parsed.matches || [];

      const enriched = matches.map(m => {
        const teacher = teachers.find(t => t.id === m.id);
        if (!teacher) return null;
        return { ...teacher, aiReason: m.reason };
      }).filter(Boolean);

      setResults(enriched);
      setStep("results");
    } catch (e) {
      console.error(e);
      setError(L.error);
      setStep("form");
    }
  };

  const reset = () => {
    setStep("form");
    setResults([]);
    setError("");
    setForm({ what: "", level: "", hours: "", budget: "", mode: "" });
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  return (
    <>
      {/* Floating trigger button */}
      <div
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: `linear-gradient(135deg, ${C.primary}, #0A9FE0)`,
          color: "#fff",
          borderRadius: C.radiusLg,
          padding: "14px 24px",
          fontSize: 15,
          fontWeight: 900,
          fontFamily: C.fb,
          cursor: "pointer",
          boxShadow: "0 4px 0 #0A9FE0, 0 8px 24px rgba(28,176,246,0.35)",
          transition: "all 0.15s",
          userSelect: "none",
          letterSpacing: "-0.2px",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 6px 0 #0A9FE0, 0 12px 32px rgba(28,176,246,0.4)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 0 #0A9FE0, 0 8px 24px rgba(28,176,246,0.35)"; }}
      >
        <span style={{ fontSize: 20 }}>🤖</span>
        {L.btn}
      </div>

      {/* Modal */}
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9995, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(8px)" }}>
          <div style={{ background: C.card, borderRadius: C.radiusLg, width: "100%", maxWidth: 500, boxShadow: C.shadowLg, border: `2px solid ${C.border}`, maxHeight: "92vh", overflowY: "auto" }}>

            {/* Header */}
            <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg, ${C.primary}, #0A9FE0)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.text, fontFamily: C.fb }}>{L.title}</div>
                </div>
                <div style={{ fontSize: 13, color: C.muted, fontFamily: C.fb, fontWeight: 600, paddingLeft: 46 }}>{L.sub}</div>
              </div>
              <button onClick={close} style={{ background: C.bg2, border: "none", borderRadius: C.radiusSm, width: 32, height: 32, fontSize: 16, cursor: "pointer", color: C.muted, fontWeight: 700, flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ padding: "20px 24px 24px" }}>

              {/* Loading state */}
              {step === "loading" && (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 16, animation: "spin 2s linear infinite", display: "inline-block" }}>🔍</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.text, fontFamily: C.fb, marginBottom: 8 }}>{L.thinking}</div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.primary, animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                  <style>{`
                    @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                  `}</style>
                </div>
              )}

              {/* Form */}
              {step === "form" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {error && (
                    <div style={{ padding: "10px 14px", background: "#FFF0F0", borderRadius: C.radius, fontSize: 13, color: C.red, fontFamily: C.fb, fontWeight: 700 }}>
                      ⚠️ {error}
                    </div>
                  )}

                  {/* What to learn */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: C.muted, fontFamily: C.fb, fontWeight: 700, marginBottom: 6 }}>{L.what}</label>
                    <textarea
                      value={form.what}
                      onChange={e => setForm(p => ({ ...p, what: e.target.value }))}
                      placeholder={L.whatPh}
                      rows={2}
                      style={{ width: "100%", padding: "12px 14px", background: C.bg2, border: `2px solid ${C.border}`, borderRadius: C.radius, fontSize: 14, fontFamily: C.fb, color: C.text, outline: "none", resize: "none", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = C.primary}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>

                  {/* Level */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: C.muted, fontFamily: C.fb, fontWeight: 700, marginBottom: 8 }}>{L.level}</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {L.levels.map(l => (
                        <button key={l} onClick={() => setForm(p => ({ ...p, level: l }))}
                          style={{ padding: "10px 12px", border: `2px solid ${form.level === l ? C.accent : C.border}`, borderRadius: C.radius, background: form.level === l ? C.accentLight : C.bg2, color: form.level === l ? C.accent : C.muted, fontSize: 12, fontFamily: C.fb, fontWeight: 800, cursor: "pointer", transition: "all 0.15s", textAlign: "center" }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hours + Budget */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: C.muted, fontFamily: C.fb, fontWeight: 700, marginBottom: 8 }}>{L.hours}</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {L.hourOpts.map(h => (
                          <button key={h} onClick={() => setForm(p => ({ ...p, hours: h }))}
                            style={{ padding: "9px 12px", border: `2px solid ${form.hours === h ? C.primary : C.border}`, borderRadius: C.radius, background: form.hours === h ? C.primaryLight : C.bg2, color: form.hours === h ? C.primary : C.muted, fontSize: 12, fontFamily: C.fb, fontWeight: 800, cursor: "pointer", transition: "all 0.15s" }}>
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: C.muted, fontFamily: C.fb, fontWeight: 700, marginBottom: 6 }}>{L.budget}</label>
                      <input
                        type="number"
                        value={form.budget}
                        onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
                        placeholder={L.budgetPh}
                        style={{ width: "100%", padding: "12px 14px", background: C.bg2, border: `2px solid ${C.border}`, borderRadius: C.radius, fontSize: 14, fontFamily: C.fb, color: C.text, outline: "none", boxSizing: "border-box" }}
                        onFocus={e => e.target.style.borderColor = C.primary}
                        onBlur={e => e.target.style.borderColor = C.border}
                      />
                    </div>
                  </div>

                  {/* Mode */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: C.muted, fontFamily: C.fb, fontWeight: 700, marginBottom: 8 }}>{L.mode}</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {L.modes.map((m, i) => {
                        const vals = ["online", "offline", "both"];
                        return (
                          <button key={m} onClick={() => setForm(p => ({ ...p, mode: vals[i] }))}
                            style={{ flex: 1, padding: "10px 8px", border: `2px solid ${form.mode === vals[i] ? C.ok : C.border}`, borderRadius: C.radius, background: form.mode === vals[i] ? C.ok + "15" : C.bg2, color: form.mode === vals[i] ? C.ok : C.muted, fontSize: 12, fontFamily: C.fb, fontWeight: 800, cursor: "pointer", transition: "all 0.15s" }}>
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <PBtn onClick={match} full disabled={!valid} size="lg" variant="primary">{L.go}</PBtn>
                </div>
              )}

              {/* Results */}
              {step === "results" && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: C.primary, fontFamily: C.fb, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 16 }}>
                    ✦ {L.results}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {results.length === 0 && (
                      <div style={{ textAlign: "center", padding: 24, color: C.muted, fontFamily: C.fb, fontSize: 14 }}>{L.placeholder_results}</div>
                    )}
                    {results.map((tv, idx) => {
                      const catColor = CAT_COLORS[tv.cat] || C.primary;
                      return (
                        <div key={tv.id} style={{ background: C.bg2, border: `2px solid ${C.border}`, borderRadius: C.radiusLg, overflow: "hidden", transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = catColor; e.currentTarget.style.boxShadow = `0 4px 16px ${catColor}22`; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
                          {/* Rank bar */}
                          <div style={{ height: 4, background: idx === 0 ? C.accent : idx === 1 ? C.primary : catColor }} />
                          <div style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                              <div style={{ position: "relative" }}>
                                <Av initials={tv.av} bg={catColor} size={48} />
                                {idx === 0 && (
                                  <div style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#fff", border: "2px solid #fff" }}>1</div>
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 15, fontWeight: 900, color: C.text, fontFamily: C.fb }}>{tv.name}</div>
                                <div style={{ fontSize: 12, color: catColor, fontFamily: C.fb, fontWeight: 800, marginBottom: 4 }}>{lang === "ka" ? tv.ska : tv.skill}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <Stars r={tv.rating} s={12} />
                                  <span style={{ fontSize: 11, color: C.muted, fontFamily: C.fb }}>{tv.rating} ({tv.reviews} {lang === "ka" ? "შეფ." : "reviews"})</span>
                                </div>
                              </div>
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div style={{ fontSize: 20, fontWeight: 900, color: C.text, fontFamily: C.fb }}>₾{tv.price}</div>
                                <div style={{ fontSize: 11, color: C.ok, fontFamily: C.fb, fontWeight: 700 }}>
                                  {lang === "ka" ? "საცდელი" : "Trial"} ₾{tv.trial}
                                </div>
                              </div>
                            </div>

                            {/* AI reason */}
                            <div style={{ background: C.primaryLight, borderRadius: C.radiusSm, padding: "8px 12px", marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
                              <span style={{ fontSize: 14, flexShrink: 0 }}>🤖</span>
                              <div style={{ fontSize: 12, color: C.mid, fontFamily: C.fb, fontWeight: 600, lineHeight: 1.6 }}>
                                <strong style={{ color: C.primary }}>{L.why}:</strong> {tv.aiReason}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                              <PBtn onClick={() => { close(); onSelect(tv); }} full size="sm">{L.book}</PBtn>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={reset}
                    style={{ marginTop: 16, width: "100%", padding: "11px", background: "none", border: `2px solid ${C.border}`, borderRadius: C.radiusLg, fontSize: 13, color: C.muted, fontFamily: C.fb, fontWeight: 800, cursor: "pointer" }}>
                    ← {L.tryAgain}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
