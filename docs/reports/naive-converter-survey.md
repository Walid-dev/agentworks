# Naive-baseline converter survey

**Date:** 2026-08-07. Read-only registry survey; no installs during the
survey. Kept as the receipt Phase 4's essay refers to when it describes
"what a developer would grab today" for OpenAPI → MCP.

## Rubric (all items required)

- (a) Generates a runnable stdio MCP server from an OpenAPI 3.x spec.
- (b) TypeScript/Node output — same runtime and transport as the
  curated lane, so the comparison stays one-variable.
- (c) Unmodified output can authenticate via env or documented config.
  Configuration is usage; source editing is forbidden.
- (d) Published within the last 12 months (i.e., after 2025-08-07).
- (e) Representativeness: npm weekly downloads and GitHub stars —
  highest-adoption candidate passing every other item wins.

## Candidates surveyed

Four candidates found via npm search + web results for "openapi to mcp":

| Name | Version | Weekly DL | Stars | Last publish | Output | Auth | Rubric |
|------|---------|-----------|-------|--------------|--------|------|--------|
| **openapi-mcp-generator** (harsha-iiiv) | **4.0.1** | **14,776** | **630** | 2026-06-14 | TS Node project (stdio / SSE / HTTP); CLI generates `package.json`, `tsconfig.json`, `.env.example`, `src/index.ts` | Env vars: `API_KEY_<SCHEME>`, `BEARER_TOKEN_<SCHEME>`, `BASIC_*_<SCHEME>`, OAuth2 variants; `API_BASE_URL` override | **all pass** |
| mcp-from-openapi (agentfront) | 2.5.1 | 8,936 | 1 | 2026-07-21 | **Library only** — no CLI, no standalone server; developer writes their own MCP server code | Framework-agnostic; auth values sourced by the integrating developer | **fails (a)** — library, not a runnable server generator |
| openapi-mcp-converter (zxypro1) | 0.0.8 | 1 | (repo unreachable via GH API) | 2025-05-09 | JS | not confirmed | **fails (d)** — 15 months since last publish |
| openapi-mcpserver-generator (vincent-pli) | 1.2.0 | 2 | 1 | 2025-05-08 | JS (`src/index.js`) | not confirmed | **fails (d)** — 15 months since last publish |

Data sources, pulled 2026-08-07:

- Versions and publish dates: `https://registry.npmjs.org/<name>`.
- Weekly downloads (2026-07-31 → 2026-08-06): `https://api.npmjs.org/downloads/point/last-week/<name>`.
- Stars: `https://api.github.com/repos/<owner>/<name>`.
- Output type and auth mechanism: each project's README.

## Verdict

**openapi-mcp-generator@4.0.1.** Sole survivor of the rubric. Dominant
by ~1.6× on downloads and ~630× on stars over the next passing
candidate. Not close — the runner-up (`mcp-from-openapi`) fails
rubric (a).

## Sources

- [openapi-mcp-generator on npm](https://www.npmjs.com/package/openapi-mcp-generator)
- [openapi-mcp-generator on GitHub (harsha-iiiv)](https://github.com/harsha-iiiv/openapi-mcp-generator)
- [mcp-from-openapi on npm](https://www.npmjs.com/package/mcp-from-openapi)
- [mcp-from-openapi on GitHub (agentfront)](https://github.com/agentfront/mcp-from-openapi)
- [openapi-mcp-converter on npm](https://www.npmjs.com/package/openapi-mcp-converter)
- [openapi-mcpserver-generator on npm](https://www.npmjs.com/package/openapi-mcpserver-generator)

## Applied

Generator invoked with **only `--input` and `--output`** — no filtering,
tag selection, or trimming flags. Naive means the whole spec, raw.

```
npx -y openapi-mcp-generator@4.0.1 \
  --input docs/specs/shortcut-openapi.json \
  --output servers/naive
```

Output summary:

- Tool count: **143** (from 85 OpenAPI paths — GET/POST/PUT/DELETE variants).
- Layout: full Node project — `package.json`, `tsconfig.json`,
  `.env.example`, `src/index.ts` (single file, 2,340 lines).
- Ships its own devDependencies (typescript, shx) and dependencies
  (@modelcontextprotocol/sdk ^1.10.0, axios, dotenv, zod ^3.24.3,
  json-schema-to-zod). No filtering applied to any of these.

Security-scheme mapping for step 0.12's `mcp-exam-naive.json`:

- Shortcut's OpenAPI declares `security: [{ api_token: [] }]` with
  scheme `{ type: "apiKey", in: "header", name: "Shortcut-Token" }`.
- The generator's `API_KEY_<SCHEME_NAME>` pattern maps this to
  **`API_KEY_API_TOKEN`** — verified against the generated
  `.env.example`.
- `API_BASE_URL` is optional; the spec bakes in
  `https://api.app.shortcut.com`.

License: MIT.
