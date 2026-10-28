# IAIA — Industrial Architecture Intelligence Agent

IAIA is a local-first application for evidence-based architecture discovery and static security triage. The React dashboard calls a FastAPI service; analysis results, project metadata, and remediation task statuses are persisted in SQLite.

Uploaded content is treated as untrusted data. IAIA does not execute source code, build scripts, containers, PLC software, or commands; it does not connect to discovered hosts or industrial equipment.

## Problem and intended users

**Problem hypothesis:** architecture and security evidence is spread across manifests, deployment configuration, source, and documentation, making an evidence-backed review slower and more fragmented. IAIA assembles supported evidence into a component inventory, relationship graph, findings, and exports.

**Candidate users:** software/system architects, application owners, and security reviewers assessing a software project's architecture. These user groups and their pain points have not yet been validated with named hackathon stakeholders. Measure review time and user outcomes in a pilot before making business-impact claims.

The hackathon brief uses **AIAI** while this repository, UI, and API use **IAIA**. Confirm the official product name with the team before changing branding.

## What IAIA does, in plain language

Think of IAIA as a static reader for a software project. It looks at source and configuration files, extracts component names and declared dependencies, runs a small set of transparent security rules, then displays those results. It does not launch the application or check whether a server is reachable.

- **Files inventoried** counts supported text files that remain after ignored cache/generated folders are removed. A ZIP's directories, images, fonts, and other binaries are not source files.
- **Components** are things the analyzer could name from a manifest, deployment file, or explicit architecture document. A source file by itself does not automatically become a service.
- **Relationships** are most commonly package dependencies declared in dependency manifests. A link such as `service-a depends on package-x` does not mean those two services communicate over a network. Network links appear only when explicit Compose dependencies or supported architecture evidence says so; prose-derived links are labeled inferred.
- **Findings** are matches for supported rules, not proof of a vulnerability. A credential-like string can be a test/example value; a cleartext URL may have context the static rule cannot know. Values are redacted for display.
- **Severity** belongs to a finding. **Component risk** is a separate, rough prioritization score; it is not a probability that a component will be compromised.
- **Blast radius** follows graph edges to calculate reachability. It shows possible architectural impact based on supplied evidence, not a forecast of how a real attack or outage would propagate.

Start with the synthetic demo to learn the pages. For your own project, create a workspace, upload its ZIP, then click **Run analysis**. Use **Components** for the inventory, **Architecture map** for declared/inferred links, **Security findings** for evidence and remediation, **Evidence & validation** for review records, **Impact analysis** for graph traversal, and **Reports & history** to export or revisit runs.

You can also click **Import Git repo** and paste a public GitHub, GitLab, or Bitbucket repository URL. **Preview repository** shows provider metadata (description, branch/ref, language, license if reported, stars, and repository size) before downloading anything. Review it, then choose **Import and analyze**. The Overview then shows the source/ref, imported file count, archive size, and analysis results. Private repositories, credentials in URLs, arbitrary hosts, and repositories whose archives exceed IAIA's limits are rejected. Git itself and all project code remain unexecuted.

GitHub may rate-limit anonymous metadata requests. Set an optional `GITHUB_TOKEN` in the backend environment to use authenticated public-repository quota; IAIA still rejects repositories marked private and never stores or logs the token. Without a token, retry later or download the public ZIP and use **Upload source**.

## Requirements

- Python 3.10 or newer (recommended: Python 3.13 with the Windows Python launcher)
- Node.js 20 or newer and npm (recommended: Node.js 22 LTS)
- On Windows: Windows PowerShell 5.1, a writable local project folder, and internet access for first-time dependency downloads
- Windows PowerShell commands below assume the workspace root is the current directory

## Install

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
npm install
```

## Run

On Windows, double-click `run_iaia.bat` to prepare dependencies, start both services in the background, and open the app in your browser. Double-click `stop_iaia.bat` to stop only the processes recorded by this copy of the launcher. If you started either service in a VS Code terminal, press Ctrl+C in that terminal to stop it.

### Copying IAIA to another Windows machine

1. Install Python and Node.js/npm using the requirements above. Reopen terminals after installation so PATH is refreshed. No administrator access is needed to run IAIA once these tools are installed.
2. Copy the complete source folder, including `deploy`, `backend`, `src`, `package.json`, and `package-lock.json`. Do **not** copy `.venv`, `.venv-iaia`, `node_modules`, `.iaia`, `dist`, or cache folders: Python environments and native Node dependencies are machine-specific. The two large sample ZIPs and presentation assets are not required to run the application.
3. Double-click `run_iaia.bat` in the copied folder. The first run downloads dependencies and may take several minutes. Paths containing spaces are supported; no hard-coded user or installation paths are required.

Keep `backend\iaia.sqlite3` only if you want to carry existing projects and analysis history; omit it for a fresh database. Reconfigure any machine-specific environment variables such as `IAIA_DB_PATH` on the destination.

The launcher uses its own `.venv-iaia`, leaving any manually created `.venv` untouched. It rebuilds its generated Python environment and reinstalls Node dependencies when the project path, selected runtime, or dependency manifests change, so accidentally copied runtime folders are not trusted. Do not store your own files in `.venv-iaia` or `node_modules`; these generated directories can be replaced during setup. Subsequent launches reuse verified dependencies. Keep `package-lock.json` with the source so npm can use `npm ci`.

The local launcher binds both services to the loopback interface only, with fixed ports 8000 and 5173. It does not expose the demo to the network. A port occupied by another application or a manually started IAIA service produces an explicit error instead of opening the wrong application or silently changing ports.

**Troubleshooting:** startup output is shown in the launcher window. Service output is saved in `.iaia\backend.log`, `.iaia\backend.error.log`, `.iaia\frontend.log`, and `.iaia\frontend.error.log`. If a tracked service becomes unhealthy, stop it with `stop_iaia.bat`, inspect these logs, and retry. Dependency-download failures require working internet/proxy access; missing runtimes must be installed before retrying. Do not move or copy a folder while its services are running.

For a terminal/automated launch without opening a browser:

```powershell
.\run_iaia.bat -NoBrowser
```

Automation can set `$env:IAIA_NO_PAUSE = '1'` to suppress the error pause; startup failures return a nonzero exit code. The `.bat` launchers target Windows; on macOS/Linux use equivalent virtual-environment activation commands and start the services manually.

Alternatively, after the manual **Install** steps above, start the backend in one terminal from the workspace root:

```powershell
python -m uvicorn backend.app.main:app --reload --port 8000
```

Start the frontend in a second terminal:

```powershell
npm run dev -- --port 5173
```

Open <http://localhost:5173>. API health is available at <http://localhost:8000/api/health>; interactive OpenAPI documentation is at <http://localhost:8000/docs>.

The backend creates `backend/iaia.sqlite3` on first start. Override its location with `IAIA_DB_PATH` if desired. The browser currently expects the backend at `http://localhost:8000`.

## Demo workflow

1. Start both services.
2. Select **Load demo project**. The synthetic PlantWatch files are analyzed by the same deterministic pipeline as uploaded files; no final graph or findings are precomputed.
3. Inspect pipeline stages, inventory, relationships, findings, scores, recommendations, and the graph.
4. In **Blast radius**, select a component and traversal direction, then calculate reachability. This is potential architectural impact, not a prediction of real compromise propagation.
5. Update roadmap task status and export JSON or HTML from **Reports & history**.

The demo deliberately includes a credential-like value, a privileged service, an all-interface port binding, and a Dockerfile with no non-root user. Secret-like values are redacted from evidence and reports.

## Architecture Evolution

Open **Architecture evolution** after analysis. **Before** is the discovered graph; **After** retains it and adds only clearly marked proposed security controls generated from existing finding-linked recommendations; **Compare** shows both graphs side by side. The change list labels additions, unchanged elements, and any future modified/removed states. Current components and edges are not mutated by recommendations. A proposed change can be Accepted, Rejected, or Implemented; the decision is saved with that analysis run and links back to its finding.

Proposed controls are architectural suggestions, not deployed components. This version does not infer that existing edges should be removed or that a monolith can be split. Trust zones, authentication, encryption, protocols, and ports remain Unknown unless the input explicitly establishes them.

## Export Center

Open **Reports & history** or **Architecture evolution** and choose Current, Proposed, or Before/After. Include options control findings markers, trust-boundary notes, relationship labels, legend, and project metadata.

- **SVG** is a complete vector graph; **PNG** is a 2× raster of the complete graph.
- **Draw.io** is editable XML for diagrams.net; nodes and edges remain separate editable cells.
- **Diagram PDF** uses landscape pages and paginates large graphs. Compare PDF includes current and proposed sections; **Report PDF** contains the executive summary and priority findings.
- **Excel** includes Executive Summary, Components, Dependencies, Security Findings, Validation Results, Trust Boundaries, Blast Radius, Recommendations, and Architecture Changes. Empty sheets state that the run has no data. Unknown trust attributes remain Unknown; values are redacted. For graphs larger than 200 components, the all-pairs Blast Radius sheet is capped at the 200 highest-risk starting nodes and 20,000 rows; the sheet records that bound, while the API can calculate a selected component on demand.
- **JSON** preserves the full run, graph, changes, and provenance; **HTML** is a printable summary.

Exports are generated from the selected run. They do not claim proposed controls are deployed, and compare exports keep current and proposed data separate.

## Supported inputs and limits

- ZIP archives and individual UTF-8 text files: Python, JavaScript/TypeScript, Java, Go, Rust, shell, JSON, YAML, TOML, XML, environment/configuration files, Markdown, Terraform text, and SQL.
- Dependency extraction: `package.json`, `requirements.txt`, and Maven `pom.xml`.
- Deployment discovery and configuration checks: Dockerfile, Docker Compose YAML, and Kubernetes YAML resources.
- Imported scanner results: SARIF JSON.
- Explicit architecture JSON/YAML can declare `components` (or `nodes`/`services`) and `relationships` (or `edges`); declared links cite that document. Markdown lines such as `Dashboard calls API.` are accepted as inferred links and cite the source line.
- Default limits: 100 MiB upload/archive, 300 MiB expanded source, 5,000 supported source/config files, 25,000 total ZIP entries, and 500:1 maximum declared compression ratio. Binaries and common generated/cache directories (including `node_modules`, `dist`, and virtual environments) do not count as supported files and are excluded. A folder named `build` is not automatically ignored because projects may store real deployment configuration there.
- Limits can be raised with `IAIA_MAX_UPLOAD_MB`, `IAIA_MAX_EXPANDED_MB`, `IAIA_MAX_SUPPORTED_FILES`, `IAIA_MAX_ARCHIVE_ENTRIES`, and `IAIA_MAX_COMPRESSION_RATIO`. Hard ceilings are 512 MiB, 2,048 MiB, 20,000 files, 100,000 entries, and 1,000:1 respectively. Set these before starting the backend. Limits cannot be disabled entirely because imported archives are untrusted.

Architecture JSON/YAML uses a small explicit schema rather than attempting to understand arbitrary documents. CycloneDX and SPDX SBOMs, SARIF variants beyond the implemented fields, and vulnerability database lookups are not supported. IAIA never asserts a dependency vulnerability without supplied scanner evidence.

## Analysis and risk model

Rules identify credential-like assignments, non-local cleartext HTTP references, Dockerfiles without a non-root user, privileged/host-network workload settings, all-interface port bindings, published ports, Kubernetes LoadBalancer services, and imported SARIF findings. Findings distinguish IAIA rules from imported results and redact matched values.

Dependency edges are extracted from manifests and Compose declarations. Connections inferred from explicit architecture prose are labeled inferred. Missing evidence stays missing; the graph is not completed with invented links.

Component risk is an explainable triage heuristic, not a probability or validated security measurement. It combines severity-weighted finding confidence, provisional role-based criticality, supported exposure indicators, and dependent graph impact, capped at 100. Validate criticality with system owners. A zero finding count does not mean a system is secure.

The Copilot searches the current project's uploaded text files for ranked source excerpts and combines them with findings, components, relationships, graph reasoning, and up to 8 recent chat turns for follow-ups. It returns file/line citations and redacted excerpts; retrieval is lexical and bounded to 12 million characters and 8 excerpts per question, so it can miss relevant code. Source search is disabled if project files changed after the selected analysis; rerun analysis first. An optional Azure OpenAI adapter can use the same selected excerpts, bounded analysis context, and recent chat turns. It is disabled unless `IAIA_GENAI_ENABLED` is explicitly true; invalid citations or provider failures fall back to local answers. Citation IDs are checked, but model claims are not semantically verified. Obtain data-handling approval before enabling it. The full repository is not sent. See [Azure OpenAI setup](docs/AZURE_OPENAI_SETUP.md) and [GenAI records](genai_prompts/README.md). Reports include source evidence, graph, findings, risk factors, and remediation tasks; HTML output escapes source-derived text.

## Evidence validation and review

Open **Validation center** to inspect each finding's stable fingerprint, rule/analyzer metadata, source SHA-256, evidence excerpt, line location, and current verification status. IAIA compares the recorded source hash and redacted line excerpt against the project's currently stored files; changed or unavailable evidence is marked for re-analysis. The complete source tree is not snapshotted per run, so an earlier revision cannot be reconstructed after project inputs change.

Review decisions are appended to a local SQLite audit history with status, reason, procedure, expected/observed result, and timestamp. **Fixed and verified** requires those validation details, but it is an operator-reported record: IAIA does not execute the test, authenticate the operator, or independently verify the result. Standards mappings are shown as not mapped until a versioned, evidence-supported registry is implemented.

## Hackathon readiness records

- [Architecture](docs/ARCHITECTURE.md) and the [working threat model](docs/THREAT_MODEL.md) describe the inspected implementation and security boundaries; the threat model is not an approved security assessment.
- [Gate 1](docs/GATE1_IDEA_VALIDATION.md) and [Gate 2](docs/GATE2_CONCEPT_APPROVAL.md) are working approval records; mentor/security/service-reuse approvals remain pending.
- [Originality assessment](docs/ORIGINALITY_ASSESSMENT.md) documents why no contribution percentage is claimed yet.
- [Gate readiness and provisional scoring](docs/HACKATHON_READINESS.md) track evidence gaps, required approvals, and the business-case inputs still to collect.
- [GenAI records](genai_prompts/README.md) distinguish the default deterministic assistant from the optional, unverified Azure integration path.
- [Local deployment helpers](deploy/README.md) are for development/demo use only.

```powershell
$env:GITHUB_TOKEN = "<optional-github-token-for-public-api-quota>"
```

## API overview

- `GET /api/health`
- `GET/POST /api/projects`
- `POST /api/projects/{id}/upload`
- `POST /api/projects/{id}/analyze`
- `POST /api/repositories/preview` and `/api/repositories/import`
- `POST /api/demo`
- `GET /api/projects/{id}/runs`, `GET /api/runs/{id}`
- `GET /api/runs/{id}/components`, `/graph`, and `/findings`
- `GET /api/runs/{id}/validation` and `PATCH /api/runs/{id}/findings/{finding_id}/review`
- `GET /api/runs/{id}/architecture`
- `PATCH /api/runs/{id}/architecture-changes/{change_id}`
- `GET /api/runs/{id}/blast-radius/{component_id}`
- `POST /api/runs/{id}/copilot`
- `PATCH /api/runs/{id}/tasks/{task_id}`
- `GET /api/runs/{id}/report.json` and `/report.html`
- `GET /api/runs/{id}/report.xlsx` and `/report.pdf`
- `GET /api/runs/{id}/diagrams/{current|proposed|compare}.{svg|png|drawio|pdf}`

## Tests and build

```powershell
python -m pytest backend/tests -q
npm run build
```

The backend tests cover safe ZIP ingestion, demo analysis and persistence, manifest/configuration discovery, secret redaction, source hashes and stable finding fingerprints, evidence-linked relationships, risk factors, blast-radius traversal, copilot answers, finding-review audit history, stale-evidence detection, current/proposed comparison, persistent decisions, SVG/PNG/Draw.io/PDF generation, XLSX sheet names/headers/row counts, and JSON/HTML endpoints. The frontend is type-checked and production-bundled; there is no separate frontend unit-test suite yet.

## Limitations

- No private Git import, live target discovery, PLC/OT control, GraphML export, imported SPDX/CycloneDX parsing, CVE feed, authentication, or multi-user access control. Git imports support public GitHub, GitLab, and Bitbucket repositories only.
- Finding review history records a local operator assertion without authenticated identity. IAIA does not run validation procedures, independently verify fixes, or currently provide versioned ASVS, SSDF, CVSS, ATT&CK for ICS, or IEC 62443 mappings.
- Static rules can produce false positives and cannot establish runtime reachability, exploitability, or system safety.
- SQLite stores project inputs and results locally. Protect the workspace and database according to your data-handling requirements.
- This is an offline architecture-assistance tool, not a substitute for safety engineering, threat modeling, or a qualified security assessment.