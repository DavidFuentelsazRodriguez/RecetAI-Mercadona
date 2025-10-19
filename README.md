# 🍳 RecetAI Mercadona

Generador inteligente de recetas basado en productos reales del Mercadona.  
Utiliza IA para crear platos personalizados según las preferencias nutricionales y dietéticas del usuario.

---

## 🧭 Visión general

### 🎯 Propósito

**RecetAI Mercadona** es una aplicación que genera recetas personalizadas a partir de los productos disponibles en Mercadona.  
Su objetivo es ayudar a los usuarios a descubrir ideas de platos que se adapten a sus **preferencias nutricionales**, **restricciones dietéticas** y **gustos personales**, utilizando productos reales y accesibles.

La aplicación combina datos nutricionales obtenidos del catálogo de Mercadona con un modelo de **inteligencia artificial generativa**, capaz de proponer recetas completas (ingredientes, pasos de preparación y valores nutricionales estimados) en cuestión de segundos.

---

### 🧑‍💻 Público objetivo

- Personas que quieren **alimentarse mejor sin complicarse**.
- Usuarios que hacen la compra en Mercadona y buscan **optimizar sus menús** con los productos que ya consumen.
- Deportistas o personas con objetivos nutricionales específicos.
- Desarrolladores interesados en ver cómo se integra scraping, lógica de recomendación e IA en un proyecto real.

---

### 🚀 Objetivo del MVP

La primera versión (MVP) de RecetAI Mercadona se centra en la **generación de recetas personalizadas** a partir de los parámetros definidos por el usuario.

**Características principales del MVP:**

- Entrada de datos desde un formulario simple:
  - Objetivo nutricional (por ejemplo: “alta en carbohidratos y proteínas”).
  - Preferencia dietética (vegano, vegetariano, omnívoro, sin gluten…).
  - Ingredientes preferidos (opcional).
- Generación de recetas mediante IA, usando productos reales del Mercadona.
- Visualización de la receta con:
  - Nombre del plato.
  - Lista de ingredientes.
  - Pasos de preparación.
  - Estimación de macronutrientes.
- Botón **“Generar otra receta”** para obtener nuevas opciones con los mismos criterios.

---

## 🧩 Componentes

- **Frontend (React + TypeScript)**
- **Backend (Node.js + Express)**
- **Módulo IA (OpenAI)**
- **Base de datos / Dataset (MongoDB)**
- **Scraper (Playwright)**
- **Integración Open Food Facts** (para datos nutricionales)

## 🏗️ Estructura del Proyecto

```
recetai-mercadona/
├── .github/               # Configuración de GitHub (CI/CD, issues templates, etc.)
├── .vscode/              # Configuración específica de VS Code
├── public/               # Archivos estáticos (imágenes, fuentes, etc.)
├── src/
│   ├── components/       # Componentes reutilizables de React
│   ├── pages/            # Rutas de Next.js
│   │   └── api/          # Endpoints de la API (Next.js API Routes)
│   ├── server/           # Código del servidor
│   │   ├── controllers/  # Controladores para las rutas de la API
│   │   ├── models/       # Modelos de la base de datos (Mongoose)
│   │   ├── routes/       # Definición de rutas de la API
│   │   └── index.ts      # Punto de entrada del servidor
│   ├── styles/           # Estilos globales y módulos CSS
│   └── types/            # Tipos de TypeScript
├── .env.example         # Plantilla de variables de entorno
├── .eslintrc.json       # Configuración de ESLint
├── .gitignore           # Archivos ignorados por Git
├── .prettierrc          # Configuración de Prettier
├── next.config.js       # Configuración de Next.js
├── package.json         # Dependencias y scripts
├── README.md            # Este archivo
└── tsconfig.json       # Configuración de TypeScript
```

## ⚙️ Instalación y ejecución

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/tuusuario/recetai-mercadona.git
cd recetai-mercadona
```

### 2️⃣ Instalar dependencias

```bash
npm install
```

### 3️⃣ Iniciar el entorno de desarrollo

```bash
npm install
```

### 4️⃣ Variables de entorno (.env)

```
OPENAI_API_KEY=tu_clave_aqui
OPENFOODFACTS_API_URL=https://world.openfoodfacts.org/api/v2
```

## 🌱 Integración con Open Food Facts

RecetAI Mercadona utiliza la API de Open Food Facts para enriquecer los productos de Mercadona con información nutricional detallada. Esta integración nos permite:

- Obtener datos nutricionales completos de miles de productos
- Mostrar información detallada sobre macronutrientes, vitaminas y minerales
- Mejorar la precisión de las recomendaciones nutricionales

### Cómo funciona

1. **Búsqueda de productos**: Se utiliza el código de barras o el nombre del producto para buscar en la base de datos de Open Food Facts.
2. **Procesamiento de datos**: Los datos nutricionales se normalizan y almacenan en nuestra base de datos MongoDB.
3. **Actualización automática**: Los productos se actualizan periódicamente para mantener la información nutricional actualizada.

### Características implementadas

- Búsqueda por código de barras o nombre del producto
- Almacenamiento en caché de resultados para mejorar el rendimiento
- Manejo de errores para productos no encontrados
- Actualización programada de datos nutricionales

### Próximas mejoras

- Implementar un sistema de coincidencia mejorado para productos sin código de barras
- Añadir soporte para alérgenos e ingredientes
- Mejorar la precisión de la búsqueda por nombre de producto
