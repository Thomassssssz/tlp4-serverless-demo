# Entrega por etapas

Cada etapa tiene archivos completos, explicación, comandos y un criterio de validación. Los archivos .md de código son material de lectura, no archivos que debas copiar sobre versiones posteriores del proyecto.

| Etapa | Entrega | Validación / estado |
| --- | --- | --- |
| 1. Arquitectura | arquitectura.md | Diseño definido, sin Express ni servidor propio |
| 2. Proyecto base | etapa-2-base.md | Dependencias instaladas y compilación verificada |
| 3. Supabase/PostgreSQL | supabase.md y etapa-3-codigo.md | SQL validado localmente; falta tu proyecto remoto |
| 4. Funciones Serverless | etapa-4-codigo.md | Handlers y validaciones probados |
| 5. Frontend | etapa-5-codigo.md | Interfaz probada en escritorio/teléfono |
| 6. Conexión HTTP | etapa-6-codigo.md | Servicio y UI probados con respuestas controladas |
| 7. CRUD | pruebas.md, etapa-7-codigo.md | Pruebas locales pasaron; CRUD remoto pendiente |
| 8. Despliegue | despliegue.md | Preparado; pendiente de tus cuentas y variables |
| 9. Revisión | pruebas.md | Tipado, build, errores y responsive revisados |
| 10. Documentación/defensa | arquitectura.md y defensa-oral.md | Material completo |

La falta de un proyecto Supabase impide certificar la etapa 3 remota y el CRUD publicado. Se completó el trabajo independiente (SQL, handlers, interfaz, pruebas y documentación), sin dar por aprobada esa integración. El siguiente paso es crear el proyecto y ejecutar schema.sql; después se reanudan las verificaciones reales.

## Comandos por etapa

- Etapa 2: npm ci; npm run build.
- Etapa 3: ejecutar supabase/schema.sql en Supabase SQL Editor y cargar variables privadas.
- Etapa 4: npm run typecheck; npm test.
- Etapas 5–6: npm run build; usar vercel dev para el sistema completo.
- Etapa 7: npm test; STOCK_API_URL=<origen real> npm run test:crud después del despliegue.
- Etapa 8: seguir despliegue.md para GitHub y Vercel.
- Etapa 9: repetir build/test si hay cambios; recorrer la matriz de pruebas.
- Etapa 10: leer defensa-oral.md y practicar la demostración.

## Archivos finales de configuración

etapa-2-base.md conserva la base inicial. configuracion-final.md contiene package.json (ahora con Vercel CLI), configuraciones y entradas de la entrega final. package-lock.json completo está en la raíz y debe versionarse; no se duplica su contenido generado en Markdown.
