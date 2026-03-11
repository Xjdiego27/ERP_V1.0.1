import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function IconoFa({ icono, tamaño = '1x', clase = "" }) {
    return (
        <FontAwesomeIcon 
            icon={icono} 
            size={tamaño} 
            className={`icono-base ${clase}`} 
        />
    );
}