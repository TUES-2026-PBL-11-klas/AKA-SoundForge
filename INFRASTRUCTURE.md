# SoundForge — Infrastructure

End-to-end infrastructure for SoundForge. Built around AWS + Kubernetes + GitHub Actions + Helm. Single repo, fully automated, no manual cluster changes.

---

## 1. Overview

```
Developer
   │  git push
   ▼
GitHub  ── pre-commit hooks (gitleaks, lint, typecheck) ──┐
   │                                                       │
   │  triggers GitHub Actions                              │
   ▼                                                       │
CI: lint → test → docker build → push to ECR              │
   │                                                       │
   ▼                                                       │
CD: kubectl apply -k (Kustomize) → EKS                    │
   │                                                       │
   ▼                                                       ▼
EKS cluster (prod / dev namespaces)              Slack/Discord webhook
   ├─ App pods                                   (build + deploy status)
   ├─ External Secrets Operator ── AWS Secrets Manager
   ├─ Fluent Bit ──→ CloudWatch Logs
   └─ Container Insights ──→ CloudWatch Metrics ──→ Alarms ──→ SNS ──→ Webhook
```

---

## 2. Stack summary

| Layer | Tool |
|---|---|
| Cloud | AWS |
| Orchestrator | Amazon EKS (managed Kubernetes) |
| Container registry | Amazon ECR |
| IaC | Terraform |
| Source | GitHub |
| Pre-commit | `pre-commit` framework + gitleaks |
| CI | GitHub Actions |
| CD | kubectl + Kustomize + GitHub Actions (direct deploy) |
| Secrets | AWS Secrets Manager + External Secrets Operator + GitHub Secrets |
| Observability | CloudWatch (Container Insights + Logs) |
| Alerting | CloudWatch Alarms → SNS → Slack/Discord webhook |

---

## 3. Pre-commit hooks

Configured via `.pre-commit-config.yaml` in the repo root. Runs locally on every commit before the commit lands.

```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
  - repo: local
    hooks:
      - id: eslint
        name: eslint
        entry: npx eslint
        language: system
        files: \.(ts|tsx|js|jsx)$
      - id: typecheck
        name: typecheck
        entry: npx tsc --noEmit
        language: system
        pass_filenames: false
```

**Purpose:**
- `gitleaks` — blocks committed secrets (AWS keys, tokens, passwords)
- `eslint` + `typecheck` — blocks broken code
- `check-yaml` / `check-added-large-files` — basic hygiene

Devs install once: `pre-commit install`.

---

## 4. CI/CD pipeline (Lead Time automation)

Single workflow `.github/workflows/deploy.yml` triggered on push to `main`.

### Steps
1. Checkout
2. Setup Node, install deps
3. Lint
4. Typecheck
5. Unit tests
6. Build Docker image, tag with `$GITHUB_SHA`
7. Push to ECR
8. Configure kubectl for EKS
9. `kubectl apply -k` (Kustomize overlay) and patch image tag
10. Wait for rollout, send Slack webhook (success or failure)

### Example workflow

```yaml
name: deploy

on:
  push:
    branches: [main]

env:
  AWS_REGION: eu-central-1
  ECR_REPO: 123456789.dkr.ecr.eu-central-1.amazonaws.com/soundforge
  CLUSTER: soundforge-prod

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }

      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - uses: aws-actions/amazon-ecr-login@v2

      - name: Build & push image
        run: |
          docker build -t $ECR_REPO:$GITHUB_SHA .
          docker push $ECR_REPO:$GITHUB_SHA

      - name: Configure kubectl
        run: aws eks update-kubeconfig --name $CLUSTER --region $AWS_REGION

      - name: Deploy with Kustomize
        working-directory: k8s/overlays/prod
        run: |
          kustomize edit set image soundforge=$ECR_REPO:$GITHUB_SHA
          kubectl apply -k .
          kubectl rollout status deployment/soundforge -n prod --timeout=5m

      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            { "text": "Deploy ${{ job.status }} — ${{ github.sha }}" }
```

---

## 5. Kubernetes orchestration — EKS

- **Cluster:** `soundforge-prod`, single region (eu-central-1)
- **Node group:** 2–3 × `t3.medium` (autoscaled 2 → 5)
- **Namespaces:** `dev`, `prod`, `monitoring`, `external-secrets`
- **Ingress:** AWS Load Balancer Controller → ALB → Service

---

## 6. Kustomize (CD)

Manifests live in-repo at `k8s/`. No templating — pure YAML + per-env overlays.

```
k8s/
├── base/
│   ├── kustomization.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── externalsecret.yaml
│   └── hpa.yaml
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml
    │   └── patch-replicas.yaml
    └── prod/
        ├── kustomization.yaml
        └── patch-resources.yaml
```

**`base/kustomization.yaml`**
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml
  - ingress.yaml
  - externalsecret.yaml
  - hpa.yaml
images:
  - name: soundforge
    newName: 123456789.dkr.ecr.eu-central-1.amazonaws.com/soundforge
    newTag: latest
```

**`overlays/prod/kustomization.yaml`**
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: prod
resources:
  - ../../base
patches:
  - path: patch-replicas.yaml
  - path: patch-resources.yaml
```

**`overlays/prod/patch-replicas.yaml`**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: soundforge }
spec: { replicas: 3 }
```

Commands:
- `kubectl kustomize k8s/overlays/prod` — preview rendered manifests
- `kubectl apply -k k8s/overlays/prod` — idempotent deploy (used by CI)
- `kustomize edit set image soundforge=$ECR_REPO:$SHA` — bump image tag in CI
- `kubectl rollout undo deployment/soundforge -n prod` — one-command rollback

---

## 7. IaC — Terraform

Everything in AWS is managed by Terraform. No clicking in the AWS console.

```
terraform/
├── backend.tf         # S3 + DynamoDB state lock
├── providers.tf
├── vpc.tf             # VPC, subnets, NAT
├── eks.tf             # EKS cluster + node group
├── ecr.tf             # container registry
├── iam.tf             # roles for CI, External Secrets, ALB Controller
├── secrets.tf         # AWS Secrets Manager entries (values injected manually once)
├── route53.tf         # DNS
└── cloudwatch.tf      # log groups, alarms, SNS topic
```

**State management**
- Backend: S3 bucket `soundforge-tf-state`
- Locking: DynamoDB table `soundforge-tf-lock`
- Workspace per env if needed

**Apply flow**
- Local: `terraform plan` for review
- CI: optional separate workflow on `terraform/**` changes that runs `terraform apply` after manual approval

---

## 8. Configuration & Secrets

### Runtime secrets (DB password, third-party API keys)
- Stored in **AWS Secrets Manager**
- **External Secrets Operator** (deployed via Helm into `external-secrets` namespace) syncs them into Kubernetes `Secret` objects
- Pods mount them as env vars

**ExternalSecret example (`k8s/base/externalsecret.yaml`):**
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: soundforge-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: soundforge-secrets
  data:
    - secretKey: DATABASE_URL
      remoteRef: { key: soundforge/prod, property: database_url }
    - secretKey: SUPABASE_SERVICE_KEY
      remoteRef: { key: soundforge/prod, property: supabase_service_key }
```

### CI-time secrets
- **GitHub Secrets** only — limited to:
  - `AWS_DEPLOY_ROLE_ARN` (OIDC-assumed role)
  - `SLACK_WEBHOOK`
- No long-lived AWS keys in CI — uses OIDC trust between GitHub Actions and an IAM role

### Non-sensitive config
- ConfigMap in `k8s/base/` or per-env patch in `k8s/overlays/*/`

---

## 9. Observability — CloudWatch

### Metrics
- **Container Insights** enabled on the EKS cluster — pod-level CPU, memory, network, restart count out of the box
- Dashboards in CloudWatch (one per env)

### Logs
- **Fluent Bit** DaemonSet ships every container's stdout/stderr to **CloudWatch Logs**
- Log group `/aws/eks/soundforge/containers`
- Retention: 14 days

### Alerts
- **CloudWatch Alarms** on:
  - Pod restart count > 3 in 5min
  - 5xx rate > 1%
  - CPU > 80% sustained
  - Memory > 85%
- Alarms publish to an **SNS topic** `soundforge-alerts`
- SNS → **Lambda** (small handler) → Slack/Discord **webhook**

---

## 10. End-to-end Lead Time flow

```
1. Dev writes code
2. git commit  →  pre-commit hooks run (gitleaks, lint, typecheck)
3. git push    →  GitHub Actions fires
4. CI: lint, typecheck, tests, docker build, push to ECR
5. CD: `kustomize edit set image` + `kubectl apply -k` against EKS
6. Pods roll out (rolling update, `kubectl rollout status`)
7. Slack webhook reports success/failure
8. CloudWatch picks up new pod metrics & logs
9. If anything breaks: alarm → SNS → Slack
10. Rollback if needed: `kubectl rollout undo deployment/soundforge`
```

Total time from `git push` to running in prod: typically 4–6 min.

---

## 11. Requirements coverage

| Requirement | Implementation |
|---|---|
| Pre-commit hooks | `pre-commit` framework + gitleaks |
| Full CI/CD cycle | GitHub Actions workflow end-to-end |
| CI with tests + webhook | npm test + Slack webhook step |
| CD with proper tech | kubectl + Kustomize + GitHub Actions |
| Observability + alerting | CloudWatch + Alarms → SNS → webhook |
| Orchestrator | Amazon EKS |
| IaC (no manual changes) | Terraform for all AWS resources |
| Secrets management | AWS Secrets Manager + External Secrets + GitHub Secrets (OIDC) |

---

## 12. Out of scope (for now)

- Multi-region / DR
- Service mesh (Istio / Linkerd)
- Progressive delivery (Argo Rollouts, Flagger)
- Separate GitOps repo (intentionally avoided — single repo for simplicity)
- Self-hosted Prometheus/Grafana (using CloudWatch instead)
