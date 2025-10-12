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
- **Base de datos / Dataset (Postgres)**  
- **Scraper (Playwright)**

- ## ⚙️ Instalación y ejecución

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

OPENAI_API_KEY=tu_clave_aqui
