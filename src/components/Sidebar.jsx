import React from "react";
import { C } from "../styles/colors";

import { useMobile } from "../hooks/useMobile";

export default function Sidebar({ usuario, vista, setVista, pendientes, onLogout, localidades, isOpen, onClose }) {
  const isMobile = useMobile();
  const items = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "registros", icon: "📋", label: "Registros" },
    { id: "nuevo", icon: "➕", label: "Nuevo Registro" },
    ...(usuario.rol === "coordinador" ? [{ id: "validacion", icon: "✅", label: "Validación", badge: pendientes }] : []),
    ...(usuario.rol === "coordinador" ? [{ id: "reportes", icon: "📈", label: "Reportes" }] : []),
    ...(usuario.rol === "coordinador" ? [{ id: "admin", icon: "⚙️", label: "Administración" }] : []),
  ];

  const locNombre = (id) => localidades.find((l) => l.id === id)?.nombre || id;

  return (
    <>
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 99, backdropFilter: "blur(2px)" }}
        />
      )}
      <div style={{
        width: 230,
        background: `linear-gradient(180deg,${C.azulOscuro} 0%,${C.azul} 100%)`,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 100,
        boxShadow: "3px 0 24px rgba(0,0,0,0.15)",
        transform: isMobile && !isOpen ? "translateX(-100%)" : "translateX(0)",
        transition: "transform 0.25s ease",
      }}>
        <div style={{ padding: "22px 18px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="Logo_Senasa.jpg" alt="Logo Senasa" style={{ height: 50, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: C.blanco, letterSpacing: "-0.02em" }}>SIMA</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>Monitor Social · Alcantarillado</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.blanco, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{usuario.nombre}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>{usuario.rol_nombre || usuario.rol}</div>
          {usuario.localidades && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>
              📍 {usuario.localidades.map((id) => locNombre(id)).join(", ")}
            </div>
          )}
        </div>
        <nav style={{ flex: 1, padding: "10px 0", overflow: "auto" }}>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setVista(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 22px", background: vista === item.id ? "rgba(255,255,255,0.14)" : "none", border: "none", cursor: "pointer", color: vista === item.id ? C.blanco : "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: vista === item.id ? 700 : 400, textAlign: "left", borderLeft: vista === item.id ? `3px solid ${C.blanco}` : "3px solid transparent", transition: "all 0.15s", letterSpacing: "-0.01em" }}
              onMouseEnter={(e) => { if (vista !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={(e) => { if (vista !== item.id) e.currentTarget.style.background = "none"; }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && <span style={{ background: C.rojo, color: C.blanco, borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 800, animation: "pulse 2s infinite" }}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={onLogout}
            style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "rgba(255,255,255,0.75)", fontSize: 12, cursor: "pointer", fontWeight: 600, transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
}
