import React, { useEffect, useMemo, useRef, useState } from "react";
import qrcode from "qrcode-generator";
import confetti from "canvas-confetti";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Copy, Instagram, Landmark, Lock,
  Menu, Minus, Plus, ShieldCheck, Sparkles, Ticket, X, Clock, Volume2, Trees,
  UtensilsCrossed, Wine, Sunrise, PartyPopper, Hourglass,
} from "lucide-react";

/* ================================================================== */
/*  CONFIG: modifica qui                                               */
/* ================================================================== */

const PARTY = {
  doors: "21:00",
  minAge: 18,
  contacts: ["niccolo.burrini", "chrisucksz"],
  releases: [
    { name: "Prima release", price: 30, status: "attiva" },
    { name: "Seconda release", price: 50, status: "prossima" },
  ],
  maxPerBooking: 8,
};

// ⚠️ Dati del bonifico: SOSTITUIRE con quelli veri prima di pubblicare
const BANK = {
  iban: "IT00X0000000000000000000000",
  holder: "Nome Cognome intestatario",
  bank: "Nome banca",
  isPlaceholder: true, // metti false quando hai inserito i dati veri
};

// Endpoint del database (thread "QR code entry system").
// Finché è null le prenotazioni restano solo sul telefono di chi prenota.
const API_URL = null;

/* ================================================================== */

const TARGET = new Date("2027-01-01T00:00:00+01:00").getTime();
const ACTIVE = PARTY.releases.find((r) => r.status === "attiva") ?? PARTY.releases[0];
const STORE_KEY = "c27-booking";
const euro = (n) => `${n}€`;
const pad = (n) => String(n).padStart(2, "0");
const ig = (h) => `https://instagram.com/${h}`;
const fmtIban = (s) => s.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function makeCode() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const r = (window.crypto?.getRandomValues?.(new Uint32Array(4))) ?? [0, 0, 0, 0].map(() => Math.random() * 1e9);
  for (let i = 0; i < 4; i++) s += a[r[i] % a.length];
  return `C27-${s}`;
}

/**
 * Consegna la prenotazione al database del check-in.
 * Forma dei dati concordata con il sistema QR:
 * { code, createdAt, release, unitPrice, amount, causale, status: "pending_payment",
 *   payer: { instagram, email, trn }, guests: [{ ticketId, firstName, lastName }] }
 * Il QR di ogni ospite contiene solo il suo ticketId.
 */
async function submitBooking(booking) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(booking)); } catch {}
  if (!API_URL) return { ok: true, local: true };
  const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(booking) });
  return { ok: res.ok };
}

function loadBooking() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch { return null; }
}

function burst() {
  if (reduceMotion()) return;
  const colors = ["#E2B866", "#FF4D8D", "#8B6CFF", "#ffffff"];
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors }), 200);
  setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors }), 350);
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

function useCountdown(target) {
  const calc = () => {
    const diff = Math.max(0, target - Date.now());
    return { done: diff === 0, d: Math.floor(diff / 864e5), h: Math.floor((diff / 36e5) % 24), m: Math.floor((diff / 6e4) % 60), s: Math.floor((diff / 1e3) % 60) };
  };
  const [t, setT] = useState(calc);
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, [target]);
  return t;
}

function useCopy() {
  const [copied, setCopied] = useState(null);
  const copy = async (key, text, fallbackEl) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1800); }
    catch {
      if (fallbackEl) { const r = document.createRange(); r.selectNodeContents(fallbackEl); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
    }
  };
  return [copied, copy];
}

/* ------------------------------------------------------------------ */
/*  Stili                                                              */
/* ------------------------------------------------------------------ */

const BTN = "group inline-flex items-center justify-center gap-2 rounded-full bg-gold-300 px-7 py-4 text-[15px] font-bold text-ink-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40";
const BTN_LINE = "inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-[15px] font-semibold text-white transition hover:border-white/60 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300";
const LABEL = "font-mono text-[11px] uppercase tracking-[0.22em] text-white/45";
const H2 = "font-display text-[2.4rem] font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-7xl";
const INPUT = "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:border-gold-300/70 focus:outline-none focus:ring-2 focus:ring-gold-300/25";

/* ------------------------------------------------------------------ */
/*  Pezzi grafici                                                      */
/* ------------------------------------------------------------------ */

function Marquee({ items, reverse, className = "" }) {
  const row = [...items, ...items];
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-hidden="true">
      <div className={`marquee inline-flex ${reverse ? "marquee-rev" : ""}`}>
        {[0, 1].map((k) => (
          <span key={k} className="flex shrink-0 items-center">
            {row.map((t, i) => <span key={i} className="flex items-center gap-6 px-6 font-display text-sm font-bold uppercase tracking-wide sm:text-base">{t}<Sparkles size={14} /></span>)}
          </span>
        ))}
      </div>
    </div>
  );
}

function QR({ value, size = 140, locked }) {
  const svg = useMemo(() => {
    const q = qrcode(0, "M"); q.addData(value); q.make();
    return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }, [value]);
  return (
    <div className="relative overflow-hidden rounded-xl bg-white p-1" style={{ width: size, height: size }}>
      <div className={`h-full w-full [&_svg]:h-full [&_svg]:w-full ${locked ? "scale-105 blur-[6px]" : ""}`} dangerouslySetInnerHTML={{ __html: svg }} />
      {locked && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="flex items-center gap-1 rounded-full bg-ink-950 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-gold-200"><Lock size={11} /> In verifica</span>
        </div>
      )}
    </div>
  );
}

// Biglietto olografico che segue il dito / mouse
function HoloTicket() {
  const ref = useRef(null);
  const move = (e) => {
    const el = ref.current; if (!el || reduceMotion()) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) - 0.5, y = ((e.clientY - r.top) / r.height) - 0.5;
    el.style.setProperty("--rx", `${(-y * 16).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 20).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
    el.classList.add("is-active");
  };
  const leave = () => { const el = ref.current; if (!el) return; el.classList.remove("is-active"); ["--rx", "--ry"].forEach((p) => el.style.setProperty(p, "0deg")); };
  return (
    <div className="holo-wrap mx-auto w-[84%] max-w-[360px]" onPointerMove={move} onPointerLeave={leave} aria-hidden="true">
      <div ref={ref} className="holo relative overflow-hidden rounded-[28px] border border-white/20 p-6 text-white">
        <div className="holo-foil pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em]">
            <span className="text-white/70">Admit one · lista nominale</span>
            <span className="rounded-full border border-white/40 px-2 py-0.5">{PARTY.minAge}+</span>
          </div>
          <p className="mt-10 font-display text-[3.2rem] font-black uppercase leading-[0.85] tracking-tight">Capo<br />danno</p>
          <p className="stroke-text font-display text-[4.2rem] font-black leading-[0.9]">2027</p>
          <div className="mt-6 grid grid-cols-2 gap-3 font-mono text-[11px]">
            <div><p className="text-white/50">DATA</p><p className="font-medium">31.12.26</p></div>
            <div><p className="text-white/50">PORTE</p><p className="font-medium">{PARTY.doors} → alba</p></div>
            <div className="col-span-2"><p className="text-white/50">DOVE</p><p className="font-medium">Villa in campagna · 📍 in privato</p></div>
          </div>
          <div className="mt-6 flex items-end justify-between border-t border-dashed border-white/30 pt-4">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">{ACTIVE.name}</p><p className="font-display text-4xl font-black">{euro(ACTIVE.price)}</p></div>
            <div className="rounded-lg bg-white p-1"><div className="h-14 w-14 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: (() => { const q = qrcode(0, "L"); q.addData("C27"); q.make(); return q.createSvgTag({ cellSize: 2, margin: 0, scalable: true }); })() }} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sezioni                                                            */
/* ------------------------------------------------------------------ */

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const links = [["Vibe", "#vibe"], ["La notte", "#notte"], ["Biglietti", "#biglietti"], ["FAQ", "#faq"]];
  return (
    <header className={`sticky top-[env(safe-area-inset-top,0px)] z-40 transition-colors ${scrolled || open ? "border-b border-white/10 bg-ink-950/80 backdrop-blur-xl" : ""}`}>
      <nav className="gutter mx-auto flex h-16 max-w-6xl items-center justify-between" aria-label="Principale">
        <a href="#top" className="font-display text-lg font-black uppercase tracking-tight text-white">C<span className="text-gold-300">/</span>27</a>
        <div className="hidden items-center gap-8 md:flex">
          {links.map(([l, h]) => <a key={h} href={h} className="text-sm font-medium text-white/70 transition hover:text-white">{l}</a>)}
          <a href="#biglietti" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-950 transition hover:bg-gold-300">Entra · {euro(ACTIVE.price)}</a>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white md:hidden" aria-label={open ? "Chiudi menu" : "Apri menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>
      {open && (
        <div className="gutter pb-6 md:hidden">
          {links.map(([l, h]) => <a key={h} href={h} onClick={() => setOpen(false)} className="block border-b border-white/5 py-3 font-display text-2xl font-extrabold uppercase text-white">{l}</a>)}
        </div>
      )}
    </header>
  );
}

function Hero() {
  const t = useCountdown(TARGET);
  const ref = useRef(null);
  const spot = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - r.left}px`);
    el.style.setProperty("--sy", `${e.clientY - r.top}px`);
  };
  return (
    <section id="top" ref={ref} onPointerMove={spot} className="spotlight relative overflow-hidden">
      <div aria-hidden="true" className="aurora pointer-events-none absolute inset-0" />
      <div className="gutter relative mx-auto grid max-w-6xl items-center gap-12 pb-14 pt-8 sm:pt-14 lg:grid-cols-[1.3fr_1fr] lg:pb-20">
        <div className="enter min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-hot px-3 py-1 font-mono text-[11px] font-bold tracking-widest text-white">OVER {PARTY.minAge}</span>
            <span className="rounded-full border border-white/20 px-3 py-1 font-mono text-[11px] tracking-widest text-white/80">31.12.2026</span>
            <span className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 font-mono text-[11px] tracking-widest text-white/80"><span className="live-dot" /> {ACTIVE.name.toUpperCase()} APERTA</span>
          </div>
          <h1 className="mt-6 font-display font-black uppercase leading-[0.82] tracking-tighter text-white">
            <span className="block text-[17vw] sm:text-[8.5rem] lg:text-[7.6rem]">Capo</span>
            <span className="block text-[17vw] sm:text-[8.5rem] lg:text-[7.6rem]">danno</span>
            <span className="gradient-text block text-[22vw] sm:text-[10rem] lg:text-[9.4rem]">2027</span>
          </h1>
          <p className="mt-6 max-w-md text-xl font-medium leading-snug text-white sm:text-2xl">Amici, amici di amici <span className="text-gold-200">e bella gente.</span></p>
          <p className="mt-3 max-w-md text-white/60">Una villa in campagna tutta per noi. Zero vicini, volume senza limiti, open bar e si va avanti fino all'alba.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#biglietti" className={BTN}><Ticket size={18} /> Prendi il posto · {euro(ACTIVE.price)} <ArrowRight size={18} className="transition group-hover:translate-x-1" /></a>
            <a href="#vibe" className={BTN_LINE}>Che si fa?</a>
          </div>
        </div>
        <div className="enter" style={{ animationDelay: "120ms" }}><HoloTicket /></div>
      </div>

      <div className="gutter relative mx-auto max-w-6xl pb-14">
        <p className={`${LABEL} mb-3`}>{t.done ? "È iniziato" : "Alla mezzanotte mancano"}</p>
        <div role="timer" aria-label={`Mancano ${t.d} giorni, ${t.h} ore, ${t.m} minuti`} className="grid grid-cols-4 gap-2 sm:gap-3">
          {[[t.d, "giorni"], [t.h, "ore"], [t.m, "min"], [t.s, "sec"]].map(([v, l]) => (
            <div key={l} className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-4 text-center backdrop-blur sm:py-6">
              <div key={v} className="tick font-display text-4xl font-black tabular-nums text-white sm:text-7xl">{l === "giorni" ? v : pad(v)}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 sm:text-xs">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Vibe() {
  return (
    <section id="vibe" className="gutter mx-auto max-w-6xl scroll-mt-20 py-20 sm:py-28">
      <p className={LABEL}>La location</p>
      <h2 className={`${H2} mt-3`}>Abbiamo preso <span className="gradient-text">una villa.</span></h2>
      <div className="bento mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="tile col-span-2 row-span-2 flex min-h-[260px] flex-col justify-between bg-gradient-to-br from-violet/40 via-ink-800 to-ink-900 lg:min-h-[380px]">
          <Trees size={28} className="text-gold-200" strokeWidth={1.5} />
          <div>
            <p className="font-display text-3xl font-black uppercase leading-none text-white sm:text-5xl">Villa in<br />campagna</p>
            <p className="mt-3 max-w-sm text-white/70">Tutto lo spazio per festeggiare fino all'alba. Le foto arrivano a breve.</p>
          </div>
        </div>
        <div className="tile flex flex-col justify-between bg-hot/90 text-white">
          <Volume2 size={24} />
          <div><p className="font-display text-5xl font-black leading-none">∞</p><p className="mt-1 text-sm font-semibold">limiti sul volume</p></div>
        </div>
        <div className="tile flex flex-col justify-between bg-gold-300 text-ink-950">
          <Sparkles size={24} />
          <div><p className="font-display text-5xl font-black leading-none">0</p><p className="mt-1 text-sm font-semibold">vicini da disturbare</p></div>
        </div>
        <div className="tile col-span-2 flex items-start gap-4 bg-ink-800">
          <Lock size={22} className="mt-1 shrink-0 text-gold-300" />
          <div>
            <p className="font-display text-xl font-extrabold uppercase text-white">Indirizzo segreto</p>
            <p className="mt-1 text-sm text-white/60">Lo mandiamo in privato solo a chi ha il posto confermato.</p>
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-3 sm:grid-cols-3 sm:gap-4" id="food">
        {[
          [UtensilsCrossed, "Cena", "Buffet completo, cotechino, lenticchie e pandoro."],
          [Wine, "Open bar", "Drink e alcol inclusi, analcolici e spumante a mezzanotte."],
          [PartyPopper, "Zero pensieri", "A bere e a mangiare ci pensiamo noi. Non portare niente."],
        ].map(([I, t, d]) => (
          <div key={t} className="tile bg-white/[0.03] ring-1 ring-white/10">
            <I size={24} className="text-gold-300" strokeWidth={1.6} />
            <h3 className="mt-6 font-display text-2xl font-extrabold uppercase text-white">{t}</h3>
            <p className="mt-2 text-white/60">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Night() {
  const steps = [
    ["21:00", "Si entra", "Solo chi è in lista, documento alla mano.", Clock],
    ["21:30", "Buffet", "Cotechino e lenticchie, come da tradizione.", UtensilsCrossed],
    ["00:00", "Mezzanotte", "Spumante per tutti e pandoro.", Sparkles],
    ["00:01", "Si balla", "Volume alto, open bar sempre aperto.", Volume2],
    ["Alba", "Fine (forse)", "Si chiude quando sorge il sole.", Sunrise],
  ];
  return (
    <section id="notte" className="scroll-mt-16 border-y border-white/10 bg-ink-900/60 py-20 sm:py-28">
      <div className="gutter mx-auto max-w-6xl">
        <p className={LABEL}>La notte</p>
        <h2 className={`${H2} mt-3`}>Dalle 21 <span className="gradient-text">all'alba.</span></h2>
      </div>
      <ol className="no-scrollbar gutter mx-auto mt-10 flex max-w-6xl snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-4">
        {steps.map(([time, t, d, I], i) => (
          <li key={time} className={`tile w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-[calc((100%-4rem)/5)] ${time === "00:00" ? "bg-gold-300 text-ink-950" : "bg-white/[0.04] text-white ring-1 ring-white/10"}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-medium">{time}</span>
              <I size={18} className={time === "00:00" ? "" : "text-gold-300"} />
            </div>
            <p className="mt-10 font-display text-2xl font-black uppercase leading-none">{t}</p>
            <p className={`mt-2 text-sm ${time === "00:00" ? "text-ink-950/70" : "text-white/55"}`}>{d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------ Prenotazione ------------------------------ */

function Stepper({ step }) {
  const labels = ["Chi viene", "Bonifico", "Conferma"];
  return (
    <ol className="flex items-center gap-2" aria-label="Passaggi">
      {labels.map((l, i) => (
        <li key={l} className="flex flex-1 flex-col gap-2" aria-current={step === i ? "step" : undefined}>
          <span className={`h-1 rounded-full transition-colors ${i <= step ? "bg-gold-300" : "bg-white/10"}`} />
          <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${i === step ? "text-white" : "text-white/40"}`}>{i + 1}. {l}</span>
        </li>
      ))}
    </ol>
  );
}

function CopyRow({ label, value, display, copied, onCopy, k }) {
  const ref = useRef(null);
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</p>
        <p ref={ref} className="mt-0.5 break-all font-mono text-[15px] font-medium text-white">{display ?? value}</p>
      </div>
      <button type="button" onClick={() => onCopy(k, value, ref.current)} aria-label={`Copia ${label}`}
        className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition ${copied === k ? "bg-gold-300 text-ink-950" : "bg-white/10 text-white hover:bg-white/20"}`}>
        {copied === k ? <><Check size={14} /> Copiato</> : <><Copy size={14} /> Copia</>}
      </button>
    </div>
  );
}

function Booking() {
  const [saved, setSaved] = useState(null);
  const [step, setStep] = useState(0);
  const [guests, setGuests] = useState([{ firstName: "", lastName: "" }]);
  const [payer, setPayer] = useState({ instagram: "", email: "", trn: "" });
  const [errors, setErrors] = useState({});
  const [paidCheck, setPaidCheck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [copied, copy] = useCopy();
  const topRef = useRef(null);

  useEffect(() => { setSaved(loadBooking()); setCode(makeCode()); }, []);

  const qty = guests.length;
  const amount = qty * ACTIVE.price;
  const surname = (guests[0]?.lastName || "").trim().replace(/[^\p{L}' -]/gu, "").slice(0, 30);
  const causale = `CAPODANNO27 ${code} ${surname}`.trim();
  const goTo = (s) => { setStep(s); topRef.current?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); };

  const validateGuests = () => {
    const e = {};
    guests.forEach((g, i) => {
      if (g.firstName.trim().length < 2) e[`f${i}`] = "Nome mancante";
      if (g.lastName.trim().length < 2) e[`l${i}`] = "Cognome mancante";
    });
    const h = payer.instagram.replace(/^@/, "").trim();
    if (!/^[a-zA-Z0-9._]{2,30}$/.test(h)) e.instagram = "Scrivi il tuo username Instagram, es. @mario.rossi";
    if (payer.email && !/^\S+@\S+\.\S+$/.test(payer.email)) e.email = "Email non valida";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const confirm = async () => {
    if (!paidCheck) return setErrors({ paid: "Spunta la casella dopo aver fatto il bonifico" });
    setBusy(true);
    const booking = {
      code, createdAt: new Date().toISOString(), release: ACTIVE.name, unitPrice: ACTIVE.price, amount, causale,
      status: "pending_payment",
      payer: { instagram: payer.instagram.replace(/^@/, "").trim(), email: payer.email.trim() || null, trn: payer.trn.trim() || null },
      guests: guests.map((g, i) => ({ ticketId: `${code}-${pad(i + 1)}`, firstName: g.firstName.trim(), lastName: g.lastName.trim() })),
    };
    try { await submitBooking(booking); setSaved(booking); burst(); topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }
    catch { setErrors({ paid: "Non siamo riusciti a salvare la prenotazione. Riprova o scrivici su Instagram." }); }
    finally { setBusy(false); }
  };

  const reset = () => {
    try { localStorage.removeItem(STORE_KEY); } catch {}
    setSaved(null); setStep(0); setGuests([{ firstName: "", lastName: "" }]); setPayer({ instagram: "", email: "", trn: "" }); setPaidCheck(false); setCode(makeCode());
  };

  return (
    <section id="biglietti" ref={topRef} className="gutter mx-auto max-w-6xl scroll-mt-20 py-20 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
        <div>
          <p className={LABEL}>Biglietti</p>
          <h2 className={`${H2} mt-3`}>Posti <span className="gradient-text">limitati.</span></h2>
          <p className="mt-5 max-w-md text-white/60">Si entra solo su lista nominale. Paghi con bonifico direttamente da qui, ognuno riceve il suo QR personale da mostrare all'ingresso.</p>
          <div className="mt-8 space-y-3">
            {PARTY.releases.map((r) => {
              const on = r.status === "attiva";
              return (
                <div key={r.name} className={`relative flex items-center justify-between overflow-hidden rounded-3xl px-6 py-5 ${on ? "bg-gold-300 text-ink-950" : "bg-white/[0.03] text-white/40 ring-1 ring-white/10"}`}>
                  <div>
                    <p className="font-display text-lg font-extrabold uppercase">{r.name}</p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em]">{on ? "● Aperta ora" : "Apre quando finisce la prima"}</p>
                  </div>
                  <p className={`font-display text-5xl font-black ${on ? "" : "line-through decoration-2"}`}>{euro(r.price)}</p>
                </div>
              );
            })}
          </div>
          <ul className="mt-8 space-y-2 text-sm text-white/60">
            <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-gold-300" /> Cena, open bar e spumante compresi</li>
            <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-gold-300" /> Un QR nominativo per ogni persona</li>
            <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-gold-300" /> Indirizzo inviato dopo la conferma</li>
          </ul>
        </div>

        <div className="min-w-0 rounded-[32px] border border-white/10 bg-ink-900/80 p-5 shadow-2xl sm:p-8">
          {saved ? <Tickets booking={saved} onReset={reset} /> : (
            <>
              <Stepper step={step} />

              {step === 0 && (
                <div className="mt-8">
                  <h3 className="font-display text-2xl font-extrabold uppercase text-white">Chi viene?</h3>
                  <p className="mt-1 text-sm text-white/50">Nome e cognome come sul documento: li controlliamo all'ingresso.</p>
                  <div className="mt-6 space-y-3">
                    {guests.map((g, i) => (
                      <div key={i} className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                        <div className="mb-2 flex items-center justify-between px-1">
                          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">Persona {i + 1}{i === 0 ? " · tu" : ""}</span>
                          {i > 0 && <button type="button" onClick={() => setGuests(guests.filter((_, j) => j !== i))} className="flex items-center gap-1 text-xs text-white/50 hover:text-white" aria-label={`Togli persona ${i + 1}`}><X size={14} /> Togli</button>}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {[["firstName", "Nome", "f"], ["lastName", "Cognome", "l"]].map(([k, ph, p]) => (
                            <div key={k}>
                              <label htmlFor={`g-${k}-${i}`} className="sr-only">{ph} persona {i + 1}</label>
                              <input id={`g-${k}-${i}`} value={g[k]} placeholder={ph} autoComplete={i === 0 ? (k === "firstName" ? "given-name" : "family-name") : "off"}
                                onChange={(e) => setGuests(guests.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))}
                                className={`${INPUT} ${errors[`${p}${i}`] ? "border-hot/70" : ""}`} aria-invalid={!!errors[`${p}${i}`]} />
                              {errors[`${p}${i}`] && <p className="mt-1 px-1 text-xs text-hot">{errors[`${p}${i}`]}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {qty < PARTY.maxPerBooking && (
                    <button type="button" onClick={() => setGuests([...guests, { firstName: "", lastName: "" }])} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-3.5 text-sm font-semibold text-white/80 transition hover:border-gold-300/60 hover:text-white">
                      <Plus size={16} /> Aggiungi un amico
                    </button>
                  )}

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="p-ig" className="mb-1.5 block px-1 text-xs text-white/50">Il tuo Instagram (ti scriviamo qui)</label>
                      <input id="p-ig" value={payer.instagram} onChange={(e) => setPayer({ ...payer, instagram: e.target.value })} placeholder="@username" autoCapitalize="none" className={`${INPUT} ${errors.instagram ? "border-hot/70" : ""}`} aria-invalid={!!errors.instagram} />
                      {errors.instagram && <p className="mt-1 px-1 text-xs text-hot">{errors.instagram}</p>}
                    </div>
                    <div>
                      <label htmlFor="p-email" className="mb-1.5 block px-1 text-xs text-white/50">Email (facoltativa)</label>
                      <input id="p-email" type="email" value={payer.email} onChange={(e) => setPayer({ ...payer, email: e.target.value })} placeholder="nome@email.it" className={`${INPUT} ${errors.email ? "border-hot/70" : ""}`} />
                      {errors.email && <p className="mt-1 px-1 text-xs text-hot">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/[0.04] px-5 py-4">
                    <span className="text-sm text-white/60">{qty} × {euro(ACTIVE.price)}</span>
                    <span className="font-display text-4xl font-black tabular-nums text-white">{euro(amount)}</span>
                  </div>
                  <button type="button" onClick={() => validateGuests() && goTo(1)} className={`${BTN} mt-4 w-full`}>Vai al pagamento <ArrowRight size={18} /></button>
                </div>
              )}

              {step === 1 && (
                <div className="mt-8">
                  <h3 className="font-display text-2xl font-extrabold uppercase text-white">Fai il bonifico</h3>
                  <p className="mt-1 text-sm text-white/50">Copia i dati nell'app della tua banca. Usa <strong className="text-white">esattamente</strong> questa causale, così ti troviamo subito.</p>
                  {BANK.isPlaceholder && (
                    <p className="mt-4 rounded-xl border border-hot/40 bg-hot/10 px-4 py-3 text-xs text-white/80">Anteprima: IBAN e intestatario sono di esempio e vanno sostituiti con quelli veri.</p>
                  )}
                  <div className="mt-5 rounded-3xl bg-white/[0.04] px-5 py-1 ring-1 ring-white/10">
                    <CopyRow k="amount" label="Importo" value={String(amount)} display={`${amount},00 €`} copied={copied} onCopy={copy} />
                    <CopyRow k="iban" label="IBAN" value={BANK.iban.replace(/\s/g, "")} display={fmtIban(BANK.iban)} copied={copied} onCopy={copy} />
                    <CopyRow k="holder" label="Intestatario" value={BANK.holder} copied={copied} onCopy={copy} />
                    <CopyRow k="causale" label="Causale" value={causale} copied={copied} onCopy={copy} />
                  </div>
                  <p className="mt-3 flex items-start gap-2 px-1 text-xs text-white/45"><Landmark size={14} className="mt-0.5 shrink-0" /> {BANK.bank}. Meglio il bonifico istantaneo: lo vediamo in pochi minuti. Quello ordinario può metterci 1-2 giorni lavorativi.</p>
                  <div className="mt-6 flex gap-3">
                    <button type="button" onClick={() => goTo(0)} className={`${BTN_LINE} px-4`} aria-label="Indietro"><ArrowLeft size={18} /></button>
                    <button type="button" onClick={() => goTo(2)} className={`${BTN} flex-1`}>Ho fatto il bonifico <ArrowRight size={18} /></button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mt-8">
                  <h3 className="font-display text-2xl font-extrabold uppercase text-white">Conferma</h3>
                  <p className="mt-1 text-sm text-white/50">Controlla che sia tutto giusto. Appena vediamo il bonifico i QR si sbloccano e ti scriviamo su Instagram.</p>
                  <div className="mt-5 rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs uppercase tracking-[0.18em] text-white/40">Codice</span>
                      <span className="font-mono text-lg font-medium text-gold-200">{code}</span>
                    </div>
                    <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                      {guests.map((g, i) => (
                        <li key={i} className="flex justify-between text-sm"><span className="text-white">{g.firstName} {g.lastName}</span><span className="font-mono text-white/40">{code}-{pad(i + 1)}</span></li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-sm text-white/50">Bonifico</span>
                      <span className="font-display text-2xl font-black text-white">{euro(amount)}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label htmlFor="p-trn" className="mb-1.5 block px-1 text-xs text-white/50">CRO / TRN del bonifico (facoltativo, velocizza il controllo)</label>
                    <input id="p-trn" value={payer.trn} onChange={(e) => setPayer({ ...payer, trn: e.target.value })} placeholder="Es. 0306912345678901" className={INPUT} />
                  </div>
                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
                    <input id="paid" type="checkbox" checked={paidCheck} onChange={(e) => { setPaidCheck(e.target.checked); setErrors({}); }} className="mt-0.5 h-5 w-5 shrink-0 accent-[#E2B866]" />
                    <span className="text-sm text-white/80">Ho inviato il bonifico di <strong className="text-white">{euro(amount)}</strong> con la causale <span className="font-mono text-gold-200">{causale}</span> e ho più di {PARTY.minAge} anni.</span>
                  </label>
                  {errors.paid && <p className="mt-2 px-1 text-xs text-hot">{errors.paid}</p>}
                  <div className="mt-6 flex gap-3">
                    <button type="button" onClick={() => goTo(1)} className={`${BTN_LINE} px-4`} aria-label="Indietro"><ArrowLeft size={18} /></button>
                    <button type="button" onClick={confirm} disabled={busy} className={`${BTN} flex-1`}>{busy ? "Salvo…" : <>Conferma e prendi i QR <Ticket size={18} /></>}</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Tickets({ booking, onReset }) {
  const paid = booking.status === "paid";
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-full ${paid ? "bg-gold-300 text-ink-950" : "bg-white/10 text-gold-200"}`}>{paid ? <Check size={20} /> : <Hourglass size={20} />}</span>
        <div>
          <h3 className="font-display text-2xl font-extrabold uppercase text-white">{paid ? "Sei in lista!" : "Ci siamo quasi"}</h3>
          <p className="text-sm text-white/50">{paid ? "Mostra il tuo QR all'ingresso con un documento." : `Stiamo verificando il bonifico di ${euro(booking.amount)}. Ti scriviamo su Instagram (@${booking.payer.instagram}) appena è confermato.`}</p>
        </div>
      </div>
      <div className="no-scrollbar mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {booking.guests.map((g) => (
          <div key={g.ticketId} className="pass relative w-[230px] shrink-0 snap-start overflow-hidden rounded-3xl p-4 text-white">
            <div className="holo-foil pointer-events-none absolute inset-0 opacity-60" />
            <div className="relative">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">Capodanno 2027</p>
              <p className="mt-1 truncate font-display text-xl font-extrabold uppercase">{g.firstName}</p>
              <p className="truncate text-sm text-white/70">{g.lastName}</p>
              <div className="mt-4 flex justify-center"><QR value={g.ticketId} size={150} locked={!paid} /></div>
              <p className="mt-3 text-center font-mono text-xs tracking-wider text-white/70">{g.ticketId}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-white/[0.04] p-4 text-sm text-white/60 ring-1 ring-white/10">
        <p>Codice prenotazione <span className="font-mono text-gold-200">{booking.code}</span>. Hai dubbi? Scrivi a{" "}
          {PARTY.contacts.map((h, i) => <React.Fragment key={h}>{i > 0 && " o "}<a href={ig(h)} target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline decoration-gold-300/60 underline-offset-2">@{h}</a></React.Fragment>)}.
        </p>
      </div>
      {!paid && <SendSummary booking={booking} />}
      <button type="button" onClick={onReset} className="mt-4 text-sm font-medium text-white/50 underline underline-offset-4 hover:text-white">Fai un'altra prenotazione</button>
    </div>
  );
}

// Finché non c'è API_URL gli organizzatori ricevono la prenotazione via Instagram
// e la incollano nell'app di check-in (accetta il JSON in fondo al messaggio).
function SendSummary({ booking }) {
  const [copied, copy] = useCopy();
  const ref = useRef(null);
  const text = `Ciao! Ho prenotato per il Capodanno 2027.\nCodice: ${booking.code}\nBonifico: ${euro(booking.amount)} · causale "${booking.causale}"${booking.payer.trn ? ` · TRN ${booking.payer.trn}` : ""}\nLista:\n${booking.guests.map((g) => `- ${g.firstName} ${g.lastName} (${g.ticketId})`).join("\n")}\n\n${JSON.stringify(booking)}`;
  return (
    <div className="mt-4 rounded-2xl border border-gold-300/30 bg-gold-300/[0.06] p-4">
      <p className="text-sm font-semibold text-white">Ultimo passo: mandaci la prenotazione</p>
      <p className="mt-1 text-xs text-white/55">Copia il riepilogo e incollalo in un DM a uno degli organizzatori, così ti mettono in lista appena arriva il bonifico.</p>
      <pre ref={ref} className="sr-only">{text}</pre>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => copy("sum", text, ref.current)} className={`${BTN} flex-1 py-3`}>{copied === "sum" ? <><Check size={16} /> Copiato</> : <><Copy size={16} /> Copia riepilogo</>}</button>
        <a href={ig(PARTY.contacts[0])} target="_blank" rel="noopener noreferrer" className={`${BTN_LINE} flex-1 py-3`}><Instagram size={16} /> Apri Instagram</a>
      </div>
    </div>
  );
}

/* ------------------------------ FAQ & footer ------------------------------ */

const FAQS = [
  { q: "Come si paga?", a: "Con bonifico, direttamente dalla sezione Biglietti: copi IBAN, importo e causale nell'app della tua banca e confermi qui. Meglio l'istantaneo." },
  { q: "Quando ricevo il QR?", a: "Subito, ma resta bloccato finché non vediamo il bonifico. Quando è confermato ti scriviamo su Instagram e il QR si sblocca. Ogni persona ha il suo." },
  { q: "Quando ricevo l'indirizzo?", a: "Insieme alla conferma del pagamento, in privato." },
  { q: "Posso portare qualcuno?", a: `Sì: amici, amici di amici e bella gente. Aggiungili nella prenotazione con nome e cognome, fino a ${PARTY.maxPerBooking} per volta. Chi non è in lista non entra.` },
  { q: "C'è un'età minima?", a: `Sì, solo ${PARTY.minAge}+. All'ingresso controlliamo il documento insieme al QR.` },
  { q: "Devo portare da bere o da mangiare?", a: "No, è tutto compreso: buffet, drink, alcol, analcolici e spumante di mezzanotte." },
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-16 border-t border-white/10">
      <div className="gutter mx-auto grid max-w-6xl gap-10 py-20 sm:py-28 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <p className={LABEL}>FAQ</p>
          <h2 className={`${H2} mt-3`}>Domande?</h2>
          <div className="mt-6 flex flex-col gap-2">
            {PARTY.contacts.map((h) => (
              <a key={h} href={ig(h)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-mono text-sm text-gold-200 hover:text-white"><Instagram size={16} /> @{h}</a>
            ))}
          </div>
        </div>
        <div className="border-t border-white/10">
          {FAQS.map((it, i) => (
            <div key={i} className="border-b border-white/10">
              <h3>
                <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} aria-controls={`faq-${i}`} className="flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-semibold text-white transition hover:text-gold-200">
                  {it.q}
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 transition ${open === i ? "rotate-45 border-gold-300 bg-gold-300 text-ink-950" : "text-white/60"}`}><Plus size={16} /></span>
                </button>
              </h3>
              <div id={`faq-${i}`} role="region" className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <p className="overflow-hidden leading-relaxed text-white/60">{it.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 pb-28 md:pb-10">
      <div className="gutter mx-auto max-w-6xl pt-16">
        <p className="gradient-text font-display text-[19vw] font-black uppercase leading-[0.8] tracking-tighter lg:text-[12rem]">31.12</p>
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:justify-between">
          <p>Festa privata su invito · Solo {PARTY.minAge}+ · Ingresso su lista nominale</p>
          <div className="flex gap-4">{PARTY.contacts.map((h) => <a key={h} href={ig(h)} target="_blank" rel="noopener noreferrer" className="hover:text-white">@{h}</a>)}</div>
        </div>
      </div>
    </footer>
  );
}

// Barra fissa in basso su telefono
function MobileBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => {
      const b = document.getElementById("biglietti")?.getBoundingClientRect();
      const inBooking = b && b.top < window.innerHeight && b.bottom > 0;
      setShow(window.scrollY > 500 && !inBooking);
    };
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 md:hidden ${show ? "translate-y-0" : "translate-y-full"}`}
      style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))", paddingLeft: "max(12px, env(safe-area-inset-left, 0px))", paddingRight: "max(12px, env(safe-area-inset-right, 0px))" }}>
      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-ink-900/90 p-1.5 shadow-2xl backdrop-blur-xl">
        <a href={ig(PARTY.contacts[0])} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-white"><Instagram size={20} /></a>
        <a href="#biglietti" className="flex flex-1 items-center justify-between rounded-full bg-gold-300 px-5 py-3 font-bold text-ink-950">
          <span>Prendi il posto</span><span className="font-display font-black">{euro(ACTIVE.price)}</span>
        </a>
      </div>
    </div>
  );
}

export default function Capodanno2027() {
  const tape = ["Over 18", "Villa in campagna", "Open bar", "Fino all'alba", "Zero vicini", "Cotechino & lenticchie", "Spumante a mezzanotte", `${ACTIVE.name} ${euro(ACTIVE.price)}`];
  return (
    <div className="grain min-h-screen bg-ink-950 font-sans text-white antialiased selection:bg-hot/40">
      <Navbar />
      <main>
        <Hero />
        <div className="relative -my-2 overflow-hidden py-6">
          <Marquee items={tape} className="relative z-10 -rotate-2 bg-gold-300 py-3 text-ink-950" />
          <Marquee items={tape} reverse className="absolute inset-x-0 top-6 rotate-2 bg-hot py-3 text-white" />
        </div>
        <Vibe />
        <Night />
        <Booking />
        <Faq />
      </main>
      <Footer />
      <MobileBar />
    </div>
  );
}
