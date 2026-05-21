# PrintLOO Setup Instructions

This guide provides exactly how to set up and run the PrintLOO code for Windows, Linux, and macOS. PrintLOO is a monorepo (using Turborepo) with a Next.js frontend (`web`) and a NestJS backend (`api`).

## Prerequisites

Before setting up the project, you need to install the following software on your system:
1. **Node.js** (v18 or higher recommended)
2. **PostgreSQL** (for the database)
3. **Redis** (for background jobs/queue and caching)

---

### 1. OS-Specific Prerequisite Installation

#### 🪟 Windows
1. **Node.js**: Download and install from [nodejs.org](https://nodejs.org/).
2. **PostgreSQL**: Download the Windows installer from the [PostgreSQL website](https://www.postgresql.org/download/windows/) and run it. Remember the password you set for the `postgres` user.
3. **Redis**: Redis does not natively support Windows. You have two options:
   - **Option A (Recommended)**: Use [WSL (Windows Subsystem for Linux)](https://learn.microsoft.com/en-us/windows/wsl/install). Open your WSL terminal and run: `sudo apt update && sudo apt install redis-server && sudo service redis-server start`.
   - **Option B**: Download a Windows port of Redis like [Memurai](https://www.memurai.com/).

#### 🐧 Linux (Ubuntu/Debian-based)
Open your terminal and run the following commands:
```bash
# Install Node.js (via NVM or apt, example using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
# Create a password for the default 'postgres' user if needed

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis-server
```

#### 🍎 macOS
The easiest way to install dependencies on macOS is using [Homebrew](https://brew.sh/).
Open your terminal and run:
```bash
# Install Node.js
brew install node

# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Install Redis
brew install redis
brew services start redis
```

---

### 2. Database Creation
Make sure you create a PostgreSQL database named `printloo`.
You can do this via a GUI like pgAdmin or DBeaver, or via the command line:
```bash
psql -U postgres -c "CREATE DATABASE printloo;"
```
*(On Linux/Mac you may need to run `sudo -u postgres psql ...` depending on your setup).*

---

### 3. Project Installation

1. Open your terminal (or Command Prompt / PowerShell on Windows).
2. Navigate to the root directory of the PrintLOO project:
   ```bash
   cd /path/to/PrintLOO
   ```
3. Install all project dependencies:
   ```bash
   npm install
   ```

---

### 4. Environment Variables Setup

You need to set up environment variables for both the backend (API) and frontend (Web).

#### Backend (API) Environment Variables
1. Navigate to `apps/api/`:
   ```bash
   cd apps/api
   ```
2. Create a file named `.env` in this folder (if it doesn't exist) and add the following:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/printloo
   # NOTE: Change 'password' to your actual PostgreSQL postgres user password

   REDIS_URL=redis://localhost:6379
   JWT_SECRET=printloo_jwt_secret_change_in_production
   JWT_REFRESH_SECRET=printloo_refresh_secret_change_in_production
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   RAZORPAY_KEY_ID=rzp_test_your_key_here
   RAZORPAY_KEY_SECRET=your_razorpay_secret_here
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE_MB=25
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

#### Frontend (Web) Environment Variables
1. Navigate to `apps/web/`:
   ```bash
   cd ../web
   ```
2. Create a file named `.env.local` in this folder (if it doesn't exist) and add the following:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_here
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

---

### 5. Database Migration and Seeding

Go back to the root directory of the project, then run the database migrations to create the necessary tables.

```bash
# From the PrintLOO root directory:
npm run db:migrate
```

*(Optional)* If you want to seed the database with initial test data:
```bash
npm run db:seed
```

---

### 6. Running the Application

Now you are ready to run both the frontend and backend simultaneously!

1. Make sure you are in the root directory (`PrintLOO/`).
2. Run the development server:
   ```bash
   npm run dev
   ```

**This command will start:**
- The **NestJS API** on `http://localhost:3001`
- The **Next.js Web Frontend** on `http://localhost:3000`

Open `http://localhost:3000` in your browser to view the application!

---

### Troubleshooting

- **Database Connection Error**: Double-check your `DATABASE_URL` in `apps/api/.env`. Make sure the username, password, and port match your PostgreSQL installation.
- **Redis Connection Error**: Ensure the Redis server is actually running. On Windows WSL, `sudo service redis-server start`. On Mac, `brew services start redis`.
- **Port already in use**: If port 3000 or 3001 is in use, close the conflicting program or adjust the `PORT` values in your `.env` files.
