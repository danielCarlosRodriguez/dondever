import React, { useState, useEffect } from "react";
import axios from "axios";

const Formulario = () => {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [proveedoresMovie, setProveedoresMovie] = useState("");
  const [proveedoresTV, setProveedoresTV] = useState("");

  useEffect(() => {
    const obtenerProveedorMovie = async (id) => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=8f6a5f014b0051324d16cacd208d3599`
        );
        setProveedoresMovie(response.data.results.AR.flatrate[0].logo_path);
        console.log(response.data.results.AR.flatrate[0].logo_path);
      } catch (error) {
        console.error(error);
      }
    };

    const obtenerProveedorTV = async (id) => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/tv/${id}/watch/providers?api_key=8f6a5f014b0051324d16cacd208d3599`
        );
        setProveedoresTV(response.data.results.AR.flatrate[0].logo_path);
        console.log(response.data.results.AR.flatrate[0].logo_path);
      } catch (error) {
        console.error(error);
      }
    };

    const obtenerResultados = async () => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/search/multi?api_key=8f6a5f014b0051324d16cacd208d3599&language=en-US&query=${texto}&page=1&include_adult=false`
        );
        setResultados(response.data.results);

        if (response.data.results.length > 0) {
          obtenerProveedorMovie(response.data.results[0].id);
          obtenerProveedorTV(response.data.results[0].id);
        }
      } catch (error) {
        console.error(error);
      }
    };

    obtenerResultados();
  }, [texto]);

  return (
    <div>
      <form>
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </form>
      <div className="row mb-3">
        <div className="card-deck d-flex flex-wrap justify-content-center mt-5">
          {resultados.map((resultado, index) => (
            <React.Fragment key={index}>
              {resultado.media_type !== "person" && (
                <div
                  className="card me-3 mb-3"
                  style={{ width: "300px" }}
                  key={resultado.id}
                >
                  <img
                    style={{ width: "100%" }}
                    src={`https://image.tmdb.org/t/p/w500${resultado.poster_path}`}
                    className="card-img-top"
                    alt={resultado.title}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{resultado.title}</h5>

                    <div className="row">
                      <div className="col-8">
                        {resultado.release_date && (
                          <>
                            <span className="card-text">
                              Fecha: {resultado.release_date}
                            </span>{" "}
                            <br />
                          </>
                        )}
                        {resultado.first_air_date && (
                          <>
                            <span className="card-text">
                              Fecha: {resultado.first_air_date}
                            </span>
                            <br />
                          </>
                        )}
                        {typeof resultado.vote_average === "number" ? (
                          <>
                            <span className="card-text">
                              Imdb: &#11088; {resultado.vote_average.toFixed(1)}
                            </span>
                            <br />
                          </>
                        ) : (
                          <>
                            <span className="card-text">
                              Imdb: &#11088; {resultado.vote_average}
                            </span>
                            <br />
                          </>
                        )}
                        <p className="card-text">
                          Tipo: {resultado.media_type}
                        </p>
                      </div>
                      <div className="col-4">
                        {resultado.media_type === "movie" &&
                          proveedoresMovie && (
                            <img
                              style={{ width: "50px" }}
                              alt="Proveedor"
                              src={`https://image.tmdb.org/t/p/original/${proveedoresMovie}`}
                            />
                          )}

                        {resultado.media_type !== "movie" && proveedoresTV && (
                          <img
                            style={{ width: "50px" }}
                            alt="Proveedor"
                            src={`https://image.tmdb.org/t/p/original/${proveedoresTV}`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Formulario;
