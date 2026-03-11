function Selector({ opciones, valor, setValor}) {
    if (opciones && opciones.length > 0 && !valor) {
    setValor(opciones[0].id);
  }
  return (
    <select 
      value={valor} 
      onChange={(e) => setValor(e.target.value)} 
    >
      {opciones.map((item) => (
        <option key={item.id} value={item.id}>{item.nombre}</option>
      ))}
    </select>
  );
}
export default Selector;