import { useState, useMemo } from "react";
import { Clipboard, Check, X, AlertTriangle } from "lucide-react";
import { supabase } from './supabaseClient';
import { useEffect } from 'react';

// ── helpers ───────────────────────────────────────────────────────────────────

function parsefecha(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function diasRestantes(s) {
  const t = parsefecha(s); if (!t) return null;
  const h = new Date(); h.setHours(0, 0, 0, 0);
  return Math.round((t - h) / 86400000);
}
function fmt(s) {
  if (!s) return "";
  const d = parsefecha(s);
  const DS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const MS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${DS[d.getDay()]} ${d.getDate()} ${MS[d.getMonth()]}, ${d.getFullYear()}`;
}

const CATS = ["Todas", "Cultura", "Gastronomía", "Aventura", "Relax", "En Casa", "Fecha Especial"];
const CAT_IC = { Cultura: "🎨", Gastronomía: "🍳", Aventura: "🧗", Relax: "🌿", "En Casa": "🏠", "Fecha Especial": "⭐", Todas: "🍄" };

const RETOS = [
  { nombre: "Cocina Ciega", desc: "Preparen juntos una receta sin ver el resultado. Cada uno hace un paso sin saber qué cocinó el otro.", cat: "Gastronomía" },
  { nombre: "Café Desconocido", desc: "Vayan a un café al que nunca hayan ido. Pidan algo del menú que suene raro.", cat: "Gastronomía" },
  { nombre: "Mercado & Canasta", desc: "Vayan al mercado con $20.000 cada uno. Cada quien compra ingredientes sin decirle al otro qué es. Luego cocinan juntos con lo que haya.", cat: "Gastronomía" },
  { nombre: "Food Truck Roulette", desc: "Busquen una zona de food trucks. Cada uno elige el plato del otro sin que lo vea.", cat: "Gastronomía" },
  { nombre: "Maridaje Improvisado", desc: "Compren quesos, embutidos o snacks raros y busquen las combinaciones más inesperadas. Califiquen cada combo.", cat: "Gastronomía" },
  { nombre: "Receta de la Abuela", desc: "Cada uno prepara un plato que le recuerde su infancia. Se comen juntos y se cuentan la historia detrás.", cat: "Gastronomía" },
  { nombre: "Exploración Urbana", desc: "Tiren una moneda en cada esquina: cara = derecha, sello = izquierda. Vean a dónde llegan.", cat: "Aventura" },
  { nombre: "Senderismo Improvisado", desc: "Busquen una ruta de senderismo a menos de 2 horas de casa. ¡Sin excusas!", cat: "Aventura" },
  { nombre: "Barrio Nuevo", desc: "Elijan un barrio que ninguno conozca bien. Tienen 2 horas para explorarlo a pie sin Google Maps activo.", cat: "Aventura" },
  { nombre: "Lista de 3 Miedos", desc: "Cada uno escribe 3 cosas pequeñas que le dan miedo o nunca ha hecho. Eligen una del otro y la hacen juntos ese día.", cat: "Aventura" },
  { nombre: "Mapa del Tesoro", desc: "Uno prepara un mapa con pistas por la ciudad. El otro lo sigue y al final hay un premio escondido.", cat: "Aventura" },
  { nombre: "Picnic Sorpresa", desc: "Uno prepara la canasta, el otro elige el parque. Sin coordinarse antes.", cat: "Relax" },
  { nombre: "Tarde Analógica", desc: "Sin teléfonos por 4 horas. Solo música, libros, juegos de mesa o simplemente estar.", cat: "Relax" },
  { nombre: "Spa en Casa", desc: "Turno de mimos. Uno recibe: masajes, película favorita, snacks elegidos por el otro. Luego se invierten los roles.", cat: "Relax" },
  { nombre: "Atardecer Obligatorio", desc: "Busquen un lugar con buena vista al atardecer. No importa si es una azotea, un parque o un cerro.", cat: "Relax" },
  { nombre: "Día de No Planes", desc: "Sin agenda. Al despertar deciden cada hora qué sigue. La única regla: no repetir nada del día anterior.", cat: "Relax" },
  { nombre: "Noche de Películas Prohibidas", desc: "El otro elige la película. Sin veto. Sin quejas. Solo palomitas.", cat: "En Casa" },
  { nombre: "Karaoke Privado", desc: "Cada uno prepara 3 canciones. Se las cantan el uno al otro en casa. No vale la vergüenza.", cat: "En Casa" },
  { nombre: "Carta al Futuro", desc: "Cada uno escribe una carta para que el otro la lea en 1 año. La guardan juntos en un sobre sellado.", cat: "En Casa" },
  { nombre: "Playlist Batalla", desc: "Cada uno arma una playlist de 10 canciones que defina cómo se siente respecto al otro. Se las presentan explicando cada canción.", cat: "En Casa" },
  { nombre: "Diccionario de Pareja", desc: "Escriban juntos 10 palabras inventadas que solo signifiquen algo para ustedes dos.", cat: "En Casa" },
  { nombre: "Tarde de Museos", desc: "Entren a un museo o galería gratuita y escojan cada uno una obra favorita. Expliquen por qué.", cat: "Cultura" },
  { nombre: "Librería al Azar", desc: "Cada uno elige un libro para el otro sin que lo vea. El intercambio es obligatorio.", cat: "Cultura" },
  { fontName: "Cine Arte", desc: "Encuentren una sala de cine alternativo o cinemateca. Vean una película en un idioma que ninguno habla con fluidez.", cat: "Cultura" },
  { nombre: "Recrear la Primera Cita", desc: "Vuelvan al mismo lugar de su primera cita o recreen el ambiente en casa. Hablen de cómo se sentían ese día.", cat: "Fecha Especial" },
  { nombre: "Noche de las Preguntas", desc: "Busquen un mazo de preguntas para parejas. Sin filtros. La única regla: responder con honestidad.", cat: "Fecha Especial" },
  { nombre: "Bucket List Juntos", desc: "Cada uno escribe 10 cosas que quiere vivir con el otro. Compárenlas y elijan 5 para convertir en planes reales.", cat: "Fecha Especial" },
  { nombre: "Cápsula del Tiempo", desc: "Metan en una caja: una foto, un objeto pequeño y una nota sobre cómo se sienten hoy. Séllela y definan cuándo la abren.", cat: "Fecha Especial" },
  { nombre: "El Día Perfecto Tuyo", desc: "Uno planea el día perfecto para el otro desde cero: desayuno, actividad, comida, noche. Solo confiar.", cat: "Fecha Especial" },
  { nombre: "Votos Informales", desc: "En casa, con velas o luces, cada uno le dice al otro tres promesas pequeñas y reales para los próximos meses.", cat: "Fecha Especial" },
];

const BLANK = { fechaRaw: "", plan: "", categoria: "Cultura", highlight: "", sentimiento: "", emoji: "✨" };

// ── hooks & utils ─────────────────────────────────────────────────────────────

function useCopy(ms = 2000) {
  const [ok, set] = useState(false);
  function copy(text) {
    if (typeof copyToClipboard === "function") {
      copyToClipboard(text)
        .then(() => { set(true); setTimeout(() => set(false), ms); })
        .catch(() => { set(true); setTimeout(() => set(false), ms); });
    }
  }
  return [ok, copy];
}

// ── components ────────────────────────────────────────────────────────────────

function EditModal({ item, onSave, onClose }) {
  const fut = item.tipo === "futuro";
  const [f, setF] = useState({
    fechaRaw: item.fechaRaw,
    plan: item.plan,
    categoria: item.categoria,
    highlight: item.highlight,
    sentimiento: item.sentimiento,
    emoji: item.emoji
  });

  // 📸 Estados para manejar la imagen dentro de la edición
  const [imagenActual, setImagenActual] = useState(item.imageUrl || null);
  const [archivoLocal, setArchivoLocal] = useState(null);

  const ac = fut ? "#fff" : "#FDE047";
  const inp = {
    background: "#000",
    border: "2px solid #333",
    color: "#fff",
    padding: "10px 12px",
    fontSize: 12,
    width: "100%",
    fontFamily: "'Space Mono',monospace",
    outline: "none"
  };

  function ch(e) {
    setF(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  function doSave() {
    onSave({
      ...item,
      ...f,
      imageUrl: imagenActual,
      nuevoArchivo: archivoLocal,
      eliminarImagen: !imagenActual && item.imageUrl
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#111", border: `4px solid ${ac}`, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: ac, letterSpacing: 2 }}>
              {fut ? "🍄 Editar Plan" : "🍪 Editar Recuerdo"}
            </div>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, textTransform: "uppercase" }}>#{item.id}</div>
          </div>
          <button onClick={onClose} style={{ background: "#222", border: "2px solid #444", color: "#fff", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: ac }}>📅 Fecha</label>
            <input type="date" name="fechaRaw" value={f.fechaRaw} onChange={ch} style={{ ...inp, colorScheme: "dark" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: ac }}>🗂 Categoría</label>
            <select name="categoria" value={f.categoria} onChange={ch} style={inp}>
              {CATS.slice(1).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: ac }}>✏️ Plan / Título</label>
            <input name="plan" value={f.plan} onChange={ch} style={inp} />
          </div>
          <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: ac }}>
              {fut ? "🍄 Qué esperan" : "⭐ Highlight"}
            </label>
            <textarea name="highlight" value={f.highlight} onChange={ch} style={{ ...inp, minHeight: 70, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: ac }}>💛 Sentimiento</label>
            <input name="sentimiento" value={f.sentimiento} onChange={ch} style={inp} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: ac }}>✨ Emoji</label>
            <input name="emoji" value={f.emoji} onChange={ch} style={inp} />
          </div>
          {/* 📸 INPUT DE IMAGEN EN EDICIÓN */}
          <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: ac }}>📸 Foto</label>

            {imagenActual ? (
              <div style={{ border: "2px solid #333", background: "#000", padding: 10, display: "flex", alignItems: "center", gap: 12 }}>
                <img src={imagenActual} alt="Miniatura" style={{ width: 30, height: 30, objectFit: "cover", border: "1px solid #444" }} />
                <div style={{ flex: 1, fontSize: 11, color: "#fff", fontWeight: "bold" }}>Foto actual</div>
                <button type="button" onClick={() => setImagenActual(null)} style={{ background: "#ff3333", color: "#ffffff", border: "2px solid #000", fontFamily: "'Space Mono'", fontSize: 10, fontWeight: "bold", padding: "6px 12px", cursor: "pointer" }}>
                  🗑️ QUITAR FOTO
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input type="file" accept="image/*" id="edit-file-hidden" onChange={e => setArchivoLocal(e.target.files[0] || null)} style={{ display: 'none' }} />
                <label htmlFor="edit-file-hidden" style={{ background: ac, border: "3px solid #000", color: "#000", padding: "8px 16px", fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 2, cursor: "pointer", display: "inline-flex", gap: 8, boxShadow: "3px 3px 0 #000" }}>
                  <span> {archivoLocal ? "Cambiar Foto" : "Adjuntar Foto"}</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, background: "#000", border: "3px solid #444", color: "#ffffff", padding: "10px", fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 2, cursor: "pointer" }}>
            CANCELAR
          </button>
          <button onClick={doSave} style={{ flex: 2, background: ac, border: `3px solid ${ac}`, color: "#000", padding: "10px", fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, cursor: "pointer" }}>
            GUARDAR CAMBIOS
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ item, onConfirm, onClose }) {
  const [done, setDone] = useState(false);
  function go() { onConfirm(); setDone(true); }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#111", border: "4px solid #ff3333", padding: 28, width: "100%", maxWidth: 440, textAlign: "center" }}>
        {!done ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#ff3333", letterSpacing: 2, marginBottom: 8 }}>
              ¿Eliminar este {item.tipo === "futuro" ? "plan" : "recuerdo"}?
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#FDE047", marginBottom: 6 }}>{item.plan}</div>
            <div style={{ fontSize: 11, color: "#ffffff", marginBottom: 20 }}>Esta acción no se puede deshacer.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, background: "#000", border: "3px solid #444", color: "#ffffff", padding: "10px", fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 2, cursor: "pointer" }}>
                CANCELAR
              </button>
              <button onClick={go} style={{ flex: 1, background: "#ff3333", border: "3px solid #ff3333", color: "#fff", padding: "10px", fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 2, cursor: "pointer" }}>
                SÍ, ELIMINAR
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#FDE047", letterSpacing: 2, marginBottom: 4 }}>
              Eliminado de la app
            </div>
            <button onClick={onClose} style={{ width: "100%", marginTop: 16, background: "#FDE047", border: "3px solid #000", color: "#000", padding: "10px", fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, cursor: "pointer" }}>
              ENTENDIDO
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CardActions({ onEdit, onDelete, dark }) {
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
      <button onClick={onEdit} style={{ flex: 1, background: "#000", border: `2px solid ${dark ? "#333" : "#00000033"}`, color: dark ? "#FDE047" : "#000", padding: "6px 0", fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 1, cursor: "pointer" }}>
        ✏️ EDITAR
      </button>
      <button onClick={onDelete} style={{ background: "#000", border: "2px solid #ff333366", color: "#ff5555", padding: "6px 10px", fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 1, cursor: "pointer" }}>
        🗑️
      </button>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [citas, setCitas] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [tab, setTab] = useState("muro");
  const [filtro, setFiltro] = useState("Todas");
  const [reto, setReto] = useState(null);
  const [tipoForm, setTipoForm] = useState("recuerdo");
  const [form, setForm] = useState(BLANK);
  const [lastRow, setLastRow] = useState(null);
  const [showMaestro, setShowMaestro] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  // 📸 Estado local para el archivo multimedia seleccionado
  const [file, setFile] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from('actividades').select('*').order('fecha_raw', { ascending: true });
      if (error) {
        console.error('Error al cargar datos desde Supabase:', error);
      } else if (data) {
        const datosMapeados = data.map(item => ({
          id: item.id,
          fechaRaw: item.fecha_raw,
          plan: item.plan,
          categoria: item.categoria,
          highlight: item.highlight,
          sentimiento: item.sentimiento,
          emoji: item.emoji,
          tipo: item.tipo,
          // Mapeamos dinámicamente el URL de la imagen si ya existe en tu DB
          imageUrl: item.imagen_url || item.imagen_url || null
        }));

        const planesExpirados = datosMapeados.filter(
          item => item.tipo === 'futuro' && diasRestantes(item.fechaRaw) !== null && diasRestantes(item.fechaRaw) < 0
        );

        if (planesExpirados.length > 0) {
          const idsAActualizar = planesExpirados.map(p => p.id);
          supabase
            .from('actividades')
            .update({ tipo: 'recuerdo' })
            .in('id', idsAActualizar)
            .then(({ error: updateError }) => {
              if (updateError) console.error('Error al migrar planes:', updateError);
            });

          planesExpirados.forEach(p => { p.tipo = 'recuerdo'; });
        }

        setCitas(datosMapeados.filter(item => item.tipo === 'recuerdo'));
        setPlanes(datosMapeados.filter(item => item.tipo === 'futuro'));
      }
    }
    fetchData();
  }, []);

  const citasF = useMemo(
    () => [...citas].filter(c => filtro === "Todas" || c.categoria === filtro)
      .sort((a, b) => parsefecha(b.fechaRaw) - parsefecha(a.fechaRaw)), // Orden de más reciente a más antiguo ideal para Feed
    [citas, filtro]
  );

  const planesF = useMemo(
    () => [...planes].filter(p => filtro === "Todas" || p.categoria === filtro)
      .sort((a, b) => parsefecha(a.fechaRaw) - parsefecha(b.fechaRaw)),
    [planes, filtro]
  );

  const stats = useMemo(() => {
    const c = {}; CATS.slice(1).forEach(k => c[k] = 0);
    [...citas, ...planes].forEach(x => { if (c[x.categoria] !== undefined) c[x.categoria]++; });
    return c;
  }, [citas, planes]);

  const prox = useMemo(() => {
    const h = new Date(); h.setHours(0, 0, 0, 0);
    return [...planes].filter(p => parsefecha(p.fechaRaw) >= h)
      .sort((a, b) => parsefecha(a.fechaRaw) - parsefecha(b.fechaRaw))[0] || null;
  }, [planes]);

  async function submit() {
    if (!form.fechaRaw || !form.plan || !form.highlight) return;

    let urlFinalFoto = null;

    // 1. Subir la imagen al Storage si hay un archivo seleccionado
    if (file) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('multimedia') // Asegúrate de que el bucket se llama así
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('multimedia')
          .getPublicUrl(fileName);

        urlFinalFoto = publicUrlData.publicUrl;
      } catch (err) {
        console.error("Error al subir la imagen en Supabase Storage:", err);
        alert("Hubo un problema al subir la imagen, pero se guardará el recuerdo sin foto.");
      }
    }

    // 2. Preparar el objeto para guardar en la base de datos
    const newItem = {
      fecha_raw: form.fechaRaw,
      plan: form.plan,
      categoria: form.categoria,
      highlight: form.highlight,
      sentimiento: form.sentimiento,
      emoji: form.emoji,
      tipo: tipoForm,
      imagen_url: urlFinalFoto // Asociar la URL de la imagen
    };

    // 3. Guardar el registro en la base de datos
    const { data, error } = await supabase.from('actividades').insert([newItem]).select();

    if (error) {
      console.error("Error al guardar en Supabase:", error);
    } else {
      let itemParaEstado;
      if (data && data.length > 0) {
        itemParaEstado = {
          id: data[0].id,
          fechaRaw: data[0].fecha_raw,
          plan: data[0].plan,
          categoria: data[0].categoria,
          highlight: data[0].highlight,
          sentimiento: data[0].sentimiento,
          emoji: data[0].emoji,
          tipo: data[0].tipo,
          imageUrl: data[0].imagen_url || data[0].imagen_url || null
        };
      } else {
        itemParaEstado = {
          id: Date.now(),
          fechaRaw: form.fechaRaw,
          plan: form.plan,
          categoria: form.categoria,
          highlight: form.highlight,
          sentimiento: form.sentimiento,
          emoji: form.emoji,
          tipo: tipoForm,
          imageUrl: urlFinalFoto
        };
      }

      // 4. Actualizar el estado de React para mostrar el nuevo recuerdo
      if (tipoForm === "recuerdo") {
        setCitas(p => [itemParaEstado, ...p]);
      } else {
        setPlanes(p => [...p, itemParaEstado]);
      }

      // 5. Limpiar el formulario
      setForm(BLANK);
      setFile(null); // Limpiar foto seleccionada
    }
  }

  async function saveEdit(updatedItem) {
    let urlFinalFoto = updatedItem.imageUrl;

    try {
      if (updatedItem.nuevoArchivo) {
        const fileExt = updatedItem.nuevoArchivo.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('multimedia')
          .upload(fileName, updatedItem.nuevoArchivo);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('multimedia')
          .getPublicUrl(fileName);

        urlFinalFoto = publicUrlData.publicUrl;

      } else if (updatedItem.eliminarImagen) {
        // 💥 NUEVO: Si el usuario eliminó la foto en el modal, la borramos del Storage
        // Tu EditModal pasa la URL vieja dentro de 'eliminarImagen'
        const urlVieja = updatedItem.eliminarImagen;
        if (typeof urlVieja === 'string') {
          // decodeURIComponent limpia caracteres raros como %20 por espacios
          const fileName = decodeURIComponent(urlVieja.split('/').pop());

          const { error: deleteStorageError } = await supabase.storage
            .from('multimedia')
            .remove([fileName]);

          if (deleteStorageError) {
            console.error("Error al eliminar archivo del Storage al editar:", deleteStorageError);
          }
        }
        urlFinalFoto = null; // Hacemos null la URL para la base de datos
      }
    } catch (err) {
      console.error("Error al procesar la imagen en Supabase Storage:", err);
      alert("Hubo un problema procesando la imagen, pero intentaremos guardar el texto.");
    }

    const dataToUpdate = {
      fecha_raw: updatedItem.fechaRaw,
      plan: updatedItem.plan,
      categoria: updatedItem.categoria,
      highlight: updatedItem.highlight,
      sentimiento: updatedItem.sentimiento,
      emoji: updatedItem.emoji,
      tipo: updatedItem.tipo,
      imagen_url: urlFinalFoto // Tu columna corregida 🎉
    };

    const { error } = await supabase.from('actividades').update(dataToUpdate).eq('id', updatedItem.id);

    if (error) {
      console.error("Error al actualizar en Supabase:", error);
    } else {
      const itemParaEstado = { ...updatedItem, imageUrl: urlFinalFoto };
      delete itemParaEstado.nuevoArchivo;
      delete itemParaEstado.eliminarImagen;

      if (updatedItem.tipo === "recuerdo") {
        setCitas(p => p.map(c => c.id === updatedItem.id ? itemParaEstado : c));
      } else {
        setPlanes(p => p.map(c => c.id === updatedItem.id ? itemParaEstado : c));
      }

      setEditItem(null);
    }
  }
  async function confirmDel() {
    if (!deleteItem) return;

    // 1. Limpieza del Storage con decodificación segura
    if (deleteItem.imageUrl) {
      try {
        // decodeURIComponent soluciona problemas con %20, guiones o caracteres especiales
        const fileName = decodeURIComponent(deleteItem.imageUrl.split('/').pop());

        const { error: storageError } = await supabase.storage
          .from('multimedia')
          .remove([fileName]);

        if (storageError) {
          console.error("Error directo de Supabase Storage al eliminar:", storageError);
        } else {
          console.log("Imagen eliminada del Storage con éxito:", fileName);
        }
      } catch (err) {
        console.error("Error procesando la eliminación de la imagen:", err);
      }
    }

    // 2. Limpieza de la Base de Datos
    const { error } = await supabase.from('actividades').delete().eq('id', deleteItem.id);

    if (error) {
      console.error("Error al eliminar de Supabase:", error);
    } else {
      if (deleteItem.tipo === "recuerdo") {
        setCitas(p => p.filter(c => c.id !== deleteItem.id));
      } else {
        setPlanes(p => p.filter(c => c.id !== deleteItem.id));
      }
    }
    setDeleteItem(null);
  }

  const TABS = [["muro", "🍪 Recuerdos"], ["proximos", "🍄 Próximos"], ["nueva", "＋ Registrar"], ["retos", "⚡ Retos"]];
  const SI = {
    background: "#000", border: "2px solid #333", color: "#fff", padding: "10px 12px",
    fontSize: 12, width: "100%", fontFamily: "'Space Mono',monospace"
  };

  return (
    <div style={{ fontFamily: "'Space Mono',monospace", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');
        html, body, #root { margin: 0; padding: 0; width: 100%; min-height: 100vh; background-color: #0a0a0a; }
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:#111;}
        ::-webkit-scrollbar-thumb{background:#FDE047;}
        .ch{transition:transform .15s,box-shadow .15s;}
        .ch:hover{transform:translate(-2px,-2px);box-shadow:4px 4px 0 #000!important;}
        .ta{color:#FDE047!important;border-bottom:3px solid #FDE047!important;}
        .fa{background:#FDE047!important;border-color:#FDE047!important;color:#000!important;}
        input,select,textarea{font-family:'Space Mono',monospace;}
        input:focus,select:focus,textarea:focus{outline:none;border-color:#FDE047!important;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
        .pulse{animation:pulse 2s infinite;}
      `}</style>

      {editItem && <EditModal item={editItem} onSave={saveEdit} onClose={() => setEditItem(null)} />}
      {deleteItem && <DeleteModal item={deleteItem} onConfirm={confirmDel} onClose={() => setDeleteItem(null)} />}

      {/* HEADER */}
      <div style={{ background: "#FDE047", borderBottom: "4px solid #000", padding: "14px 20px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, width: "100%" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: "#000", letterSpacing: 2, lineHeight: 1 }}>🍪 Cookies &amp; Mushrooms 🍄</div>
            <div style={{ fontSize: 9, color: "#000", opacity: .6, letterSpacing: 3, textTransform: "uppercase", marginTop: 2 }}>Bitácora de Pareja</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ background: "#000", color: "#FDE047", padding: "6px 12px", fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 1 }}>
              🍪 {citas.length}
            </div>
            <div style={{ background: "#000", color: "#fff", padding: "6px 12px", fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 1, border: "2px solid #444" }}>
              🍄 {planes.length}
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: "#111", borderBottom: "3px solid #FDE047", overflowX: "auto" }}>
        <div style={{ maxWidth: 650, margin: "0 auto", display: "flex", width: "100%" }}>
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={tab === k ? "ta" : ""}
              style={{
                padding: "12px 18px", fontFamily: "'Space Mono'", fontSize: 12, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: 3, color: tab === k ? "#FDE047" : "#555",
                cursor: "pointer", border: "none", background: "none",
                borderBottom: tab === k ? "3px solid #FDE047" : "3px solid transparent", marginBottom: -3, whiteSpace: "nowrap"
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "24px 16px" }}>

        {/* MURO (RECUERDOS TIPO INSTAGRAM) */}
        {tab === "muro" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 15, marginBottom: 24 }}>
              <div style={{ background: "#111", border: "3px solid #FDE047", padding: 14 }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 40, color: "#FDE047", lineHeight: 1 }}>{citas.length + planes.length}</div>
                <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>🍄 Total</div>
              </div>
              {Object.entries(stats).map(([cat, cnt]) => (
                <div key={cat} style={{ background: "#111", border: "3px solid #222", padding: 14 }}>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 40, color: "#FDE047", lineHeight: 1 }}>{cnt}</div>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>{CAT_IC[cat]} {cat}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {CATS.map(cat => (
                <button key={cat} onClick={() => setFiltro(cat)} className={filtro === cat ? "fa" : ""}
                  style={{
                    background: "transparent", border: "2px solid #333", color: "#555", padding: "6px 12px",
                    fontFamily: "'Space Mono'", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer"
                  }}>
                  {CAT_IC[cat]} {cat}
                </button>
              ))}
            </div>

            {citasF.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#333" }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🍪</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: "#444", letterSpacing: 2 }}>Sin recuerdos aquí... ¡aún!</div>
              </div>
            ) : (
              /* FEED VERTICAL - TIPO INSTAGRAM */
              <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 480, margin: "0 auto" }}>
                {citasF.map(c => (
                  <div key={c.id} className="ch" style={{ background: "#FDE047", border: "4px solid #000", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>

                    {/* Barra Superior del Post */}
                    <div style={{ background: "#000", color: "#FDE047", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "'Bebas Neue'", fontSize: 13, letterSpacing: 0.5 }}>🍪 {fmt(c.fechaRaw)}</span>
                      <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", border: "1px solid #FDE047", padding: "2px 6px" }}>{CAT_IC[c.categoria]} {c.categoria}</span>
                    </div>

                    {/* Espacio Multimedia (Foto) estilo Instagram */}
                    {c.imageUrl && (
                      <div style={{ width: "100%", borderBottom: "4px solid #000", background: "#000", display: "flex", justifyContent: "center", alignItems: "center", maxHeight: 450, overflow: "hidden" }}>
                        <img src={c.imageUrl} alt={c.plan} style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }} />
                      </div>
                    )}

                    {/* Pie del Post (Información del Recuerdo) */}
                    <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column" }}>
                      <div style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: "#000", lineHeight: 1.1, marginBottom: 8, letterSpacing: 1 }}>{c.plan}</div>
                      <div style={{ fontSize: 12, color: "#000", lineHeight: 1.6, borderLeft: "3px solid #000", paddingLeft: 10, marginBottom: 12 }}>{c.highlight}</div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 18 }}>{c.emoji}</span>
                        <span style={{ fontSize: 11, color: "#000", opacity: .85, fontStyle: "italic", fontWeight: "700" }}>{c.sentimiento}</span>
                      </div>

                      <div style={{ marginTop: 14 }}><CardActions dark onEdit={() => setEditItem(c)} onDelete={() => setDeleteItem(c)} /></div>
                    </div>
                    <div style={{ position: "absolute", bottom: -8, right: -4, fontSize: 52, opacity: .04, pointerEvents: "none" }}>🍪</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* PRÓXIMOS */}
        {tab === "proximos" && (
          <>
            {prox && (() => {
              const dias = diasRestantes(prox.fechaRaw);
              return (
                <div style={{ background: "#FDE047", border: "4px solid #000", padding: 20, marginBottom: 24, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div className={dias !== null && dias <= 3 ? "pulse" : ""} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 3, color: "#000", textTransform: "uppercase", marginBottom: 4 }}>Próximo plan</div>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: dias === 0 ? 14 : 48, color: "#000", lineHeight: 1 }}>
                      {dias === 0 ? "¡HOY! 🎉" : dias < 0 ? `Hace ${Math.abs(dias)}d` : `${dias}d`}
                    </div>
                    {dias > 0 && <div style={{ fontSize: 9, color: "#000", opacity: .6, letterSpacing: 2, textTransform: "uppercase" }}>días restantes</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: "#000", letterSpacing: 1, lineHeight: 1.1 }}>{prox.plan}</div>
                    <div style={{ fontSize: 10, color: "#000", opacity: .6, marginTop: 4 }}>{fmt(prox.fechaRaw)} · {CAT_IC[prox.categoria]} {prox.categoria}</div>
                  </div>
                  <div style={{ fontSize: 36 }}>{prox.emoji}</div>
                </div>
              );
            })()}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {CATS.map(cat => (
                <button key={cat} onClick={() => setFiltro(cat)} className={filtro === cat ? "fa" : ""}
                  style={{
                    background: "transparent", border: "2px solid #333", color: "#555", padding: "6px 12px",
                    fontFamily: "'Space Mono'", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer"
                  }}>
                  {CAT_IC[cat]} {cat}
                </button>
              ))}
            </div>

            {planesF.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#333" }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🍄</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: "#444", letterSpacing: 2 }}>¡Aún no hay planes aquí!</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>Ve a <strong style={{ color: "#FDE047" }}>＋ Registrar</strong> y agrega un plan futuro.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
                {planesF.map(p => {
                  const dias = diasRestantes(p.fechaRaw); const esHoy = dias === 0; const esPas = dias !== null && dias < 0;
                  return (
                    <div key={p.id} className="ch" style={{ background: "#fff", border: "4px solid #000", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
                      <div style={{ background: "#000", color: "#fff", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "'Bebas Neue'", fontSize: 12, letterSpacing: 0.5 }}>🍄 {fmt(p.fechaRaw)}</span>
                        <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", border: "1px solid #fff", padding: "2px 6px" }}>{CAT_IC[p.categoria]} {p.categoria}</span>
                      </div>
                      <div style={{ padding: "14px 12px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: "#000", lineHeight: 1.1, marginBottom: 10, letterSpacing: 1 }}>{p.plan}</div>
                        <div style={{ fontSize: 11, color: "#000", lineHeight: 1.5, borderLeft: "3px solid #000", paddingLeft: 8, marginBottom: 12, display: "flex", alignItems: "center", flexGrow: 1 }}>{p.highlight}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <div style={{ background: esHoy ? "#FDE047" : esPas ? "#222" : "#0a0a0a", color: esHoy ? "#000" : "#FDE047", border: "2px solid #000", padding: "4px 10px", fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 2 }}>
                            {esHoy ? "¡HOY! 🎉" : esPas ? `Hace ${Math.abs(dias)}d` : `Faltan ${dias} días`}
                          </div>
                          <span style={{ fontSize: 10, color: "#000", opacity: .90, fontStyle: "italic" }}>{p.sentimiento}</span>
                        </div>
                        <div style={{ marginTop: "auto" }}><CardActions onEdit={() => setEditItem(p)} onDelete={() => setDeleteItem(p)} /></div>
                      </div>
                      <div style={{ position: "absolute", bottom: -8, right: -4, fontSize: 52, opacity: .05, pointerEvents: "none" }}>🍄</div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* REGISTRAR (INTELIGENTE) */}
        {tab === "nueva" && (
          <div style={{ background: "#111", border: `4px solid ${tipoForm === "futuro" ? "#fff" : "#FDE047"}`, padding: 24, transition: "all .3s ease" }}>

            {/* Cabecera dinámica */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: tipoForm === "futuro" ? "#fff" : "#FDE047", letterSpacing: 2 }}>
                {tipoForm === "recuerdo" ? "🍪 Nuevo Recuerdo" : "🍄 Nuevo Plan Futuro"}
              </div>
              <div style={{ background: tipoForm === "futuro" ? "#fff" : "#FDE047", color: "#000", padding: "4px 10px", fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>
                {tipoForm === "futuro" ? "¿Todo preparado?" : "Registren sus mejores momentos"}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* FECHA INTELIGENTE */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "1/-1" }}>
                <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: tipoForm === "futuro" ? "#fff" : "#FDE047" }}>
                  📅 ¿Cuándo {tipoForm === "futuro" ? "será" : "fue"}?
                </label>
                <input
                  type="date"
                  value={form.fechaRaw}
                  onChange={e => {
                    const val = e.target.value;
                    setForm(p => ({ ...p, fechaRaw: val }));
                    if (val) {
                      // Lógica inteligente para detectar futuro o pasado
                      const [y, m, d] = val.split('-');
                      const selected = new Date(y, m - 1, d);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      setTipoForm(selected > today ? "futuro" : "recuerdo");
                    }
                  }}
                  style={{ ...SI, colorScheme: "dark", fontSize: 16, padding: "12px" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: tipoForm === "futuro" ? "#fff" : "#FDE047" }}>🗂 Categoría</label>
                <select value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))} style={SI}>
                  {CATS.slice(1).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: tipoForm === "futuro" ? "#fff" : "#FDE047" }}>✨ Emoji</label>
                <input value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))} placeholder="Ej: 🌸" style={SI} />
              </div>

              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: tipoForm === "futuro" ? "#fff" : "#FDE047" }}>✏️ {tipoForm === "futuro" ? "Plan / Título" : "Título del Recuerdo"}</label>
                <input value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))} placeholder="Ej: Tarde en el Museo de Arte" style={SI} />
              </div>

              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: tipoForm === "futuro" ? "#fff" : "#FDE047" }}>
                  {tipoForm === "futuro" ? "🍄 Qué esperan / plan" : "⭐ Highlight (Lo mejor)"}
                </label>
                <textarea value={form.highlight} onChange={e => setForm(p => ({ ...p, highlight: e.target.value }))}
                  placeholder={tipoForm === "futuro" ? "Ej: Reservar mesa con vista..." : "Ej: Cuando nos reímos sin parar..."}
                  style={{ ...SI, minHeight: 80, resize: "vertical" }} />
              </div>

              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: tipoForm === "futuro" ? "#fff" : "#FDE047" }}>💛 Sentimiento</label>
                <input value={form.sentimiento} onChange={e => setForm(p => ({ ...p, sentimiento: e.target.value }))} placeholder="Ej: Emocionada, Feliz..." style={SI} />
              </div>

              {/* 📸 INPUT DE IMAGEN (Solo en modo Recuerdo) */}
              {tipoForm === "recuerdo" && (
                <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#FDE047" }}>
                    📸 Foto del Recuerdo
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="file"
                      accept="image/*"
                      id="archivo-input-hidden"
                      onChange={e => { if (e.target.files && e.target.files[0]) setFile(e.target.files[0]); }}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="archivo-input-hidden"
                      className="ch"
                      style={{
                        background: "#FDE047", border: "3px solid #000", color: "#000", padding: "10px 20px",
                        fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, cursor: "pointer",
                        display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "4px 4px 0 #000"
                      }}
                    >
                      <span>✨ Seleccionar Foto</span>
                    </label>
                    <span style={{ fontSize: 11, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                      {file ? file.name : "Ninguna foto..."}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button onClick={submit} className="ch"
              style={{
                background: tipoForm === "futuro" ? "#fff" : "#FDE047", border: "3px solid #000",
                color: "#000", padding: "14px", fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 2,
                cursor: "pointer", width: "100%", marginTop: 24, boxShadow: "4px 4px 0 #000"
              }}>
              {tipoForm === "futuro" ? "🍄 GUARDAR PLAN FUTURO" : "🍪 GUARDAR RECUERDO"}
            </button>
          </div>
        )}
        {/* RETOS */}
        {tab === "retos" && (
          <div style={{ background: "#FDE047", border: "4px solid #000", padding: 28, textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 34, color: "#000", letterSpacing: 2, marginBottom: 4 }}>⚡ Generador de Retos</div>
            <p style={{ color: "#000", fontSize: 12, marginBottom: 20, opacity: .65 }}>¿Sin ideas? Presiona el botón y el universo decide.</p>
            <div style={{ fontSize: 10, color: "#00000066", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>
              {RETOS.length} retos disponibles
            </div>
            <button onClick={() => setReto(RETOS[Math.floor(Math.random() * RETOS.length)])}
              style={{
                background: "#000", border: "4px solid #000", color: "#FDE047", padding: "14px 28px",
                fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 2, cursor: "pointer", width: "100%", marginBottom: 4
              }}>
              🍪 ¡SORPRÉNDEME! 🍄
            </button>
            {reto && (
              <div style={{ background: "#000", color: "#FDE047", padding: 24, marginTop: 20, textAlign: "left" }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 2, marginBottom: 8 }}>{reto.nombre}</div>
                <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.7, marginBottom: 12 }}>{reto.desc}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "inline-block", border: "2px solid #FDE047", padding: "3px 12px", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>
                    {CAT_IC[reto.cat]} {reto.cat}
                  </div>
                  <button onClick={() => { setTipoForm("futuro"); setForm(f => ({ ...f, plan: reto.nombre, highlight: reto.desc, categoria: reto.cat })); setTab("nueva"); }}
                    style={{
                      background: "#FDE047", color: "#000", border: "none", padding: "6px 16px",
                      fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 1, cursor: "pointer"
                    }}>
                    + Añadir como Plan Futuro
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}