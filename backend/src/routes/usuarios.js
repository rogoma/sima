const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const pool = require("../db/pool");
const auth = require("../middlewares/auth");
const { requireRol } = require("../middlewares/roles");

// Solo el coordinador puede gestionar usuarios
const soloCoordinador = [auth, requireRol("coordinador")];

// ─── GET /api/usuarios ─────────────────────────────────────────────────────────
router.get("/", ...soloCoordinador, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.rol, u.rol_nombre, u.activo, u.created_at,
            array_agg(ul.localidad_id ORDER BY ul.localidad_id) FILTER (WHERE ul.localidad_id IS NOT NULL) AS localidades
     FROM usuarios u
     LEFT JOIN usuario_localidades ul ON ul.usuario_id = u.id
     GROUP BY u.id
     ORDER BY u.nombre`
  );
  res.json(rows);
});

// ─── GET /api/usuarios/:id ─────────────────────────────────────────────────────
router.get("/:id", ...soloCoordinador, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.rol, u.rol_nombre, u.activo, u.created_at,
            array_agg(ul.localidad_id ORDER BY ul.localidad_id) FILTER (WHERE ul.localidad_id IS NOT NULL) AS localidades
     FROM usuarios u
     LEFT JOIN usuario_localidades ul ON ul.usuario_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Usuario no encontrado." });
  res.json(rows[0]);
});

// ─── POST /api/usuarios ────────────────────────────────────────────────────────
router.post(
  "/",
  ...soloCoordinador,
  [
    body("id").notEmpty().matches(/^[a-z0-9_]+$/).withMessage("ID solo puede contener letras minúsculas, números y guiones bajos."),
    body("nombre").notEmpty().trim(),
    body("rol").isIn(["coordinador", "junta", "contratista", "equipo"]),
    body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres."),
    body("localidades").optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id, nombre, rol, rol_nombre, password, localidades } = req.body;

    const { rows: existe } = await pool.query(`SELECT id FROM usuarios WHERE id=$1`, [id]);
    if (existe.length) return res.status(409).json({ error: "Ya existe un usuario con ese ID." });

    const hash = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO usuarios (id, nombre, rol, rol_nombre, password_hash) VALUES ($1,$2,$3,$4,$5)`,
        [id, nombre.trim(), rol, rol_nombre || null, hash]
      );

      if (localidades?.length) {
        for (const locId of localidades) {
          await client.query(
            `INSERT INTO usuario_localidades (usuario_id, localidad_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
            [id, locId]
          );
        }
      }

      await client.query("COMMIT");
      const { rows } = await client.query(
        `SELECT u.id, u.nombre, u.rol, u.rol_nombre, u.activo,
                array_agg(ul.localidad_id) FILTER (WHERE ul.localidad_id IS NOT NULL) AS localidades
         FROM usuarios u LEFT JOIN usuario_localidades ul ON ul.usuario_id=u.id
         WHERE u.id=$1 GROUP BY u.id`,
        [id]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
);

// ─── PUT /api/usuarios/:id ─────────────────────────────────────────────────────
router.put(
  "/:id",
  ...soloCoordinador,
  [
    body("nombre").optional().notEmpty().trim(),
    body("rol").optional().isIn(["coordinador", "junta", "contratista", "equipo"]),
    body("password").optional().isLength({ min: 6 }),
    body("localidades").optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows } = await client.query(`SELECT * FROM usuarios WHERE id=$1`, [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: "Usuario no encontrado." });

      const { nombre, rol, rol_nombre, password, activo, localidades } = req.body;
      const updates = [];
      const params = [];

      if (nombre !== undefined) { updates.push(`nombre=$${params.push(nombre.trim())}`); }
      if (rol !== undefined)    { updates.push(`rol=$${params.push(rol)}`); }
      if (rol_nombre !== undefined) { updates.push(`rol_nombre=$${params.push(rol_nombre)}`); }
      if (activo !== undefined) { updates.push(`activo=$${params.push(activo)}`); }
      if (password)             { updates.push(`password_hash=$${params.push(await bcrypt.hash(password, 10))}`); }

      if (updates.length) {
        updates.push(`updated_at=$${params.push(new Date().toISOString())}`);
        await client.query(`UPDATE usuarios SET ${updates.join(",")} WHERE id=$${params.push(req.params.id)}`, params);
      }

      if (localidades !== undefined) {
        await client.query(`DELETE FROM usuario_localidades WHERE usuario_id=$1`, [req.params.id]);
        for (const locId of localidades) {
          await client.query(`INSERT INTO usuario_localidades (usuario_id, localidad_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [req.params.id, locId]);
        }
      }

      await client.query("COMMIT");
      const { rows: updated } = await client.query(
        `SELECT u.id, u.nombre, u.rol, u.rol_nombre, u.activo,
                array_agg(ul.localidad_id) FILTER (WHERE ul.localidad_id IS NOT NULL) AS localidades
         FROM usuarios u LEFT JOIN usuario_localidades ul ON ul.usuario_id=u.id
         WHERE u.id=$1 GROUP BY u.id`,
        [req.params.id]
      );
      res.json(updated[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
);

// ─── DELETE /api/usuarios/:id — desactiva, no elimina ─────────────────────────
router.delete("/:id", ...soloCoordinador, async (req, res) => {
  if (req.params.id === req.usuario.id) {
    return res.status(400).json({ error: "No puede desactivar su propio usuario." });
  }
  const { rows } = await pool.query(
    `UPDATE usuarios SET activo=false, updated_at=NOW() WHERE id=$1 RETURNING id`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Usuario no encontrado." });
  res.json({ mensaje: "Usuario desactivado." });
});

// ─── GET /api/usuarios/modalidades ────────────────────────────────────────────
router.get("/modalidades/lista", auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT m.id, m.nombre, m.cat,
            array_agg(mr.rol ORDER BY mr.rol) AS roles
     FROM modalidades m
     JOIN modalidad_roles mr ON mr.modalidad_id = m.id
     WHERE m.activo = TRUE
     GROUP BY m.id
     ORDER BY m.cat, m.nombre`
  );
  res.json(rows);
});

module.exports = router;
