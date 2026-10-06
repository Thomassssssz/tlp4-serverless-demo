# Etapas 7 y 9 — Pruebas y revisión

## Resultados de esta implementación

| Comprobación | Resultado y alcance |
| --- | --- |
| npm run build | Pasó: frontend y backend con TypeScript, frontend compilado por Vite |
| npm test | 41 pruebas pasaron; 0 fallidas y 0 omitidas |
| SQL | Ejecutado dos veces en PostgreSQL embebido; UUID/fecha, CRUD, restricciones, RPC y permisos verificados |
| Navegador Chromium | Alta, edición, búsqueda HTTP, aumentos/disminuciones, error de stock y confirmación de eliminación pasaron con respuestas HTTP controladas |
| Responsive | Escritorio 1440 px y teléfono 390 px verificados, sin desbordamiento de página ni excepciones del navegador |
| Bundle frontend | No contiene referencias a la clave privada de Supabase |
| npm audit --omit=dev | No informó vulnerabilidades en dependencias de producción en esta ejecución |
| Supabase remoto | Pendiente: el usuario todavía no creó su proyecto |
| vercel dev / publicación | Pendiente: sin autenticación/proyecto de Vercel; el intento de CLI no pudo completar el login |
| CRUD publicado y concurrencia remota | Pendiente: requiere URL real y SQL instalado |

Las pruebas de handlers usan el SDK real de Supabase con fetch controlado. No son pruebas de red contra la base real. La prueba de navegador también controla respuestas HTTP; no existe un modo de inventario falso en la aplicación.

La verificación SQL se ejecutó con PGlite, PostgreSQL embebido, como herramienta externa de validación fuera del repositorio. No se agregó como dependencia ni tecnología de la aplicación, y no demuestra conectividad con Supabase ni concurrencia entre conexiones reales.

La consola de npm test muestra un mensaje genérico durante la prueba deliberada del error HTTP 500; ese caso pasó. No se imprimen secretos.

Capturas de la revisión con datos de prueba, no de una base remota:

- [Escritorio](capturas/escritorio.png)
- [Teléfono](capturas/movil.png)

## Repetir verificaciones del código

```bash
npm ci
npm run build
npm test
```

Para comprobar persistencia real y dos solicitudes simultáneas después de desplegar:

```bash
STOCK_API_URL=https://TU-DOMINIO.vercel.app npm run test:crud
```

El script modifica únicamente un producto temporal que crea para esta ejecución e intenta limpiarlo incluso si falla. No lo ejecutes contra un proyecto ajeno.

## Matriz de pruebas manuales

| Caso | Resultado esperado |
| --- | --- |
| Nombre vacío o solo espacios | No guardar; API 400 |
| Precio negativo | No guardar; API 400 |
| Stock fraccionario o negativo | No guardar; API 400 |
| Precio 0 y stock 0 | Guardar; etiqueta Sin stock |
| Stock 1 a 5 | Stock bajo |
| Stock 6 o más | Disponible |
| Retirar más unidades que las disponibles | API 409; la base conserva el stock |
| Dos retiros simultáneos de la última unidad | Una respuesta 200 y otra 409; stock final 0 |
| Editar con stock original desactualizado | API 409; cerrar, actualizar y reabrir formulario |
| UUID inválido | API 400 |
| Producto que no existe | API 404 |
| Método no permitido | API 405 con cabecera Allow |
| Backend sin variables | API 503 |
| Recargar la página | Mismos valores que PostgreSQL |
| Cancelar eliminación | Registro intacto |
| Confirmar eliminación | Desaparece de la lista y de PostgreSQL |
| Cambiar rápidamente el buscador | Se descartan respuestas de búsquedas anteriores |
| Fallo de red | Aviso de error; no se inventan resultados |

## Diagnóstico

- Solo npm run dev: Vite sirve React pero no ejecuta api/. Usá npm run dev:full con Vercel configurado.
- 503: comprobar presencia de ambas variables en el backend y volver a desplegar.
- 500: revisar logs de Vercel, URL/clave, existencia de tabla y función SQL. No pegar claves en logs.
- 404 de HTML: verificar ruta, importación del proyecto y vercel.json.
- 409 al editar: el stock cambió desde que se abrió el formulario. Actualizar y volver a editar.
- 409 al retirar: no hay unidades suficientes o se superó el rango integer.
- La base está vacía: es normal antes del primer producto; la app no carga productos de demostración.
- Preview protegido: usar acceso autorizado de Vercel antes de probar por HTTP.

## Limitaciones del alcance

No hay login, roles de aplicación, historial de movimientos ni sincronización en tiempo real entre pantallas. Una modificación de otro usuario se ve al consultar nuevamente. La lista se pagina internamente para evitar truncamiento, pero inventarios muy grandes requieren paginación visible. El stock tiene rango integer y el precio hasta dos decimales.

No se considera finalizada la integración real hasta ejecutar el SQL en Supabase, cargar las variables, desplegar y pasar la prueba CRUD real.
