import { useState, useEffect, useCallback, useRef } from 'react';
import AsidePanel from './AsideContainer';
import IconoFa from './IconoFa';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import SeccionImagen from './SeccionImagen';
import SeccionCumpleanos from './SeccionCumpleanos';
import ModalImagen from './ModalImagen';
import { headersAuth, API_URL } from '../auth';
import { getSession } from '../utils/session';

export default function CompanyPanel({ isOpen, onClose, idRol, idAccs }) {
  const [menuUrl, setMenuUrl] = useState(null);
  const [eventoUrl, setEventoUrl] = useState(null);
  const [evento2Url, setEvento2Url] = useState(null);
  const [eventoMujeresUrl, setEventoMujeresUrl] = useState(null);
  const [cumpleanos, setCumpleanos] = useState([]);
  const [imagenGrande, setImagenGrande] = useState(null);

  const esAdmin = idRol === 1;

  // Obtener rol y género del usuario actual
  var sessionData = getSession();
  var rolUsuario = sessionData && sessionData.usuario ? (sessionData.usuario.rol || '').toUpperCase() : '';
  var esRRHH = rolUsuario === 'RRHH' || rolUsuario.indexOf('RRHH') >= 0;
  var puedeSubir = esAdmin || esRRHH;

  var generoUsuario = sessionData && sessionData.usuario ? sessionData.usuario.genero : null;
  var esMujer = generoUsuario === 'F';

  // Ref para guardar las URLs anteriores y evitar re-renders innecesarios
  const prevUrlsRef = useRef({});

  // Función reutilizable para cargar todas las imágenes y cumpleaños
  const cargarDatos = useCallback(function (silencioso) {
    var h = headersAuth();
    var t = Date.now();

    function fetchImg(endpoint, setter, key) {
      fetch(API_URL + '/' + endpoint, { headers: h })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var nuevaUrl = data.url ? API_URL + data.url + '?t=' + t : null;
          // Solo actualizar si la URL base cambió (evita parpadeos)
          var urlBase = data.url || null;
          if (prevUrlsRef.current[key] !== urlBase) {
            prevUrlsRef.current[key] = urlBase;
            setter(nuevaUrl);
          }
        })
        .catch(function () { if (!silencioso) setter(null); });
    }

    fetchImg('menu', setMenuUrl, 'menu');
    fetchImg('evento', setEventoUrl, 'evento');
    fetchImg('evento2', setEvento2Url, 'evento2');

    if (puedeSubir || esMujer) {
      fetchImg('evento-mujeres', setEventoMujeresUrl, 'evento-mujeres');
    }

    // Cumpleaños solo en carga inicial (no cambia frecuentemente)
    if (!silencioso) {
      fetch(API_URL + '/cumpleanos', { headers: h })
        .then(function (res) { return res.json(); })
        .then(function (data) { setCumpleanos(data); })
        .catch(function () { setCumpleanos([]); });
    }
  }, [puedeSubir, esMujer]);

  // Carga inicial al abrir + polling cada 30s mientras esté abierto
  useEffect(function () {
    if (!isOpen) return;

    // Carga inmediata
    cargarDatos(false);

    // Polling silencioso cada 30s (solo imágenes, no cumpleaños)
    var intervalo = setInterval(function () {
      cargarDatos(true);
    }, 30000);

    return function () { clearInterval(intervalo); };
  }, [isOpen, cargarDatos]);

  return (
    <AsidePanel isOpen={isOpen}>
      <div style={{ padding: '20px' }}>
        <button className="panel-close-btn" onClick={onClose}>
          <IconoFa icono={faXmark} />
        </button>

        <h3 style={{ marginBottom: '15px' }}>Panel de Empresa</h3>

        {/* Menú Semanal */}
        {(menuUrl || puedeSubir) && (
          <SeccionImagen
            label="Menú Semanal"
            url={menuUrl}
            esAdmin={puedeSubir}
            tipo="menu"
            idAccs={idAccs}
            onCambio={setMenuUrl}
            onVerGrande={setImagenGrande}
          />
        )}

        {/* Eventos */}
        {(eventoUrl || puedeSubir) && (
          <SeccionImagen
            label="Eventos"
            url={eventoUrl}
            esAdmin={puedeSubir}
            tipo="evento"
            idAccs={idAccs}
            onCambio={setEventoUrl}
            onVerGrande={setImagenGrande}
          />
        )}

        {/* Evento 2 */}
        {(evento2Url || puedeSubir) && (
          <SeccionImagen
            label="Eventos 2"
            url={evento2Url}
            esAdmin={puedeSubir}
            tipo="evento2"
            idAccs={idAccs}
            onCambio={setEvento2Url}
            onVerGrande={setImagenGrande}
          />
        )}

        {/* Evento exclusivo Mujeres — solo visible para mujeres y admins/RRHH */}
        {(esMujer || puedeSubir) && (eventoMujeresUrl || puedeSubir) && (
          <SeccionImagen
            label="Evento Mujeres"
            url={eventoMujeresUrl}
            esAdmin={puedeSubir}
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
