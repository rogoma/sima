function requireRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "Sin permisos para esta acción." });
    }
    next();
  };
}

function puedeAccederLocalidad(usuario, localidadId) {
  if (!usuario.localidades || !usuario.localidades.length) return true;
  return usuario.localidades.includes(localidadId);
}

module.exports = { requireRol, puedeAccederLocalidad };
