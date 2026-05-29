"use client";

import { useRef, useState } from "react";

const INITIAL_CLASSES = [
  {
    name: "User",
    x: 40,
    y: 40,
    fields: [
      { name: "id", type: "uuid" },
      { name: "username", type: "string" },
      { name: "displayName", type: "string" },
      { name: "bio", type: "string" },
      { name: "avatarUrl", type: "string" },
      { name: "isPrivate", type: "bool" },
      { name: "createdAt", type: "Date" },
    ],
    methods: [
      "follow(other: User)",
      "unfollow(other: User)",
      "isFollowing(other: User): bool",
      "like(track: Track)",
      "unlike(track: Track)",
      "comment(track: Track, body: string)",
      "createTrack(prompt, opts): Track",
      "remix(track: Track, opts): Track",
    ],
  },
  {
    name: "Track",
    x: 480,
    y: 40,
    fields: [
      { name: "id", type: "uuid" },
      { name: "creatorId", type: "uuid" },
      { name: "parentTrackId", type: "uuid?" },
      { name: "title", type: "string" },
      { name: "prompt", type: "string" },
      { name: "genre", type: "string" },
      { name: "mood", type: "string" },
      { name: "durationSeconds", type: "int" },
      { name: "hasVocals", type: "bool" },
      { name: "audioUrl", type: "string" },
      { name: "coverArtUrl", type: "string" },
      { name: "isPublished", type: "bool" },
      { name: "playCount", type: "int" },
      { name: "createdAt", type: "Date" },
    ],
    methods: [
      "publish()",
      "unpublish()",
      "incrementPlay()",
      "isRemix(): bool",
      "getParent(): Track?",
      "getRemixes(): Track[]",
      "getLikeCount(): int",
      "getCommentCount(): int",
    ],
  },
  {
    name: "Follow",
    x: 40,
    y: 460,
    fields: [
      { name: "followerId", type: "uuid" },
      { name: "followeeId", type: "uuid" },
      { name: "createdAt", type: "Date" },
    ],
    methods: [],
  },
  {
    name: "Like",
    x: 480,
    y: 660,
    fields: [
      { name: "userId", type: "uuid" },
      { name: "trackId", type: "uuid" },
      { name: "createdAt", type: "Date" },
    ],
    methods: [],
  },
  {
    name: "Comment",
    x: 920,
    y: 460,
    fields: [
      { name: "id", type: "uuid" },
      { name: "trackId", type: "uuid" },
      { name: "authorId", type: "uuid" },
      { name: "parentCommentId", type: "uuid?" },
      { name: "body", type: "string" },
      { name: "createdAt", type: "Date" },
    ],
    methods: [
      "reply(body: string): Comment",
      "isReply(): bool",
      "getReplies(): Comment[]",
    ],
  },
];

// label = relation type / arity
// kind = "assoc" (line), "compose" (filled diamond), "self" (loop)
const RELATIONS = [
  { from: "Track", to: "User", label: "creator  N:1", kind: "compose", fromField: "creatorId" },
  { from: "Track", to: "Track", label: "parent  0..1", kind: "self", fromField: "parentTrackId", toField: "id" },
  { from: "Follow", to: "User", label: "follower/followee  N:M", kind: "assoc" },
  { from: "Like", to: "User", label: "N:1", kind: "assoc" },
  { from: "Like", to: "Track", label: "N:1", kind: "assoc" },
  { from: "Comment", to: "Track", label: "N:1", kind: "assoc" },
  { from: "Comment", to: "User", label: "author  N:1", kind: "assoc" },
  { from: "Comment", to: "Comment", label: "reply  0..1", kind: "self", fromField: "parentCommentId", toField: "id" },
];

const CLASS_WIDTH = 280;
const HEADER_HEIGHT = 28;
const ROW_HEIGHT = 18;
const SECTION_PAD = 6;

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
  klass: {
    position: "absolute",
    width: CLASS_WIDTH,
    border: "1px solid #111",
    background: "#fff",
    fontSize: 11,
    boxShadow: "2px 2px 0 rgba(0,0,0,0.08)",
  },
  klassHeader: {
    background: "#111",
    color: "#fff",
    padding: "6px 10px",
    fontWeight: 600,
    letterSpacing: 1,
    fontSize: 11,
    textAlign: "center",
    cursor: "grab",
    height: HEADER_HEIGHT,
    boxSizing: "border-box",
  },
  section: {
    borderTop: "1px solid #111",
    padding: `${SECTION_PAD}px 10px`,
  },
  fieldRow: {
    display: "flex",
    justifyContent: "space-between",
    height: ROW_HEIGHT,
    alignItems: "center",
  },
  fieldName: { color: "#111" },
  fieldType: { color: "#888", fontSize: 10 },
  methodRow: {
    height: ROW_HEIGHT,
    display: "flex",
    alignItems: "center",
    color: "#111",
    fontSize: 10,
  },
  cardLabel: {
    fontSize: 10,
    fill: "#111",
    fontFamily: "ui-monospace, monospace",
    fontWeight: 600,
  },
};

function classHeight(c) {
  const fieldsBlock = SECTION_PAD * 2 + Math.max(c.fields.length, 1) * ROW_HEIGHT;
  const methodsBlock = SECTION_PAD * 2 + Math.max(c.methods.length, 1) * ROW_HEIGHT;
  return HEADER_HEIGHT + fieldsBlock + methodsBlock;
}

function classCenter(c) {
  return { x: c.x + CLASS_WIDTH / 2, y: c.y + classHeight(c) / 2 };
}

// Anchor at the middle of the left or right edge of a class
function edgeAnchor(c, side) {
  const y = c.y + classHeight(c) / 2;
  const x = side === "right" ? c.x + CLASS_WIDTH : c.x;
  return { x, y };
}

// Anchor at the row for a specific field (left or right edge)
function fieldAnchor(c, fieldName, side) {
  const idx = c.fields.findIndex((f) => f.name === fieldName);
  if (idx < 0) return edgeAnchor(c, side);
  const y = c.y + HEADER_HEIGHT + SECTION_PAD + idx * ROW_HEIGHT + ROW_HEIGHT / 2;
  const x = side === "right" ? c.x + CLASS_WIDTH : c.x;
  return { x, y };
}

export default function ClassDiagramPage() {
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef(null);
  const canvasRef = useRef(null);

  const onMouseDown = (e, name) => {
    const c = classes.find((x) => x.name === name);
    const rect = canvasRef.current.getBoundingClientRect();
    const scrollLeft = canvasRef.current.scrollLeft;
    const scrollTop = canvasRef.current.scrollTop;
    dragRef.current = {
      name,
      offsetX: (e.clientX - rect.left + scrollLeft) / zoom - c.x,
      offsetY: (e.clientY - rect.top + scrollTop) / zoom - c.y,
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
    setClasses((prev) =>
      prev.map((c) => (c.name === name ? { ...c, x, y } : c))
    );
  };

  const onMouseUp = () => {
    dragRef.current = null;
  };

  const onWheel = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    setZoom((z) => Math.min(2.5, Math.max(0.3, z * (e.deltaY < 0 ? 1.1 : 0.9))));
  };

  const classMap = Object.fromEntries(classes.map((c) => [c.name, c]));

  function pickSides(a, b) {
    return a.x + CLASS_WIDTH / 2 <= b.x + CLASS_WIDTH / 2
      ? ["right", "left"]
      : ["left", "right"];
  }

  const connections = RELATIONS.map((r, i) => {
    const a = classMap[r.from];
    const b = classMap[r.to];
    if (!a || !b) return null;

    if (r.kind === "self" || r.from === r.to) {
      const p1 = r.fromField ? fieldAnchor(a, r.fromField, "right") : edgeAnchor(a, "right");
      const p2 = r.toField ? fieldAnchor(a, r.toField, "right") : edgeAnchor(a, "right");
      // Loop outward to the right, never crossing back through the box
      const d = `M ${p1.x} ${p1.y} C ${p1.x + 50} ${p1.y}, ${p2.x + 50} ${p2.y}, ${p2.x} ${p2.y}`;
      const labelX = Math.max(p1.x, p2.x) + 60;
      const labelY = (p1.y + p2.y) / 2;
      return (
        <g key={i}>
          <path d={d} stroke="#444" strokeWidth="1.2" fill="none" />
          <rect
            x={labelX - 50}
            y={labelY - 9}
            width={100}
            height={14}
            fill="#fff"
            stroke="#ccc"
          />
          <text x={labelX} y={labelY + 1} style={styles.cardLabel} textAnchor="middle">
            {r.label}
          </text>
        </g>
      );
    }

    const [sideA, sideB] = pickSides(a, b);
    const p1 = edgeAnchor(a, sideA);
    const p2 = edgeAnchor(b, sideB);
    const dx = Math.max(40, Math.abs(p2.x - p1.x) / 2);
    const c1x = sideA === "right" ? p1.x + dx : p1.x - dx;
    const c2x = sideB === "right" ? p2.x + dx : p2.x - dx;
    const d = `M ${p1.x} ${p1.y} C ${c1x} ${p1.y}, ${c2x} ${p2.y}, ${p2.x} ${p2.y}`;

    const labelX = (p1.x + p2.x) / 2;
    const labelY = (p1.y + p2.y) / 2;
    const labelW = Math.max(60, r.label.length * 6 + 12);

    // Composition diamond at the "to" end (UML: filled diamond on the whole)
    const diamond =
      r.kind === "compose" ? (
        (() => {
          const dirX = sideB === "right" ? 1 : -1;
          const cx = p2.x + dirX * 8;
          const cy = p2.y;
          const pts = `${p2.x},${p2.y} ${cx - dirX * 0},${cy - 5} ${cx + dirX * 8},${cy} ${cx},${cy + 5}`;
          return <polygon points={pts} fill="#111" stroke="#111" />;
        })()
      ) : null;

    return (
      <g key={i}>
        <path d={d} stroke="#444" strokeWidth="1.2" fill="none" />
        {diamond}
        <rect
          x={labelX - labelW / 2}
          y={labelY - 9}
          width={labelW}
          height={14}
          fill="#fff"
          stroke="#ccc"
        />
        <text x={labelX} y={labelY + 1} style={styles.cardLabel} textAnchor="middle">
          {r.label}
        </text>
      </g>
    );
  });

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.title}>SoundForge — Class Diagram</div>
        <div style={styles.subtitle}>
          Drag class headers. Lines show associations; filled diamond = composition.
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

            {classes.map((c) => (
              <div key={c.name} style={{ ...styles.klass, left: c.x, top: c.y }}>
                <div
                  style={styles.klassHeader}
                  onMouseDown={(e) => onMouseDown(e, c.name)}
                >
                  {c.name}
                </div>
                <div style={styles.section}>
                  {c.fields.length === 0 ? (
                    <div style={{ ...styles.fieldRow, color: "#bbb" }}>—</div>
                  ) : (
                    c.fields.map((f) => (
                      <div key={f.name} style={styles.fieldRow}>
                        <span style={styles.fieldName}>{f.name}</span>
                        <span style={styles.fieldType}>{f.type}</span>
                      </div>
                    ))
                  )}
                </div>
                <div style={styles.section}>
                  {c.methods.length === 0 ? (
                    <div style={{ ...styles.methodRow, color: "#bbb" }}>—</div>
                  ) : (
                    c.methods.map((m) => (
                      <div key={m} style={styles.methodRow}>
                        + {m}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
