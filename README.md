# Decku API

A Node.js API built with TypeScript, Express, and MongoDB for managing steamdeck game settings DB.

## Features

- TypeScript for type safety
- Express.js web framework
- MongoDB integration
- RESTful API endpoints
- CORS enabled
- **Zod validation** for request validation

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or remote)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your MongoDB connection string:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/decku
DB_NAME=decku
```

## Development

Run the development server with hot reload:
```bash
npm run dev
```

## Build

Compile TypeScript to JavaScript:
```bash
npm run build
```

## Production

Run the compiled JavaScript:
```bash
npm start
```

## License

MIT
