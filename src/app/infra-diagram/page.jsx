const CHIP = {
  green:    { bg: "#d1fae5", fg: "#065f46" },
  blue:     { bg: "#dbeafe", fg: "#1e3a8a" },
  peach:    { bg: "#fed7aa", fg: "#9a3412" },
  red:      { bg: "#fee2e2", fg: "#991b1b" },
  yellow:   { bg: "#fef3c7", fg: "#92400e" },
  lavender: { bg: "#e9d5ff", fg: "#6b21a8" },
};

const FONT = '-apple-system, "Inter", "Segoe UI", system-ui, sans-serif';

const styles = {
  page: {
    fontFamily: FONT,
    background: "#fff",
    color: "#111",
    minHeight: "100vh",
    padding: "48px 32px 80px",
  },
  container: { maxWidth: 1500, margin: "0 auto" },
  title: { fontSize: 22, fontWeight: 700, letterSpacing: -0.2 },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 48 },

  band: { marginBottom: 56 },
  bandHeader: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#9ca3af",
    paddingBottom: 6,
    borderBottom: "1px solid #e5e7eb",
    marginBottom: 24,
  },
  row: {
    display: "flex",
    gap: 0,
    alignItems: "stretch",
    justifyContent: "flex-start",
    flexWrap: "nowrap",
  },

  card: {
    width: 260,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    flexShrink: 0,
  },
  cardHeader: {
    background: "#1f1b18",
    color: "#fff",
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
  },
  cardRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 14px",
    fontSize: 12,
    borderTop: "1px solid #f3f4f6",
    color: "#374151",
  },
  chipBase: {
    fontSize: 10,
    fontWeight: 500,
    padding: "2px 10px",
    borderRadius: 999,
    fontFamily: FONT,
    whiteSpace: "nowrap",
  },

  arrowGutter: {
    flex: "0 0 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
    fontSize: 20,
    fontWeight: 300,
  },
  gapGutter: { flex: "0 0 32px" },

  cluster: {
    border: "1px dashed #d1d5db",
    borderRadius: 10,
    padding: "26px 24px 24px",
    position: "relative",
    display: "flex",
    alignItems: "stretch",
    gap: 0,
  },
  clusterLabel: {
    position: "absolute",
    top: -8,
    left: 16,
    background: "#fff",
    padding: "0 8px",
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 2,
    color: "#9ca3af",
    textTransform: "uppercase",
  },
};

function Chip({ color, children }) {
  const c = CHIP[color] || CHIP.blue;
  return (
    <span style={{ ...styles.chipBase, background: c.bg, color: c.fg }}>
      {children}
    </span>
  );
}

function Card({ title, rows }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>{title}</div>
      {rows.map((r, i) => (
        <div key={i} style={styles.cardRow}>
          <span>{r.label}</span>
          <Chip color={r.color}>{r.value}</Chip>
        </div>
      ))}
    </div>
  );
}

function Arrow() {
  return (
    <div style={styles.arrowGutter} aria-hidden>
      <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
        <path
          d="M1 6 H19 M14 1 L20 6 L14 11"
          stroke="#9ca3af"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

function Gap() {
  return <div style={styles.gapGutter} aria-hidden />;
}

export default function InfraDiagramPage() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.title}>SoundForge — Infrastructure</div>
        <div style={styles.subtitle}>
          End-to-end pipeline · runtime · observability
        </div>

        {/* BAND 1 — CI / CD PIPELINE */}
        <section style={styles.band}>
          <div style={styles.bandHeader}>CI / CD Pipeline</div>
          <div style={styles.row}>
            <Card
              title="Developer"
              rows={[
                { label: "Pre-commit", value: "Husky", color: "peach" },
                { label: "Linter", value: "ESLint", color: "blue" },
                { label: "Secret scan", value: "Gitleaks", color: "red" },
              ]}
            />
            <Arrow />
            <Card
              title="GitHub"
              rows={[
                { label: "Pull requests", value: "code review", color: "blue" },
                { label: "Secrets", value: "OIDC role", color: "peach" },
                { label: "Manifests", value: "watched", color: "green" },
              ]}
            />
            <Arrow />
            <Card
              title="GitHub Actions"
              rows={[
                { label: "Lint + Tests", value: "unit / e2e", color: "blue" },
                { label: "Docker build", value: "ECR push", color: "green" },
                { label: "Fail notify", value: "Slack webhook", color: "red" },
              ]}
            />
            <Arrow />
            <Card
              title="Amazon ECR"
              rows={[
                { label: "Images", value: "tagged $SHA", color: "peach" },
                { label: "Registry", value: "ecr.aws", color: "green" },
              ]}
            />
            <Arrow />
            <Card
              title="EKS Deploy"
              rows={[
                { label: "Manifests", value: "Kustomize", color: "peach" },
                { label: "Strategy", value: "rolling update", color: "blue" },
                { label: "Secrets", value: "K8s Secrets", color: "red" },
                { label: "Registry", value: "ECR", color: "green" },
              ]}
            />
          </div>
        </section>

        {/* BAND 2 — RUNTIME INFRASTRUCTURE */}
        <section style={styles.band}>
          <div style={styles.bandHeader}>Runtime Infrastructure</div>
          <div style={styles.row}>
            <Card
              title="End Users"
              rows={[
                { label: "Browser", value: "HTTPS", color: "green" },
                { label: "Notifications", value: "SSE stream", color: "blue" },
              ]}
            />
            <Arrow />
            <div style={styles.cluster}>
              <span style={styles.clusterLabel}>EKS Cluster</span>
              <Card
                title="ALB Ingress"
                rows={[
                  { label: "TLS termination", value: "HTTPS", color: "green" },
                  { label: "Routing", value: "path-based", color: "blue" },
                  { label: "Load balancing", value: "round-robin", color: "peach" },
                ]}
              />
              <Arrow />
              <Card
                title="Next.js App"
                rows={[
                  { label: "Server", value: "Node / Edge", color: "green" },
                  { label: "Replicas", value: "3", color: "blue" },
                  { label: "Framework", value: "Next 15", color: "green" },
                  { label: "API routes", value: "App Router", color: "lavender" },
                  { label: "ORM", value: "Prisma", color: "peach" },
                ]}
              />
            </div>
            <Arrow />
            <Card
              title="Supabase"
              rows={[
                { label: "Database", value: "PostgreSQL", color: "blue" },
                { label: "Auth", value: "email + OAuth", color: "green" },
              ]}
            />
          </div>
        </section>

        {/* BAND 3 — OBSERVABILITY & ALERTS */}
        <section style={styles.band}>
          <div style={styles.bandHeader}>Observability & Alerts</div>
          <div style={styles.row}>
            <Card
              title="CloudWatch"
              rows={[
                { label: "Scrape target", value: "pods + ALB", color: "blue" },
                { label: "Collected", value: "cpu, mem, 5xx", color: "green" },
              ]}
            />
            <Arrow />
            <Card
              title="Alarms"
              rows={[
                { label: "Rules", value: "5xx > 1%", color: "peach" },
                { label: "Receiver", value: "SNS topic", color: "blue" },
                { label: "Source", value: "CloudWatch", color: "yellow" },
              ]}
            />
            <Arrow />
            <Card
              title="Discord / Slack"
              rows={[
                { label: "Pipeline fails", value: "#alerts", color: "red" },
                { label: "Error alerts", value: "#alerts", color: "red" },
              ]}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
