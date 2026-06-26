# SplitNest

Shared expense splitting app for roommates and small groups. Built with **React + Vite** (frontend) and **Express + MongoDB** (backend).

## Prerequisites

- Node.js 18+
- MongoDB 6+ (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

## Quick Start

### 1. Install MongoDB

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install -y mongodb
sudo systemctl start mongod
```

**macOS (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Docker:**
```bash
docker run -d --name splitnest-mongo -p 27017:27017 mongo:7
```

### 2. Create MongoDB Collections (optional but recommended)

Run the setup script to create collections with validators and indexes:

```bash
mongosh splitnest mongodb/setup.js
```

Or with a connection string:
```bash
mongosh "mongodb://127.0.0.1:27017/splitnest" mongodb/setup.js
```

> Mongoose will auto-create collections on first run if you skip this step.

### 3. Configure Environment

```bash
cp .env.example .env
cp .env.local.example .env.local
```

**.env** (server):
```
MONGODB_URI=mongodb://127.0.0.1:27017/splitnest
PORT=3001
```

**.env.local** (frontend, optional):
```
VITE_API_URL=/api
```

For MongoDB Atlas, use:
```
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/splitnest
```

### 4. Install & Run

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001/api/health

The server auto-seeds demo data on first startup.

## Production Build

```bash
npm run build
npm run start:server   # API on port 3001
npm run preview        # static frontend on port 4173
```

Serve the `dist/` folder behind nginx/vercel and proxy `/api` to the Express server.

## MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `members` | Group participants |
| `groups` | Expense groups with member lists and budget |
| `expenses` | Expense records with split participants |
| `settlementrecords` | Partial and full settlement history |
| `activitylogs` | Audit trail |
| `notifications` | In-app notifications |
| `categories` | Expense and income categories |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/bootstrap` | Load all app data |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| POST | `/api/expenses/:id/duplicate` | Duplicate expense |
| POST | `/api/members` | Add member |
| DELETE | `/api/members/:id` | Remove member from group |
| POST | `/api/settlements/settle` | Mark debt settled |
| POST | `/api/settlements/partial` | Record partial payment |
| POST | `/api/categories` | Add category |

## Further Steps

1. **Authentication** — Add JWT/Passport auth and tie members to user accounts
2. **Real-time sync** — Add Socket.io or MongoDB change streams for live updates
3. **Income tracking** — Extend expense model with `type: income | expense`
4. **Receipt uploads** — Integrate S3/Cloudinary for `receiptUrl`
5. **Deploy** — Host API on Railway/Render/Fly.io; frontend on Vercel/Netlify
6. **Mobile app** — Wrap PWA with Capacitor or use React Native

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + frontend together |
| `npm run dev:server` | API only |
| `npm run dev:client` | Frontend only |
| `npm run db:reset` | Drop all collections and re-seed demo data |
| `npm run seed` | Seed only (connects + seeds if incomplete) |
| `npm run test:logic` | Run settlement math tests |

## MongoDB Compass

1. Open Compass and connect with:
   ```
   mongodb://127.0.0.1:27017/splitnest
   ```
2. Confirm database **`splitnest`** (not `test`) contains collections: `members`, `groups`, `expenses`, etc.
3. If data is missing or partial, reset:
   ```bash
   npm run db:reset
   ```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| UI shows "Connection Error" | Run `npm run dev` (needs API on port 3001) |
| Compass empty | Start API once, or run `npm run db:reset` |
| Records tab empty | Select **Hostel Room** group; check week filter chevrons |
| Partial data (members but no expenses) | Run `npm run db:reset` |
