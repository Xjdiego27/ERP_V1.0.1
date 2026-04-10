import IconoFa from './IconoFa';
import { faCakeCandles } from '@fortawesome/free-solid-svg-icons';
import '../styles/SeccionCumpleanos.css';

export default function SeccionCumpleanos(props) {
  // cumpleanos = array de objetos { nombre, dia, foto }

  // Nombre del mes actual en español
  var meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  var mesActual = meses[new Date().getMonth()];

  // Si no hay cumpleaños, mostramos un mensaje
  if (props.cumpleanos.length === 0) {
    return (
      <div className="cumple-seccion">
        <h4 className="cumple-titulo">
          <IconoFa icono={faCakeCandles} /> Cumpleaños de {mesActual}
        </h4>
        <p className="cumple-vacio">No hay cumpleaños este mes.</p>
      </div>
    );
  }

  // Si hay cumpleaños, mostramos la lista
  return (
    <div className="cumple-seccion">
      <h4 className="cumple-titulo">
        <IconoFa icono={faCakeCandles} /> Cumpleaños de {mesActual}
      </h4>

      <ul className="cumple-lista">
        {props.cumpleanos.map(function (persona, i) {
          return (
            <li key={i} className="cumple-item">
              <span className="cumple-dia">{persona.dia}</span>
              <span className="cumple-nombre">{persona.nombre}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
