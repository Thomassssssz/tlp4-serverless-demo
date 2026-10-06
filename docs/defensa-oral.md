# Etapa 10 — Defensa oral

## Presentación de dos minutos

“Desarrollamos un sistema de control de stock para registrar productos, consultar el inventario y controlar entradas y salidas.

El frontend está hecho con React, Vite y TypeScript. El backend usa funciones Serverless en Vercel, escritas con Node.js y TypeScript. La base de datos es PostgreSQL y accedemos a ella mediante Supabase.

Cuando el usuario realiza una operación, React envía una solicitud HTTP. Vercel ejecuta el handler correspondiente, que valida los datos y consulta o modifica la base. Después devuelve JSON y termina su ejecución. React actualiza la pantalla con el resultado confirmado.

No implementamos un backend con Express ni un servidor que escuche permanentemente. Vercel administra la infraestructura. PostgreSQL conserva los datos aunque termine la ejecución de la función.

Para el stock, usamos una operación SQL atómica. Así, dos solicitudes simultáneas no sobrescriben cambios y el stock nunca queda negativo. La interfaz distingue productos disponibles, con stock bajo y sin stock.”

## Ejemplo: agregar producto

1. Completo el formulario con nombre, descripción, categoría, precio y stock.
2. React envía POST /api/productos.
3. Vercel ejecuta api/productos/index.ts.
4. El handler verifica nombre, precio y stock.
5. Supabase inserta el registro en PostgreSQL, que genera ID y fecha.
6. Recibo 201 con el producto, y React consulta nuevamente el listado.

## Ejemplo: modificar stock

1. Selecciono “Disminuir stock” e ingreso una cantidad.
2. React envía PATCH con delta negativo.
3. El handler valida ID y cantidad.
4. Invoca actualizar_stock mediante Supabase RPC.
5. PostgreSQL verifica y modifica la fila en una sola operación.
6. Si alcanza el stock, devuelve el valor guardado; si no, recibo 409.
7. React muestra los datos confirmados y el estado correspondiente.

La función SQL es lógica dentro de la base; la función Serverless es el handler que Vercel ejecutó por HTTP.

## Ejemplo: eliminar producto

Confirmo la eliminación. React envía DELETE /api/productos/ID. La función ejecuta la eliminación en PostgreSQL mediante Supabase y devuelve el producto eliminado. React vuelve a cargar el inventario. Si ya no existe, el backend responde 404.

## Dónde entra Serverless

En api/: son funciones invocadas por eventos HTTP. React es la interfaz y Supabase/PostgreSQL mantiene la persistencia.

## Por qué es Serverless

Entregamos handlers al proveedor y no iniciamos un proceso propio con app.listen(). Cada solicitud tiene una ejecución que responde y termina. No depende de una variable global o de memoria para mantener productos.

No decimos que desaparezcan los servidores: los administra Vercel. Puede reutilizar instancias para varias solicitudes.

## Comparación con un backend tradicional

| Backend tradicional administrado por nosotros | Backend de este proyecto |
| --- | --- |
| Iniciamos un servidor que escucha solicitudes | Publicamos handlers que Vercel invoca |
| Administramos proceso y disponibilidad | El proveedor administra la ejecución |
| Debemos configurar la capacidad del servidor | La plataforma gestiona recursos según sus límites |
| La base externa conserva los datos | PostgreSQL externo conserva los datos |

Ambos pueden validar datos y acceder a una base. La diferencia principal está en el modelo de ejecución y administración, no en que uno use JavaScript.

## Preguntas frecuentes

**¿Qué evento activa una función?** Una solicitud HTTP: GET, POST, PUT, PATCH o DELETE.

**¿Cuándo comienza y termina?** El handler comienza cuando Vercel enruta la solicitud; termina al devolver la respuesta y retornar, o al responder un error.

**¿Qué pasa cuando recargo?** React consulta la base otra vez. Los datos siguen en PostgreSQL.

**¿Por qué Supabase?** Proporciona acceso HTTPS a PostgreSQL y administración de la base sin agregar un servidor propio.

**¿Por qué validar en tres lugares?** El formulario ayuda al usuario, el backend protege la API y las restricciones de la base preservan la integridad.

**¿Cómo evitan stock negativo?** Validamos datos y usamos un UPDATE atómico condicionado, además de CHECK stock >= 0 en la tabla.

**¿Qué es un cold start?** El tiempo adicional que puede necesitar la plataforma al preparar un entorno de ejecución.

**¿Es gratuito e ilimitado?** No. Vercel y Supabase tienen planes, cuotas y límites.

**¿Es un sistema privado listo para una empresa?** No incluye login ni permisos por usuario. Es una demostración académica funcional; un uso privado necesita autenticación y autorización.

## Demostración en clase: cinco minutos

- Mostrar arquitectura y abrir Network en las herramientas del navegador.
- Agregar un producto con 8 unidades y señalar POST, 201 y JSON.
- Bajar a 5: mostrar PATCH, respuesta y “Stock bajo”.
- Bajar a 0: mostrar “Sin stock” y la acción de retirar deshabilitada.
- Recargar y mostrar la fila en Supabase para demostrar persistencia.
- Editar, buscar y eliminar.
- Mostrar el handler y resaltar validación, llamada a Supabase y return res.status(...).json(...).
- Cerrar explicando que el backend no usa Express ni app.listen().
