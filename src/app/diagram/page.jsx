const LAYERS = [
  {
    name: "Client",
    components: ["Next.js App Router", "React UI", "Web Audio Player"],
  },
  {
    name: "Server",
    components: ["Server Actions", "Route Handlers", "Auth & Validation"],
  },
  {
    name: "Domain",
    components: ["Tracks", "Remix / Collab", "Feed & Recommendations"],
  },
  {
    name: "Data & Services",
    components: [
      "Supabase (Postgres, Storage, Auth, Realtime)",
      "Music Gen API",
      "Stripe",
    ],
  },
];

const styles = {
  page: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    background: "#fafafa",
    color: "#111",
    minHeight: "100vh",
    padding: "60px 20px",
  },
  container: {
    maxWidth: 720,
    margin: "0 auto",
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 40,
  },
  layer: {
    border: "1px solid #111",
    background: "#fff",
    padding: "16px 20px",
  },
  layerName: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#666",
    marginBottom: 8,
  },
  components: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    fontSize: 13,
  },
  arrow: {
    width: 1,
    height: 24,
    background: "#111",
    margin: "0 auto",
  },
  legend: {
    marginTop: 40,
    fontSize: 11,
    color: "#666",
    lineHeight: 1.6,
    borderTop: "1px solid #ddd",
    paddingTop: 16,
  },
};

export default function DiagramPage() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.title}>SoundForge — Architecture</div>
        <div style={styles.subtitle}>Layered. Top depends on bottom.</div>

        {LAYERS.map((layer, i) => (
          <div key={layer.name}>
            <div style={styles.layer}>
              <div style={styles.layerName}>{layer.name}</div>
              <div style={styles.components}>
                {layer.components.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            </div>
            {i < LAYERS.length - 1 && <div style={styles.arrow} />}
          </div>
        ))}

        <div style={styles.legend}>
          Requests flow downward. Each layer depends only on the layer
          immediately below it.
        </div>
      </div>
    </div>
  );
}
