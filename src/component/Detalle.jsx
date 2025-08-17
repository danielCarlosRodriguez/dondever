import { useEffect, useState, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import RatingGrid from "./RatingGrid";

const Detalle = ({ item, onBack }) => {
  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
  const type = item.media_type === "movie" ? "movie" : "tv";

  const [cast, setCast] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // ✅ Helpers estables (useCallback) para no romper exhaustiveness
  const getProviderLogo = useCallback(
    async (id, typeStr) => {
      try {
        const { data } = await axios.get(
          `https://api.themoviedb.org/3/${typeStr}/${id}/watch/providers?api_key=${API_KEY}`
        );
        const r = data?.results ?? {};
        return (
          r.UY?.flatrate?.[0]?.logo_path ??
          r.AR?.flatrate?.[0]?.logo_path ??
          null
        );
      } catch {
        return null;
      }
    },
    [API_KEY]
  );

  const enrichWithProviders = useCallback(
    async (itemsArr, typeStr) => {
      return Promise.all(
        itemsArr.map(async (it) => {
          const proveedor = await getProviderLogo(it.id, typeStr);
          return { ...it, proveedor };
        })
      );
    },
    [getProviderLogo]
  );

  useEffect(() => {
    let active = true;

    const fetchExtra = async () => {
      setLoading(true);
      setErr(null);
      try {
        const [creditsRes, similarRes, recsRes] = await Promise.all([
          axios.get(
            `https://api.themoviedb.org/3/${type}/${item.id}/credits?api_key=${API_KEY}&language=es-ES`
          ),
          axios.get(
            `https://api.themoviedb.org/3/${type}/${item.id}/similar?api_key=${API_KEY}&language=es-ES&page=1`
          ),
          axios.get(
            `https://api.themoviedb.org/3/${type}/${item.id}/recommendations?api_key=${API_KEY}&language=es-ES&page=1`
          ),
        ]);

        if (!active) return;

        const topCast = (creditsRes.data?.cast ?? [])
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
          .slice(0, 8);

        const rawSimilar = (similarRes.data?.results ?? []).slice(0, 12);
        const rawRecs = (recsRes.data?.results ?? []).slice(0, 12);

        const [simWithProv, recsWithProv] = await Promise.all([
          enrichWithProviders(rawSimilar, type),
          enrichWithProviders(rawRecs, type),
        ]);

        setCast(topCast);
        setSimilar(simWithProv);
        setRecs(recsWithProv);
      } catch (e) {
        if (!active) return;
        setErr("No se pudieron cargar detalles adicionales.");
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (item?.id && API_KEY) {
      fetchExtra();
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [item?.id, type, API_KEY, enrichWithProviders]); // ✅ incluye enrichWithProviders

  const title = item.title || item.name;
  const date = item.release_date || item.first_air_date || "N/A";

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-10">
      <button
        onClick={onBack}
        className="group relative mb-6 text-purple-700 font-medium hover:text-purple-800 focus:outline-none"
        aria-label="Volver"
        title="Volver"
      >
        <span className="inline-flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver
        </span>
        <span className="block h-[2px] w-0 bg-purple-700 transition-all duration-200 group-hover:w-full"></span>
      </button>

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Imagen */}
        <img
          className="w-72 h-auto rounded-lg shadow-md self-start"
          src={
            item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : "https://via.placeholder.com/500x750?text=Sin+Imagen"
          }
          alt={title}
        />

        {/* Info */}
        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-2">{title}</h2>
          {item.tagline && (
            <p className="text-lg text-gray-600 italic mb-2">{item.tagline}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700 mb-4">
            <p>
              <strong>Fecha:</strong> {date}
            </p>
            <p>
              <strong>Tipo:</strong> {item.media_type}
            </p>
          </div>

          <p className="text-gray-800 mb-4 leading-relaxed">
            <strong>Descripción:</strong> {item.overview || "Sin descripción"}
          </p>

          {item.proveedor && (
            <div className="mt-3">
              <span className="block text-sm text-gray-500 mb-1">
                Disponible en:
              </span>
              <img
                className="w-16 h-16 object-contain"
                src={`https://image.tmdb.org/t/p/original${item.proveedor}`}
                alt="Proveedor"
              />
            </div>
          )}

          {/* RatingGrid (IMDb / Rotten / Metascore / TMDb / Total) */}
          <div className="mt-4">
            <RatingGrid
              imdb={item.omdb?.imdbRating}
              metascore={item.omdb?.Metascore}
              ratings={item.omdb?.Ratings}
              tmdb={item.vote_average}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Estado de carga / error */}
      {loading && (
        <div className="mt-8 text-center text-sm text-gray-500">
          Cargando reparto y recomendaciones…
        </div>
      )}
      {err && (
        <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {err}
        </div>
      )}

      {/* Reparto principal */}
      {!loading && cast.length > 0 && (
        <CastScroller title="Reparto principal" items={cast} />
      )}

      {/* Similares */}
      {!loading && similar.length > 0 && (
        <SectionScroller title="Similares" items={similar} />
      )}

      {/* Recomendadas */}
      {!loading && recs.length > 0 && (
        <SectionScroller title="Recomendadas" items={recs} />
      )}
    </div>
  );
};

/* ===== Scroller para ACTORES (con flechas) ===== */
function CastScroller({ title, items }) {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 0);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [items]);

  const scrollByAmount = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.min(320, el.clientWidth * 0.9);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section className="mt-10">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>

      <div className="relative">
        {/* IZQ */}
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          disabled={!canLeft}
          aria-label="Desplazar a la izquierda"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 
                     bg-white/80 backdrop-blur border shadow rounded-full p-2
                     hover:bg-white disabled:opacity-40 disabled:pointer-events-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* DER */}
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          disabled={!canRight}
          aria-label="Desplazar a la derecha"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 
                     bg-white/80 backdrop-blur border shadow rounded-full p-2
                     hover:bg-white disabled:opacity-40 disabled:pointer-events-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Fades */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white to-transparent rounded-l-lg" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent rounded-r-lg" />

        {/* Track */}
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth
                     snap-x snap-mandatory
                     scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
                     [scrollbar-width:thin]"
        >
          {items.map((actor) => (
            <div
              key={actor.cast_id ?? `${actor.id}-${actor.credit_id}`}
              className="min-w-[140px] bg-gray-50 rounded-lg shadow-sm p-3 snap-start"
            >
              <img
                className="w-28 h-28 object-cover rounded-md mx-auto mb-2"
                src={
                  actor.profile_path
                    ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                    : "https://via.placeholder.com/185x278?text=Sin+Foto"
                }
                alt={actor.name}
              />
              <p className="text-sm font-medium text-gray-900 text-center">
                {actor.name}
              </p>
              {actor.character && (
                <p className="text-xs text-gray-600 text-center">
                  como {actor.character}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== Scroller para SIMILARES/RECOMENDADAS (con flechas y proveedor) ===== */
function SectionScroller({ title, items }) {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 0);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [items]);

  const scrollByAmount = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.min(320, el.clientWidth * 0.9);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section className="mt-10">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>

      <div className="relative">
        {/* IZQ */}
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          disabled={!canLeft}
          aria-label="Desplazar a la izquierda"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 
                     bg-white/80 backdrop-blur border shadow rounded-full p-2
                     hover:bg-white disabled:opacity-40 disabled:pointer-events-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* DER */}
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          disabled={!canRight}
          aria-label="Desplazar a la derecha"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 
                     bg-white/80 backdrop-blur border shadow rounded-full p-2
                     hover:bg-white disabled:opacity-40 disabled:pointer-events-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Fades */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white to-transparent rounded-l-lg" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent rounded-r-lg" />

        {/* Track */}
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth
                     snap-x snap-mandatory
                     scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
                     [scrollbar-width:thin]"
        >
          {items.map((it) => (
            <div
              key={it.id}
              className="min-w-[140px] bg-white rounded-lg shadow hover:shadow-md transition-shadow snap-start"
            >
              <img
                className="w-36 h-52 object-cover rounded-t-lg"
                src={
                  it.poster_path
                    ? `https://image.tmdb.org/t/p/w300${it.poster_path}`
                    : "https://via.placeholder.com/300x450?text=Sin+Imagen"
                }
                alt={it.title || it.name}
              />
              <div className="p-2">
                <p className="text-xs font-medium line-clamp-2">
                  {it.title || it.name}
                </p>

                {/* Rating a la izquierda + Proveedor a la derecha */}
                <div className="mt-1 flex items-center justify-between">
                  {typeof it.vote_average === "number" ? (
                    <p className="text-[11px] text-gray-600">
                      ⭐ {it.vote_average.toFixed(1)}
                    </p>
                  ) : (
                    <span className="text-[11px] text-gray-400">—</span>
                  )}

                  {it.proveedor ? (
                    <img
                      className="w-5 h-5 object-contain"
                      src={`https://image.tmdb.org/t/p/original${it.proveedor}`}
                      alt="Proveedor"
                      title="Proveedor"
                    />
                  ) : (
                    <span className="w-5 h-5" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

SectionScroller.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
};

CastScroller.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Detalle;

Detalle.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    media_type: PropTypes.string.isRequired,
    poster_path: PropTypes.string,
    title: PropTypes.string,
    name: PropTypes.string,
    release_date: PropTypes.string,
    first_air_date: PropTypes.string,
    original_language: PropTypes.string,
    vote_average: PropTypes.number,
    overview: PropTypes.string,
    proveedor: PropTypes.string,
    tagline: PropTypes.string,
    // ✅ agrega validación del bloque OMDb
    omdb: PropTypes.shape({
      imdbRating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      Metascore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      Ratings: PropTypes.arrayOf(
        PropTypes.shape({
          Source: PropTypes.string,
          Value: PropTypes.string,
        })
      ),
    }),
  }).isRequired,
  onBack: PropTypes.func.isRequired,
};
