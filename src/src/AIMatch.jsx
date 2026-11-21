// AIMatch.jsx — AI teacher matching for Classeli
// The AI call runs on the server (/api/ai-match), so the API key is never exposed in the browser.
// If the AI is unavailable or finds nothing, a built-in keyword matcher is used instead,
// and the student is told honestly when there is no teacher for their subject yet.

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

// Words that point to a category, in English and Georgian (used by the fallback matcher)
const CAT_WORDS = {
  school:["math","maths","physics","chemistry","biology","history","exam","school","sat","national","მათემატ","ფიზიკ","ქიმი","ბიოლოგ","ისტორი","გამოცდ","სკოლ"],
  music:["music","piano","guitar","vocal","sing","voice","violin","drum","song","მუსიკ","პიანო","ფორტეპიანო","გიტარ","ვოკალ","სიმღერ","ვიოლინ","დასარტყ"],
  arts:["art","draw","paint","ceramic","pottery","design","illustrat","ხატვ","ხელოვნ","კერამიკ","დიზაინ"],
  floristry:["flower","florist","garden","bouquet","plant","ყვავილ","ფლორისტ","ბაღ","თაიგულ","მცენარ"],
  fitness:["fitness","yoga","gym","train","pilates","box","sport","run","ფიტნეს","იოგა","ვარჯიშ","პილატეს","კრივ","სპორტ"],
  dance:["dance","ballet","salsa","tango","hip hop","ცეკვ","ბალეტ","სალსა","ტანგო"],
  cooking:["cook","bake","chef","khinkali","khachapuri","pastry","wine","food","კულინარ","სამზარეულ","ხინკალ","ხაჭაპურ","ცომ","ღვინ","კერძ"],
  tech:["python","code","coding","program","javascript","react","ai","data","excel","marketing","web","პროგრამ","კოდ","მარკეტინგ","ტექნოლოგ"],
  photo:["photo","camera","video","film","lightroom","ფოტო","კამერ","ვიდეო","ფილმ"],
  languages:["english","german","french","spanish","russian","italian","turkish","chinese","japanese","korean","language","ielts","toefl","ინგლისურ","გერმანულ","ფრანგულ","ესპანურ","რუსულ","იტალიურ","თურქულ","ჩინურ","იაპონურ","ენა","ენის"],
  beauty:["makeup","nail","hair","skin","beauty","მაკიაჟ","ფრჩხილ","თმ","კან","სილამაზ"],
  culture:["georgian culture","polyphon","folk","supra","qvevri","ქართული კულტურ","მრავალხმიან","ხალხურ","სუფრ","ქვევრ"],
  mind:["chess","meditat","writing","memory","mindful","speaking","debate","ჭადრაკ","მედიტაც","წერ","მეხსიერ"],
};

const LABELS = {
  en: {
    btn: "Find my perfect teacher ✦",
    title: "AI Teacher Matching",
    sub: "Tell us what you want to learn and we'll find the best teachers for you",
    what: "What do you want to learn? *",
    whatPh: "e.g. I want to learn piano, I'm a complete beginner",
    level: "Your level",
    levels: ["Complete beginner", "Some experience", "Intermediate", "Advanced"],
    hours: "Hours per week",
    hourOpts: ["1-2 hours", "3-4 hours", "5+ hours"],
    budget: "Max budget per session (GEL)",
    budgetPh: "e.g. 40",
    mode: "How do you want to learn?",
    modes: ["Online", "In-person", "Both"],
    go: "Find my teachers",
    thinking: "Finding your perfect match...",
    results: "Your top matches",
    why: "Why this teacher",
    view: "View profile",
    tryAgain: "Search again",
    noneTitle: (w) => `We don't have a teacher for “${w}” yet`,
    noneSub: "New teachers join every week. Meanwhile, here are teachers you might like:",
    noneSubEmpty: "New teachers join every week — check back soon or browse all teachers.",
    browseAll: "Browse all teachers",
    overBudget: "Above your budget",
    sample: "Sample",
    trial: "Trial",
    reviews: "reviews",
  },
  ka: {
    btn: "იპოვე შენი მასწავლებელი ✦",
    title: "AI მასწავლებლის შერჩევა",
    sub: "გვითხარი რისი სწავლა გინდა და შევარჩევთ საუკეთესო მასწავლებლებს",
    what: "რისი სწავლა გინდა? *",
    whatPh: "მაგ: მინდა ვისწავლო პიანინო, სრული დამწყები ვარ",
    level: "შენი დონე",
    levels: ["სრული დამწყები", "გარკვეული გამოცდილება", "საშუალო დონე", "მოწინავე"],
    hours: "საათი კვირაში",
    hourOpts: ["1-2 საათი", "3-4 საათი", "5+ საათი"],
    budget: "მაქს. ბიუჯეტი სესიაზე (GEL)",
    budgetPh: "მაგ: 40",
    mode: "სად გინდა სწავლა?",
    modes: ["ონლაინ", "ოფლაინ", "ორივე"],
    go: "მასწავლებლების პოვნა",
    thinking: "ვეძებ შენთვის საუკეთესო მასწავლებელს...",
    results: "შენთვის საუკეთესო მასწავლებლები",
    why: "რატომ ეს მასწავლებელი",
    view: "პროფილის ნახვა",
    tryAgain: "ხელახლა ძიება",
    noneTitle: (w) => `„${w}“-ის მასწავლებელი ჯერ არ გვყავს`,
    noneSub: "ახალი მასწავლებლები ყოველ კვირა ემატებიან. მანამდე, შეიძლება მოგეწონოს:",
    noneSubEmpty: "ახალი მასწავლებლები ყოველ კვირა ემატებიან — მალე შემოიარე ან ნახე ყველა მასწავლებელი.",
    browseAll: "ყველა მასწავლებელი",
    overBudget: "ბიუჯეტზე ძვირი",
    sample: "ნიმუში",
    trial: "საცდელი",
    reviews: "შეფ.",
  },
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

// ── Matching logic ────────────────────────────────────────────
const norm = (s) => String(s || "").toLowerCase();
const STOP = new Set(["i","want","to","learn","a","an","the","and","or","for","my","me","im","i'm","am","complete","beginner","how","with","of","in","on","მინდა","ვისწავლო","სწავლა","და","ან","ვარ","სრული","დამწყები","მე"]);
const tokens = (s) => norm(s).replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(w => w.length > 1 && !STOP.has(w));

// How well does a teacher teach what the student asked for? (0 = not at all)
const subjectScore = (tv, what) => {
  const hay = norm([tv.skill, tv.ska, tv.bio, tv.bka].join(" "));
  const skillHay = norm([tv.skill, tv.ska].join(" "));
  let score = 0;
  for (const w of tokens(what)) {
    const stem = w.length > 5 ? w.slice(0, w.length - 2) : w; // crude stemming for Georgian endings
    if (skillHay.includes(stem)) score += 5;
    else if (hay.includes(stem)) score += 2;
  }
  const q = norm(what);
  for (const [cat, words] of Object.entries(CAT_WORDS)) {
    if (words.some(k => q.includes(k)) && tv.cat === cat) score += 1;
  }
  return score;
};
const modeOk = (tv, mode) => !mode || mode === "both" || (mode === "online" ? tv.online : tv.offline);
const budgetOk = (tv, budget) => !(budget > 0) || (tv.price || 0) <= budget;

const localReason = (tv, form, L, lang) => {
  const parts = [];
  if (lang === "ka") {
    parts.push(`ასწავლის: ${tv.ska || tv.skill}`);
    if (budgetOk(tv, +form.budget) && +form.budget > 0) parts.push(`₾${tv.price} — ბიუჯეტში ჯდება`);
    if (form.mode && form.mode !== "both" && modeOk(tv, form.mode)) parts.push(form.mode === "online" ? "ონლაინ" : "ოფლაინ");
    if (tv.rating) parts.push(`რეიტინგი ${tv.rating}`);
  } else {
    parts.push(`Teaches ${tv.skill || tv.ska}`);
    if (budgetOk(tv, +form.budget) && +form.budget > 0) parts.push(`₾${tv.price} fits your budget`);
    if (form.mode && form.mode !== "both" && modeOk(tv, form.mode)) parts.push(form.mode === "online" ? "teaches online" : "teaches in person");
    if (tv.rating) parts.push(`rated ${tv.rating}`);
  }
  return parts.join(" · ");
};

// Ranks teachers for the request. Returns { matches, alternatives }.
export const localMatch = (form, teachers, lang) => {
  const L = LABELS[lang] || LABELS.en;
  const budget = +form.budget;
  const scored = teachers.map(tv => {
    const s = subjectScore(tv, form.what);
    let total = s * 10;
    if (modeOk(tv, form.mode)) total += 3;
    if (budgetOk(tv, budget)) total += 3;
    total += (tv.rating || 0) / 2;
    if (tv.demo) total -= 2;
    return { tv, s, total };
  }).sort((a, b) => b.total - a.total);
  const matches = scored.filter(x => x.s > 0 && modeOk(x.tv, form.mode)).slice(0, 3)
    .map(x => ({ ...x.tv, aiReason: localReason(x.tv, form, L, lang) }));
  const alternatives = matches.length ? [] : scored.filter(x => modeOk(x.tv, form.mode)).slice(0, 3)
    .map(x => ({ ...x.tv, aiReason: localReason(x.tv, form, L, lang) }));
  return { matches, alternatives };
};

const askServer = async (form, teachers, lang) => {
  const res = await fetch("/api/ai-match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lang,
      request: form,
      teachers: teachers.map(t => ({ id: String(t.id), name: t.name, skill: t.skill, skillKa: t.ska, cat: t.cat, price: t.price, online: t.online, offline: t.offline, rating: t.rating, bio: t.bio || t.bka, speaks: t.speaks })),
    }),
  });
  if (!res.ok) throw new Error("AI unavailable");
  const data = await res.json();
  if (!data || !Array.isArray(data.matches)) throw new Error("Bad AI response");
  return data.matches;
};

// ── Smart search (optional, not on the page by default) ───────
export function SmartSearch({ lang, teachers, onSelect }) {
  const L = LABELS[lang] || LABELS.en;
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const form = { what: query };
    let found = [];
    try {
      const m = await askServer(form, teachers, lang);
      found = m.map(x => teachers.find(t => String(t.id) === String(x.id))).filter(Boolean);
    } catch (e) {
      found = localMatch(form, teachers, lang).matches;
    }
    setResults(found);
    setLoading(false);
  };
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 10 }}>
        <input value={query} onChange={e => { setQuery(e.target.value); setResults(null); }} onKeyDown={e => e.key === "Enter" && search()}
          placeholder={L.whatPh}
          style={{ flex: 1, padding: "13px 16px", background: C.bg2, border: `2px solid ${C.border}`, borderRadius: C.radiusLg, fontSize: 14, fontFamily: C.fb, color: C.text, outline: "none", fontWeight: 600 }} />
        <PBtn onClick={search} loading={loading} disabled={!query.trim()} variant="primary">{lang === "ka" ? "AI ძიება" : "AI Search"}</PBtn>
      </div>
      {results && results.length === 0 && <div style={{ marginTop: 10, fontSize: 13, color: C.muted, fontFamily: C.fb, fontWeight: 600 }}>{L.noneSubEmpty}</div>}
      {results && results.map(tv => (
        <div key={tv.id} onClick={() => onSelect(tv)} style={{ marginTop: 8, background: C.card, border: `2px solid ${C.border}`, borderRadius: C.radiusLg, padding: "12px 14px", cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}>
          <Av initials={tv.av} bg={CAT_COLORS[tv.cat] || C.primary} size={40} />
          <div style={{ flex: 1, fontFamily: C.fb }}><div style={{ fontWeight: 900, fontSize: 14 }}>{tv.name}</div><div style={{ fontSize: 12, color: CAT_COLORS[tv.cat] || C.primary, fontWeight: 800 }}>{lang === "ka" ? tv.ska : tv.skill}</div></div>
          <div style={{ fontWeight: 900, fontFamily: C.fb }}>₾{tv.price}</div>
        </div>
      ))}
    </div>
  );
}

// ── AI Teacher Matching Modal ─────────────────────────────────
export default function AIMatch({ lang, teachers, onSelect, onBrowse }) {
  const L = LABELS[lang] || LABELS.en;
  const isKa = lang === "ka";
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("form"); // form | loading | results
  const [form, setForm] = useState({ what: "", level: "", hours: "", budget: "", mode: "" });
  const [results, setResults] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [error, setError] = useState("");

  const valid = form.what.trim().length >= 2;

  const match = async () => {
    if (!valid) return;
    if (!teachers || teachers.length === 0) {
      setResults([]); setAlternatives([]); setStep("results"); return;
    }
    setStep("loading");
    setError("");
    const local = localMatch(form, teachers, lang);
    let finalMatches = null;
    try {
      const aiMatches = await askServer(form, teachers, lang);
      // Only keep IDs that really exist (compare as strings — DB ids may be numbers or UUIDs)
      const seen = new Set();
      finalMatches = aiMatches.map(m => {
        const tv = teachers.find(t => String(t.id) === String(m.id));
        if (!tv || seen.has(String(tv.id))) return null;
        seen.add(String(tv.id));
        return { ...tv, aiReason: m.reason || localReason(tv, form, L, lang) };
      }).filter(Boolean).slice(0, 3);
    } catch (e) {
      console.warn("AI match unavailable, using built-in matching:", e.message);
    }
    if (finalMatches && finalMatches.length) {
      setResults(finalMatches); setAlternatives([]);
    } else {
      // AI said "no match" or failed — fall back to keyword matching, then to honest alternatives
      setResults(local.matches);
      setAlternatives(local.matches.length ? [] : local.alternatives);
    }
    setStep("results");
  };

  const reset = () => {
    setStep("form");
    setResults([]);
    setAlternatives([]);
    setError("");
  };
  const close = () => { setOpen(false); reset(); };
  const pick = (tv) => { close(); onSelect(tv); };

  const ResultCard = (tv, idx, isAlt) => {
    const catColor = CAT_COLORS[tv.cat] || C.primary;
    const over = +form.budget > 0 && (tv.price || 0) > +form.budget;
    return (
      <div key={tv.id} style={{ background: C.bg2, border: `2px solid ${C.border}`, borderRadius: C.radiusLg, overflow: "hidden", transition: "all 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = catColor; e.currentTarget.style.boxShadow = `0 4px 16px ${catColor}22`; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
        {!isAlt && <div style={{ height: 4, background: idx === 0 ? C.accent : idx === 1 ? C.primary : catColor }} />}
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ position: "relative" }}>
              <Av initials={tv.av} bg={catColor} size={48} />
              {!isAlt && idx === 0 && (
                <div style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#fff", border: "2px solid #fff" }}>1</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: C.text, fontFamily: C.fb }}>{tv.name}{tv.demo && <span style={{ marginLeft: 6, fontSize: 10, color: "#AAAAAA", fontWeight: 800 }}>{L.sample}</span>}</div>
              <div style={{ fontSize: 12, color: catColor, fontFamily: C.fb, fontWeight: 800, marginBottom: 4 }}>{isKa ? tv.ska : tv.skill}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Stars r={tv.rating} s={12} />
                <span style={{ fontSize: 11, color: C.muted, fontFamily: C.fb }}>{tv.rating} ({tv.reviews || 0} {L.reviews})</span>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.text, fontFamily: C.fb }}>₾{tv.price}</div>
              {tv.trial ? <div style={{ fontSize: 11, color: C.ok, fontFamily: C.fb, fontWeight: 700 }}>{L.trial} ₾{tv.trial}</div> : null}
              {over && <div style={{ fontSize: 10, color: C.red, fontFamily: C.fb, fontWeight: 800 }}>{L.overBudget}</div>}
            </div>
          </div>
          {!isAlt && tv.aiReason && (
            <div style={{ background: C.primaryLight, borderRadius: C.radiusSm, padding: "8px 12px", marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>🤖</span>
              <div style={{ fontSize: 12, color: C.mid, fontFamily: C.fb, fontWeight: 600, lineHeight: 1.6 }}>
                <strong style={{ color: C.primary }}>{L.why}:</strong> {tv.aiReason}
              </div>
            </div>
          )}
          <PBtn onClick={() => pick(tv)} full size="sm">{L.view}</PBtn>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        role="button"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `linear-gradient(135deg, ${C.primary}, #0A9FE0)`, color: "#fff", borderRadius: C.radiusLg, padding: "14px 24px", fontSize: 15, fontWeight: 900, fontFamily: C.fb, cursor: "pointer", boxShadow: "0 4px 0 #0A9FE0, 0 8px 24px rgba(28,176,246,0.35)", transition: "all 0.15s", userSelect: "none", letterSpacing: "-0.2px" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 6px 0 #0A9FE0, 0 12px 32px rgba(28,176,246,0.4)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 0 #0A9FE0, 0 8px 24px rgba(28,176,246,0.35)"; }}
      >
        <span style={{ fontSize: 20 }}>🤖</span>
        {L.btn}
      </div>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9995, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(8px)", textAlign: "left" }}>
          <div style={{ background: C.card, borderRadius: C.radiusLg, width: "100%", maxWidth: 500, boxShadow: C.shadowLg, border: `2px solid ${C.border}`, maxHeight: "92vh", overflowY: "auto" }}>
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
              {step === "loading" && (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 16, animation: "aispin 2s linear infinite", display: "inline-block" }}>🔍</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.text, fontFamily: C.fb, marginBottom: 8 }}>{L.thinking}</div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.primary, animation: `aibounce 1s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                  <style>{`
                    @keyframes aibounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                    @keyframes aispin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                  `}</style>
                </div>
              )}

              {step === "form" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {error && (
                    <div style={{ padding: "10px 14px", background: "#FFF0F0", borderRadius: C.radius, fontSize: 13, color: C.red, fontFamily: C.fb, fontWeight: 700 }}>⚠️ {error}</div>
                  )}
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: C.muted, fontFamily: C.fb, fontWeight: 700, marginBottom: 6 }}>{L.what}</label>
                    <textarea value={form.what} onChange={e => setForm(p => ({ ...p, what: e.target.value }))} placeholder={L.whatPh} rows={2}
                      style={{ width: "100%", padding: "12px 14px", background: C.bg2, border: `2px solid ${C.border}`, borderRadius: C.radius, fontSize: 14, fontFamily: C.fb, color: C.text, outline: "none", resize: "none", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: C.muted, fontFamily: C.fb, fontWeight: 700, marginBottom: 8 }}>{L.level}</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {L.levels.map(l => (
                        <button key={l} onClick={() => setForm(p => ({ ...p, level: p.level === l ? "" : l }))}
                          style={{ padding: "10px 12px", border: `2px solid ${form.level === l ? C.accent : C.border}`, borderRadius: C.radius, background: form.level === l ? C.accentLight : C.bg2, color: form.level === l ? C.accent : C.muted, fontSize: 12, fontFamily: C.fb, fontWeight: 800, cursor: "pointer", transition: "all 0.15s", textAlign: "center" }}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: C.muted, fontFamily: C.fb, fontWeight: 700, marginBottom: 8 }}>{L.hours}</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {L.hourOpts.map(h => (
                          <button key={h} onClick={() => setForm(p => ({ ...p, hours: p.hours === h ? "" : h }))}
                            style={{ padding: "9px 12px", border: `2px solid ${form.hours === h ? C.primary : C.border}`, borderRadius: C.radius, background: form.hours === h ? C.primaryLight : C.bg2, color: form.hours === h ? C.primary : C.muted, fontSize: 12, fontFamily: C.fb, fontWeight: 800, cursor: "pointer", transition: "all 0.15s" }}>{h}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: C.muted, fontFamily: C.fb, fontWeight: 700, marginBottom: 6 }}>{L.budget}</label>
                      <input type="number" min="0" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value.replace(/[^\d]/g, "") }))} placeholder={L.budgetPh}
                        style={{ width: "100%", padding: "12px 14px", background: C.bg2, border: `2px solid ${C.border}`, borderRadius: C.radius, fontSize: 14, fontFamily: C.fb, color: C.text, outline: "none", boxSizing: "border-box" }}
                        onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: C.muted, fontFamily: C.fb, fontWeight: 700, marginBottom: 8 }}>{L.mode}</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {L.modes.map((m, i) => {
                        const v = ["online", "offline", "both"][i];
                        return (
                          <button key={m} onClick={() => setForm(p => ({ ...p, mode: p.mode === v ? "" : v }))}
                            style={{ flex: 1, padding: "10px 8px", border: `2px solid ${form.mode === v ? C.ok : C.border}`, borderRadius: C.radius, background: form.mode === v ? C.ok + "15" : C.bg2, color: form.mode === v ? C.ok : C.muted, fontSize: 12, fontFamily: C.fb, fontWeight: 800, cursor: "pointer", transition: "all 0.15s" }}>{m}</button>
                        );
                      })}
                    </div>
                  </div>
                  <PBtn onClick={match} full disabled={!valid} size="lg" variant="primary">{L.go}</PBtn>
                </div>
              )}

              {step === "results" && (
                <div>
                  {results.length > 0 ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 900, color: C.primary, fontFamily: C.fb, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 16 }}>✦ {L.results}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {results.map((tv, idx) => ResultCard(tv, idx, false))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>🔎</div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: C.text, fontFamily: C.fb, marginBottom: 6 }}>{L.noneTitle(form.what.trim().slice(0, 60))}</div>
                        <div style={{ fontSize: 13, color: C.muted, fontFamily: C.fb, fontWeight: 600, lineHeight: 1.6 }}>{alternatives.length ? L.noneSub : L.noneSubEmpty}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {alternatives.map((tv, idx) => ResultCard(tv, idx, true))}
                      </div>
                    </>
                  )}
                  <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button onClick={reset}
                      style={{ flex: 1, padding: "11px", background: "none", border: `2px solid ${C.border}`, borderRadius: C.radiusLg, fontSize: 13, color: C.muted, fontFamily: C.fb, fontWeight: 800, cursor: "pointer" }}>← {L.tryAgain}</button>
                    {onBrowse && <button onClick={() => { close(); onBrowse(); }}
                      style={{ flex: 1, padding: "11px", background: C.primaryLight, border: `2px solid ${C.primary}33`, borderRadius: C.radiusLg, fontSize: 13, color: C.primary, fontFamily: C.fb, fontWeight: 800, cursor: "pointer" }}>{L.browseAll}</button>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
