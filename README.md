# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 💾 SQLite + DrizzleORM
- � **OpenAPI specification generation** from Zod schemas
- 🌐 **Interactive Swagger UI** for API testing
- �📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Copy `.env.example` to `.env` and provide a `DATABASE_URL` with your connection string.

Run an initial database migration:

```bash
npm run db:migrate
```

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## API Documentation

This project automatically generates OpenAPI specifications from your existing Zod schemas:

- **Interactive API docs**: Visit `http://localhost:5173/api/docs` 
- **Generate spec files**: `npm run openapi:generate`
- **JSON spec**: `http://localhost:5173/api/openapi.json`
- **YAML spec**: `http://localhost:5173/api/openapi.yaml`

See [docs/openapi.md](docs/openapi.md) for detailed documentation.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
# For npm
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── server.js
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

---

Built with ❤️ using React Router.
