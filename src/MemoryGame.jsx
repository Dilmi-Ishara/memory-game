import { useState, useEffect, useCallback } from "react";

// ── Data ─────────────────────────────────────────────────────────────────────
const EMOJIS_ALL = [
  "🍕","🎸","🚀","🦊","🌸","🎯","🍦","🎲",
  "🐬","🌈","🔥","⚡","🎪","🍀","🦋","🎵","🍉","🏆",
];

const DIFFICULTY = {
  easy:   { pairs: 8,  cols: 4, label: "Easy",   sub: "4×4 — 8 pairs"  },
  medium: { pairs: 10, cols: 5, label: "Medium",  sub: "5×4 — 10 pairs" },
  hard:   { pairs: 18, cols: 6, label: "Hard",    sub: "6×6 — 18 pairs" },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(diff) {
  const emojis = EMOJIS_ALL.slice(0, DIFFICULTY[diff].pairs);
  return shuffle([...emojis, ...emojis].map((emoji, i) => ({
    id: i, emoji, flipped: false, matched: false,
  })));
}

// ── Stars background ──────────────────────────────────────────────────────────
function Stars() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    size: Math.random() * 2.5 + 0.5,
    top: Math.random() * 100,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 1.5 + Math.random() * 2,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute", borderRadius: "50%", background: "white",
          width: s.size, height: s.size,
          top: `${s.top}%`, left: `${s.left}%`,
          animation: `twinkle ${s.duration}s ${s.delay}s infinite alternate`,
        }} />
      ))}
    </div>
  );
}

// ── Card component ────────────────────────────────────────────────────────────
function Card({ card, onClick, small }) {
  return (
    <div onClick={onClick} style={{ aspectRatio: "1", perspective: "600px", cursor: card.flipped || card.matched ? "default" : "pointer" }}>
      <div style={{
        width: "100%", height: "100%", position: "relative",
        transformStyle: "preserve-3d",
        transition: "transform 0.35s",
        transform: card.flipped || card.matched ? "rotateY(180deg)" : "none",
      }}>
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          backfaceVisibility: "hidden", borderRadius: 10,
          background: "rgba(60,20,110,0.7)", border: "0.5px solid #6644bb",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, color: "#9966ff",
        }}>✦</div>
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          backfaceVisibility: "hidden", borderRadius: 10,
          transform: "rotateY(180deg)",
          background: card.matched ? "rgba(30,158,117,0.25)" : "rgba(20,10,40,0.95)",
          border: `0.5px solid ${card.matched ? "#1d9e75" : "#6644bb"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: small ? 16 : 22,
        }}>{card.emoji}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{
      flex: 1, background: "rgba(80,40,140,0.3)",
      border: "0.5px solid #3a1f6e", borderRadius: 10,
      padding: "10px 8px", textAlign: "center",
    }}>
      <div style={{ fontSize: 11, color: "#9980cc", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: "#e0d4ff" }}>{value}</div>
    </div>
  );
}

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 20px", borderRadius: 99, fontSize: 14, cursor: "pointer",
      border: active ? "0.5px solid #9966ff" : "0.5px solid #6644bb",
      background: active ? "#6644bb" : "transparent",
      color: active ? "#fff" : "#b39ddb", fontWeight: active ? 500 : 400,
    }}>{label}</button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MemoryGame() {
  const [screen, setScreen]   = useState("setup");
  const [diff, setDiff]       = useState("easy");
  const [cards, setCards]     = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(0);
  const [moves, setMoves]     = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [lock, setLock]       = useState(false);
  const [won, setWon]         = useState(false);
  const [scores, setScores]   = useState(() =>
    JSON.parse(localStorage.getItem("memgame_lb") || "[]")
  );

  // Timer
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Check for win
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!cards.length || matched !== DIFFICULTY[diff].pairs) return;
    setRunning(false);
    setWon(true);
    const entry = { diff, moves, seconds, date: new Date().toLocaleDateString() };
    const updated = [...scores, entry]
      .sort((a, b) => a.moves - b.moves || a.seconds - b.seconds)
      .slice(0, 20);
    setScores(updated);
    localStorage.setItem("memgame_lb", JSON.stringify(updated));
  }, [matched]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check flipped pair
  useEffect(() => {
    if (flipped.length !== 2) return;
    setLock(true);
    const [a, b] = flipped;
    if (cards[a].emoji === cards[b].emoji) {
      setCards(prev => prev.map((c, i) => i === a || i === b ? { ...c, matched: true } : c));
      setMatched(m => m + 1);
      setFlipped([]);
      setLock(false);
    } else {
      setTimeout(() => {
        setCards(prev => prev.map((c, i) => i === a || i === b ? { ...c, flipped: false } : c));
        setFlipped([]);
        setLock(false);
      }, 850);
    }
  }, [flipped]); // eslint-disable-line react-hooks/exhaustive-deps

  const startGame = useCallback(() => {
    setCards(buildCards(diff));
    setFlipped([]);
    setMatched(0);
    setMoves(0);
    setSeconds(0);
    setRunning(false);
    setLock(false);
    setWon(false);
    setScreen("play");
  }, [diff]);

  const flipCard = (i) => {
    if (lock || cards[i].flipped || cards[i].matched) return;
    if (!running) setRunning(true);
    setMoves(m => m + 1);
    setCards(prev => prev.map((c, idx) => idx === i ? { ...c, flipped: true } : c));
    setFlipped(prev => [...prev, i]);
  };

  const cols = DIFFICULTY[diff].cols;
  const isSmall = diff === "hard";

  const btnStyle = {
    padding: "9px 18px", borderRadius: 99,
    border: "0.5px solid #6644bb", background: "transparent",
    color: "#b39ddb", fontSize: 13, cursor: "pointer",
  };
  const btnPrimary = { ...btnStyle, background: "#6644bb", color: "#fff", border: "0.5px solid #9966ff" };

  return (
    <>
      <style>{`
        @keyframes twinkle { from { opacity: 0.2; } to { opacity: 1; } }
        body { margin: 0; background: #0a0015; min-height: 100vh; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#0a0015",
        position: "relative", overflow: "hidden",
        padding: "1.5rem 1rem", fontFamily: "sans-serif",
      }}>
        <Stars />

        <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"#3a0066", top:-100, left:-80, opacity:0.5, filter:"blur(60px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", width:250, height:250, borderRadius:"50%", background:"#001a66", bottom:-80, right:-60, opacity:0.4, filter:"blur(60px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", width:180, height:180, borderRadius:"50%", background:"#660033", top:"40%", left:"40%", opacity:0.25, filter:"blur(60px)", pointerEvents:"none" }} />

        <div style={{ position:"relative", zIndex:1, maxWidth:480, margin:"0 auto" }}>

          <div style={{ textAlign:"center", fontSize:22, fontWeight:500, color:"#e0d4ff", marginBottom:"1.5rem", letterSpacing:"0.05em" }}>
            ✦ Memory Stars ✦
          </div>

          <div style={{ display:"flex", gap:8, marginBottom:"1.5rem", justifyContent:"center" }}>
            <TabBtn label="Game" active={screen !== "leaderboard"} onClick={() => setScreen(won ? "play" : "setup")} />
            <TabBtn label="Leaderboard" active={screen === "leaderboard"} onClick={() => setScreen("leaderboard")} />
          </div>

          {screen === "setup" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:"1.5rem" }}>
                {Object.entries(DIFFICULTY).map(([key, val]) => (
                  <div key={key} onClick={() => setDiff(key)} style={{
                    borderRadius:12, padding:"1rem", textAlign:"center", cursor:"pointer",
                    background: diff===key ? "rgba(120,70,200,0.4)" : "rgba(80,40,140,0.25)",
                    border: diff===key ? "2px solid #9966ff" : "0.5px solid #3a1f6e",
                  }}>
                    <div style={{ fontWeight:500, fontSize:15, color:"#e0d4ff" }}>{val.label}</div>
                    <div style={{ fontSize:12, color:"#9980cc", marginTop:4 }}>{val.sub}</div>
                  </div>
                ))}
              </div>
              <button onClick={startGame} style={btnPrimary}>Start game</button>
            </div>
          )}

          {screen === "play" && (
            <div>
              <div style={{ display:"flex", gap:10, marginBottom:"1.25rem" }}>
                <StatCard label="Moves" value={moves} />
                <StatCard label="Matches" value={matched} />
                <StatCard label="Time" value={`${seconds}s`} />
              </div>

              {won && (
                <div style={{
                  textAlign:"center", padding:"1rem", borderRadius:12, marginBottom:"1.25rem",
                  background:"rgba(30,158,117,0.2)", border:"0.5px solid #1d9e75",
                }}>
                  <div style={{ fontSize:18, fontWeight:500, color:"#5dcaa5" }}>You won! 🎉</div>
                  <div style={{ fontSize:13, color:"#9fe1cb", marginTop:4 }}>{moves} moves in {seconds} seconds</div>
                </div>
              )}

              <div style={{
                display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`,
                gap: isSmall ? 6 : 8, marginBottom:"1.25rem",
              }}>
                {cards.map((card, i) => (
                  <Card key={card.id} card={card} onClick={() => flipCard(i)} small={isSmall} />
                ))}
              </div>

              <div style={{ display:"flex", gap:8 }}>
                <button onClick={startGame} style={btnStyle}>Restart</button>
                <button onClick={() => setScreen("setup")} style={btnStyle}>Change level</button>
              </div>
            </div>
          )}

          {screen === "leaderboard" && (
            <div>
              {scores.length === 0 ? (
                <div style={{ textAlign:"center", color:"#9980cc", padding:"2rem 0", fontSize:14 }}>
                  No scores yet — play a game first!
                </div>
              ) : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr>
                      {["Rank","Level","Moves","Time","Date"].map(h => (
                        <th key={h} style={{ textAlign:"left", fontSize:11, color:"#9980cc", fontWeight:500, padding:"6px 8px", borderBottom:"0.5px solid #3a1f6e", textTransform:"uppercase", letterSpacing:"0.04em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scores.slice(0, 10).map((s, i) => (
                      <tr key={i}>
                        <td style={{ padding:"8px", color: i===0?"#fac775":i===1?"#c9b8ff":i===2?"#f09595":"#9980cc", fontWeight: i<3?500:400 }}>
                          {i===0?"Gold":i===1?"Silver":i===2?"Bronze":`#${i+1}`}
                        </td>
                        <td style={{ padding:"8px" }}>
                          <span style={{
                            fontSize:11, padding:"2px 8px", borderRadius:99,
                            background: s.diff==="easy"?"rgba(30,158,117,0.2)":s.diff==="medium"?"rgba(239,159,39,0.2)":"rgba(226,75,74,0.2)",
                            color: s.diff==="easy"?"#5dcaa5":s.diff==="medium"?"#fac775":"#f09595",
                          }}>{s.diff}</span>
                        </td>
                        <td style={{ padding:"8px", color:"#c9b8ff" }}>{s.moves}</td>
                        <td style={{ padding:"8px", color:"#c9b8ff" }}>{s.seconds}s</td>
                        <td style={{ padding:"8px", color:"#9980cc" }}>{s.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ marginTop:"1rem" }}>
                <button onClick={() => { setScores([]); localStorage.removeItem("memgame_lb"); }} style={btnStyle}>Clear scores</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
