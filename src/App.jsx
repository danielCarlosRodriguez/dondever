import Formulario from "./component/Formulario";

function App() {
  return (
    <>
      <div className="container mx-auto pb-5 ">
        <div className="mt-2 mb-3 flex justify-center">
          <img
            src="/img/logo-donde-ver.png"
            alt="¿Dónde ver?"
            className="h-26 md:h-40 w-auto drop-shadow-sm"
            loading="lazy"
          />
        </div>

        <Formulario />

        <footer className="mt-10 border-t pt-4 text-sm text-gray-600 mx-5">
          <div className="flex items-center justify-between ">
            <span>dondever v2</span>
            <span>By elBoli</span>
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;
