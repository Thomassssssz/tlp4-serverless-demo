const formulario = document.getElementById("formulario");

const boton = document.getElementById("boton");

const estado = document.getElementById("estado");

const resultado = document.getElementById("resultado");

formulario.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const mensaje = document.getElementById("mensaje").value;

  boton.disabled = true;
  boton.textContent = "Ejecutando...";

  estado.textContent = "Enviando solicitud HTTP a la función Serverless...";

  resultado.classList.add("oculto");

  try {
    const respuesta = await fetch("/api/procesar", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        nombre,
        mensaje,
      }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.mensaje);
    }

    estado.textContent = "Función ejecutada correctamente";

    document.getElementById("respuestaEstado").textContent = "200 OK";

    document.getElementById("respuestaNombre").textContent = datos.nombre;

    document.getElementById("respuestaMensaje").textContent = datos.mensaje;

    document.getElementById("respuestaHora").textContent = datos.hora;

    resultado.classList.remove("oculto");
  } catch (error) {
    estado.textContent = "Ocurrió un error al ejecutar la función";

    console.error(error);
  }

  boton.disabled = false;

  boton.textContent = "Ejecutar función Serverless";
});
