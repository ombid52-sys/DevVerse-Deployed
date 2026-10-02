# DevVerse

> **Modern cloud platform to showcase, inspect, and run applications alongside complete interactive source repositories.**

[![Live Production](https://img.shields.io/badge/Live%20Demo-devverse.run.place-blue?style=flat-square)](https://devverse.run.place)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=flat-square)](LICENSE)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest%20Passed-emerald?style=flat-square)](https://vitest.dev/)

---

## 🌟 Key Features

- **Multi-Platform Showcase**: Catalog software across Windows, Linux, macOS, Android, and Web applications.
- **Interactive Runtime Sandbox**: Execute static web applications directly inside an isolated browser sandbox.
- **In-Browser Code Inspector**: GitHub-inspired repository tree browser with syntax highlighting, language distribution stats, and verified ZIP downloads.
- **Hardened Cloud Storage**: Backblaze B2 (S3-compatible) storage with ZipSlip prevention, decompression bomb checks, and server-side authorization.
- **Governance & Real-Time Audit**: Single master administrator account, granular account status management (`Active`, `Disabled`, `Suspended`), and a live Server-Sent Events (SSE) audit stream.
- **Developer Workspaces & Collections**: Manage application visibility (`Public` / `Private`), track source health, and curate personal collections.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Vanilla CSS + Tailwind CSS (Utilitarian glassmorphism) |
| **Database** | MongoDB (Native Driver with indexes & connection pooling) |
| **Object Storage** | Backblaze B2 (S3 SDK `@aws-sdk/client-s3`) |
| **Security & Auth** | JOSE (JWT via HTTP-only SameSite cookies), bcryptjs, Zod |
| **Testing** | Vitest (33 automated unit, integration & security tests) |

---

## 🚀 Quickstart

### 1. Clone & Install
```bash
git clone https://github.com/ombid52/DevVerse.git
cd DevVerse
npm install
```

### 2. Configure Environment
Create `.env` from `.env.example`:
```bash
cp .env.example .env
```

| Key | Description | Example |
|---|---|---|
| `APP_URL` | Public base URL | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `SESSION_SECRET` | Secret for session tokens (Min, 32 chars) | `your-cryptographic-secret` |
| `B2_ENDPOINT` | Backblaze S3 endpoint | `s3.eu-central-003.backblazeb2.com` |
| `B2_KEY_ID` | Backblaze Application Key ID | `003...` |
| `B2_APPLICATION_KEY` | Backblaze Application Key | `K00...` |
| `B2_BUCKET_NAME` | Backblaze B2 bucket name | `DevVerse` |
| `BREVO_API_KEY` | Brevo email API key | `xkeysib-...` |
| `BREVO_SENDER_EMAIL` | Verified sender email | `support@devverse.run.place` |
| `BREVO_SENDER_NAME` | Sender display name | `DevVerse` |
| `ADMIN_BOOTSTRAP_TOKEN` | Token for admin initialization | `your-secret-token` |

### 3. Initialize Admin & Run
```bash
# Provision single master admin account
npm run init-admin

# Start development server
npm run dev
```
Visit **[http://localhost:3000](http://localhost:3000)**.

---

## 🧪 Testing & Verification

DevVerse maintains strict pre-commit quality gates:

```bash
# Run unit & security tests
npm test

# TypeScript verification
npm run typecheck

# Sync clean portable build
npm run sync-portable
```

---

## 🔒 Security Architecture

- **ZipSlip & Path Traversal Prevention**: Absolute paths, `../`, null bytes, and drive roots are rejected on archive ingestion.
- **Decompression Bomb Protection**: Enforces 250MB extracted size limits and a 10,000 file ceiling.
- **Static Analysis**: Uploaded files are inspected without server-side execution.
- **Audit Log Sanitization**: Passwords, tokens, codes, and credentials are automatically redacted before persistence.