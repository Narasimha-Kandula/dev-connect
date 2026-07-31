# 🚀 RUN.md — Local Development Setup Guide

A step-by-step guide to get **DevConnect** running on your machine from scratch.


## 1. 🧾 System Requirements

| Requirement | Minimum | Recommended |
| - | - | - |
| **Node.js** | 20.0.0 | 20.x LTS (latest v20) |
| **npm** | 10.x | 10.x (ships with Node 20) |
| **Git** | 2.30+ | Latest stable |
| **Docker** | 24.x | Latest stable |
| **OS** | Windows 10/11, macOS (Intel + Apple Silicon), Linux (Ubuntu 22.04+/Debian 12+/Kali) | — |


> ⚠️ **Node.js 22+** may work but is untested with this project. Stick to Node 20 LTS for a guaranteed smooth setup.

> ⚠️ **Do not use pnpm** — this project uses `npm` exclusively. `pnpm` is known to cause dependency resolution issues, especially on Kali Linux.

> ⚠️ **Next.js 16.2** requires React 19 and TypeScript 5.9+. The versions are locked in `package.json` — do not upgrade them individually.


## 2. 📦 Dependency Versions (Locked)

These are the **exact versions** used in this project. Do not upgrade unless you've verified compatibility.

| Package | Version | Notes |
| - | - | - |
| Next.js | 16.2.12 | App Router + Turbopack |
| React | 19.2.8 | Locked by Next.js 16 |
| TypeScript | 5.9.3 | Shared across frontend + backend |
| Tailwind CSS | 4.3.3 | v4 with `@theme` tokens |
| Framer Motion | 12.42.2 | Animation + gesture library |
| Zustand | 5.0.14 | State management |
| Socket.IO Client | 4.8.3 | Real-time WebSocket client |
| NestJS | 11.1.28 | Backend framework |
| Prisma | 6.19.3 | ORM + schema management |
| @prisma/client | 6.19.3 | Generated client |
| Socket.IO | 4.8.3 | WebSocket server |
| ioredis | 5.11.1 | Redis client |
| BullMQ | 5.61.2 | Job queues |
| Meilisearch | v1.11 | Full-text search engine (Docker) |
| Redis | 7-alpine | Cache + queues (Docker) |



## 3. 🖥️ OS-Specific Setup

### 🪟 Windows Setup

1. **Install Node.js 20 LTS**

   - Option A: Download from [nodejs.org](https://nodejs.org/) (official installer)

   - Option B: Use [nvm-windows](https://github.com/coreybutler/nvm-windows) for version management

   - ```
nvm install 20  
nvm use 20
```

2. **Install Git**

   - Download from [git-scm.com](https://git-scm.com/)

3. **Install Docker Desktop**

   - Download from [docker.com](https://www.docker.com/products/docker-desktop/)

   - Ensure WSL2 backend is enabled for better performance

4. **Verify installation**

```
node -v      \# Should show v20.x.x  
npm -v       \# Should show 10.x.x  
git --version  
docker --version
```

### 🍎 macOS Setup

1. **Install Homebrew** (if not installed)

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. **Install Node.js 20 via nvm**

```
brew install nvm  
mkdir ~/.nvm  
\# Add to ~/.zshrc or ~/.bash\_profile:  
export NVM\_DIR="$HOME/.nvm"  
\[ -s "$(brew --prefix)/opt/nvm/nvm.sh" \] && \\. "$(brew --prefix)/opt/nvm/nvm.sh"  
\# Then:  
nvm install 20  
nvm use 20
```

3. **Install Git** (usually pre-installed on macOS)

```
brew install git
```

4. **Install Docker Desktop**

   - Download from [docker.com](https://www.docker.com/products/docker-desktop/)

   - Apple Silicon (M1/M2/M3) users: ensure you download the **Apple Silicon** version

5. **Verify installation**

```
node -v      \# Should show v20.x.x  
npm -v       \# Should show 10.x.x  
git --version  
docker --version
```

> 💡 **Apple Silicon note**: All dependencies work natively on ARM64. Docker containers will run via Rosetta 2 emulation automatically.

### 🐧 Linux Setup (Ubuntu/Debian/Kali)

1. **Install Node.js 20 via nvm** (recommended over apt)

```
\# Install build tools first (required for native modules)  
sudo apt update  
sudo apt install -y build-essential curl  
  
\# Install nvm  
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash  
  
\# Reload shell or run:  
export NVM\_DIR="$HOME/.nvm"  
\[ -s "$NVM\_DIR/nvm.sh" \] && \\. "$NVM\_DIR/nvm.sh"  
  
\# Install Node 20  
nvm install 20  
nvm use 20
```

2. **Install Git**

```
sudo apt install -y git
```

3. **Install Docker Engine**

```
\# For Ubuntu/Debian:  
sudo apt install -y docker.io docker-compose-v2  
sudo usermod -aG docker $USER  
\# Log out and back in for group changes to take effect
```

4. **Verify installation**

```
node -v      \# Should show v20.x.x  
npm -v       \# Should show 10.x.x  
git --version  
docker --version  
docker compose version
```

> 💡 **Kali Linux note**: If you encounter npm permission errors, configure npm to use a local prefix:

```
mkdir ~/.npm-global  
npm config set prefix '~/.npm-global'  
export PATH=~/.npm-global/bin:$PATH
```

Add the `export` line to `~/.bashrc` or `~/.zshrc`.


## 4. 📁 Project Setup

### Clone the Repository

```
git clone https://github.com/Narasimha-Kandula/dev-connect.git  
cd DevConnect
```

### Install Dependencies

```
\# Install backend dependencies  
cd backend  
npm install  
  
\# Install frontend dependencies  
cd ../frontend  
npm install  
  
\# Return to project root  
cd ..
```

> ⏱️ First install may take 2–5 minutes depending on your internet speed.


## 5. 🔐 Environment Variables

### Backend (`backend/.env`)

Copy the example file and fill in your values:

```
cp backend/.env.example backend/.env

\# ── Database (Supabase) ──────────────────────────────────  
DATABASE\_URL=postgresql://postgres:YOUR\_DB\_PASSWORD@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true  
DIRECT\_URL=postgresql://postgres:YOUR\_DB\_PASSWORD@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres  
  
\# ── JWT ──────────────────────────────────────────────────  
JWT\_SECRET=generate-with-openssl-rand-hex-32  
JWT\_REFRESH\_SECRET=generate-another-with-openssl-rand-hex-32  
  
\# ── Redis (Upstash or local Docker) ─────────────────────  
REDIS\_URL=redis://:devpassword@localhost:6379  
  
\# ── Meilisearch ─────────────────────────────────────────  
MEILISEARCH\_URL=http://localhost:7700  
MEILISEARCH\_API\_KEY=devmasterkey  
  
\# ── Email (Resend) ──────────────────────────────────────  
RESEND\_API\_KEY=re\_YOUR\_RESEND\_API\_KEY  
  
\# ── OAuth (optional — leave blank if not configuring) ───  
GITHUB\_CLIENT\_ID=  
GITHUB\_CLIENT\_SECRET=  
GOOGLE\_CLIENT\_ID=  
GOOGLE\_CLIENT\_SECRET=  
  
\# ── Platform ────────────────────────────────────────────  
FRONTEND\_URL=http://localhost:3000  
PORT=4000
```

> ⚠️ **Generate JWT secrets securely**:

```
openssl rand -hex 32
```

### Frontend (`frontend/.env.local`)

This file does **not** have an example template — create it manually:

```
touch frontend/.env.local

NEXT\_PUBLIC\_API\_URL=http://localhost:4000/api/v1  
NEXT\_PUBLIC\_WS\_URL=http://localhost:4000  
NEXT\_PUBLIC\_GITHUB\_CLIENT\_ID=your\_github\_client\_id  
NEXT\_PUBLIC\_GOOGLE\_CLIENT\_ID=your\_google\_client\_id
```

> 💡 The `NEXT\_PUBLIC\_API\_URL` points to the backend at port **4000** (not 3001).


## 6. ▶️ Running the Application

### Step 1: Start Infrastructure (Docker)

Run Redis and Meilisearch containers:

```
\# From the project root  
docker compose up -d
```

Verify containers are running:

```
docker ps --format "table \{\{.Names\}\}\\t\{\{.Status\}\}\\t\{\{.Ports\}\}"
```

Expected output:

```
NAMES                    STATUS         PORTS  
devconnect-redis         Up X minutes   0.0.0.0:6379-\>6379/tcp  
devconnect-meilisearch   Up X minutes   0.0.0.0:7700-\>7700/tcp
```

### Step 2: Run Validation Script (optional)

```
bash scripts/setup.sh
```

This checks Node version, port availability, Docker containers, npm dependencies, and environment files.

### Step 3: Database Setup

```
cd backend  
  
\# Generate Prisma client from schema  
npm run prisma:generate  
  
\# Apply database migrations to your Supabase database  
npm run prisma:migrate  
  
\# (Optional) Seed the database with development data  
npm run seed
```

> ⚠️ `prisma:migrate` requires a working Supabase `DATABASE\_URL`. If you don't have a Supabase project yet, see the [Supabase Setup](#supabase-postgresql) section below.

### Step 4: Start the Backend

```
cd backend  
npm run start:dev
```

Expected output:

```
\[Nest\] 12345  - LOG \[NestApplication\] Nest application successfully started  
\[Nest\] 12345  - LOG 🚀 Application is running on: http://localhost:4000/api/v1
```

> ✅ Verify: Open http://localhost:4000/api/v1 in your browser. You should see `\{"status":"ok"\}` or similar health response.

### Step 5: Start the Frontend

Open a **new terminal** and run:

```
cd frontend  
npm run dev
```

Expected output:

```
▲ Next.js 16.2.12 (Turbopack)  
   Local:        http://localhost:3000  
   Environments: .env.local
```

> ✅ Verify: Open http://localhost:3000 in your browser. You should see the DevConnect landing page.


## 7. 🔄 Full Run Reference

```
\# Terminal 1 — Infrastructure (one-time)  
cd DevConnect  
docker compose up -d  
  
\# Terminal 2 — Backend (keep running)  
cd DevConnect/backend  
npm run start:dev  
  
\# Terminal 3 — Frontend (keep running)  
cd DevConnect/frontend  
npm run dev
```


## 8. 🧪 Verify Setup

Once both servers are running:

| Check | URL | Expected |
| - | - | - |
| Landing page | http://localhost:3000 | DevConnect hero section |
| Login page | http://localhost:3000/login | Login form |
| API health | http://localhost:4000/api/v1 | `\{"status":"ok"\}` |
| API health | http://localhost:4000/api/v1 | Health endpoint confirms backend is running |


**Full flow test:**

1. Go to http://localhost:3000/signup and create an account

2. You should be redirected to the dashboard

3. Navigate to `/discover` to see the developer swipe feed

4. Navigate to `/projects` to see the project list

5. Try sending a message via `/chat`

> 💡 The backend API is mocked by default for development — actual Supabase backend calls will work once you set up your Supabase project and configure the `.env` file.


## 9. 🐛 Common Issues & Fixes

### ❌ `Error: listen EADDRINUSE :::4000`

Port 4000 is already in use. Either:

```
\# Kill the process using port 4000  
lsof -ti:4000 | xargs kill -9  
  
\# Or change the backend port in backend/.env:  
PORT=4001
```

Then update `frontend/.env.local`:

```
NEXT\_PUBLIC\_API\_URL=http://localhost:4001/api/v1  
NEXT\_PUBLIC\_WS\_URL=http://localhost:4001
```

### ❌ `Error: listen EADDRINUSE :::3000`

Port 3000 is already in use. Both the dev server and Playwright E2E tests expect port 3000, so kill the conflicting process:

```
lsof -ti:3000 | xargs kill -9
```

Then restart the frontend on port 3000:

```
cd frontend  
npm run dev
```

### ❌ `Cannot find module '@prisma/client'`

Prisma client needs to be generated:

```
cd backend  
npm run prisma:generate
```

### ❌ `PrismaClientInitializationError: Can't reach database server`

Your Supabase database connection is not working. Check:

- `DATABASE\_URL` in `backend/.env` is correct

- Supabase project is not paused (free tier projects pause after 1 week of inactivity)

- IP is not blocked by Supabase (enable "Allow all IPs" in Project Settings → Network Restrictions)

### ❌ `Invalid `prisma.xxx.findMany()` invocation`

The database schema doesn't match the Prisma schema. Run migrations:

```
cd backend  
npm run prisma:migrate
```

### ❌ Frontend not starting / blank page

Clear the Next.js cache:

```
cd frontend  
rm -rf .next  
npm run dev
```

### ❌ `npm install` fails

```
\# Clear npm cache  
npm cache clean --force  
  
\# Delete node\_modules and reinstall  
rm -rf node\_modules package-lock.json  
npm install
```

### ❌ `npm ERR! code EINTEGRITY` or checksum errors

```
rm -rf node\_modules package-lock.json  
npm cache clean --force  
npm install
```

### ❌ WebSocket connection fails (chat not working)

- Ensure the backend is running on port 4000

- Check `NEXT\_PUBLIC\_WS\_URL=http://localhost:4000` in `frontend/.env.local`

- Socket.IO uses polling → WebSocket transport upgrade. If behind a proxy, ensure WebSocket support is enabled.

### ❌ Auth not working / "Invalid token"

- Ensure `JWT\_SECRET` and `JWT\_REFRESH\_SECRET` are set in `backend/.env`

- The frontend stores tokens in `localStorage` — try clearing it:

- ```
localStorage.clear()
```

- Ensure `NEXT\_PUBLIC\_API\_URL` in `frontend/.env.local` points to the correct backend URL

### ❌ `docker compose up -d` fails

```
\# Check Docker is running  
docker info  
  
\# If Docker is running, try:  
docker compose pull  
docker compose up -d
```

### ❌ Prisma migration fails with "relation already exists"

The database may already have tables from a previous migration. Either:

```
\# Reset the database (WARNING: deletes all data)  
npm run prisma:migrate -- --reset  
  
\# Or create a baseline migration:  
npx prisma migrate diff --from-empty --to-schema-datamodel src/prisma/schema.prisma --script \> migration.sql  
\# Then apply it manually in Supabase SQL editor
```

### ❌ `NVM` not found after installing

After installing nvm, you need to either restart your terminal or source the nvm script:

```
\# Source nvm (adjust path for your shell)  
export NVM\_DIR="$HOME/.nvm"  
\[ -s "$NVM\_DIR/nvm.sh" \] && \\. "$NVM\_DIR/nvm.sh"
```

To make it permanent, add the above lines to your shell config (`~/.bashrc`, `~/.zshrc`, or `~/.bash\_profile`).


## 10. 📡 External Services Setup

### Supabase (PostgreSQL + Auth)

1. Go to [supabase.com](https://supabase.com/) and log in (or create an account)

2. Click **New project**

   - Name: `devconnect` (or any name)

   - Database password: generate a strong password

   - Region: choose the one closest to you

   - Pricing plan: **Free** tier is sufficient

3. Wait for the database to provision (~2 minutes)

4. Go to **Project Settings → Database**

   - Copy **Connection string (URI)** — this is your `DATABASE\_URL`

   - Copy **Connection string (direct)** — this is your `DIRECT\_URL`

5. Go to **Project Settings → API**

   - Copy **Project URL** → `SUPABASE\_URL`

   - Copy **anon public key** → `NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY` (if using Supabase client directly)

   - Copy **service\_role key** → `SUPABASE\_SERVICE\_KEY` (keep this secret!)

6. Paste these values into `backend/.env`

7. Run migrations:

```
cd backend  
npx prisma migrate deploy --schema=src/prisma/schema.prisma
```

### Redis (via Docker — local development)

Redis runs locally via Docker. No additional setup is needed beyond `docker compose up -d`.

For production, use [Upstash](https://upstash.com/) (serverless Redis):

1. Create an account at upstash.com

2. Create a new Redis database

3. Copy the **REST URL** → replace `REDIS\_URL` in `backend/.env`

### Meilisearch (via Docker — local development)

Meilisearch runs locally via Docker. The admin panel is at http://localhost:7700.

The default master key is `devmasterkey` (configured in `docker-compose.yml`).


## 11. ⚡ Performance Tips

- **Node 20 LTS** — Use Node 20.x for best compatibility with NestJS 11 and Next.js 16

- **Avoid turbopack issues** — If you encounter build errors, try without turbopack:

- ```
\# Instead of npm run dev (which uses --turbopack)  
npx next dev
```

- **Redis persistence** — The Docker Redis container saves data to a volume (`redis-data`). Data persists across restarts.

- **Database connection pooling** — The `DATABASE\_URL` uses PgBouncer (port 6543), the `DIRECT\_URL` connects directly (port 5432). Prisma migrations require the direct connection.

- **Next.js cache** — If the frontend behaves unexpectedly, clear `.next` and restart:

- ```
rm -rf frontend/.next && cd frontend && npm run dev
```


## 12. 🧠 Developer Notes

- **Use npm, not pnpm or yarn** — This project uses `npm` exclusively. The lockfile is `package-lock.json`.

- **Keep env files in sync** — If you add a new environment variable, update both the `.env` file AND the `README.md` documentation.

- **Restart servers after env changes** — Changes to `.env` files require restarting the dev servers.

- **Follow the monorepo structure** — Code goes in the `frontend/`, `backend/`, or `database/` directory. Do not add top-level source files.

- **Backend runs on port 4000**, **Frontend runs on port 3000** — These are the defaults. Changing them requires updating both `.env` files.

- **Prisma schema is the source of truth** — If you modify `database/schema.sql`, also update `backend/src/prisma/schema.prisma`. Prefer using Prisma migrations over raw SQL.

- **Turbopack is opt-in** — The `npm run dev` command uses `--turbopack`. If you encounter issues, run `npx next dev` without turbopack.

- **Playwright E2E tests** run on port **3000** (the same port as the dev server). Playwright auto-starts the server via its `webServer` config, or reuses an already-running one (`reuseExistingServer: true`).


## 13. ✅ Ready Checklist

- [ ] Node.js 20.x installed (`node -v`)

- [ ] npm 10.x installed (`npm -v`)

- [ ] Git installed (`git --version`)

- [ ] Docker installed (`docker --version`)

- [ ] Repository cloned

- [ ] Backend dependencies installed (`cd backend && npm install`)

- [ ] Frontend dependencies installed (`cd frontend && npm install`)

- [ ] Docker containers running (`docker compose up -d`)

- [ ] Backend `.env` configured (Supabase URL, JWT secret, Redis URL)

- [ ] Frontend `.env.local` configured (API URL, WS URL)

- [ ] Prisma client generated (`npm run prisma:generate`)

- [ ] Database migrations applied (`npm run prisma:migrate`)

- [ ] Backend running on http://localhost:4000

- [ ] Frontend running on http://localhost:3000

- [ ] Can sign up and log in

- [ ] Can access `/discover`, `/chat`, `/projects`


## 🎉 You're Ready!

You now have DevConnect running locally. Start developing:

- **Frontend**: `cd frontend && npm run dev` — http://localhost:3000

- **Backend**: `cd backend && npm run start:dev` — http://localhost:4000

- **Infrastructure**: `docker compose up -d` — Redis on 6379, Meilisearch on 7700

**Useful commands:**

```
\# Run frontend tests  
cd frontend && npm test  
  
\# Run backend tests  
cd backend && npm test  
  
\# Run E2E tests (requires frontend dev server)  
cd frontend && npx playwright test  
  
\# Type-check frontend  
cd frontend && npm run typecheck  
  
\# Type-check backend  
cd backend && npm run typecheck  
  
\# Apply new Prisma migration  
cd backend && npm run prisma:migrate  
  
\# Open Prisma Studio (database GUI)  
cd backend && npm run prisma:studio  
  
\# Seed database with sample data  
cd backend && npm run seed  
  
\# Validate environment setup  
bash scripts/setup.sh
```

