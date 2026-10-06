# Etapa 2 — Proyecto base

Archivos creados: `tsconfig.json`, `tsconfig.server.json`, `vite.config.ts`, `vercel.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/types/Producto.ts`, `.env.example`.

Archivos modificados: `package.json`, `.gitignore`. Se retira la demostración anterior (`api/procesar.js` y los tres archivos de `public/`) para reemplazarla con React. Git conserva su historial.

Comandos: `npm ci`, `npm run build`. El lockfile generado se entrega junto con el proyecto.

React renderiza la aplicación; Vite compila el frontend; TypeScript verifica tipos; Vercel recibe las funciones en `api/`.

## package.json

```json
{
  "name": "control-de-stock-serverless",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": "24.x"
  },
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "dev:full": "vercel dev",
    "typecheck": "tsc --noEmit && tsc -p tsconfig.server.json --noEmit",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "tsx --test tests/*.test.ts",
    "test:crud": "node scripts/smoke-crud.mjs"
  },
  "dependencies": {
    "@supabase/supabase-js": "2.117.2",
    "react": "19.3.0",
    "react-dom": "19.3.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vercel/node": "21.0.0",
    "@vitejs/plugin-react": "6.1.2",
    "tsx": "4.23.15",
    "typescript": "5.9.3",
    "vite": "8.3.3"
  }
}

```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": [
      "vite/client"
    ]
  },
  "include": [
    "src",
    "vite.config.ts"
  ]
}

```

## tsconfig.server.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": [
      "ES2022"
    ],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "types": [
      "node"
    ]
  },
  "include": [
    "api",
    "server",
    "tests",
    "src/types"
  ]
}

```

## vite.config.ts

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react()] });

```

## vercel.json

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/productos",
      "destination": "/api/productos/index"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}

```

## index.html

```
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#153c36" />
    <meta name="description" content="Control de stock con React, funciones Serverless y Supabase/PostgreSQL." />
    <title>Control de Stock</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

```

## src/main.tsx

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);

```

## src/App.tsx

```tsx
export default function App() {
  return <main><h1>Control de Stock</h1><p>Base React + Vite + TypeScript preparada.</p></main>;
}

```

## src/styles.css

```
:root { font-family: system-ui, sans-serif; color: #183d37; background: #f5f7f5; }
body { margin: 0; }
main { max-width: 1200px; margin: auto; padding: 32px; }

```

## src/types/Producto.ts

```ts
export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  stock: number;
  fecha_creacion: string;
}

export type ProductoInput = Pick<Producto, 'nombre' | 'descripcion' | 'categoria' | 'precio' | 'stock'>;
export type ProductoUpdate = ProductoInput & { expected_stock: number };
export interface ApiResponse<T> { data: T }
export interface ApiErrorBody { error: string }

```

## .env.example

```
# Solo backend. Nunca usar VITE_ para la clave privada.
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=REEMPLAZAR_EN_CONFIGURACION_SEGURA

```

## .gitignore

```
.vercel/
node_modules/
dist/
.env
.env.*
!.env.example
*.local
*.log
coverage/
.DS_Store

```
