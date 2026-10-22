# Engineering Documentation — A Practical Writing Standard

> **Audience:** Software engineers writing design docs, architecture notes, READMEs and operational runbooks  
> **Goal:** Produce documents that engineers can trust and act on without needing the original author present.

## 1. What makes engineering documentation excellent?

Top-tier documentation is **accurate, task-oriented, maintained and independently usable**. It is not necessarily long or decorated. A document succeeds when its reader can make a correct decision or complete a procedure with it.

Use five tests:

1. **Discoverable:** The reader can find it by a predictable filename, directory and title.
2. **Scannable:** The reader finds the purpose, current state, prerequisites and action within seconds.
3. **Reliable:** Technical facts match code, configuration and verified behavior.
4. **Executable:** Procedures include commands, expected results, safe failure paths and rollback instructions.
5. **Maintainable:** Ownership and change triggers are clear.

## 2. Pick the right document type first

| Type | Primary question | Common contents | TaskFlow example |
| --- | --- | --- | --- |
| README | What is this and how do I start? | Purpose, quickstart, links | `README.md` |
| Runbook | How do I operate or recover it? | Prerequisites, steps, verification, rollback | `docs/ci-cd.md` release/troubleshooting sections |
| Architecture overview | How is the system organized? | Components, boundaries, data flow, tradeoffs | `docs/architecture.md` |
| Design proposal / RFC | What should we build and why? | Problem, goals, options, decision, risks | `docs/rfcs/0001-staging-deployment.md` |
| ADR | Why was an architectural decision taken? | Context, decision, alternatives, consequences | `docs/adr/0001-docker-compose-for-smoke-tests.md` |
| Incident postmortem | What happened and what will change? | Timeline, impact, root cause, actions | `docs/incidents/2026-10-22-smoke-startup-race.md` |
| API reference | How do clients call the API? | Auth, endpoints, schemas, errors | `docs/api.md` or OpenAPI |

**Do not put everything into one giant README.** The README should link to specialized documents, which each answer a distinct reader question.

## 3. A repeatable writing process

### Step 1 — Identify the audience and decision

Write one sentence: *“This document enables [reader] to [action/decision] without [missing dependency].”*

Example: “This runbook enables a TaskFlow engineer to publish and verify a release without relying on the pipeline author.”

If the reader's task isn't clear, the document is likely to become a collection of unrelated notes.

### Step 2 — Gather primary evidence

Start with code, configuration, command output, diagrams and validated logs. For CI, inspect:

- Workflow `on:`, `jobs`, `needs`, `if`, `permissions` and secrets usage.
- Dockerfiles, Compose configuration, healthchecks and Nginx config.
- Successful and failed workflow runs.
- Registry image naming/tagging conventions.

**Never convert an assumption into a “current-state” claim.** Mark uncertain items as “verify,” “planned” or “not confirmed.”

### Step 3 — Build a document outline

For an operational runbook, use this default sequence:

1. Title and document metadata.
2. Purpose / when to use it.
3. Scope and non-goals.
4. Architecture and system boundaries.
5. Prerequisites and access.
6. Procedure (ordered, copyable commands).
7. Verification / expected output.
8. Failure handling and rollback.
9. Security and risk notes.
10. Ownership, maintenance triggers and reference links.

Not every document needs every section. Choose sections because they help a reader, not because a template demands them.

### Step 4 — Draft from verified facts

Use explicit names, concrete verbs and present-tense descriptions of current behavior. Examples:

**Weak:** “The CI automatically ensures everything works.”

**Strong:** “On a `v*.*.*` tag push, the workflow runs validation jobs, publishes both version-tagged images, starts the Compose stack and checks HTTP responses. This does not deploy to a VPS.”

**Weak:** “Run the deploy command.”

**Strong:** “Set `API_VERSION` and `WEB_VERSION`, run Compose, check `docker compose ps`, then verify `GET /` and `GET /api/tasks`. Stop if a service is unhealthy.”

### Step 5 — Add proof and boundaries

For every important promise, describe *how to verify it* and *what it does not prove*. A green CI status means configured tests passed—not that all possible bugs were eliminated. A published image is not the same as a deployed service.

### Step 6 — Simulate a first-time reader

Ask a teammate (or yourself on a fresh checkout): Can they find the right section? Do commands use paths that exist? Are requirements and permissions specified? Is there an expected success/failure signal? Are dangerous commands annotated?

### Step 7 — Review, publish and maintain

Treat docs as code. Review them in PRs, link them from the README, and update them in the same PR when relevant behavior changes. Prefer a short, accurate document over a comprehensive stale one.

## 4. Style standards

### 4.1 Titles and headings

- One H1 title per document.
- H2 for major reader questions or lifecycle stages.
- H3 for specific subtopics.
- Prefer informative headings like “Verify the published images” instead of “Other details.”

### 4.2 Commands and examples

- Provide language identifiers on code fences (`bash`, `yaml`, `json`).
- Distinguish illustrative snippets from exact current configuration.
- Avoid embedding real secrets, personal tokens or internal credentials.
- Explain environment variables before first use.
- Give expected output or success criteria after important commands.
- Explain destructive effects, especially `docker compose down -v`, database resets and force pushes.

### 4.3 Diagrams

Choose the diagram that explains the question:

- **Flowchart:** validation and deployment stages.
- **Sequence diagram:** HTTP request path, deployment handshake, token flow.
- **Component diagram:** systems and service boundaries.
- **State diagram:** task, release or approval lifecycles.

Every diagram needs a useful title/context; explain boundaries and arrows. Do not draw a diagram merely for visual decoration.

### 4.4 Tables

Tables are best for triggers, states, responsibilities and troubleshooting mappings—not for long paragraphs. Avoid ambiguous status labels; use “Verified,” “Configured, not observed,” “Planned” and “Not applicable” when appropriate.

### 4.5 Tone

Write direct, neutral, precise prose. Avoid marketing phrases (“enterprise-ready,” “bulletproof,” “fully secure”) unless justified by defined criteria. Use “must” for requirements, “should” for recommendations and “may” for options.

## 5. Copyable templates

### 5.1 Runbook skeleton

```markdown
# <System> — <Procedure>

> Owner: <team>  
> Status: <verified / draft>  
> Last reviewed: <YYYY-MM-DD>

## Purpose and when to use
## Scope and non-goals
## Preconditions and access
## Architecture / dependencies
## Step-by-step procedure
## Expected results / verification
## Failure handling
## Rollback / cleanup
## Security considerations
## References and maintenance
```

### 5.2 Design proposal skeleton

```markdown
# RFC: <Decision to make>

## Summary
## Problem / context
## Goals and non-goals
## Requirements and constraints
## Proposed design
## Alternatives considered
## Tradeoffs and risks
## Rollout and migration
## Observability and rollback
## Open questions
## Decision and owner
```

### 5.3 Architecture decision record skeleton

```markdown
# ADR-0001: <Decision>

Status: Accepted | Proposed | Superseded
Date: <YYYY-MM-DD>

## Context
## Decision
## Alternatives
## Consequences
## Review trigger
```

## 6. Apply this standard to TaskFlow

A good documentation tree grows *with* the system:

```text
docs/
├── ci-cd.md                     # Current CI, image publishing and release runbook
├── documentation-guide.md      # Your internal documentation standard
├── architecture.md             # Later: services and request/data flow
├── operations/
│   ├── staging-deploy.md       # Later: deployment runbook
│   └── rollback.md             # Later: recovery procedure
├── adr/
│   └── 0001-ci-smoke-compose.md
└── incidents/
    └── ...
```

These are **suggested future files**, not claims they exist now. Start with only the two supplied files, link them from README and add the rest when a real need appears.

## 7. Engineering documentation review checklist

Use this before approving a docs PR:

- [ ] Reader, purpose and scope are explicit.
- [ ] Title, filename and directory make the doc discoverable.
- [ ] Current behavior is verified from source or clearly marked uncertain.
- [ ] Commands are executable, safe and version/path aware.
- [ ] Inputs, prerequisites and permissions are documented.
- [ ] Expected success and failure outputs are understandable.
- [ ] Security-sensitive material is not exposed.
- [ ] Failure cases and rollback/cleanup are documented where relevant.
- [ ] Diagrams and tables explain something material.
- [ ] The document says what is *not* implemented.
- [ ] Owner, status and maintenance trigger are included.
- [ ] README or relevant index links to the document.

## 8. A practice exercise

1. Open `docs/ci-cd.md` and identify three claims about current TaskFlow behavior.
2. Locate each claim's evidence in `.github/workflows/`, `compose.yaml` or GitHub Actions run logs.
3. Pick one claim that is marked “verify” and resolve it from the code.
4. Improve one troubleshooting row with an exact diagnostic command and a clear interpretation.
5. Ask someone unfamiliar with TaskFlow to follow the release-verification section without your help.

**You have mastered the skill when another engineer can correctly use and maintain your documentation without contacting you.**

## 9. Further reading

- [Google Technical Writing Courses](https://developers.google.com/tech-writing)
- [Diátaxis documentation framework](https://diataxis.fr/)
- [Write the Docs](https://www.writethedocs.org/)
- [GitHub Markdown guide](https://docs.github.com/en/get-started/writing-on-github)
