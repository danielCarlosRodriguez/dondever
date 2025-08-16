import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";

const PLACEHOLDER = "https://via.placeholder.com/500x750?text=Sin+Imagen";

const DetalleOmdb = ({ imdbID, onBack }) => {
  const OMDB_KEY = import.meta.env.VITE_OMDB_API_KEY;
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancel = false;

    const fetchDetail = async () => {
      if (!OMDB_KEY) {
        setError("Falta VITE_OMDB_API_KEY en .env");
        setCargando(false);
        return;
      }
      try {
        setCargando(true);
        setError(null);
        const url = `https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${imdbID}&plot=full`;
        const { data } = await axios.get(url);

        if (cancel) return;

        if (data.Response === "False") {
          setError(data.Error || "No se encontraron detalles.");
          setData(null);
        } else {
          setData(data);
          console.log(data);
          
        }
      } catch (e) {
        if (cancel) return;
        console.error(e);
        setError("No se pudo cargar el detalle.");
      } finally {
        if (!cancel) setCargando(false);
      }
    };

    fetchDetail();
    return () => {
      cancel = true;
    };
  }, [imdbID, OMDB_KEY]);

  const ratingIMDb =
    data?.imdbRating && data.imdbRating !== "N/A" ? data.imdbRating : null;
  const metascore =
    data?.Metascore && data.Metascore !== "N/A" ? data.Metascore : null;
  const tomatoes =
    (data?.Ratings || []).find((r) => r.Source === "Rotten Tomatoes")?.Value ||
    null;

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-10">
      <button
        onClick={onBack}
        className="mb-6 text-purple-600 hover:underline font-medium"
        type="button"
      >
        ⬅ Volver
      </button>

      {cargando && (
        <div className="text-sm text-gray-500">Cargando detalles de OMDb…</div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!cargando && !error && data && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <img
            className="w-72 h-auto rounded-lg shadow-md self-start"
            src={
              data.Poster && data.Poster !== "N/A" ? data.Poster : PLACEHOLDER
            }
            alt={data.Title}
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER;
            }}
          />

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">
              {data.Title}{" "}
              {data.Year ? (
                <span className="text-gray-500 text-2xl">({data.Year})</span>
              ) : null}
            </h2>

            {/* Badges de rating */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {ratingIMDb && (
                <span className="inline-flex items-center gap-1 text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded">
                  ⭐ IMDb: {ratingIMDb}
                </span>
              )}
              {tomatoes && (
                <span className="inline-flex items-center gap-1 text-sm bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded">
                  🍅 Rotten: {tomatoes}
                </span>
              )}
              {metascore && (
                <span className="inline-flex items-center gap-1 text-sm bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded">
                  🟩 Metascore: {metascore}
                </span>
              )}
              {data.imdbVotes && data.imdbVotes !== "N/A" && (
                <span className="inline-flex items-center gap-1 text-sm bg-gray-50 text-gray-700 border border-gray-200 px-2 py-1 rounded">
                  🗳 {data.imdbVotes} votos
                </span>
              )}
            </div>

            {/* Grid de metadatos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700 mb-4">
              {data.Rated && data.Rated !== "N/A" && (
                <p>
                  <strong>Clasificación:</strong> {data.Rated}
                </p>
              )}
              {data.Runtime && data.Runtime !== "N/A" && (
                <p>
                  <strong>Duración:</strong> {data.Runtime}
                </p>
              )}
              {data.Genre && data.Genre !== "N/A" && (
                <p>
                  <strong>Género:</strong> {data.Genre}
                </p>
              )}
              {data.Type && data.Type !== "N/A" && (
                <p>
                  <strong>Tipo:</strong> {data.Type}
                </p>
              )}
              {data.Released && data.Released !== "N/A" && (
                <p>
                  <strong>Estreno:</strong> {data.Released}
                </p>
              )}
              {data.Language && data.Language !== "N/A" && (
                <p>
                  <strong>Idiomas:</strong> {data.Language}
                </p>
              )}
              {data.Country && data.Country !== "N/A" && (
                <p>
                  <strong>País:</strong> {data.Country}
                </p>
              )}
              {data.BoxOffice && data.BoxOffice !== "N/A" && (
                <p>
                  <strong>Box Office:</strong> {data.BoxOffice}
                </p>
              )}
              {data.Production && data.Production !== "N/A" && (
                <p>
                  <strong>Productora:</strong> {data.Production}
                </p>
              )}
              {data.Website && data.Website !== "N/A" && (
                <p>
                  <strong>Sitio:</strong>{" "}
                  <a
                    className="text-purple-600 hover:underline"
                    href={data.Website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {data.Website}
                  </a>
                </p>
              )}
            </div>

            {/* Créditos y sinopsis */}
            {data.Director && data.Director !== "N/A" && (
              <p className="mb-1">
                <strong>Director:</strong> {data.Director}
              </p>
            )}
            {data.Writer && data.Writer !== "N/A" && (
              <p className="mb-1">
                <strong>Guion:</strong> {data.Writer}
              </p>
            )}
            {data.Actors && data.Actors !== "N/A" && (
              <p className="mb-4">
                <strong>Actores:</strong> {data.Actors}
              </p>
            )}
            {data.Plot && data.Plot !== "N/A" && (
              <p className="text-gray-800 leading-relaxed">
                <strong>Sinopsis:</strong> {data.Plot}
              </p>
            )}

            {/* Link a IMDb */}
            {data.imdbID && (
              <a
                href={`https://www.imdb.com/title/${data.imdbID}/`}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-4 text-sm text-purple-600 hover:underline"
              >
                Ver en IMDb ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

DetalleOmdb.propTypes = {
  imdbID: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default DetalleOmdb;
