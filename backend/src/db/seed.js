/**
 * Seed inicial — carga los datos de demostración de App.jsx en la base de datos.
 * Ejecutar: npm run seed
 */
const bcrypt = require("bcryptjs");
const pool = require("./pool");

// ─── DATOS DE REFERENCIA (igual que App.jsx) ──────────────────────────────────
const localidades = [
  { id: "yaguaron",  nombre: "Yaguarón",         previstas: 1100, conectados: 400, adecuaciones: 150, ci: 1013 },
  { id: "pirayu",    nombre: "Pirayú",            previstas: 1900, conectados: 79,  adecuaciones: 85,  ci: 1571 },
  { id: "yhu",       nombre: "Yhú",               previstas: 807,  conectados: 54,  adecuaciones: 217, ci: 810  },
  { id: "chore",     nombre: "Choré",             previstas: 665,  conectados: 100, adecuaciones: 164, ci: 889  },
  { id: "ybyyau",    nombre: "Yby Yaú",           previstas: 700,  conectados: 30,  adecuaciones: 125, ci: 931  },
  { id: "fram",      nombre: "Fram",              previstas: 1320, conectados: 0,   adecuaciones: 510, ci: 1160 },
  { id: "capitanm",  nombre: "Capitán Miranda",   previstas: 1130, conectados: 40,  adecuaciones: 159, ci: 1401 },
];

const modalidades = [
  { id: "gestion_junta",   nombre: "Gestión directa de la Junta",            cat: "JUNTA",       roles: ["coordinador", "junta"] },
  { id: "llave_mano",      nombre: "Llave en Mano — Hogares vulnerables",    cat: "CONTRATISTA", roles: ["coordinador", "contratista"] },
  { id: "ayuda_mutua",     nombre: "Autoconstrucción por Ayuda Mutua",        cat: "ICARO",       roles: ["coordinador", "junta", "equipo"] },
  { id: "liderazgo_multi", nombre: "Liderazgo Multinivel (8% referentes)",   cat: "ICARO",       roles: ["coordinador", "junta", "equipo"] },
  { id: "liderazgo_man",   nombre: "Liderazgo Manzanal Influencer",          cat: "ICARO",       roles: ["coordinador", "junta", "equipo"] },
  { id: "red_albaniles",   nombre: "Red de Albañiles/Plomeros Certificados", cat: "ICARO",       roles: ["coordinador", "junta", "equipo"] },
  { id: "tercerizado",     nombre: "Servicio Tercerizado de Albañiles",       cat: "ICARO",       roles: ["coordinador", "junta", "equipo"] },
  { id: "articulacion",    nombre: "Articulación de Insumos / LAZOS II",     cat: "ICARO",       roles: ["coordinador", "junta", "equipo"] },
  { id: "productos_fin",   nombre: "Productos Financieros (Juntas)",          cat: "ICARO",       roles: ["coordinador", "junta", "equipo"] },
  { id: "usb_comp",        nombre: "USB por Componentes (Sinérgica)",         cat: "ICARO",       roles: ["coordinador", "junta", "equipo"] },
  { id: "triple_a",        nombre: "Info Hogares Triple A (Hazlo tú mismo)", cat: "ICARO",       roles: ["coordinador", "junta", "equipo"] },
  { id: "dif_conexion",    nombre: "Derecho de Conexión Diferido (6 meses)", cat: "ICARO",       roles: ["coordinador", "junta", "equipo"] },
];

const usuarios = [
  { id: "coord1",    nombre: "Coord. DASOC",     rol: "coordinador", rolNombre: "Coordinador de Validación",  localidades: null,                          pass: "coord123" },
  { id: "j_yaguaron",nombre: "Junta Yaguarón",  rol: "junta",       rolNombre: "Junta de Saneamiento",       localidades: ["yaguaron"],                   pass: "junta123" },
  { id: "j_pirayu",  nombre: "Junta Pirayú",    rol: "junta",       rolNombre: "Junta de Saneamiento",       localidades: ["pirayu"],                     pass: "junta456" },
  { id: "contrat1",  nombre: "TECSUL S.A.",      rol: "contratista", rolNombre: "Empresa Contratista",        localidades: ["yaguaron", "pirayu", "yhu"],  pass: "cont123" },
  { id: "equipo1",   nombre: "Equipo Social DASOC", rol: "equipo",  rolNombre: "Equipo Social DASOC",        localidades: null,                          pass: "equipo123" },
];

const proyecciones = [
  { localidad_id: "yaguaron", items: [{ m: "Ayuda Mutua", n: 80 }, { m: "Liderazgo Multinivel", n: 120 }, { m: "Red Albañiles", n: 200 }, { m: "Llave en Mano", n: 100 }] },
  { localidad_id: "pirayu",   items: [{ m: "Ayuda Mutua", n: 150 }, { m: "Liderazgo Multinivel", n: 200 }, { m: "Productos Financ.", n: 180 }, { m: "Llave en Mano", n: 250 }] },
  { localidad_id: "yhu",      items: [{ m: "Ayuda Mutua", n: 60 }, { m: "Liderazgo Manzanal", n: 80 }, { m: "Triple A", n: 100 }] },
  { localidad_id: "chore",    items: [{ m: "Ayuda Mutua", n: 50 }, { m: "Red Albañiles", n: 90 }, { m: "Llave en Mano", n: 80 }] },
  { localidad_id: "ybyyau",   items: [{ m: "Ayuda Mutua", n: 70 }, { m: "Liderazgo Multinivel", n: 100 }, { m: "Derecho Diferido", n: 80 }] },
  { localidad_id: "fram",     items: [{ m: "Llave en Mano", n: 300 }, { m: "Ayuda Mutua", n: 150 }, { m: "Productos Financ.", n: 200 }] },
  { localidad_id: "capitanm", items: [{ m: "Ayuda Mutua", n: 100 }, { m: "Liderazgo Manzanal", n: 120 }, { m: "Llave en Mano", n: 150 }] },
];

const registros_init = [
  { id: "REG-0001", localidad: "yaguaron", tipo: "conectado",  modalidad: "gestion_junta",   titular: "Juan Ramírez",    ci: "3456789", celular: "0981-123456", manzana: "12", lote: "05", fechaEjec: "2026-02-15", estado: "validado",  cargadoPor: "j_yaguaron", evidencia: "foto_01.jpg", obs: "Conexión completa",
    historial: [
      { estado: "pendiente", fecha: "2026-02-16T10:30:00", por: "j_yaguaron" },
      { estado: "validado",  fecha: "2026-02-17T09:15:00", por: "coord1", comentario: "Conexión verificada. Empalme visible en foto." }
    ]
  },
  { id: "REG-0002", localidad: "pirayu",   tipo: "conectado",  modalidad: "llave_mano",      titular: "Rosa Fernández",  ci: "4567890", celular: "0985-234567", manzana: "03", lote: "12", fechaEjec: "2026-02-20", estado: "pendiente", cargadoPor: "contrat1",   evidencia: "acta_02.pdf",  obs: "",
    historial: [{ estado: "pendiente", fecha: "2026-02-21T14:00:00", por: "contrat1" }]
  },
  { id: "REG-0003", localidad: "yhu",      tipo: "adecuacion", modalidad: "ayuda_mutua",     titular: "Carlos López",    ci: "5678901", celular: "",             manzana: "07", lote: "22", fechaEjec: "2026-02-25", estado: "rechazado", cargadoPor: "equipo1",    evidencia: "foto_03.jpg",  obs: "",
    historial: [
      { estado: "pendiente", fecha: "2026-02-25T16:45:00", por: "equipo1" },
      { estado: "rechazado", fecha: "2026-02-26T11:00:00", por: "coord1", comentario: "La foto no muestra el interior de la instalación. Reenviar con imagen del baño y cañerías." }
    ]
  },
  { id: "REG-0004", localidad: "yaguaron", tipo: "adecuacion", modalidad: "liderazgo_multi", titular: "Elena Torres",    ci: "6789012", celular: "0991-345678", manzana: "15", lote: "08", fechaEjec: "2026-03-01", estado: "pendiente", cargadoPor: "equipo1",    evidencia: "foto_04.jpg",  obs: "",
    historial: [{ estado: "pendiente", fecha: "2026-03-02T09:00:00", por: "equipo1" }]
  },
  { id: "REG-0005", localidad: "chore",    tipo: "conectado",  modalidad: "gestion_junta",   titular: "Miguel Sosa",     ci: "7890123", celular: "0982-456789", manzana: "02", lote: "31", fechaEjec: "2026-03-05", estado: "validado",  cargadoPor: "equipo1",    evidencia: "foto_05.jpg",  obs: "",
    historial: [
      { estado: "pendiente", fecha: "2026-03-06T08:30:00", por: "equipo1" },
      { estado: "validado",  fecha: "2026-03-07T10:00:00", por: "coord1", comentario: "Correcto." }
    ]
  },
  { id: "REG-0006", localidad: "fram",     tipo: "conectado",  modalidad: "llave_mano",      titular: "Patricia Núñez",  ci: "8901234", celular: "0983-567890", manzana: "05", lote: "17", fechaEjec: "2026-03-08", estado: "pendiente", cargadoPor: "contrat1",   evidencia: "foto_06.jpg",  obs: "Hogar vulnerable certificado",
    historial: [{ estado: "pendiente", fecha: "2026-03-09T11:00:00", por: "contrat1" }]
  },
];

// ─── EJECUCIÓN ─────────────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Localidades
    for (const loc of localidades) {
      await client.query(
        `INSERT INTO localidades (id, nombre, previstas, conectados, adecuaciones, ci)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
        [loc.id, loc.nombre, loc.previstas, loc.conectados, loc.adecuaciones, loc.ci]
      );
    }
    console.log("✅ Localidades insertadas.");

    // Modalidades
    for (const mod of modalidades) {
      await client.query(
        `INSERT INTO modalidades (id, nombre, cat) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING`,
        [mod.id, mod.nombre, mod.cat]
      );
      for (const rol of mod.roles) {
        await client.query(
          `INSERT INTO modalidad_roles (modalidad_id, rol) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [mod.id, rol]
        );
      }
    }
    console.log("✅ Modalidades insertadas.");

    // Usuarios
    for (const u of usuarios) {
      const hash = await bcrypt.hash(u.pass, 10);
      await client.query(
        `INSERT INTO usuarios (id, nombre, rol, rol_nombre, password_hash)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        [u.id, u.nombre, u.rol, u.rolNombre, hash]
      );
      if (u.localidades) {
        for (const locId of u.localidades) {
          await client.query(
            `INSERT INTO usuario_localidades (usuario_id, localidad_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
            [u.id, locId]
          );
        }
      }
    }
    console.log("✅ Usuarios insertados.");

    // Proyecciones ICARO
    for (const proy of proyecciones) {
      for (const item of proy.items) {
        await client.query(
          `INSERT INTO icaro_proyecciones (localidad_id, modalidad, cantidad) VALUES ($1,$2,$3)`,
          [proy.localidad_id, item.m, item.n]
        );
      }
    }
    console.log("✅ Proyecciones ICARO insertadas.");

    // Registros + historial
    for (const reg of registros_init) {
      // Calcular la secuencia
      const num = parseInt(reg.id.split("-")[1]);
      await client.query(`SELECT setval('registros_seq', GREATEST(nextval('registros_seq')-1, $1))`, [num]);

      await client.query(
        `INSERT INTO registros
           (id, localidad_id, tipo, modalidad_id, titular, ci, celular, manzana, lote,
            fecha_ejec, fecha_carga, estado, cargado_por, evidencia_url, observaciones)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (id) DO NOTHING`,
        [
          reg.id, reg.localidad, reg.tipo, reg.modalidad, reg.titular,
          reg.ci, reg.celular || null, reg.manzana, reg.lote, reg.fechaEjec,
          reg.historial[0].fecha, reg.estado, reg.cargadoPor,
          reg.evidencia || null, reg.obs || null,
        ]
      );

      for (const h of reg.historial) {
        await client.query(
          `INSERT INTO historial_registros (registro_id, estado, fecha, por, comentario)
           VALUES ($1,$2,$3,$4,$5)`,
          [reg.id, h.estado, h.fecha, h.por, h.comentario || null]
        );
      }
    }
    console.log("✅ Registros e historial insertados.");

    await client.query("COMMIT");
    console.log("\n🎉 Seed completado exitosamente.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error en seed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
