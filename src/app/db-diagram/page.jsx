"use client";

import { useRef, useState } from "react";

const INITIAL_TABLES = [
  {
    name: "users",
    x: 40,
    y: 40,
    columns: [
      { name: "id", type: "uuid", key: "PK" },
      { name: "username", type: "text unique" },
      { name: "display_name", type: "text" },
      { name: "bio", type: "text" },
      { name: "avatar_url", type: "text" },
      { name: "is_private", type: "bool" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "tracks",
    x: 480,
    y: 40,
    columns: [
      { name: "id", type: "uuid", key: "PK" },
      { name: "creator_id", type: "uuid", key: "FK" },
      { name: "parent_track_id", type: "uuid", key: "FK" },
      { name: "title", type: "text" },
      { name: "prompt", type: "text" },
      { name: "genre", type: "text" },
      { name: "mood", type: "text" },
      { name: "duration_seconds", type: "int" },
      { name: "has_vocals", type: "bool" },
      { name: "audio_url", type: "text" },
      { name: "cover_art_url", type: "text" },
      { name: "is_published", type: "bool" },
      { name: "play_count", type: "int" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "follows",
    x: 40,
    y: 380,
    columns: [
      { name: "follower_id", type: "uuid", key: "PK,FK" },
      { name: "followee_id", type: "uuid", key: "PK,FK" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "likes",
    x: 480,
    y: 540,
    columns: [
      { name: "user_id", type: "uuid", key: "PK,FK" },
      { name: "track_id", type: "uuid", key: "PK,FK" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "comments",
    x: 920,
    y: 380,
    columns: [
      { name: "id", type: "uuid", key: "PK" },
      { name: "track_id", type: "uuid", key: "FK" },
      { name: "author_id", type: "uuid", key: "FK" },
      { name: "parent_comment_id", type: "uuid", key: "FK" },
      { name: "body", type: "text" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
];

// Relations: from a column on one table to a column on another.
// cardinality: side at "from" and "to" — "1" or "N"
const RELATIONS = [
  { from: ["tracks", "creator_id"], to: ["users", "id"], card: ["N", "1"] },
  { from: ["tracks", "parent_track_id"], to: ["tracks", "id"], card: ["N", "1"] },
  { from: ["follows", "follower_id"], to: ["users", "id"], card: ["N", "1"] },
  { from: ["follows", "followee_id"], to: ["users", "id"], card: ["N", "1"] },
  { from: ["likes", "user_id"], to: ["users", "id"], card: ["N", "1"] },
  { from: ["likes", "track_id"], to: ["tracks", "id"], card: ["N", "1"] },
  { from: ["comments", "track_id"], to: ["tracks", "id"], card: ["N", "1"] },
  { from: ["comments", "author_id"], to: ["users", "id"], card: ["N", "1"] },
  { from: ["comments", "parent_comment_id"], to: ["comments", "id"], card: ["N", "1"] },
];

const TABLE_WIDTH = 320;
const HEADER_HEIGHT = 32;
const ROW_HEIGHT = 24;

const styles = {
  page: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    background: "#fafafa",
    color: "#111",
    minHeight: "100vh",
    padding: "24px 20px",
  },
  container: { maxWidth: 1400, margin: "0 auto" },
  title: { fontSize: 16, fontWeight: 600, marginBottom: 4, letterSpacing: 0.5 },
  subtitle: { fontSize: 12, color: "#666", marginBottom: 16 },
  canvas: {
    position: "relative",
    width: "100%",
    height: 820,
    border: "1px solid #ddd",
    background:
      "linear-gradient(#f0f0f0 1px, transparent 1px) 0 0 / 20px 20px, linear-gradient(90deg, #f0f0f0 1px, transparent 1px) 0 0 / 20px 20px, #fff",
    overflow: "auto",
    userSelect: "none",
  },
  scrollInner: {
    position: "relative",
    width: 3000,
    height: 2000,
  },
  table: {
    position: "absolute",
    width: TABLE_WIDTH,
    border: "1px solid #111",
    background: "#fff",
    fontSize: 11,
    boxShadow: "2px 2px 0 rgba(0,0,0,0.08)",
  },
  tableHeader: {
    background: "#111",
    color: "#fff",
    padding: "8px 12px",
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 11,
    cursor: "grab",
    height: HEADER_HEIGHT,
    boxSizing: "border-box",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0 12px",
    borderTop: "1px solid #eee",
    height: ROW_HEIGHT,
    alignItems: "center",
  },
  colName: { color: "#111" },
  colMeta: { color: "#888", fontSize: 10, marginLeft: 8, textAlign: "right" },
  cardLabel: {
    fontSize: 10,
    fill: "#111",
    fontFamily: "ui-monospace, monospace",
    fontWeight: 600,
  },
};

function tableHeight(t) {
  return HEADER_HEIGHT + t.columns.length * ROW_HEIGHT;
}

function colIndex(t, colName) {
  return t.columns.findIndex((c) => c.name === colName);
}

// Returns the (x, y) anchor at the right or left edge of a row, depending on side.
function rowAnchor(t, colName, side) {
  const idx = colIndex(t, colName);
  const y = t.y + HEADER_HEIGHT + idx * ROW_HEIGHT + ROW_HEIGHT / 2;
  const x = side === "right" ? t.x + TABLE_WIDTH : t.x;
  return { x, y };
}

export default function DbDiagramPage() {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef(null);

  const canvasRef = useRef(null);

  const onMouseDown = (e, name) => {
    const t = tables.find((x) => x.name === name);
    const rect = canvasRef.current.getBoundingClientRect();
    const scrollLeft = canvasRef.current.scrollLeft;
    const scrollTop = canvasRef.current.scrollTop;
    dragRef.current = {
      name,
      offsetX: (e.clientX - rect.left + scrollLeft) / zoom - t.x,
      offsetY: (e.clientY - rect.top + scrollTop) / zoom - t.y,
    };
  };

  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    const { name, offsetX, offsetY } = dragRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const scrollLeft = canvasRef.current.scrollLeft;
    const scrollTop = canvasRef.current.scrollTop;
    const x = Math.max(0, (e.clientX - rect.left + scrollLeft) / zoom - offsetX);
    const y = Math.max(0, (e.clientY - rect.top + scrollTop) / zoom - offsetY);
    setTables((prev) =>
      prev.map((t) => (t.name === name ? { ...t, x, y } : t))
    );
  };

  const onWheel = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    setZoom((z) => Math.min(2.5, Math.max(0.3, z * (e.deltaY < 0 ? 1.1 : 0.9))));
  };

  const onMouseUp = () => {
    dragRef.current = null;
  };

  const tableMap = Object.fromEntries(tables.map((t) => [t.name, t]));

  // Decide which side (left/right) each anchor sits on based on table positions.
  function pickSides(a, b) {
    const aCenter = a.x + TABLE_WIDTH / 2;
    const bCenter = b.x + TABLE_WIDTH / 2;
    if (aCenter <= bCenter) return ["right", "left"];
    return ["left", "right"];
  }

  const connections = RELATIONS.map((r, i) => {
    const a = tableMap[r.from[0]];
    const b = tableMap[r.to[0]];
    if (!a || !b) return null;

    // Self-referencing: loop on the right side of the table
    if (r.from[0] === r.to[0]) {
      const p1 = rowAnchor(a, r.from[1], "right");
      const p2 = rowAnchor(a, r.to[1], "right");
      const d = `M ${p1.x} ${p1.y} C ${p1.x + 60} ${p1.y}, ${p2.x + 60} ${p2.y}, ${p2.x} ${p2.y}`;
      const labelX = p1.x + 50;
      const labelY = (p1.y + p2.y) / 2;
      return (
        <g key={i}>
          <path d={d} stroke="#444" strokeWidth="1.2" fill="none" />
          <rect
            x={labelX - 22}
            y={labelY - 9}
            width={44}
            height={14}
            fill="#fff"
            stroke="#ccc"
          />
          <text x={labelX} y={labelY + 1} style={styles.cardLabel} textAnchor="middle">
            {r.card[0]}:{r.card[1]}
          </text>
        </g>
      );
    }

    const [sideA, sideB] = pickSides(a, b);
    const p1 = rowAnchor(a, r.from[1], sideA);
    const p2 = rowAnchor(b, r.to[1], sideB);

    const dx = Math.max(40, Math.abs(p2.x - p1.x) / 2);
    const c1x = sideA === "right" ? p1.x + dx : p1.x - dx;
    const c2x = sideB === "right" ? p2.x + dx : p2.x - dx;
    const d = `M ${p1.x} ${p1.y} C ${c1x} ${p1.y}, ${c2x} ${p2.y}, ${p2.x} ${p2.y}`;

    const labelX = (p1.x + p2.x) / 2;
    const labelY = (p1.y + p2.y) / 2 - 6;

    return (
      <g key={i}>
        <path d={d} stroke="#444" strokeWidth="1.2" fill="none" />
        <rect
          x={labelX - 22}
          y={labelY - 10}
          width={44}
          height={14}
          fill="#fff"
          stroke="#ccc"
        />
        <text x={labelX} y={labelY} style={styles.cardLabel} textAnchor="middle">
          {r.card[0]}:{r.card[1]}
        </text>
      </g>
    );
  });

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.title}>SoundForge — DB Schema</div>
        <div style={styles.subtitle}>
          Drag tables by their headers. Lines connect FK rows to their target PK.
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
          <button
            onClick={() => setZoom((z) => Math.max(0.3, z * 0.9))}
            style={{ fontFamily: "inherit", padding: "2px 10px", border: "1px solid #111", background: "#fff", cursor: "pointer" }}
          >−</button>
          <button
            onClick={() => setZoom(1)}
            style={{ fontFamily: "inherit", padding: "2px 10px", border: "1px solid #111", background: "#fff", cursor: "pointer", fontSize: 11 }}
          >{Math.round(zoom * 100)}%</button>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z * 1.1))}
            style={{ fontFamily: "inherit", padding: "2px 10px", border: "1px solid #111", background: "#fff", cursor: "pointer" }}
          >+</button>
          <span style={{ fontSize: 10, color: "#888", marginLeft: 8 }}>ctrl/⌘ + scroll to zoom</span>
        </div>

        <div
          ref={canvasRef}
          style={styles.canvas}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          <div style={{ ...styles.scrollInner, transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
          <svg
            width={3000}
            height={2000}
            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
          >
            {connections}
          </svg>

          {tables.map((t) => (
            <div key={t.name} style={{ ...styles.table, left: t.x, top: t.y }}>
              <div
                style={styles.tableHeader}
                onMouseDown={(e) => onMouseDown(e, t.name)}
              >
                {t.name}
              </div>
              {t.columns.map((c) => (
                <div key={c.name} style={styles.row}>
                  <span style={styles.colName}>{c.name}</span>
                  <span style={styles.colMeta}>
                    {c.type}
                    {c.key ? `  ·  ${c.key}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
