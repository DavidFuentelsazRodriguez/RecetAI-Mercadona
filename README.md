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
- **Base de datos (MongoDB)**
- **Scraper (Cheerio + Axios)**
  - Extrae datos de productos de Mercadona desde FatSecret España
  - Obtiene información nutricional detallada (22 campos)
  - Sincronización automática con la base de datos

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
│   │   ├── config/       # Configuraciones (base de datos, etc.)
│   │   ├── controllers/  # Controladores para las rutas de la API
│   │   ├── models/       # Modelos de la base de datos (Mongoose)
│   │   ├── routes/       # Definición de rutas de la API
│   │   ├── services/     # Lógica de negocio y servicios
│   │   │   ├── __tests__/  # Pruebas unitarias de servicios
│   │   └── index.ts      # Punto de entrada del servidor
│   ├── styles/           # Estilos globales y módulos CSS
│   └── types/            # Tipos de TypeScript
├── .env.example         # Plantilla de variables de entorno
├── .eslintrc.json       # Configuración de ESLint
├── .gitignore           # Archivos ignorados por Git
├── .prettierrc          # Configuración de Prettier
├── .jest.config.js      # Configuración de Jest
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

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
#PORT
PORT=5000

# Node Environment
NODE_ENV=development

# MongoDB
MONGODB_URI=<tu_uri_aqui>

```

### 5️⃣ Flujo de sincronización

La aplicación incluye un sistema de sincronización que permite mantener actualizada la base de datos de productos de Mercadona. El proceso se realiza directamente desde la interfaz de usuario de la aplicación:

1. **Iniciar sincronización**: Desde el panel de administración, haz clic en "Sincronizar productos".
2. **Procesamiento**: La aplicación se conectará a FatSecret España y comenzará a extraer la información de los productos.
3. **Actualización**: Los productos se actualizarán automáticamente en la base de datos.
4. **Confirmación**: Recibirás una notificación cuando la sincronización haya finalizado, mostrando un resumen de los cambios realizados.

> **Nota**: La sincronización puede tardar varios minutos dependiendo de la cantidad de productos a actualizar.
