import { useRef, useState } from 'react';
import IconoFa from './IconoFa';
import { faCamera, faXmark } from '@fortawesome/free-solid-svg-icons';
import { headersAuth, API_URL } from '../auth';
import '../styles/SeccionImagen.css';

// Este componente muestra una imagen con botones de subir y eliminar
// Se usa para Menú Semanal y Eventos
export default function SeccionImagen(props) {
  // Props que recibe:
  // label     = título ("Menú Semanal" o "Eventos")
  // url       = ruta de la imagen (o null si no hay)
  // esAdmin   = true si el usuario es administrador
  // tipo      = "menu" o "evento" (para el endpoint)
  // idAccs    = id del usuario que sube
  // onCambio  = función para actualizar la url en el padre
  // onVerGrande = función para abrir modal con imagen grande

  const [cargando, setCargando] = useState(false);
  const inputRef = useRef(null);

  // ¿En qué carpeta se guarda? menu → menus, evento → eventos
  var carpeta = 'menus';
  if (props.tipo === 'evento') {
    carpeta = 'eventos';
  }

  // --- FUNCIÓN: Subir imagen ---
  async function subir(e) {
    var archivo = e.target.files[0];
    if (!archivo) return;

    setCargando(true);

    // FormData es como un "sobre" para enviar archivos por HTTP
    var formData = new FormData();
    formData.append('archivo', archivo);

    // Enviamos al backend
    var respuesta = await fetch(API_URL + '/' + props.tipo + '?id_accs=' + props.idAccs, {
      method: 'POST',
      headers: headersAuth(),
      body: formData,
    });

    var data = await respuesta.json();

    // Si el backend respondió con el nombre del archivo, actualizamos la imagen
    if (data.archivo) {
      props.onCambio('/assets/' + carpeta + '/' + data.archivo + '?t=' + Date.now());
    }

    setCargando(false);
  }

  // --- FUNCIÓN: Eliminar imagen ---
  async function eliminar() {
    await fetch(API_URL + '/' + props.tipo, { method: 'DELETE', headers: headersAuth() });
    props.onCambio(null);
  }

  return (
    <div className="seccion-imagen">
      <h4 className="seccion-imagen-titulo">{props.label}</h4>

      <div className="seccion-imagen-contenedor">

        {/* Si hay imagen, la mostramos. Si no, mostramos un recuadro gris */}
        {props.url ? (
          <img
            src={props.url}
            alt={props.label}
            className="seccion-imagen-foto"
            onClick={function () { props.onVerGrande(props.url); }}
          />
        ) : (
          <div className="seccion-imagen-vacia">Sin imagen</div>
        )}

        {/* Botón rojo para ELIMINAR (solo admin y solo si hay imagen) */}
        {props.esAdmin && props.url && (
          <button
            className="seccion-btn-eliminar"
            onClick={eliminar}
            title={'Eliminar ' + props.label}
          >
            <IconoFa icono={faXmark} />
          </button>
        )}

        {/* Botón para SUBIR imagen (solo admin) */}
        {props.esAdmin && (
          <div>
            {/* Input oculto que abre el explorador de archivos */}
            <input
              type="file"
              accept="image/*"
              ref={inputRef}
              className="seccion-input-oculto"
              onChange={subir}
            />
            {/* Botón visible que activa el input oculto */}
            <button
              className="seccion-btn-subir"
              onClick={function () { inputRef.current.click(); }}
              disabled={cargando}
              title={'Subir ' + props.label}
            >
              {cargando ? '...' : <IconoFa icono={faCamera} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
