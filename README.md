# DatSec2 — RBAC web app (Next.js)

Web app for role-based access control (RBAC), user management, job modules (Finance, HR, Operations, Compliance), and audit logs.

**Assumptions:** You’re comfortable with a code editor and setting up MySQL/MariaDB. You can use **GitHub Desktop** (or any Git client) to clone the repo—command-line Git is optional. This README focuses on **Node.js**, **Next.js**, and **Tailwind**.

---

## 1. Node.js and npm

**Node.js** runs JavaScript on your machine so the app can start. Installing Node also installs **npm** (Node Package Manager), which reads `package.json` and downloads dependencies into `node_modules/`.

1. Install **Node.js LTS** from [nodejs.org](https://nodejs.org/) (e.g. **20.x** or **22.x**).
2. Verify in a terminal:

   ```bash
   node -v
   npm -v
   ```

   If commands are not found, restart the terminal or log out/in after install.

**Tip:** Use the same major Node version as the rest of the team to avoid odd install/build issues. Check with `node -v` and align with `package.json` → `engines` if present.

You do **not** need to learn Node’s APIs to contribute—only install it and use the npm commands below.

---

## 2. Get the code and install dependencies

### Option A — GitHub Desktop

1. Open [GitHub Desktop](https://desktop.github.com/) and sign in.
2. **File → Clone repository** (or clone from the repo page in the browser via “Open in GitHub Desktop” if available).
3. Pick a folder on your machine and clone.
4. **Repository → Open in Terminal** (or **Open in Command Prompt** on Windows), or open that folder in your editor and use its integrated terminal.

Then install dependencies (see below).

### Option B — Command line

```bash
git clone <your-repo-url>
cd datsec2_finals_new
```

### Install npm packages

In the project folder (the repo root), run:

```bash
npm install
```

- Run **`npm install`** once after cloning, and again whenever **`package.json`** or **`package-lock.json`** changes (e.g. after you pull the latest changes in GitHub Desktop or via `git pull`).
- **`node_modules/`** is generated and ignored by Git; don’t commit it.

---

## 3. Next.js in this project

**Next.js** is the React framework for this repo: routing, server components, and API routes under `app/`.

| Command | What it does |
|--------|----------------|
| `npm run dev` | **Development server** with hot reload. Use this while coding. Default: [http://localhost:3000](http://localhost:3000). Stop with `Ctrl+C`. |
| `npm run build` | **Production build**—compiles the app. Run before deploy or to catch errors. |
| `npm run start` | Serves the **built** app (run `build` first). |
| `npm run lint` | ESLint. |

**Mental model:**

- **`app/`** — File-based routing: `app/dashboard/page.tsx` → `/dashboard`. API handlers live under `app/api/.../route.ts`.
- **Server vs client** — Files with `"use client"` run in the browser; others are server-first by default. You don’t install Next separately—it’s a dependency in `package.json`, pulled in by `npm install`.

No global `next` CLI is required; everything goes through **`npm run ...`**.

---

## 4. Tailwind CSS in this project

**Tailwind** is already configured—you don’t run a separate Tailwind installer for day-to-day work.

- **Tailwind v4** is wired via PostCSS (`postcss.config.mjs` uses `@tailwindcss/postcss`).
- Global styles: `app/globals.css` starts with `@import "tailwindcss";` and base `body` styles.
- **Usage:** In React components, use utility classes on `className` (e.g. `className="flex gap-2 rounded-md bg-zinc-900 text-zinc-100"`). No extra build step beyond `npm run dev`.

If styles look missing, ensure you didn’t delete the import chain from `app/layout.tsx` → `globals.css`.

---

## 5. Database and environment

Create the DB and load SQL as you normally would:

1. Database name **`rbac_system`** (or set `DATABASE_NAME` in env).
2. Run **`database/rbac_schema.sql`**, then optionally **`database/sample_accounts.sql`**.
3. Copy env template and edit credentials:

   ```bash
   copy .env.example .env.local
   ```

   (macOS/Linux: `cp .env.example .env.local`)

4. Set **`DATABASE_*`** to match your MySQL user/host/password, and **`SESSION_PASSWORD`** to a random string **≥ 32 characters** (required for `npm run build`).

Never commit **`.env.local`**. See `.env.example` for variable names.

**Demo logins** (after `sample_accounts.sql`): password **`Password123!`** for accounts like `superadmin`, `admin`, `finance_user` (see SQL file for full list). Local dev only.

---

## 6. Run the app

```bash
npm run dev
```

Open the URL shown in the terminal (usually port **3000**). If the port is busy, Next.js will print an alternative.

---

## 7. Project layout

| Path | Purpose |
|------|--------|
| `app/` | Pages and API routes (Next.js App Router) |
| `components/` | Reusable UI |
| `lib/` | Server-side helpers (DB, auth, RBAC) |
| `database/` | SQL schema and sample data |
| `app/globals.css` | Tailwind entry + global styles |
| `.env.example` | Environment variable template |

---

## 8. Troubleshooting (Node / Next / build)

| Issue | What to check |
|-------|----------------|
| `node` / `npm` not found | Node installed? Terminal restarted? |
| Errors right after `git pull` | Run **`npm install`** again. |
| `SESSION_PASSWORD` / build fails | `.env.local` has `SESSION_PASSWORD` ≥ 32 chars. |
| Blank or unstyled page | `app/layout.tsx` imports `./globals.css`. |
| DB errors | Service running, `.env.local` matches your MySQL settings. |

---
