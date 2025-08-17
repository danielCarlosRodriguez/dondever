import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Detalle from "./Detalle";
import RatingGrid from "./RatingGrid";

const Formulario = () => {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);

  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
  const OMDB_KEY = import.meta.env.VITE_OMDB_API_KEY;
  const OMDB_KEY_2 = import.meta.env.VITE_OMDB_API_KEY_2;

  if (!API_KEY) console.error("❌ No se encontró VITE_TMDB_API_KEY");
  if (!OMDB_KEY && !OMDB_KEY_2)
    console.warn("⚠ Falta(n) key(s) de OMDb (no habrá ratings de OMDb)");

  // Caché de resultados OMDb (imdbId -> payload)
  const omdbCacheRef = useRef(new Map());
  // Deduplicación “in-flight” (imdbId -> Promise)
  const omdbInFlightRef = useRef(new Map());
  // Cooldown para no spamear OMDb si dio “Request limit reached”
  const omdbRetryAtRef = useRef(0); // epoch ms

  const shouldSkipOmdb = () => Date.now() < omdbRetryAtRef.current;

  const obtenerProveedor = async (item) => {
    try {
      const tipo = item.media_type === "movie" ? "movie" : "tv";
      const { data } = await axios.get(
        `https://api.themoviedb.org/3/${tipo}/${item.id}/watch/providers?api_key=${API_KEY}`
      );
      const r = data?.results ?? {};
      const proveedor =
        r.UY?.flatrate?.[0]?.logo_path ??
        r.AR?.flatrate?.[0]?.logo_path ??
        null;
      return { ...item, proveedor };
    } catch {
      return { ...item, proveedor: null };
    }
  };

  // ---- OMDb core
  const omdbRequest = async (imdbId, apiKey) => {
    const { data } = await axios.get(
      `https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbId}`
    );
    if (data?.Response === "False") {
      const err = new Error(data?.Error || "OMDb error");
      err.omdbError = data?.Error;
      err.status = 200;
      throw err;
    }
    return data;
  };

  const omdbFetchWithFallback = async (imdbId) => {
    const keys = [OMDB_KEY, OMDB_KEY_2].filter(Boolean);
    let lastErrMsg = null;

    for (let i = 0; i < keys.length; i++) {
      try {
        // console.log(`OMDb: intentando con key #${i + 1}`);
        return await omdbRequest(imdbId, keys[i]);
      } catch (e) {
        const status = e?.response?.status;
        const msg =
          e?.omdbError ||
          e?.response?.data?.Error ||
          e?.message ||
          "OMDb error";
        lastErrMsg = msg;
        const quota =
          status === 401 ||
          /request limit reached/i.test(msg) ||
          /invalid api key/i.test(msg) ||
          /no api key provided/i.test(msg);
        if (!quota || i === keys.length - 1) break;
        // de lo contrario, prueba con la siguiente key
      }
    }

    // marcar cooldown si fue por límite
    if (/request limit reached/i.test(String(lastErrMsg))) {
      // pausa 2 minutos (ajustable)
      omdbRetryAtRef.current = Date.now() + 2 * 60 * 1000;
    }

    return {
      imdbRating: null,
      Metascore: null,
      Ratings: null,
      _omdbError: lastErrMsg,
    };
  };

  const fetchOmdbForTmdbItem = async (it) => {
    try {
      if ((!OMDB_KEY && !OMDB_KEY_2) || shouldSkipOmdb()) {
        return { imdbRating: null, Metascore: null, Ratings: null };
      }

      const tipo = it.media_type === "movie" ? "movie" : "tv";
      const ext = await axios.get(
        `https://api.themoviedb.org/3/${tipo}/${it.id}/external_ids?api_key=${API_KEY}`
      );
      const imdbId = ext?.data?.imdb_id;
      if (!imdbId) return { imdbRating: null, Metascore: null, Ratings: null };

      const cache = omdbCacheRef.current;
      if (cache.has(imdbId)) return cache.get(imdbId);

      // dedupe in-flight
      const inflight = omdbInFlightRef.current.get(imdbId);
      if (inflight) return await inflight;

      const p = (async () => {
        const omdb = await omdbFetchWithFallback(imdbId);
        const clean = (v) => (v && v !== "N/A" ? v : null);
        const payload = {
          imdbRating: clean(omdb?.imdbRating),
          Metascore: clean(omdb?.Metascore),
          Ratings: Array.isArray(omdb?.Ratings) ? omdb.Ratings : null,
        };
        cache.set(imdbId, payload);
        return payload;
      })();

      omdbInFlightRef.current.set(imdbId, p);
      const res = await p;
      omdbInFlightRef.current.delete(imdbId);
      return res;
    } catch {
      return { imdbRating: null, Metascore: null, Ratings: null };
    }
  };

  // Carga incremental: pinta TMDb y enriquece N items con OMDb (concurrencia limitada)
  const loadOmdbIncremental = async (
    items,
    isActiveRef,
    maxOmdb = 8,
    concurrency = 2
  ) => {
    const queue = items.slice(0, maxOmdb);
    const worker = async () => {
      while (queue.length) {
        const it = queue.shift();
        const omdb = await fetchOmdbForTmdbItem(it);
        if (!isActiveRef.current) return;
        setResultados((prev) =>
          prev.map((x) => (x.id === it.id ? { ...x, omdb } : x))
        );
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(concurrency, queue.length) }, worker)
    );
  };

  // ---- ÚNICO useEffect para buscar y pintar
  useEffect(() => {
    let active = true;
    const isActiveRef = { current: true };

    const obtenerResultados = async () => {
      const q = texto.trim();
      if (!q) {
        setResultados([]);
        return;
      }
      try {
        // 1) Buscar en TMDb
        const { data } = await axios.get(
          `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(
            q
          )}&page=1&include_adult=false`
        );

        // 2) Filtrar y agregar proveedor
        const base = (data.results || []).filter(
          (r) => r.media_type !== "person"
        );
        const conProveedor = await Promise.all(base.map(obtenerProveedor));
        if (!active) return;

        // 3) Pintar YA (OMDb en "cargando")
        setResultados(conProveedor.map((it) => ({ ...it, omdb: undefined })));

        // 4) Enriquecer OMDb sin bloquear UI
        loadOmdbIncremental(conProveedor, isActiveRef, 8, 2);
      } catch (error) {
        if (!active) return;
        console.error("❌ Error buscando/enriqueciendo:", error);
      }
    };

    obtenerResultados();
    return () => {
      active = false;
      isActiveRef.current = false;
    };
  }, [texto, API_KEY, OMDB_KEY, OMDB_KEY_2]);

  if (seleccionado) {
    return <Detalle item={seleccionado} onBack={() => setSeleccionado(null)} />;
  }

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
            <img
              className="w-full h-96 object-cover rounded-t-xl"
              src={`https://image.tmdb.org/t/p/w500${resultado.poster_path}`}
              alt={resultado.title || resultado.name}
            />
            <div className="p-4 flex flex-col flex-grow">
              <h5 className="text-lg font-bold mb-2">
                {resultado.title || resultado.name}
              </h5>

              <div className="flex justify-between items-start text-sm text-gray-600 mb-3">
                <div className="space-y-1">
                  {resultado.release_date && (
                    <p>Fecha: {resultado.release_date}</p>
                  )}
                  {resultado.first_air_date && (
                    <p>Fecha: {resultado.first_air_date}</p>
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

              <div className="mx-auto">
                <RatingGrid
                  imdb={resultado.omdb?.imdbRating}
                  metascore={resultado.omdb?.Metascore}
                  ratings={resultado.omdb?.Ratings}
                  tmdb={
                    typeof resultado.vote_average === "number"
                      ? resultado.vote_average
                      : null
                  }
                  size="sm"
                  className="mt-1"
                  loadingOmdb={resultado.omdb === undefined}
                />
              </div>
            </div>

            <button
              className="w-full bg-purple-600 text-white font-semibold py-3 rounded-b-xl hover:bg-purple-700 transition-colors cursor-pointer"
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
