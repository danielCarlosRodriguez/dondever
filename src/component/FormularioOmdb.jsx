import { useEffect, useState } from "react";
import axios from "axios";
import DetalleOmdb from "./DetalleOmdb";
import RatingGrid from "./RatingGrid";

const PLACEHOLDER = "https://via.placeholder.com/500x750?text=Sin+Imagen";

const FormularioOmdb = () => {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const OMDB_KEY = import.meta.env.VITE_OMDB_API_KEY;

  useEffect(() => {
    let cancelled = false;
    const q = texto.trim();

    if (!OMDB_KEY) {
      console.error("❌ Falta VITE_OMDB_API_KEY en .env");
      return;
    }

    if (q.length < 2) {
      setResultados([]);
      setError(null);
      setCargando(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCargando(true);
        setError(null);

        const searchUrl = `https://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${encodeURIComponent(
          q
        )}&page=1`;
        const { data } = await axios.get(searchUrl);

        if (cancelled) return;

        if (data.Response === "False") {
          setResultados([]);
          setError(data.Error || "Sin resultados.");
          setCargando(false);
          return;
        }

        const top = (data.Search || []).slice(0, 12);

        const detalles = await Promise.all(
          top.map(async (it) => {
            try {
              const detUrl = `https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${it.imdbID}&plot=short`;
              const det = await axios.get(detUrl);
              const d = det.data || {};
              return {
                imdbID: it.imdbID,
                title: d.Title || it.Title,
                year: d.Year || it.Year,
                type: d.Type || it.Type,
                poster: d.Poster && d.Poster !== "N/A" ? d.Poster : it.Poster,
                imdbRating:
                  d.imdbRating && d.imdbRating !== "N/A" ? d.imdbRating : null,
                genre: d.Genre && d.Genre !== "N/A" ? d.Genre : null,
                runtime: d.Runtime && d.Runtime !== "N/A" ? d.Runtime : null,
                plot: d.Plot && d.Plot !== "N/A" ? d.Plot : null,
              };
            } catch {
              return {
                imdbID: it.imdbID,
                title: it.Title,
                year: it.Year,
                type: it.Type,
                poster: it.Poster,
                imdbRating: null,
                genre: null,
                runtime: null,
                plot: null,
              };
            }
          })
        );

        if (cancelled) return;
        setResultados(detalles);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setError("No se pudo completar la búsqueda.");
      } finally {
        if (!cancelled) setCargando(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [texto, OMDB_KEY]);

  // Vista de detalle
  if (selectedId) {
    return (
      <DetalleOmdb imdbID={selectedId} onBack={() => setSelectedId(null)} />
    );
  }

  // Vista de listado
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 p-6">
      {/* Input */}
      <form
        className="mb-6 w-full max-w-md"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar en OMDb (títulos IMDb)…"
          className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </form>

      {/* Estados */}
      {cargando && (
        <div className="text-sm text-gray-500 mb-4">Buscando en OMDb…</div>
      )}
      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      {/* Cards */}
      <div className="w-full max-w-6xl flex flex-wrap justify-center gap-6">
        {resultados.map((r) => {
          const numericRating = r.imdbRating ? parseFloat(r.imdbRating) : null;
          return (
            <div
              key={r.imdbID}
              className="bg-white rounded-xl shadow-md overflow-hidden w-72 flex flex-col transition-transform hover:scale-105 hover:shadow-lg"
            >
              {/* Imagen */}
              <img
                className="w-full h-96 object-cover rounded-t-xl"
                src={r.poster && r.poster !== "N/A" ? r.poster : PLACEHOLDER}
                alt={r.title}
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER;
                }}
              />
              {/* Contenido */}
              <div className="p-4 flex flex-col flex-grow">
                <h5 className="text-lg font-bold mb-2 line-clamp-2">
                  {r.title}
                </h5>

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  {r.year && <p>Año: {r.year}</p>}
                  {r.type && <p>Tipo: {r.type}</p>}
                  {r.genre && <p>Género: {r.genre}</p>}
                  {r.runtime && <p>Duración: {r.runtime}</p>}
                  {numericRating !== null ? (
                    <p>IMDb: ⭐ {numericRating.toFixed(1)}</p>
                  ) : (
                    <p className="text-gray-400">IMDb: —</p>
                  )}
                  {/* 🔴 Se eliminó el bloque del plot */}
                </div>

                <RatingGrid
                  imdb={r.imdbRating}
                  metascore={r.metascore}
                  ratings={r.ratings}
                  size="sm"
                />
              </div>

              {/* Botón: abre Detalle */}
              <button
                className="w-full bg-purple-600 text-white font-semibold py-3 rounded-b-xl hover:bg-purple-700 transition-colors"
                type="button"
                onClick={() => setSelectedId(r.imdbID)}
              >
                Ver Detalles
              </button>
            </div>
          );
        })}
      </div>

      {!cargando &&
        !error &&
        texto.trim().length >= 2 &&
        resultados.length === 0 && (
          <div className="text-sm text-gray-500 mt-4">
            No se encontraron títulos.
          </div>
        )}
    </div>
  );
};

export default FormularioOmdb;
