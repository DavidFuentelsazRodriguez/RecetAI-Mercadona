# 🍳 RecetAI Mercadona

An intelligent recipe generator based on real Mercadona products.
It uses **Google Gemini** AI to create personalized dishes that strictly adhere to your nutritional and dietary goals, validating every ingredient against a real database.

---

## 🧭 Overview

### 🎯 Purpose

**RecetAI Mercadona** solves the "what's for dinner" problem by aligning AI creativity with supermarket reality.
Unlike other generic generators, this system ensures that:
1.  The ingredients actually exist at Mercadona (thanks to FatSecret scraping).
2.  **Ingredients are found by meaning, not just text:** It understands that "Oats" matches "Porridge" using vector embeddings.
3.  Nutritional values (calories, macros) are real mathematical calculations, not AI hallucinations.
4.  The recipes strictly comply with diets (Keto, Vegan, High-Protein, etc.).

---

## 🚀 Key Technical Features

### 🧠 Artificial Intelligence (Gemini 2.0 Flash)
We use the `gemini-2.0-flash` model for fast and accurate generation. The system includes:
-   **Advanced Prompt Engineering:** Dynamic prompt construction based on available products.
-   **Self-Correction System:** If the AI generates invalid JSON or violates a nutritional rule, the system automatically retries by sending the error back to the AI for correction.
-   **Vector Database (Qdrant):** Stores mathematical representations (embeddings) of every product. This allows the system to find ingredients by *concept* rather than exact keyword matching.

### ⚡ Asynchronous & Scalable Architecture
-   **Job Queue (BullMQ):** Long-running tasks, like the product scraper, are not run by the web server. Instead, they are added to a `Redis`-backed queue. This ensures the API responds instantly (`202 Accepted`) and prevents server timeouts.
-   **Dedicated Worker:** A separate `worker` process (running in its own Docker container) listens to the queue and executes these heavy jobs in the background, ensuring the API is always available.
-   **Caching (`RecipeCache`):** To optimize costs and latency, successful recipe generations are cached in MongoDB.

### 🛡️ Validation and Security
-   **Schema Validation (`Zod`):** Every request `body` and every AI response is strictly validated.
-   **Semantic Validation:** A dedicated service verifies that the AI-generated ingredients match the database products using semantic similarity, even if the names differ slightly (e.g., "Whole Wheat Pasta" vs "Integral Spaghetti").
-   **API Security (`express-rate-limit`):** Protects costly endpoints (like AI generation and scraping) from abuse and simple DoS attacks.
-   **Security Linting (`eslint-plugin-security`):** Automatically detects potential security vulnerabilities (like ReDoS) during development.

### 🔄 Automated DevOps
-   **Containerized Environment (`Docker`):** The entire application (API, Worker, MongoDB, Redis) runs in a fully isolated and reproducible environment using `docker-compose`.
-   **Continuous Integration (`GitHub Actions`):** Every `push` to `main` and `develop` automatically runs all linters and tests, ensuring code quality and preventing broken builds.
-   **Code Quality (`Husky + lint-staged`):** Automatically runs `eslint` and `prettier` before every `git commit`, ensuring consistent code style and preventing errors from ever reaching the repository.

---

## 🧩 Tech Stack

-   **Framework:** Next.js + TypeScript
-   **Backend:** Node.js + Express
-   **AI:** Google Generative AI SDK (Gemini)
-   **Databases:**
    -   MongoDB (Data & Cache)
    -   Redis (Job Queues)
    -   Qdrant (Vector Search)
-   **Validation:** Zod
-   **Scraping:** Axios + Cheerio
-   **DevOps:** Docker, GitHub Actions
-   **Testing:** Jest + Supertest
-   **Logging:** Winston
-   **Linting:** ESLint, Prettier, Husky

---

## 🏗️ Project Structure

```text
.
├── .github/workflows/    # CI/CD workflows (GitHub Actions)
│   └── ci.yml
├── .husky/               # Git hooks (pre-commit)
│   └── pre-commit
├── src/
│   ├── components/       # (Future) React Components
│   ├── pages/            # (Future) Next.js Pages
│   └── server/
│       ├── config/       # All config files
│       │   ├── database.ts
│       │   ├── gemini.ts
│       │   ├── logger.ts
│       │   ├── queues.ts     # BullMQ Queue/Worker config
│       │   └── rateLimiters.ts
│       ├── controllers/  # API route handlers
├       │   ├── __tests__/ # Integration tests
│       ├── models/       # Mongoose Schemas (Product, Recipe, RecipeCache)
│       ├── routes/       # Express route definitions
│       ├── services/     # All business logic
│       │   ├── recipe/   # Recipe generation logic
│       │   ├── __tests__/ # Unit tests
│       │   ├── fatsecretScraperService.ts
│       │   └── ...
│       ├── utils/
│       ├── index.ts      # Express app definition (for tests)
│       ├── server.ts     # Server entry point (runs the app)
│       └── worker.ts     # Worker entry point (runs the queue)
├── .env.example          # Environment variable template
├── .gitignore
├── docker-compose.yml    # Docker orchestra file (API + Worker + DB + Cache)
├── Dockerfile.dev        # Docker instructions for development
├── jest.config.js
├── package.json
└── tsconfig.json
```

## ⚙️Installation (Docker Recommended)

This project is designed to run in a containerized environment using Docker. This is the simplest and most reliable way to run the API, Worker, Database, and Cache with a single command.

### 1️⃣ Prerequisites

- Git

- Docker Desktop (or Docker Engine + Compose)

### 2️⃣ Clone the Repository

```bash
git clone https://github.com/tuusuario/recetai-mercadona.git
cd recetai-mercadona
```

### 3️⃣ Create Environment File

```
PORT=5000
NODE_ENV=development

# Internal Docker Network URLs (Do not change if using Docker)
MONGODB_URI=mongodb://mongodb:27017/recetAI
REDIS_HOST=redis
REDIS_PORT=6379
QDRANT_HOST=qdrant
QDRANT_PORT=6333

# Your Secrets
GOOGLE_API_KEY=your_gemini_api_key_here
```

### 4️⃣ Run the Application

This single command will build the images, start all containers (API, Worker, Mongo, Redis), and connect them.

```bash
docker-compose up --build
```
- API: ```http://localhost:5000```
- Qdrant Dashboard: ```http://localhost:6333/dashboard```

## 🧪 Testing
The project includes an exhaustive test suite using Jest. To run the tests:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 🔄 Asynchronous Synchronization Flow

The product database is kept up-to-date via an asynchronous background process:

1. **Trigger**: Client sends POST /api/products/sync.
2. **Queue**: The API validates the request (Rate Limit) and adds a job to Redis. Responds 202 Accepted.
3. **Worker**: The Worker container picks up the job.
4. **Scrape**: It scrapes product data from FatSecret.
5. **Vectorize**: It uses Gemini to generate embeddings for every new product.
6. **Index**: It updates MongoDB (metadata) and Qdrant (vectors) simultaneously.

## 📝 Licencia
This project is under the MIT License.

