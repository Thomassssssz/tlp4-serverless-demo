# Configuración final completa

Estos archivos corresponden a la entrega final. package.json agrega Vercel CLI para que npm run dev:full funcione después de autenticar y vincular el proyecto. package-lock.json completo está en la raíz, generado por npm; usar npm ci.

## package.json

```
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
    "vercel": "62.5.0",
    "vite": "8.3.3"
  }
}

```

## tsconfig.json

```
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

```
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

```
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react()] });

```

## vercel.json

```
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

```
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);

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
