import React, { useState, useEffect } from "react";
import { C } from "../styles/colors";
import { fetchUsuarios, crearUsuario as apiCrearUsuario, desactivarUsuario } from "../services/api";
import { RolBadge, CatBadge } from "../components/Badges";
import { Loading } from "../components/DataDisplay";
import { Campo, Input, Select } from "../components/FormFields";

const fmt = n => String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export default function VistaAdmin({ localidades, modalidades }) {
  const [tab, setTab] = useState("usuarios");
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [nuevoU, setNuevoU] = useState({ id: "", nombre: "", rol: "junta", localidades: [], password: "" });
  const setN = (k, v) => setNuevoU((n) => ({ ...n, [k]: v }));

  useEffect(() => {
    fetchUsuarios().then((u) => { setUsuarios(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const crearUsuario = async () => {
    if (!nuevoU.id || !nuevoU.nombre || !nuevoU.password) return;
    try {
      const rolNombres = { coordinador: "Coordinador de Validación", junta: "Junta de Saneamiento", contratista: "Empresa Contratista", equipo: "Equipo Social DASOC" };
      const created = await apiCrearUsuario({ ...nuevoU, rol_nombre: rolNombres[nuevoU.rol] });
      setUsuarios((u) => [...u, created]);
      setShowNew(false); setNuevoU({ id: "", nombre: "", rol: "junta", localidades: [], password: "" });
    } catch (e) { alert(e.error || "Error al crear usuario"); }
  };

  const desactivar = async (id) => {
    try { await desactivarUsuario(id); setUsuarios((u) => u.map((x) => x.id === id ? { ...x, activo: false } : x)); }
    catch (e) { alert(e.error || "Error"); }
  };

  const tabs = [{ id: "usuarios", l: "👤 Usuarios" }, { id: "metas", l: "🎯 Metas" }, { id: "estrategias", l: "🔧 Estrategias" }];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.texto, margin: 0, letterSpacing: "-0.03em" }}>⚙️ Administración</h1>
        <p style={{ color: C.grisTexto, marginTop: 4, fontSize: 13 }}>Usuarios, metas y parametrización</p>
      </div>
      <div style={{ display: "flex", gap: 0, marginBottom: 20, background: C.blanco, borderRadius: 12, border: `1px solid ${C.grisMedio}`, overflow: "hidden", width: "fit-content" }}>
        {tabs.map((t) => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 22px", background: tab === t.id ? C.azul : "none", color: tab === t.id ? C.blanco : C.grisTexto, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, borderRight: `1px solid ${C.grisMedio}`, transition: "all 0.2s" }}>{t.l}</button>)}
      </div>

      {tab === "usuarios" && (
        <div>
          {loading ? <Loading /> : <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Usuarios ({usuarios.length})</h3>
              <button onClick={() => setShowNew(!showNew)} style={{ padding: "9px 18px", background: C.azul, color: C.blanco, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Nuevo usuario</button>
            </div>
            {showNew && (
              <div className="fade-in" style={{ background: C.azulSuave, borderRadius: 14, padding: 20, marginBottom: 20, border: `1px solid ${C.grisMedio}` }}>
                <h4 style={{ margin: "0 0 14px" }}>Nuevo usuario</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Campo label="ID (letras, números, _)" required><Input value={nuevoU.id} onChange={(e) => setN("id", e.target.value)} placeholder="ej: j_caacupe" /></Campo>
                  <Campo label="Nombre" required><Input value={nuevoU.nombre} onChange={(e) => setN("nombre", e.target.value)} placeholder="Nombre" /></Campo>
                  <Campo label="Contraseña" required><Input type="password" value={nuevoU.password} onChange={(e) => setN("password", e.target.value)} placeholder="Mín. 6 caracteres" /></Campo>
                  <Campo label="Rol" required><Select value={nuevoU.rol} onChange={(e) => setN("rol", e.target.value)}><option value="coordinador">Coordinador</option><option value="junta">Junta</option><option value="contratista">Contratista</option><option value="equipo">Equipo Social</option></Select></Campo>
                  {(nuevoU.rol === "junta" || nuevoU.rol === "contratista") && (
                    <Campo label="Localidades">
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: 8, border: `1px solid ${C.grisBorde}`, borderRadius: 10, background: C.blanco }}>
                        {localidades.map((l) => (<label key={l.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={nuevoU.localidades.includes(l.id)} onChange={(e) => { const c = nuevoU.localidades; setN("localidades", e.target.checked ? [...c, l.id] : c.filter((x) => x !== l.id)); }} />{l.nombre}</label>))}
                      </div>
                    </Campo>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => setShowNew(false)} style={{ padding: "8px 18px", background: C.gris, border: `1px solid ${C.grisMedio}`, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.grisTexto }}>Cancelar</button>
                  <button onClick={crearUsuario} style={{ padding: "8px 22px", background: C.azul, color: C.blanco, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Crear</button>
                </div>
              </div>
            )}
            <div style={{ background: C.blanco, borderRadius: 14, border: `1px solid ${C.grisMedio}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ background: C.gris }}>{["Usuario", "Rol", "Localidades", "Estado", ""].map((h) => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.grisTexto, fontSize: 12, borderBottom: `1px solid ${C.grisMedio}` }}>{h}</th>)}</tr></thead>
                <tbody>{usuarios.map((u, i) => (
                  <tr key={u.id} style={{ backgroundColor: i % 2 === 0 ? C.blanco : C.gris, borderBottom: `1px solid ${C.grisMedio}` }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700 }}>{u.nombre}</td>
                    <td style={{ padding: "12px 14px" }}><RolBadge rol={u.rol} /></td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: C.grisTexto }}>{u.localidades ? u.localidades.map((id) => localidades.find((l) => l.id === id)?.nombre || id).join(", ") : "Todas"}</td>
                    <td style={{ padding: "12px 14px" }}><span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.activo ? C.verdeC : C.rojoClaro, color: u.activo ? "#065F46" : C.rojo }}>{u.activo ? "Activo" : "Inactivo"}</span></td>
                    <td style={{ padding: "12px 14px" }}>{u.activo && <button onClick={() => desactivar(u.id)} style={{ padding: "5px 12px", background: C.rojoClaro, color: C.rojo, border: "none", borderRadius: 8, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Desactivar</button>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>}
        </div>
      )}

      {tab === "metas" && (
        <div style={{ background: C.blanco, borderRadius: 14, border: `1px solid ${C.grisMedio}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.grisMedio}` }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Metas por localidad</h3></div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: C.gris }}>{["Localidad", "Meta actual"].map((h) => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.grisTexto, fontSize: 12, borderBottom: `1px solid ${C.grisMedio}` }}>{h}</th>)}</tr></thead>
            <tbody>{localidades.map((l, i) => (
              <tr key={l.id} style={{ backgroundColor: i % 2 === 0 ? C.blanco : C.gris, borderBottom: `1px solid ${C.grisMedio}` }}>
                <td style={{ padding: "12px 14px", fontWeight: 700 }}>{l.nombre}</td>
                <td style={{ padding: "12px 14px", fontWeight: 700, color: C.azul }}>{fmt(l.previstas)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === "estrategias" && (
        <div style={{ background: C.blanco, borderRadius: 14, border: `1px solid ${C.grisMedio}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.grisMedio}` }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Estrategias / Modalidades</h3></div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: C.gris }}>{["Categoría", "Modalidad", "Estado"].map((h) => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.grisTexto, fontSize: 12, borderBottom: `1px solid ${C.grisMedio}` }}>{h}</th>)}</tr></thead>
            <tbody>{modalidades.map((m, i) => (
              <tr key={m.id} style={{ backgroundColor: i % 2 === 0 ? C.blanco : C.gris, borderBottom: `1px solid ${C.grisMedio}` }}>
                <td style={{ padding: "12px 14px" }}><CatBadge cat={m.cat} /></td>
                <td style={{ padding: "12px 14px" }}>{m.nombre}</td>
                <td style={{ padding: "12px 14px" }}><span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: C.verdeC, color: "#065F46" }}>✅ Activa</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
