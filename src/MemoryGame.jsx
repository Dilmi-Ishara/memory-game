

import { useState, useEffect, useCallback } from "react";


// ── Data ────────────────────────────────────────────────────────────────────
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

// ── Sub-components ───────────────────────────────────────────────────────────
function Card({ card, onClick, small }) {
  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: "1",
        perspective: "600px",
        cursor: card.flipped || card.matched ? "default" : "pointer",
      }}
    >
      <div style={{
        width: "100%", height: "100%", position: "relative",
        transformStyle: "preserve-3d",
        transition: "transform 0.35s",
        transform: card.flipped || card.matched ? "rotateY(180deg)" : "none",
      }}>
        {/* Front (hidden face) */}
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          backfaceVisibility: "hidden", borderRadius: 8,
          background: "#f0eeff", border: "0.5px solid #c5bfee",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, color: "#a09add",
        }}>?</div>
        {/* Back (emoji face) */}
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          backfaceVisibility: "hidden", borderRadius: 8,
          transform: "rotateY(180deg)",
          background: card.matched ? "#e1f5ee" : "#fff",
          border: `0.5px solid ${card.matched ? "#5dcaa5" : "#ddd"}`,
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
      background: "#f5f4fe", borderRadius: 8, padding: "10px 8px",
      textAlign: "center", flex: 1,
    }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: "#1a1a1a" }}>{value}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MemoryGame() {
  const [screen, setScreen]     = useState("setup");   // "setup" | "play" | "leaderboard"
  const [diff, setDiff]         = useState("easy");
  const [cards, setCards]       = useState([]);
  const [flipped, setFlipped]   = useState([]);
  const [matched, setMatched]   = useState(0);
  const [moves, setMoves]       = useState(0);
  const [seconds, setSeconds]   = useState(0);
  const [running, setRunning]   = useState(false);
  const [lock, setLock]         = useState(false);
  const [won, setWon]           = useState(false);
  const [scores, setScores]     = useState(() =>
    JSON.parse(localStorage.getItem("memgame_lb") || "[]")
  );

  // Timer
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Check for win
  useEffect(() => {
    if (cards.length && matched === DIFFICULTY[diff].pairs) {
      setRunning(false);
      setWon(true);
      const entry = { diff, moves, seconds, date: new Date().toLocaleDateString() };
      const updated = [...scores, entry]
        .sort((a, b) => a.moves - b.moves || a.seconds - b.seconds)
        .slice(0, 20);
      setScores(updated);
      localStorage.setItem("memgame_lb", JSON.stringify(updated));
    }
  }, [matched]);

  // Check flipped pair
  useEffect(() => {
    if (flipped.length !== 2) return;
    setLock(true);
    const [a, b] = flipped;
    if (cards[a].emoji === cards[b].emoji) {
      setCards((prev) =>
        prev.map((c, i) => i === a || i === b ? { ...c, matched: true } : c)
      );
      setMatched((m) => m + 1);
      setFlipped([]);
      setLock(false);
    } else {
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c, i) => i === a || i === b ? { ...c, flipped: false } : c)
        );
        setFlipped([]);
        setLock(false);
      }, 850);
    }
  }, [flipped]);

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
    setMoves((m) => m + 1);
    setCards((prev) => prev.map((c, idx) => idx === i ? { ...c, flipped: true } : c));
    setFlipped((prev) => [...prev, i]);
  };

  const cols = DIFFICULTY[diff].cols;
  const isSmall = diff === "hard";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", fontFamily: "sans-serif", padding: "1.5rem 1rem" }}>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
        {["play", "setup"].includes(screen) ? (
          <>
            <TabBtn active label="Game" />
            <TabBtn onClick={() => setScreen("leaderboard")} label="Leaderboard" />
          </>
        ) : (
          <>
            <TabBtn onClick={() => setScreen("setup")} label="Game" />
            <TabBtn active label="Leaderboard" />
          </>
        )}
      </div>

      {/* ── Setup screen ── */}
      {screen === "setup" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: "1.5rem" }}>
            {Object.entries(DIFFICULTY).map(([key, val]) => (
              <div key={key} onClick={() => setDiff(key)} style={{
                borderRadius: 12, padding: "1rem", textAlign: "center", cursor: "pointer",
                background: diff === key ? "#eeedfe" : "#fff",
                border: diff === key ? "2px solid #7f77dd" : "0.5px solid #ddd",
              }}>
                <div style={{ fontWeight: 500, fontSize: 15, color: "#1a1a1a" }}>{val.label}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{val.sub}</div>
              </div>
            ))}
          </div>
          <button onClick={startGame} style={primaryBtn}>Start game</button>
        </div>
      )}

      {/* ── Play screen ── */}
      {screen === "play" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: "1.25rem" }}>
            <StatCard label="Moves" value={moves} />
            <StatCard label="Matches" value={matched} />
            <StatCard label="Time" value={`${seconds}s`} />
          </div>

          {won && (
            <div style={{
              textAlign: "center", padding: "1rem", borderRadius: 12,
              background: "#e1f5ee", border: "0.5px solid #5dcaa5", marginBottom: "1.25rem",
            }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#085041" }}>You won!</div>
              <div style={{ fontSize: 13, color: "#0f6e56", marginTop: 4 }}>
                {moves} moves in {seconds} seconds
              </div>
            </div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: isSmall ? 6 : 8,
            marginBottom: "1.25rem",
          }}>
            {cards.map((card, i) => (
              <Card key={card.id} card={card} onClick={() => flipCard(i)} small={isSmall} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={startGame} style={outlineBtn}>Restart</button>
            <button onClick={() => setScreen("setup")} style={outlineBtn}>Change difficulty</button>
          </div>
        </div>
      )}

      {/* ── Leaderboard screen ── */}
      {screen === "leaderboard" && (
        <div>
          {scores.length === 0 ? (
            <div style={{ textAlign: "center", color: "#888", padding: "2rem 0", fontSize: 14 }}>
              No scores yet — play a game first!
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {["Rank","Level","Moves","Time","Date"].map((h) => (
                    <th key={h} style={{ textAlign: "left", fontSize: 11, color: "#888", fontWeight: 500, padding: "6px 8px", borderBottom: "0.5px solid #eee", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scores.slice(0, 10).map((s, i) => (
                  <tr key={i}>
                    <td style={{ padding: "8px", color: i === 0 ? "#ba7517" : i === 1 ? "#5f5e5a" : i === 2 ? "#993c1d" : "#1a1a1a", fontWeight: i < 3 ? 500 : 400 }}>
                      {i === 0 ? "Gold" : i === 1 ? "Silver" : i === 2 ? "Bronze" : `#${i + 1}`}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: s.diff === "easy" ? "#e1f5ee" : s.diff === "medium" ? "#faeeda" : "#fcebeb", color: s.diff === "easy" ? "#085041" : s.diff === "medium" ? "#633806" : "#791f1f" }}>
                        {s.diff}
                      </span>
                    </td>
                    <td style={{ padding: "8px" }}>{s.moves}</td>
                    <td style={{ padding: "8px" }}>{s.seconds}s</td>
                    <td style={{ padding: "8px", color: "#888" }}>{s.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: "1rem" }}>
            <button onClick={() => { setScores([]); localStorage.removeItem("memgame_lb"); }} style={outlineBtn}>Clear scores</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 18px", borderRadius: 8, fontSize: 14, cursor: "pointer",
      border: active ? "0.5px solid #afa9ec" : "0.5px solid #ddd",
      background: active ? "#eeedfe" : "#fff",
      color: active ? "#3c3489" : "#888",
      fontWeight: active ? 500 : 400,
    }}>{label}</button>
  );
}

const primaryBtn = {
  padding: "10px 20px", borderRadius: 8, border: "0.5px solid #afa9ec",
  background: "#eeedfe", color: "#3c3489", fontSize: 14, cursor: "pointer", fontWeight: 500,
};

const outlineBtn = {
  padding: "9px 16px", borderRadius: 8, border: "0.5px solid #ddd",
  background: "#fff", color: "#1a1a1a", fontSize: 13, cursor: "pointer",
};
