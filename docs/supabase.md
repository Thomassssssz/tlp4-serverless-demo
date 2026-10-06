# Etapa 3 — Supabase y PostgreSQL

## Crear tu proyecto

1. Entrá a https://supabase.com/dashboard y creá una cuenta.
2. Elegí **New project**, una organización y el nombre `control-de-stock`.
3. Elegí una región cercana y una contraseña segura para PostgreSQL. Guardala en tu gestor de contraseñas, no en GitHub.
4. Cuando el proyecto esté disponible, abrí **SQL Editor → New query**.
5. Pegá el archivo completo `supabase/schema.sql` y ejecutalo con **Run**.
6. Revisá en **Table Editor** que exista `public.productos`.

El script crea la tabla con UUID y fecha automáticos, restricciones de precio/stock, RLS y una función SQL para actualizar stock de manera atómica. Puede ejecutarse otra vez sobre el esquema creado por este proyecto sin borrar productos. `IF NOT EXISTS` no migra una tabla previa que tenga otros campos: para este trabajo usá un proyecto nuevo o verificá el esquema existente.

## Conectar las funciones

Buscá la URL del proyecto en **Project Settings → Data API** (también puede aparecer en Connect). En **API Keys**, usá la clave del backend `secret` o la clave heredada `service_role`, nunca la clave pública `anon`/`publishable` para este backend. Los nombres del panel pueden cambiar.

Variables necesarias, exclusivamente del backend:

| Variable | Contenido |
| --- | --- |
| `SUPABASE_URL` | `https://<referencia-del-proyecto>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada `secret` o heredada `service_role` |

El nombre de la variable es el mismo con ambos formatos de clave. La clave tiene permisos elevados: no va en el navegador, capturas, documentación ni GitHub. La sesión de Supabase está deshabilitada en el cliente del servidor.

Para desarrollo local: copiá `.env.example` a `.env.local`, completalo privadamente y usá `vercel dev`. Vite por sí solo solo ejecuta el frontend. Para el entorno cloud, cargá las variables desde su configuración segura; no compartas claves en el chat. Para Vercel, agregalas en **Project Settings → Environment Variables** y volvé a desplegar.

No necesitás contraseña de PostgreSQL en la aplicación: las funciones acceden por la API HTTPS de Supabase.

Si el entorno cloud tiene red restringida, permití el hostname exacto de tu proyecto (`<referencia>.supabase.co`) en su configuración de red. Para autenticar la CLI de Vercel puede ser necesario permitir `vercel.com` y `api.vercel.com`. Esto afecta las comprobaciones desde el entorno cloud; no sustituye las variables del proyecto en Vercel.

## Alcance de seguridad

RLS y los permisos impiden que las claves públicas del navegador accedan a esta tabla. La clave privada queda en Vercel. Este trabajo no incluye login; las funciones HTTP son públicas, por lo que alguien con acceso a la URL puede operar el inventario. Usá datos académicos. Un inventario privado real requiere autenticar y autorizar usuarios en cada función; ocultar la clave no reemplaza ese control.

## Verificar esta etapa

Ejecutá el SQL y comprobá la tabla y la función en Supabase. Sin tu proyecto, no se puede verificar la conexión remota ni afirmar que los datos ya se guardan allí. Mientras tanto se pueden compilar y probar los handlers con dependencias controladas.
