# CodeDrop

A minimalist, high-performance pastebin service for sharing code snippets securely and instantly.

## Prerequisites
- **Git**
- **Go 1.25+**
- **Node.js 18+ & npm**
- **Docker**

---

## Local Installation

### 1. Clone the repository
```bash
git clone https://github.com/akyloffdev/CodeDrop.git
cd CodeDrop
```

### 2. Infrastructure (Database & Redis)
If you have Docker installed, start the required services:
```bash
docker-compose up -d
```

### 3. Backend Setup
```bash
cd backend
go mod tidy

# Linux / macOS
export DATABASE_URL=postgres://user:password@localhost:5432/codedrop?sslmode=disable
export REDIS_URL=redis://localhost:6379
export ALLOWED_ORIGIN=http://localhost:3000

# Windows (Command Prompt)
set DATABASE_URL=postgres://user:password@localhost:5432/codedrop?sslmode=disable
set REDIS_URL=redis://localhost:6379
set ALLOWED_ORIGIN=http://localhost:3000

go run main.go
```

### 4. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_HOST=http://localhost:10000" > .env.local
npm run dev
```
The application will be available at `http://localhost:3000`.

---

## Deployment on Render.com

To host this project on Render, follow these steps:

### 1. Databases
1. Create a **New PostgreSQL** instance. Copy the **Internal Database URL**.
2. Create a **New Redis** instance. Copy the **Internal Redis URL**.

### 2. Backend Service
1. Create a **New Web Service** and connect your GitHub repository.
2. **Root Directory**: `backend`
3. **Runtime**: `Go`
4. **Build Command**: `go build -o app main.go`
5. **Start Command**: `./app`
6. Add **Environment Variables**:
   - `DATABASE_URL`: (Paste your Internal PostgreSQL URL)
   - `REDIS_URL`: (Paste your Internal Redis URL)
   - `ALLOWED_ORIGIN`: `https://your-frontend.onrender.com`
   - `X-CodeDrop-Token`: `secure-access-v1`

### 3. Frontend Service
1. Create a **New Web Service** (or Static Site).
2. **Root Directory**: `frontend`
3. **Runtime**: `Node`
4. **Build Command**: `npm install; npm run build`
5. **Start Command**: `npm run start`
6. Add **Environment Variables**:
   - `NEXT_PUBLIC_API_HOST`: `https://your-backend.onrender.com`

---

## Technical Stack
- **Frontend**: Next.js 14, Tailwind CSS, PrismJS (VSCode-like highlighting).
- **Backend**: Go (Gin Gonic), pgx (PostgreSQL driver), go-redis.
- **Security**: IP-based rate limiting, anti-spam tokens, and automated TTL-based cleanup.

Created by [akyloffdev](https://github.com/akyloffdev).