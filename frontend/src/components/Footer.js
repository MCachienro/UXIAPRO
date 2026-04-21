const FOOTER_LOGOS = [
  {
    name: 'Generalitat de Catalunya',
    href: 'https://sites.google.com/xtec.cat/proyectos-de-innovacion/inicio',
    image: '/logos/logo-generalitat.png',
  },
  {
    name: 'Ministerio de Educacion y FP',
    href: 'https://www.boe.es/boe/dias/2023/09/01/pdfs/BOE-B-2023-24805.pdf',
    image: '/logos/logo-ministerio-fp.png',
  },
];

function Footer() {
  return (
    <footer className="mt-auto border-t border-emerald-100/80 bg-white/80 py-3 backdrop-blur-sm sm:py-5">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-6">
        <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:mb-4 sm:text-xs sm:tracking-[0.16em]">
          Programa InnovaFP - Entitats financiadores
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          {FOOTER_LOGOS.map((logo) => (
            <a
              key={logo.name}
              href={logo.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-16 items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-24 sm:rounded-xl sm:p-2"
              aria-label={logo.name}
            >
              <img
                src={logo.image}
                alt={logo.name}
                className="h-9 w-full object-contain sm:h-16"
                loading="lazy"
                decoding="async"
              />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
