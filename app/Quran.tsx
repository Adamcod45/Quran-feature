"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { SURAHS, type Surah, type Verse } from "./qurandata";

const HTMLFlipBook = dynamic(() => import("react-pageflip"), { ssr: false });

const LOGO_SRC = "/logo.png";
const RECITER = "Alafasy_128kbps";

const audioUrl = (surah: number, verse: number) =>
  `https://everyayah.com/data/${RECITER}/${String(surah).padStart(3, "0")}${String(verse).padStart(3, "0")}.mp3`;

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabic = (n: number) => String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);

/* ------------------------------------------------------------------ */
/* DESIGN TOKENS: the same palette as before, now in one place.        */
/* ------------------------------------------------------------------ */
const C = {
  bg: "#0b0b0e",
  surface: "#14141a",
  line: "#26262e",
  ink: "#f2eee6",
  muted: "#9a968c",
  gold: "#c9a961",
  quran: "#1f8a70",
  goldDeep: "#6b5a2c", // gold that stays readable on the cream paper
  paperText: "#3a382f",
};
const mix = (color: string, pct: number, into = "transparent") => `color-mix(in srgb, ${color} ${pct}%, ${into})`;

const FONT_UI = 'var(--font-ui), system-ui, -apple-system, "Segoe UI", sans-serif';
const FONT_DISPLAY = 'var(--font-display), Georgia, serif';
const FONT_ARABIC = 'var(--font-arabic), "Amiri", serif';
const FONT_QURAN = 'var(--font-quran), "Amiri Quran", "Amiri", serif';

const reset: CSSProperties = { background: "none", border: 0, color: "inherit", font: "inherit", cursor: "pointer", padding: 0 };

/* ------------------------------------------------------------------ */
/* STYLES (inline)                                                     */
/* ------------------------------------------------------------------ */
const st: Record<string, CSSProperties> = {
  /* shell */
  shell: { position: "relative", minHeight: "100svh", overflowX: "hidden", background: C.bg, color: C.ink, fontFamily: FONT_UI, lineHeight: 1.5 },
  glow: {
    position: "fixed", left: "-20%", right: "-20%", bottom: "-35%", height: "70%", pointerEvents: "none",
    background: `radial-gradient(55% 65% at 50% 100%, ${mix(C.quran, 38)}, transparent 70%)`,
  },
  wrap: { position: "relative", maxWidth: 680, margin: "0 auto", padding: "0 18px 80px" },

  /* home */
  hero: { display: "flex", alignItems: "center", gap: 16, padding: "34px 0 18px" },
  logo: {
    flex: "none", width: 64, height: 64, borderRadius: "50%", border: `2px solid ${C.gold}`,
    background: C.surface, overflow: "hidden", display: "grid", placeItems: "center",
  },
  logoImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  h1: { margin: 0, display: "flex", alignItems: "baseline", gap: 12, fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: "2.3rem", lineHeight: 1 },
  h1Ar: { fontFamily: FONT_ARABIC, fontWeight: 400, fontSize: "2.1rem", color: C.gold },
  list: { listStyle: "none", margin: 0, padding: 0 },
  row: {
    ...reset, display: "grid", gridTemplateColumns: "44px 1fr auto", alignItems: "center", gap: 14,
    width: "100%", textAlign: "left", padding: "13px 4px", borderBottom: `1px solid ${C.line}`,
  },
  num: { position: "relative", width: 38, height: 38, display: "grid", placeItems: "center", fontSize: ".8rem", color: C.gold },
  numBox: { position: "absolute", inset: 5, border: `1px solid ${C.gold}`, borderRadius: 3, opacity: 0.7 },
  numText: { position: "relative", fontStyle: "normal" },
  nm: { fontWeight: 500, transition: "color .15s" },
  sub: { color: C.muted, fontSize: ".82rem" },
  ar: { fontFamily: FONT_ARABIC, fontSize: "1.5rem" },

  /* reader */
  bar: {
    position: "sticky", top: 0, zIndex: 5, display: "flex", alignItems: "center", gap: 6, padding: "10px 0",
    background: mix(C.bg, 92), backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}`,
  },
  title: { flex: 1, textAlign: "center", fontWeight: 500 },
  titleSub: { display: "block", color: C.muted, fontWeight: 400, fontSize: ".75rem" },
  ib: { ...reset, minWidth: 40, height: 40, borderRadius: 999, border: `1px solid ${C.line}`, display: "grid", placeItems: "center" },
  ibGhost: { minWidth: 40, height: 40 },
  book: { display: "flex", justifyContent: "center", alignItems: "center", padding: "18px 0 0", minHeight: "calc(100svh - 80px)" },

  /* paper */
  page: {
    background: "linear-gradient(to right, rgba(0,0,0,.14), rgba(0,0,0,.04) 14px, transparent 42px), linear-gradient(180deg, #f6f2ea, #ece6d8)",
    color: C.bg, overflow: "hidden", willChange: "transform",
  },
  pageContent: { height: "100%", padding: "36px 26px 22px", display: "flex", flexDirection: "column", overflowY: "auto", scrollbarWidth: "none" },
  verse: { minHeight: "100%", display: "flex", flexDirection: "column" },
  selectable: { userSelect: "text", WebkitUserSelect: "text" },
  vt: {
    direction: "rtl", textAlign: "right", fontFamily: FONT_QURAN, fontSize: "clamp(1.4rem, 5.2vw, 2rem)",
    lineHeight: 2.1, margin: "auto 0 0",
  },
  latin: { margin: "14px 0 0", direction: "ltr", fontStyle: "italic", color: C.goldDeep, lineHeight: 1.55, fontSize: ".92rem" },
  en: { margin: "18px 0 0", paddingTop: 14, borderTop: "1px solid rgba(0,0,0,.15)", color: C.paperText, lineHeight: 1.6, fontSize: ".95rem" },
  ref: {
    marginTop: "auto", paddingTop: 22, display: "flex", alignItems: "center", justifyContent: "center",
    gap: 10, fontSize: ".78rem", color: C.goldDeep, pointerEvents: "none",
  },
  vn: {
    display: "inline-grid", placeItems: "center", minWidth: "2em", height: "2em", padding: "0 .3em",
    border: "1px solid #8a6d2f", borderRadius: 999, color: C.goldDeep, fontFamily: FONT_ARABIC, fontSize: ".95rem",
  },

  /* cover (a hard board, green to the edge) */
  coverPage: {
    background: `linear-gradient(to right, rgba(0,0,0,.35), transparent 30px), radial-gradient(80% 60% at 50% 100%, ${mix(C.quran, 55)}, transparent 70%), ${mix(C.quran, 28, C.bg)}`,
    color: C.ink,
  },
  cover: { position: "relative", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "40px 30px" },
  coverFrame: { position: "absolute", inset: 14, border: `3px double ${C.gold}`, borderRadius: 6, pointerEvents: "none" },
  coverAr: { fontFamily: FONT_QURAN, fontSize: "3.4rem", lineHeight: 1.3, color: C.gold },
  coverEn: { fontFamily: FONT_DISPLAY, fontSize: "1.6rem", marginTop: 10 },
  coverSub: { color: C.muted, marginTop: 6 },

  /* verse tools */
  pop: {
    position: "fixed", zIndex: 30, width: "max-content", maxWidth: "min(94vw, 420px)", display: "flex", flexWrap: "wrap",
    justifyContent: "center", gap: 6, padding: 8, border: `1px solid ${C.gold}`, borderRadius: 18,
    background: mix(C.surface, 94), backdropFilter: "blur(12px)", boxShadow: "0 10px 30px rgba(0,0,0,.5)",
    userSelect: "none", WebkitUserSelect: "none", animation: "q-pop .16s ease-out",
  },
  act: { ...reset, minWidth: 52, height: 36, padding: "0 13px", border: `1px solid ${C.line}`, borderRadius: 999, fontSize: ".84rem" },
  actOn: { borderColor: C.gold, color: C.gold, background: mix(C.gold, 12) },
  actMain: { background: C.quran, borderColor: C.quran, color: "#fff", fontWeight: 600 },
  note: { flexBasis: "100%", textAlign: "center", fontSize: ".78rem", color: C.muted },
};

/* The few things inline styles can't express: keyframes, a media query and a WebKit scrollbar. */
const EXTRAS = `
@keyframes q-pop { from { opacity: 0; scale: .94; } }
@media (prefers-reduced-motion: reduce) { [data-q-pop] { animation: none !important; } }
.q-noscroll::-webkit-scrollbar { display: none; }
`;

/* ------------------------------------------------------------------ */

export default function Page() {
  return <QuranApp surahs={SURAHS} />;
}

function QuranApp({ surahs }: { surahs: Surah[] }) {
  const [id, setId] = useState<number | null>(null);

  useEffect(() => {
    const readHash = () => {
      const match = window.location.hash.match(/^#s(\d+)$/);
      const next = match ? Number(match[1]) : null;
      setId(next && surahs[next - 1] ? next : null);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    window.addEventListener("popstate", readHash);
    return () => {
      window.removeEventListener("hashchange", readHash);
      window.removeEventListener("popstate", readHash);
    };
  }, [surahs]);

  const open = (n: number | null) => {
    window.history.pushState(null, "", n ? `#s${n}` : window.location.pathname);
    setId(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const surah = id ? surahs[id - 1] : undefined;

  return (
    <div style={st.shell}>
      <style>{EXTRAS}</style>
      <div style={st.glow} aria-hidden="true" />
      <div style={st.wrap}>
        {surah ? <Reader key={surah.id} surah={surah} onBack={() => open(null)} /> : <Home surahs={surahs} onOpen={open} />}
      </div>
    </div>
  );
}

/* HOME */

function Home({ surahs, onOpen }: { surahs: Surah[]; onOpen: (n: number) => void }) {
  return (
    <>
      <header style={st.hero}>
        <div style={st.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SRC}
            alt="Quran app logo"
            style={st.logoImg}
            onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
          />
        </div>
        <h1 style={st.h1}>
          Quran <span lang="ar" style={st.h1Ar}>القرآن</span>
        </h1>
      </header>

      <ul style={st.list}>
        {surahs.map((c) => (
          <SurahRow key={c.id} surah={c} onOpen={onOpen} />
        ))}
      </ul>
    </>
  );
}

function SurahRow({ surah, onOpen }: { surah: Surah; onOpen: (n: number) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <li>
      <button
        type="button"
        style={st.row}
        onClick={() => onOpen(surah.id)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
      >
        <span style={st.num}>
          <span style={st.numBox} />
          <span style={{ ...st.numBox, transform: "rotate(45deg)" }} />
          <i style={st.numText}>{surah.id}</i>
        </span>
        <span>
          <span style={{ ...st.nm, color: hover ? C.gold : "inherit" }}>{surah.transliteration}</span>
          <br />
          <span style={st.sub}>{surah.translation} · {surah.verses.length} verses</span>
        </span>
        <span style={st.ar} lang="ar">{surah.name}</span>
      </button>
    </li>
  );
}

/* READER */

type ReaderState = { current: number; latin: boolean };
const ReaderCtx = createContext<ReaderState>({ current: 0, latin: false });
const WINDOW = 3; // only pages this close to the current one mount their text

const FlipPage = forwardRef<
  HTMLDivElement,
  { index: number; children: ReactNode; density?: "hard" | "soft"; paper?: CSSProperties; content?: CSSProperties }
>(({ index, children, density = "soft", paper, content }, ref) => {
  const { current } = useContext(ReaderCtx);
  const near = Math.abs(index - current) <= WINDOW;
  return (
    <div ref={ref} data-density={density} style={{ ...st.page, ...paper }}>
      <div className="q-noscroll" style={{ ...st.pageContent, ...content }}>{near ? children : null}</div>
    </div>
  );
});
FlipPage.displayName = "FlipPage";

function VerseBody({ index, surahId, verse }: { index: number; surahId: number; verse: Verse }) {
  const { latin } = useContext(ReaderCtx);
  const box = useRef<HTMLDivElement>(null);

  /* With a mouse, dragging over the text selects it instead of turning the page. */
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const keep = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest("[data-text]")) e.stopPropagation();
    };
    el.addEventListener("mousedown", keep);
    return () => el.removeEventListener("mousedown", keep);
  }, []);

  return (
    <div ref={box} data-verse={index} style={st.verse}>
      <div lang="ar" data-text style={{ ...st.vt, ...st.selectable }}>{verse[0]}</div>
      {latin && <p data-text style={{ ...st.latin, ...st.selectable }}>{verse[2]}</p>}
      <p data-text style={{ ...st.en, ...st.selectable }}>{verse[1]}</p>
      <div style={st.ref}>
        <span style={st.vn}>{toArabic(index)}</span>
        {surahId}:{index}
      </div>
    </div>
  );
}

type Pop = { v: number; text: string; x: number; y: number; above: boolean };

function Reader({ surah, onBack }: { surah: Surah; onBack: () => void }) {
  const [current, setCurrent] = useState(0);
  const [latin, setLatin] = useState(false);
  const [slow, setSlow] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState("");
  const [pop, setPop] = useState<Pop | null>(null);

  const audio = useRef<HTMLAudioElement | null>(null);
  const runsLeft = useRef(0);
  const pressing = useRef(false); // while a popup button is pressed, the selection can't dismiss the popup

  const stop = () => {
    audio.current?.pause();
    setPlaying(false);
  };

  useEffect(() => () => { audio.current?.pause(); audio.current = null; }, []);
  useEffect(() => { if (audio.current) audio.current.playbackRate = slow ? 0.75 : 1; }, [slow]);
  useEffect(() => { if (!pop) stop(); }, [pop]);

  /* The popup follows the text selection, like the system's Copy menu. */
  useEffect(() => {
    let timer: number | undefined;
    const onSelection = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        if (!pressing.current) timer = window.setTimeout(() => setPop(null), 150);
        return;
      }
      const node = sel.anchorNode;
      const el = node instanceof Element ? node : node?.parentElement;
      const host = el?.closest<HTMLElement>("[data-verse]");
      if (!host) return setPop(null);
      const r = sel.getRangeAt(0).getBoundingClientRect();
      if (!r.width && !r.height) return;
      const half = Math.min(window.innerWidth * 0.47, 210);
      const x = Math.min(Math.max(r.left + r.width / 2, half + 8), window.innerWidth - half - 8);
      const below = r.bottom + 12;
      const above = below + 120 > window.innerHeight; // no room underneath: go above the selection
      setPop({ v: Number(host.dataset.verse ?? 0), text: sel.toString().trim(), x, y: above ? r.top - 12 : below, above });
    };
    document.addEventListener("selectionchange", onSelection);
    return () => {
      document.removeEventListener("selectionchange", onSelection);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const flash = (message: string) => {
    setNote(message);
    window.setTimeout(() => setNote(""), 1800);
  };

  const listen = () => {
    if (!pop) return;
    if (playing) return stop();
    const player = (audio.current ??= new Audio());
    player.src = audioUrl(surah.id, pop.v);
    player.playbackRate = slow ? 0.75 : 1;
    runsLeft.current = repeat ? 3 : 1;
    player.onended = () => {
      runsLeft.current -= 1;
      if (runsLeft.current > 0) {
        player.currentTime = 0;
        void player.play().catch(() => setPlaying(false));
      } else setPlaying(false);
    };
    player.onerror = () => { setPlaying(false); flash("Couldn’t load the recitation"); };
    player.play().then(() => setPlaying(true)).catch(() => { setPlaying(false); flash("Couldn’t start playback"); });
  };

  const shareText = () => (pop ? `${pop.text}\n\n— Quran ${surah.id}:${pop.v} (${surah.transliteration})` : "");

  const copy = async () => {
    try { await navigator.clipboard.writeText(shareText()); flash("Copied"); } catch { flash("Couldn’t copy"); }
  };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: shareText() }); } catch { /* cancelled */ }
    } else await copy();
  };

  const hold = () => { pressing.current = true; };
  const release = () => { window.setTimeout(() => { pressing.current = false; }, 400); };

  const tool = (on = false): CSSProperties => (on ? { ...st.act, ...st.actOn } : st.act);

  return (
    <>
      <div style={st.bar}>
        <button type="button" style={st.ib} onClick={onBack} aria-label="All surahs">←</button>
        <div style={st.title}>
          {surah.transliteration}
          <small style={st.titleSub}>{surah.translation}</small>
        </div>
        <span style={st.ibGhost} aria-hidden="true" />
      </div>

      <div style={st.book}>
        <ReaderCtx.Provider value={{ current, latin }}>
          {/* one verse per page; drag a page corner to turn it, select text to open the verse tools */}
          <HTMLFlipBook
            key={surah.id}
            width={370}
            height={560}
            size="stretch"
            minWidth={280}
            maxWidth={520}
            minHeight={420}
            maxHeight={780}
            maxShadowOpacity={0.4}
            drawShadow={true}
            showCover={true}
            usePortrait={true}
            mobileScrollSupport={true}
            className=""
            style={{ margin: "0 auto" }}
            startPage={0}
            flippingTime={900}
            startZIndex={0}
            autoSize={true}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            disableFlipByClick={true}
            renderOnlyPageLengthChange={true}
            onFlip={(e) => {
              window.getSelection()?.removeAllRanges();
              setPop(null);
              setCurrent(e.data);
            }}
          >
            <FlipPage index={0} density="hard" paper={st.coverPage} content={st.cover}>
              <div style={st.coverFrame} />
              <div style={st.coverAr} lang="ar">{surah.name}</div>
              <div style={st.coverEn}>{surah.transliteration}</div>
              <div style={st.coverSub}>{surah.translation}</div>
            </FlipPage>

            {surah.verses.map((verse, i) => (
              <FlipPage key={`${surah.id}-${i}`} index={i + 1}>
                <VerseBody index={i + 1} surahId={surah.id} verse={verse} />
              </FlipPage>
            ))}
          </HTMLFlipBook>
        </ReaderCtx.Provider>
      </div>

      {pop && (
        <div
          data-q-pop
          style={{ ...st.pop, left: pop.x, top: pop.y, transform: pop.above ? "translate(-50%, -100%)" : "translateX(-50%)" }}
          role="toolbar"
          aria-label={`Verse ${surah.id}:${pop.v}`}
          onPointerDown={hold}
          onPointerUp={release}
          onPointerCancel={release}
        >
          <button type="button" style={{ ...st.act, ...st.actMain }} onClick={listen}>{playing ? "Stop" : "Listen"}</button>
          <button type="button" style={tool(slow)} aria-pressed={slow} onClick={() => setSlow((v) => !v)}>Slow</button>
          <button type="button" style={tool(repeat)} aria-pressed={repeat} onClick={() => setRepeat((v) => !v)}>×3</button>
          <button type="button" style={tool(latin)} aria-pressed={latin} onClick={() => setLatin((v) => !v)}>Latin</button>
          <button type="button" style={tool()} onClick={copy}>Copy</button>
          <button type="button" style={tool()} onClick={share}>Share</button>
          {note && <span style={st.note} role="status">{note}</span>}
        </div>
      )}
    </>
  );
}