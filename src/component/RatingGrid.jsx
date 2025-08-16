// src/component/RatingGrid.jsx
import PropTypes from "prop-types";

export default function RatingGrid({
  imdb,
  rotten,
  metascore,
  ratings,
  className = "",
  size = "sm",
}) {
  // ---- Helpers
  const toNumber = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (!trimmed || trimmed.toUpperCase() === "N/A") return null;
      const n = parseFloat(trimmed.replace(",", ".").replace("%", ""));
      return Number.isNaN(n) ? null : n;
    }
    return null;
  };

  const imdbPct = (() => {
    const n = toNumber(imdb);
    if (n === null) return null;
    return Math.max(0, Math.min(10, n)) * 10; // 0..10 -> %
  })();

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
    return Math.max(0, Math.min(100, n)); // ya está en 0..100
  })();

  const present = [imdbPct, rottenPct, metaPct].filter((v) => v !== null);
  const totalPct =
    present.length > 0
      ? present.reduce((acc, v) => acc + v, 0) / present.length
      : null;

  // ---- Formato y colores
  const fmt = (v) => (v === null ? "—" : `${Math.round(v)}%`);
  const tone = (v) => {
    if (v === null) return "text-gray-400";
    if (v >= 85) return "text-emerald-700";
    if (v >= 70) return "text-purple-700";
    if (v >= 55) return "text-amber-600";
    return "text-rose-600";
  };

  // 🔧 color fijo para los valores individuales (IMDb/Rotten/MC)
  const subColor = "text-slate-600";

  // 🔧 tamaños separados para “sub” (individuales) y “total”
  const sizes =
    size === "md"
      ? {
          valueSub: "text-sm",
          valueTotal: "text-lg",
          gap: "gap-3",
          cell: "py-1",
          logo: "h-8",
        }
      : {
          valueSub: "text-xs",
          valueTotal: "text-sm",
          gap: "gap-2",
          cell: "py-0.5",
          logo: "h-8",
        };

  const badge = (label) => (
    <span className="inline-flex items-center justify-center font-semibold rounded px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200">
      {label}
    </span>
  );

  return (
    <div className={`w-full ${className}`}>
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
        <div className={`${sizes.cell}`}>{badge("Total")}</div>

        {/* Fila 2: valores */}
        <div
          className={`${sizes.cell} font-medium ${subColor} ${sizes.valueSub}`}
        >
          {fmt(imdbPct)}
        </div>
        <div
          className={`${sizes.cell} font-medium ${subColor} ${sizes.valueSub}`}
        >
          {fmt(rottenPct)}
        </div>
        <div
          className={`${sizes.cell} font-medium ${subColor} ${sizes.valueSub}`}
        >
          {fmt(metaPct)}
        </div>
        <div
          className={`${sizes.cell} font-bold ${tone(totalPct)} ${
            sizes.valueTotal
          }`}
        >
          {fmt(totalPct)}
        </div>
      </div>
    </div>
  );
}

RatingGrid.propTypes = {
  imdb: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  rotten: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  metascore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ratings: PropTypes.array,
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md"]),
};
