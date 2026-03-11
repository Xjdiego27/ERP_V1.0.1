export default function Input({ 
  tipo = "text", 
  value, 
  valor_ingresado, 
  placeholder, 
  name, 
  className = "",
  disabled = false 
}) {
  return (
    <input
      type={tipo}
      name={name}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      onChange={(e) => valor_ingresado(e.target.value)}
    />
  );
}