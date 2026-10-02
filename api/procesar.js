module.exports = function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      mensaje: "Metodo no permitido",
    });
  }

  const { nombre, mensaje } = req.body;

  if (!nombre || !mensaje) {
    return res.status(400).json({
      ok: false,
      mensaje: "Faltan datos",
    });
  }

  const hora = new Date().toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

  return res.status(200).json({
    ok: true,
    nombre,
    mensaje,
    hora,
  });
};
