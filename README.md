# 🍳 RecetAI Mercadona

Generador inteligente de recetas basado en productos reales del Mercadona.
Utiliza la IA de **Google Gemini** para crear platos personalizados que se ajustan estrictamente a tus objetivos nutricionales y dietéticos, validando cada ingrediente contra una base de datos real.

---

## 🧭 Visión general

### 🎯 Propósito

**RecetAI Mercadona** resuelve el problema de "qué cocinar hoy" alineando la creatividad de la IA con la realidad del supermercado.
A diferencia de otros generadores genéricos, este sistema asegura que:
1. Los ingredientes existen realmente en Mercadona (gracias al scraping de FatSecret).
2. Los valores nutricionales (calorías, macros) son cálculos matemáticos reales, no alucinaciones de la IA.
3. Las recetas cumplen estrictamente con dietas (Keto, Vegana, Alta en Proteína, etc.).

---

## 🚀 Características Técnicas Destacadas

### 🧠 Inteligencia Artificial (Gemini 2.0 Flash)
Utilizamos el modelo `gemini-2.0-flash` para una generación rápida y precisa. El sistema incluye:
- **Prompt Engineering Avanzado:** Construcción dinámica de prompts basándose en los productos disponibles.
- **Sistema de Autocorrección:** Si la IA genera un JSON inválido o incumple una regla nutricional, el sistema reintenta automáticamente enviando el error a la IA para que se corrija.

### 🛡️ Validación y Seguridad (Zod)
Cada receta generada pasa por un doble filtro:
1. **Validación de Esquema:** `Zod` asegura que la respuesta de la IA tenga la estructura JSON exacta requerida.
2. **Validación de Negocio:** Un servicio dedicado (`RecipeValidatorService`) verifica matemáticamente que la suma de calorías y macros cumpla con los límites establecidos por el usuario.

### ⚡ Rendimiento y Caché
Para optimizar costes y latencia, se implementa un sistema de caché en MongoDB (`RecipeCache`). Si un usuario pide una receta con los mismos parámetros que una solicitud anterior, se sirve instantáneamente desde la base de datos sin llamar a la API de Google.

### 🕷️ Sincronización de Productos
Un scraper robusto (basado en `Cheerio` y `Axios`) extrae información nutricional detallada de productos Hacendado desde FatSecret España, normalizando datos y gestionando la paginación y errores de red automáticamente.

---

## 🧩 Stack Tecnológico

- **Framework:** Next.js + TypeScript
- **Backend:** Node.js + Express (Server Pattern)
- **IA:** Google Generative AI SDK (Gemini)
- **Base de Datos:** MongoDB + Mongoose
- **Validación:** Zod
- **Scraping:** Axios + Cheerio
- **Testing:** Jest + Supertest (Cobertura de Unit y Integration tests)

---

## 🏗️ Estructura del Proyecto

```text
src/
├── server/
│   ├── config/       # Conexión a DB y cliente Gemini
│   ├── controllers/  # Lógica de entrada de endpoints
│   ├── models/       # Schemas Mongoose (Product, Recipe, RecipeCache)
│   ├── services/     # Lógica de negocio compleja
│   │   ├── recipe/   # Lógica específica de generación de recetas
│   │   │   ├── recipeService.ts        # Orquestador principal
│   │   │   ├── recipePromptBuilder.ts  # Construcción de prompts
│   │   │   └── recipeValidatorService.ts # Reglas de negocio
│   │   ├── geminiService.ts            # Comunicación con IA
│   │   └── fatsecretScraperService.ts  # Extracción de datos
│   ├── utils/        # Validaciones y mensajes de error
│   └── routes/       # Definición de endpoints API
└── types/            # Interfaces TypeScript compartidas
```

## ⚙️ Instalación y Configuración

### 1️⃣ Prerrequisitos

- Node.js (v18 o superior)

- MongoDB ejecutándose localmente o en Atlas.

- Una API Key de Google AI Studio (Gemini).

### 2️⃣ Clonar el repositorio

```bash
git clone https://github.com/tuusuario/recetai-mercadona.git
cd recetai-mercadona
```

### 3️⃣ Instalar dependencias

```bash
npm install
```

### 4️⃣ Ejecutar

#### Modo desarrollo

```bash
npm run dev
```

#### Servidor Backend (Standalone)

```bash
npm run server:dev
```

###  Variables de entorno (.env)

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/recetAI
GOOGLE_API_KEY=tu_api_key_de_gemini_aqui
```

## 🧪 Testing
El proyecto cuenta con una suite de tests exhaustiva utilizando Jest. Se cubren servicios críticos como el Scraper, la generación de Prompts y la lógica de validación.
Para ejecutar los test:

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con reporte de cobertura
npm run test:coverage

# Ejecutar en modo vigilancia (watch)
npm run test:watch
```

## 🔄 Flujo de sincronización

La aplicación incluye un sistema de sincronización que permite mantener actualizada la base de datos de productos de Mercadona. El proceso se realiza directamente desde la interfaz de usuario de la aplicación:

1. Endpoint: POST /api/products/sync
2. El servicio se conecta a FatSecret España.
3. Itera sobre las páginas de resultados buscando productos "Hacendado" o "Mercadona".
4. Entra al detalle de cada producto para extraer 22 puntos de datos nutricionales (incluyendo grasas saturadas, fibra, sodio, etc.).
5. Utiliza bulkWrite de MongoDB para insertar o actualizar eficientemente cientos de productos.

## 📝 Licencia
Este proyecto está bajo la Licencia MIT.

