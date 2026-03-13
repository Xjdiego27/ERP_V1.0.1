import { useState, useEffect } from 'react';
import AsidePanel from './AsideContainer';
import IconoFa from './IconoFa';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import SeccionImagen from './SeccionImagen';
import SeccionCumpleanos from './SeccionCumpleanos';
import ModalImagen from './ModalImagen';
import { headersAuth, API_URL } from '../auth';

export default function CompanyPanel({ isOpen, onClose, idRol, idAccs }) {
  const [menuUrl, setMenuUrl] = useState(null);
  const [eventoUrl, setEventoUrl] = useState(null);
  const [evento2Url, setEvento2Url] = useState(null);
  const [eventoMujeresUrl, setEventoMujeresUrl] = useState(null);
  const [cumpleanos, setCumpleanos] = useState([]);
  const [imagenGrande, setImagenGrande] = useState(null);

  const esAdmin = idRol === 1;

  // Obtener género del usuario actual
  var sessionData = JSON.parse(localStorage.getItem('session'));
  var generoUsuario = sessionData && sessionData.usuario ? sessionData.usuario.genero : null;
  var esMujer = generoUsuario === 'F';

  // Traer datos cuando se abre el panel
  useEffect(() => {
    if (!isOpen) return;

    fetch(API_URL + '/menu', { headers: headersAuth() })
      .then(res => res.json())
      .then(data => setMenuUrl(data.url ? data.url + '?t=' + Date.now() : null))
      .catch(() => setMenuUrl(null));

    fetch(API_URL + '/evento', { headers: headersAuth() })
      .then(res => res.json())
      .then(data => setEventoUrl(data.url ? data.url + '?t=' + Date.now() : null))
      .catch(() => setEventoUrl(null));

    fetch(API_URL + '/evento2', { headers: headersAuth() })
      .then(res => res.json())
      .then(data => setEvento2Url(data.url ? data.url + '?t=' + Date.now() : null))
      .catch(() => setEvento2Url(null));

    // Evento mujeres: solo traer si es admin o es mujer
    if (esAdmin || esMujer) {
      fetch(API_URL + '/evento-mujeres', { headers: headersAuth() })
        .then(res => res.json())
        .then(data => setEventoMujeresUrl(data.url ? data.url + '?t=' + Date.now() : null))
        .catch(() => setEventoMujeresUrl(null));
    }

    fetch(API_URL + '/cumpleanos', { headers: headersAuth() })
      .then(res => res.json())
      .then(data => setCumpleanos(data))
      .catch(() => setCumpleanos([]));
  }, [isOpen]);

  return (
    <AsidePanel isOpen={isOpen}>
      <div style={{ padding: '20px' }}>
        <button className="panel-close-btn" onClick={onClose}>
          <IconoFa icono={faXmark} />
        </button>

        <h3 style={{ marginBottom: '15px' }}>Panel de Empresa</h3>

        {/* Menú Semanal */}
        {(menuUrl || esAdmin) && (
          <SeccionImagen
            label="Menú Semanal"
            url={menuUrl}
            esAdmin={esAdmin}
            tipo="menu"
            idAccs={idAccs}
            onCambio={setMenuUrl}
            onVerGrande={setImagenGrande}
          />
        )}

        {/* Eventos */}
        {(eventoUrl || esAdmin) && (
          <SeccionImagen
            label="Eventos"
            url={eventoUrl}
            esAdmin={esAdmin}
            tipo="evento"
            idAccs={idAccs}
            onCambio={setEventoUrl}
            onVerGrande={setImagenGrande}
          />
        )}

        {/* Evento 2 */}
        {(evento2Url || esAdmin) && (
          <SeccionImagen
            label="Eventos 2"
            url={evento2Url}
            esAdmin={esAdmin}
            tipo="evento2"
            idAccs={idAccs}
            onCambio={setEvento2Url}
            onVerGrande={setImagenGrande}
          />
        )}

        {/* Evento exclusivo Mujeres — solo visible para mujeres y admins */}
        {(esMujer || esAdmin) && (eventoMujeresUrl || esAdmin) && (
          <SeccionImagen
            label="Evento Mujeres"
            url={eventoMujeresUrl}
            esAdmin={esAdmin}
            tipo="evento-mujeres"
            idAccs={idAccs}
            onCambio={setEventoMujeresUrl}
            onVerGrande={setImagenGrande}
          />
        )}

        {/* Cumpleaños */}
        <SeccionCumpleanos cumpleanos={cumpleanos} />

        {/* Modal para ver imagen en grande */}
        <ModalImagen url={imagenGrande} onCerrar={() => setImagenGrande(null)} />
      </div>
    </AsidePanel>
  );
}
