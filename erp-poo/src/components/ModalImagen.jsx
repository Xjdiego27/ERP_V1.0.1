import { createPortal } from 'react-dom';
import '../styles/ModalImagen.css';

// Este componente muestra una imagen en pantalla completa
// Se cierra al hacer clic en cualquier parte
// Usa createPortal para renderizar fuera del aside (evita recortes por overflow)
export default function ModalImagen(props) {
  // Props que recibe:
  // url      = la url de la imagen a mostrar (o null)
  // onCerrar = función para cerrar el modal

  // Si no hay url, no mostramos nada
  if (!props.url) {
    return null;
  }

  return createPortal(
    <div className="modal-fondo" onClick={props.onCerrar}>
      <img src={props.url} alt="Imagen grande" className="modal-imagen" />
    </div>,
    document.body
  );
}
