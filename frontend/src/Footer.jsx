export default function Footer() {
  return (
    <footer className="w-full bg-gray-100 border-t mt-10 py-6">
      
      <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center">

        {/* Generalitat / InnovaFP */}
        <a
          href="https://sites.google.com/xtec.cat/proyectos-de-innovacion/inicio"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/3f/Generalitat_de_Catalunya_logo.svg"
            alt="Generalitat - InnovaFP"
            className="h-12 md:h-16 object-contain transition hover:scale-105"
          />
        </a>

        {/* Ministerio */}
        <a
          href="https://www.boe.es/boe/dias/2023/09/01/pdfs/BOE-B-2023-24805.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/99/Logo_del_Ministerio_de_Educaci%C3%B3n_y_Formaci%C3%B3n_Profesional.svg"
            alt="Ministerio Educación y FP"
            className="h-12 md:h-16 object-contain transition hover:scale-105"
          />
        </a>

      </div>
    </footer>
  );
}
