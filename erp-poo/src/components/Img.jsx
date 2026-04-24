import { useState } from 'react';

function Img({ ruta, descripcion }) {
  const [error, setError] = useState(false);

  if (!ruta || error) {
    return (
      <span className="img-avatar-fallback" title={descripcion} aria-label={descripcion}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
          <path d="M12 12c2.486 0 4.5-2.014 4.5-4.5S14.486 3 12 3 7.5 5.014 7.5 7.5 9.514 12 12 12zm0 2.25c-3.004 0-9 1.508-9 4.5V21h18v-2.25c0-2.992-5.996-4.5-9-4.5z"/>
        </svg>
      </span>
    );
  }

  return (
    <img
      src={ruta}
      alt={descripcion}
      onError={() => setError(true)}
    />
  );
}

export default Img;