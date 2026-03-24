const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const pool = require("../db/pool");
const authMiddleware = require("../middlewares/auth");

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post(
  "/login",
  [
    body("id").notEmpty().withMessage("El usuario es requerido."),
    body("password").notEmpty().withMessage("La contraseña es requerida."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id, password } = req.body;

    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.rol, u.rol_nombre, u.password_hash, u.activo,
              array_agg(ul.localidad_id) FILTER (WHERE ul.localidad_id IS NOT NULL) AS localidades
       FROM usuarios u
       LEFT JOIN usuario_localidades ul ON ul.usuario_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );

    if (!rows.length) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const user = rows[0];

    if (!user.activo) {
      return res.status(401).json({ error: "Usuario inactivo. Contacte al administrador." });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    const { password_hash, ...userSafe } = user;
    res.json({ token, usuario: userSafe });
  }
);

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", authMiddleware, (req, res) => {
  const { password_hash, ...userSafe } = req.usuario;
  res.json(userSafe);
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────────
// El logout es manejado en el cliente (eliminar el token).
// Este endpoint existe para invalidaciones futuras (blacklist de tokens).
router.post("/logout", authMiddleware, (req, res) => {
  res.json({ mensaje: "Sesión cerrada correctamente." });
});

module.exports = router;
