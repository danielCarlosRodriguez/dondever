// src/component/RatingGrid.jsx
import PropTypes from "prop-types";

export default function RatingGrid({
  imdb,
  rotten,
  metascore,
  tmdb,
  ratings,
  className = "",
  size = "sm",
  loadingOmdb = false, // 👈 NUEVO
}) {
  // ---- Helpers
  const toNumber = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string") {
      const t = v.trim();
      if (!t || t.toUpperCase() === "N/A") return null;
      const n = parseFloat(t.replace(",", ".").replace("%", ""));
      return Number.isNaN(n) ? null : n;
    }
    return null;
  };

  const imdb10 = (() => {
    const n = toNumber(imdb);
    if (n === null) return null;
    return Math.max(0, Math.min(10, n));
  })();
  const imdbPct = imdb10 === null ? null : imdb10 * 10;

  const rottenPct = (() => {
    let n = toNumber(rotten);
    if (n !== null) return Math.max(0, Math.min(100, n));
    const fromRatings =
      Array.isArray(ratings) &&
      ratings.find((r) => r?.Source === "Rotten Tomatoes")?.Value;
    n = toNumber(fromRatings);
    if (n === null) return null;
    return Math.max(0, Math.min(100, n));
  })();

  const metaPct = (() => {
    const n = toNumber(metascore);
    if (n === null) return null;
    return Math.max(0, Math.min(100, n));
  })();

  const tmdb10 = (() => {
    const n = toNumber(tmdb);
    if (n === null) return null;
    return Math.max(0, Math.min(10, n));
  })();
  const tmdbPct = tmdb10 === null ? null : tmdb10 * 10;

  const present = [imdbPct, rottenPct, metaPct, tmdbPct].filter(
    (v) => v !== null
  );
  const totalPct =
    present.length > 0
      ? present.reduce((acc, v) => acc + v, 0) / present.length
      : null;

  // ---- Formato/estilo
  const fmtPct = (v) => (v === null ? "—" : `${Math.round(v)}%`);
  const fmt10 = (v) =>
    v === null ? "—" : (Math.round(v * 10) / 10).toFixed(1);
  const fmt10AndPct = (ten, pct) =>
    ten === null ? (
      "—"
    ) : (
      <span>
        <span className="font-semibold">{fmt10(ten)}</span>
        <span className="mx-1 text-slate-400">|</span>
        <span>{fmtPct(pct)}</span>
      </span>
    );

  const tone = (v) => {
    if (v === null) return "text-gray-400";
    if (v >= 85) return "text-emerald-700";
    if (v >= 70) return "text-purple-700";
    if (v >= 55) return "text-amber-600";
    return "text-rose-600";
  };

  const subColor = "text-slate-600";

  const sizes =
    size === "md"
      ? {
          valueSub: "text-sm",
          valueTotal: "text-lg",
          cell: "py-1",
          logo: "h-7",
        }
      : {
          valueSub: "text-xs",
          valueTotal: "text-sm",
          cell: "py-0.5",
          logo: "h-7",
        };

  const badge = (label) => (
    <span className="inline-flex items-center justify-center font-semibold rounded px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200">
      {label}
    </span>
  );

  const Spinner = () => (
    <span
      className="inline-block h-3 w-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"
      aria-label="Cargando"
    />
  );

  return (
    <div className={`w-full ${className}`}>
      {/* 4 columnas; 3 filas: logos / valores / total */}
      <div className="inline-grid grid-cols-[repeat(4,max-content)] justify-center items-center gap-x-2 md:gap-x-3 gap-y-1 text-center">
        {/* Fila 1: logos */}
        <div className={`${sizes.cell} flex justify-center`}>
          <img
            src="/img/logo-imdb.png"
            alt="IMDb"
            className={`${sizes.logo} w-auto`}
            loading="lazy"
          />
        </div>
        <div className={`${sizes.cell} flex justify-center`}>
          <img
            src="/img/logo-rotten.png"
            alt="Rotten Tomatoes"
            className={`${sizes.logo} w-auto`}
            loading="lazy"
          />
        </div>
        <div className={`${sizes.cell} flex justify-center`}>
          <img
            src="/img/logo-metacritic.png"
            alt="Metacritic"
            className={`${sizes.logo} w-auto`}
            loading="lazy"
          />
        </div>
        <div className={`${sizes.cell} flex justify-center`}>
          <img
            src="/img/logo-tmdb.png"
            alt="TMDb"
            className={`${sizes.logo} w-auto`}
            loading="lazy"
          />
        </div>

        {/* Fila 2: valores */}
        {/* IMDb (muestra 8.3 | 83%) con spinner mientras carga OMDb */}
        <div className={`${sizes.cell} ${subColor} ${sizes.valueSub}`}>
          {loadingOmdb ? <Spinner /> : fmt10AndPct(imdb10, imdbPct)}
        </div>

        {/* Rotten (solo %) con spinner */}
        <div
          className={`${sizes.cell} font-medium ${subColor} ${sizes.valueSub}`}
        >
          {loadingOmdb ? <Spinner /> : fmtPct(rottenPct)}
        </div>

        {/* Metacritic (solo %) con spinner */}
        <div
          className={`${sizes.cell} font-medium ${subColor} ${sizes.valueSub}`}
        >
          {loadingOmdb ? <Spinner /> : fmtPct(metaPct)}
        </div>

        {/* TMDb (muestra 8.3 | 83%) — no depende de OMDb */}
        <div className={`${sizes.cell} ${subColor} ${sizes.valueSub}`}>
          {fmt10AndPct(tmdb10, tmdbPct)}
        </div>

        {/* Fila 3: Total */}
        <div className="col-span-4 flex items-center justify-center gap-2 pt-1">
          {badge("Total")}
          <span className={`font-bold ${tone(totalPct)} ${sizes.valueTotal}`}>
            {fmtPct(totalPct)}
          </span>
        </div>
      </div>
    </div>
  );
}

RatingGrid.propTypes = {
  imdb: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  rotten: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  metascore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tmdb: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ratings: PropTypes.array,
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md"]),
  loadingOmdb: PropTypes.bool, // 👈 NUEVO
};
