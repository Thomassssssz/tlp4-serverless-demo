const formulario = document.getElementById("formulario");

const boton = document.getElementById("boton");

const estado = document.getElementById("estado");

const resultado = document.getElementById("resultado");

const pasos = [
  document.getElementById("paso-usuario"),
  document.getElementById("paso-web"),
  document.getElementById("paso-http"),
  document.getElementById("paso-serverless"),
  document.getElementById("paso-respuesta"),
];

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function reiniciarFlujo() {
  pasos.forEach((paso) => {
    paso.classList.remove("activo");
    paso.classList.remove("completado");
  });
}

async function activarPaso(indice) {
  if (indice > 0) {
    pasos[indice - 1].classList.remove("activo");
    pasos[indice - 1].classList.add("completado");
  }

  pasos[indice].classList.add("activo");

  await esperar(450);
}

formulario.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();

  const mensaje = document.getElementById("mensaje").value.trim();

  boton.disabled = true;

  boton.textContent = "Ejecutando...";

  resultado.classList.add("oculto");

  reiniciarFlujo();

  try {
    estado.textContent = "El usuario genera el evento...";

    await activarPaso(0);

    estado.textContent = "La página prepara los datos...";

    await activarPaso(1);

    estado.textContent = "Enviando solicitud HTTP...";

    await activarPaso(2);

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

    estado.textContent = "Ejecutando función Serverless...";

    await activarPaso(3);

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.mensaje);
    }

    estado.textContent = "Procesando respuesta de la función...";

    await activarPaso(4);

    pasos[4].classList.remove("activo");

    pasos[4].classList.add("completado");

    document.getElementById("respuestaEstado").textContent = "200 OK";

    document.getElementById("respuestaNombre").textContent = datos.nombre;

    document.getElementById("respuestaMensaje").textContent = datos.mensaje;

    document.getElementById("respuestaHora").textContent = datos.hora;

    resultado.classList.remove("oculto");

    estado.textContent = "Función ejecutada correctamente";
  } catch (error) {
    estado.textContent = "Ocurrió un error al ejecutar la función";

    reiniciarFlujo();

    console.error(error);
  }

  boton.disabled = false;

  boton.textContent = "Ejecutar función Serverless";
});
