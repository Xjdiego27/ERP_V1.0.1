function Img({ ruta, descripcion }) {
  return (
    <img 
      src={ruta} 
      alt={descripcion} 
    />
  );
}

export default Img;