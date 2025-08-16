import { useState, useEffect } from "react";
import axios from "axios";
import Detalle from "./Detalle";


const Formulario = () => {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
const [seleccionado, setSeleccionado] = useState(null);

  
  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  if (!API_KEY) {
    console.error("❌ No se encontró la variable VITE_TMDB_API_KEY en .env");
  }

  const obtenerProveedor = async (item) => {
    try {
      const tipo = item.media_type === "movie" ? "movie" : "tv";
      const response = await axios.get(
        `https://api.themoviedb.org/3/${tipo}/${item.id}/watch/providers?api_key=${API_KEY}`
      );

      const r = response.data.results ?? {};
      const proveedor =
        r.UY?.flatrate?.[0]?.logo_path ??
        r.AR?.flatrate?.[0]?.logo_path ??
        null;

      //console.log(response.data.results);
      
      

      return { ...item, proveedor };


    } catch (error) {
      console.error(error);
      return { ...item, proveedor: null };
    }
  };

  useEffect(() => {
    const obtenerResultados = async () => {
      if (!texto) {
        setResultados([]);
        return;
      }

      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=es-ES&query=${texto}&page=1&include_adult=false`
        );

        const enriquecidos = await Promise.all(
          response.data.results
            .filter((r) => r.media_type !== "person")
            .map((item) => obtenerProveedor(item))
        );

        setResultados(enriquecidos);
        console.log(enriquecidos);
        
      } catch (error) {
        console.error("❌ Error obteniendo proveedor:", error);
      }
    };

    obtenerResultados();
  }, [texto, API_KEY]);

  if (seleccionado) {
    return <Detalle item={seleccionado} onBack={() => setSeleccionado(null)} />;
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 p-6">
      {/* Input */}
      <form className="mb-6 w-full max-w-md">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar película o serie..."
          className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      {/* Cards */}
      <div className="w-full max-w-6xl flex flex-wrap justify-center gap-6">
        {resultados.map((resultado) => (
          <div
            key={resultado.id}
            className="bg-white rounded-xl shadow-md overflow-hidden w-72 flex flex-col transition-transform transform hover:scale-105 hover:shadow-lg"
          >
            {/* Imagen */}
            <img
              className="w-full h-96 object-cover rounded-t-xl"
              src={`https://image.tmdb.org/t/p/w500${resultado.poster_path}`}
              alt={resultado.title || resultado.name}
            />

            {/* Contenido */}
            <div className="p-4 flex flex-col flex-grow">
              {/* Título */}
              <h5 className="text-lg font-bold mb-2">
                {resultado.title || resultado.name}
              </h5>

              {/* Info + Proveedor */}
              <div className="flex justify-between items-start text-sm text-gray-600 mb-4">
                <div className="space-y-1">
                  {resultado.release_date && (
                    <p>Fecha: {resultado.release_date}</p>
                  )}
                  {resultado.first_air_date && (
                    <p>Fecha: {resultado.first_air_date}</p>
                  )}
                  {typeof resultado.vote_average === "number" && (
                    <p>IMDb: ⭐ {resultado.vote_average.toFixed(1)}</p>
                  )}
                  <p>Tipo: {resultado.media_type}</p>
                </div>
                <div className="flex items-center">
                  {resultado.proveedor ? (
                    <img
                      className="w-12 h-12 object-contain"
                      alt="Proveedor"
                      src={`https://image.tmdb.org/t/p/original${resultado.proveedor}`}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </div>
              </div>
            </div>

            {/* Botón (ocupa todo el ancho) */}
            <button
              className="w-full bg-purple-600 text-white font-semibold py-3 rounded-b-xl hover:bg-purple-700 transition-colors"
              onClick={() => setSeleccionado(resultado)}
            >
              Ver Detalles
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Formulario;
