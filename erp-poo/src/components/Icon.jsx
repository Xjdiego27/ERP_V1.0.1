
export default function Icon({ nombre, tamaño = 'md', alerta, onClick }) {
    const estiloTamaño = {
        sm: '18px',
        md: '24px',
        lg: '36px'
    };

    return (
        <div className={`icon-container size-${tamaño}`} onClick={onClick}>
            <span className="material-icons" style={{ fontSize: estiloTamaño[tamaño] }}>
                {nombre}
            </span>
            {alerta && <span className="dot"></span>}
        </div>
    );
}