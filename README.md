# Restaurant Cafe Management

Application SaaS pour restaurants, cafes et cafes-restaurants avec React, Node.js, Express, MongoDB, JWT et Socket.io.

## Stack

- Frontend: React + Vite, React Router, Tailwind CSS, Framer Motion, Recharts, React Hook Form, Axios
- Backend: Node.js, Express.js, MongoDB native driver, JWT, bcrypt, Joi, Socket.io
- Base de donnees: MongoDB uniquement

## Installation locale

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run install:all
npm run seed
npm run dev:server
npm run dev:client
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`
Health check: `http://localhost:5000/health`

## Deploiement

Backend:

```bash
cd server
npm install
npm run deploy:check
npm start
```

Frontend:

```bash
cd client
npm install
npm run build
```

Variables serveur obligatoires: `MONGODB_URI`, `MONGODB_DB`, `JWT_SECRET`, `CORS_ORIGIN`.

Variables client obligatoires: `VITE_API_URL`, `VITE_SOCKET_URL`.
