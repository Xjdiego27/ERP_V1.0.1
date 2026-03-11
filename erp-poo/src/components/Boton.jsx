function Boton({ children, accion, tipo = "button", disabled = false }) {
    return (
            <button 
                onClick={accion} 
                type={tipo}          
                disabled={disabled}  
            >
                {children}     
            </button>
    );
}

export default Boton;

