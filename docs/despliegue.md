# Etapa 8 — GitHub y Vercel

El código está preparado para Vercel. No se ha publicado automáticamente: todavía faltan el proyecto Supabase y una cuenta/proyecto autorizado de Vercel.

## 1. Preparar Supabase

Seguí supabase.md, ejecutá schema.sql y obtené la URL y clave privada. No publiques secretos ni una captura de las variables.

## 2. Subir cambios a GitHub

El repositorio ya existe: Thomassssssz/tlp4-serverless-demo. Desde su carpeta:

```bash
npm ci
npm run build
npm test
git status --short
git switch -c control-stock-serverless
git add .
git diff --cached --stat
git commit -m "Implementar control de stock con funciones Serverless"
git push -u origin control-stock-serverless
```

Revisá los archivos antes del commit. .env.local está ignorado. Si la rama ya existe, usá git switch control-stock-serverless. En GitHub, abrí un Pull Request desde esa rama hacia main, revisá y fusioná los cambios. No hay que crear otro repositorio ni cambiar origin.

En tu computadora puede ser necesario autenticar Git con GitHub para el push. El acceso de lectura de este entorno no demuestra permiso de escritura desde tu máquina.

## 3. Conectar con Vercel

1. Entrá a https://vercel.com y conectá tu cuenta de GitHub.
2. Elegí Add New → Project e importá tlp4-serverless-demo.
3. Si todavía no aparece, autorizá ese repositorio en la integración de GitHub.
4. Seleccioná Vite como framework y la raíz del repositorio como Root Directory.
5. Verificá: Build Command = npm run build y Output Directory = dist.
6. Seleccioná Node.js 24.x, coherente con package.json.
7. Agregá las variables antes de desplegar.

No hay que publicar un servidor manual. Vercel detecta los archivos TypeScript de api/ y los convierte en funciones. vercel.json define explícitamente la ruta del listado hacia api/productos/index y configura el frontend.

## 4. Variables de entorno

| Nombre | Valor |
| --- | --- |
| SUPABASE_URL | URL HTTPS del proyecto Supabase |
| SUPABASE_SERVICE_ROLE_KEY | Clave privada del backend: secret o service_role |

Cargalas en Settings → Environment Variables para Production y, si vas a probar ramas, Preview. Para usar vercel dev, también Development. No uses VITE_ para estas variables ni subas .env.local.

Si modificás variables después del despliegue, ejecutá Redeploy para que el nuevo despliegue las reciba. Las ramas de prueba pueden compartir la misma base: elegí datos académicos o proyectos separados si querés aislamiento.

## 5. Desplegar y verificar

Elegí Deploy. La compilación debe pasar. Abrí el dominio que **Vercel te entregue**; no hay un dominio inventado en esta documentación.

Consultá /api/productos: debe responder HTTP 200 y JSON con data. Si falta configuración, debe responder 503. Revisá los logs de las funciones desde el proyecto Vercel; no registres claves ni cuerpos completos.

## 6. Desarrollo local del sistema completo

Vercel CLI está incluida en las devDependencies:

```bash
npm ci
npx vercel login
npx vercel link
npx vercel env pull .env.local
npm run dev:full
```

Alternativamente, copiá .env.example a .env.local y completalo privadamente antes de vercel dev. El archivo descargado por env pull no debe subirse a Git.

vercel dev emula el frontend y las funciones para desarrollo. Es una herramienta local: la aplicación publicada sigue ejecutando handlers bajo demanda. npm run dev inicia solo Vite y no ejecuta api/; allí la interfaz mostrará que el backend no está disponible.

## 7. Probar funciones y CRUD publicado

```bash
curl -i https://TU-DOMINIO.vercel.app/api/productos
curl -i -X POST https://TU-DOMINIO.vercel.app/api/productos \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Teclado","descripcion":"USB","categoria":"Tecnología","precio":15000,"stock":8}'
```

Copiá el ID devuelto. Usalo en GET /api/productos/ID, PUT, PATCH /api/productos/ID/stock y DELETE. El stock se cambia con JSON {"delta":2} o {"delta":-2}. PUT requiere el producto completo y expected_stock.

Para una prueba repetible que crea y elimina su propio producto:

```bash
STOCK_API_URL=https://TU-DOMINIO.vercel.app npm run test:crud
```

Este comando escribe datos reales: ejecutalo únicamente contra tu proyecto académico. Comprueba creación, búsqueda, consulta, edición, aumentos, disminuciones, stock insuficiente, persistencia y eliminación. También prueba dos disminuciones simultáneas para comprobar que solo una puede consumir el último stock. El ID y nombre temporal se informan; se intenta limpiar el producto incluso ante fallos.

Si activaste Deployment Protection en un preview, probá en un dominio accesible de tu proyecto o configurá el acceso autorizado de Vercel. No desactives controles ni insertes tokens en el código para hacer pasar una prueba.

## 8. Prueba manual final

Agregá un producto con stock 8, aumentalo a 10, bajalo a 5 y luego a 0. Verificá las etiquetas, recargá la página y comprobá el mismo valor en Supabase Table Editor. Editá precio/nombre, buscá el nuevo nombre y eliminá el producto. Confirmá que desaparezca también de PostgreSQL.

La recarga y la consulta a la tabla demuestran que el stock no se guarda solo en React.
