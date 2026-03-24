const jwt = require("jsonwebtoken");
const pool = require("../db/pool");

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado." });
  }
  try {
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.rol, u.rol_nombre, u.password_hash, u.activo,
              array_agg(ul.localidad_id) FILTER (WHERE ul.localidad_id IS NOT NULL) AS localidades
       FROM usuarios u
       LEFT JOIN usuario_localidades ul ON ul.usuario_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [decoded.id]
    );
    if (!rows.length) return res.status(401).json({ error: "Usuario no encontrado." });
    if (!rows[0].activo) return res.status(401).json({ error: "Usuario inactivo." });
    req.usuario = rows[0];
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};
