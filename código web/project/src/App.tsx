import React, { useState, useEffect, FormEvent } from 'react';
import { ChevronDown, Instagram, Menu, X, Search } from 'lucide-react';

function App(): JSX.Element {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('home');
  const [showThanks, setShowThanks] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timeOnPage, setTimeOnPage] = useState<number>(Date.now());

  const clearHighlights = (): void => {
    document.querySelectorAll('mark.page-highlight').forEach((m) => {
      const parent = m.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(m.textContent || ''), m);
      parent.normalize();
    });
  };

  useEffect(() => {
    const handleScroll = (): void => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setTimeOnPage(Date.now());
  }, []);

  const scrollToSection = (sectionId: string): void => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSearch = (q: string): void => {
    const query = q.trim();
    clearHighlights();
    if (!query) return;

    const pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(pattern, 'gi');

    const container = document.querySelector('main') || document.body;
    const blockTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'NAV', 'FOOTER']);

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node: Node): number => {
          const p = node.parentNode as HTMLElement | null;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (blockTags.has(p.tagName)) return NodeFilter.FILTER_REJECT;
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let firstMark: HTMLElement | null = null;

    const wrapRange = (textNode: Text, start: number, end: number): HTMLElement => {
      const range = document.createRange();
      range.setStart(textNode, start);
      range.setEnd(textNode, end);
      const mark = document.createElement('mark');
      mark.className = 'page-highlight';
      range.surroundContents(mark);
      return mark as HTMLElement;
    };

    const jobs: Array<() => void> = [];

    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const value = node.nodeValue!;
      let m: RegExpExecArray | null;
      regex.lastIndex = 0;
      const matches: Array<{ s: number; e: number }> = [];
      while ((m = regex.exec(value)) !== null) {
        matches.push({ s: m.index, e: m.index + m[0].length });
        if (m.index === regex.lastIndex) regex.lastIndex++;
      }
      if (matches.length) {
        jobs.push(() => {
          for (let i = matches.length - 1; i >= 0; i--) {
            const { s, e } = matches[i];
            const mark = wrapRange(node, s, e);
            if (!firstMark) firstMark = mark;
          }
        });
      }
    }

    jobs.forEach((fn) => fn());

    if (firstMark) {
      firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Función mejorada para el envío del formulario con tipos TypeScript
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    // Verificar tiempo mínimo en la página (anti-bot)
    const timeSpent = Date.now() - timeOnPage;
    if (timeSpent < 3000) { // Menos de 3 segundos
      console.log('Envío muy rápido, posible bot');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      
      // Verificar honeypot
      if (formData.get('bot-field') || formData.get('website') || formData.get('email-confirm') || formData.get('phone-check')) {
        console.log('Bot detectado por honeypot');
        setIsSubmitting(false);
        return;
      }
      
      // Añadir datos adicionales para análisis
      formData.set('form-name', 'waitlist');
      formData.set('timestamp', new Date().toISOString());
      formData.set('timeOnPage', timeSpent.toString());
      
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData as any).toString(),
      });
      
      if (response.ok) {
        setShowThanks(true);
      } else {
        throw new Error('Error en el envío');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al enviar el formulario. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSearch(search);
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    }
  };

  const handleSearchClick = (): void => {
    handleSearch(search);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const handleCopyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText('Apúntate a esto, ¡te va a encantar! Hay regalito si te apuntas ahora. https://tesela40.es');
      alert('¡Enlace copiado! Ya puedes compartirlo en Instagram o donde quieras.');
    } catch (error) {
      console.error('Error al copiar:', error);
      alert('No se pudo copiar el enlace. Inténtalo manualmente.');
    }
  };

  if (showThanks) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#a2a183',
        color: '#a2a183',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '20px',
          background: 'rgba(239, 235, 224, 0.8)',
          padding: '60px 40px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <p style={{fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '40px'}}>
            ¡Gracias por unirte a Tesela 40! ¡Nuestras novedades llegarán pronto a tu buzón!
          </p>
          <h1 style={{fontFamily: 'Dancing Script, cursive', fontSize: '3rem', margin: '30px 0 20px 0', fontWeight: 600}}>
            María y Rita
          </h1>
          <img src="/Recurso 6.svg" alt="Tesela 40 Logo" style={{height: '40px', width: 'auto', margin: '20px auto', display: 'block'}} />
          <p style={{fontSize: '1.1rem', marginBottom: '20px', fontWeight: 400, margin: '20px 0'}}>
            Comparte e inspira a otros a encontrar la magia del regalo perfecto.
          </p>
          <div style={{marginTop: '40px'}}>
            <div style={{display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap'}}>
              <a href="https://wa.me/?text=Apúntate%20a%20esto,%20¡te%20va%20a%20encantar!%20Hay%20regalito%20si%20te%20apuntas%20ahora.%20https://tesela40.es" 
                 target="_blank" rel="noopener noreferrer"
                 style={{background: '#bf7969', color: '#efebe0', padding: '12px 20px', border: '2px solid #efebe0', borderRadius: '10px', textDecoration: 'none', fontWeight: 600}}>
                <span style={{display: 'inline-flex', alignItems: 'center'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" style={{marginRight: '8px'}}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.325"/>
                  </svg>
                  WhatsApp
                </span>
              </a>
              <a href="mailto:?subject=Te%20va%20a%20encantar%20Tesela%2040&body=Apúntate%20a%20esto,%20¡te%20va%20a%20encantar!%20Hay%20regalito%20si%20te%20apuntas%20ahora.%20https://tesela40.es"
                 style={{background: '#bf7969', color: '#efebe0', padding: '12px 20px', border: '2px solid #efebe0', borderRadius: '10px', textDecoration: 'none', fontWeight: 600}}>
                💌 Email
              </a>
              <button onClick={handleCopyLink}
                style={{background: '#bf7969', color: '#efebe0', padding: '12px 20px', border: '2px solid #efebe0', borderRadius: '10px', fontWeight: 600, cursor: 'pointer'}}>
                🔗 Copiar enlace
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#a2a183] text-[#efebe0]" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '300', letterSpacing: '0.025em' }}>
      {/* Sticky Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-[#efebe0] transition-all duration-300 ${
        isScrolled ? 'shadow-lg' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/Recurso 6.svg" 
                alt="Tesela 40" 
                className="h-8 w-auto ml-4"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('about')}
                className="text-[#bf7969] font-bold hover:text-[#bf7969]/80 transition-colors duration-200"
              >
                Sobre nosotras
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-[#bf7969] font-bold hover:text-[#bf7969]/80 transition-colors duration-200"
              >
                Contacto
              </button>
              
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-4 py-2 rounded-lg bg-white/10 text-[#bf7969] placeholder-[#bf7969]/60 focus:outline-none focus:ring-2 focus:ring-[#bf7969] w-48"
                  aria-label="Buscar en la página"
                />
                <button
                  type="button"
                  onClick={handleSearchClick}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1"
                  aria-label="Buscar"
                  title="Buscar"
                >
                  <Search className="text-[#bf7969] w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-[#bf7969] hover:text-[#bf7969]/80 transition-colors duration-200"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-[#efebe0] border-t border-[#bf7969]/20">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {/* Mobile Search Bar */}
                <div className="relative px-3 py-2">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { 
                      if (e.key === 'Enter') { 
                        handleSearch(search); 
                        setIsMobileMenuOpen(false); 
                      } 
                    }}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 text-[#bf7969] placeholder-[#bf7969]/60 focus:outline-none focus:ring-2 focus:ring-[#bf7969]"
                    aria-label="Buscar en la página"
                  />
                  <button
                    type="button"
                    onClick={() => { handleSearch(search); setIsMobileMenuOpen(false); }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-1"
                    aria-label="Buscar"
                    title="Buscar"
                  >
                    <Search className="text-[#bf7969] w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => scrollToSection('about')}
                  className="block w-full text-left px-3 py-2 text-[#bf7969] font-bold hover:text-[#bf7969]/80 transition-colors duration-200"
                >
                  Sobre nosotras
                </button>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="block w-full text-left px-3 py-2 text-[#bf7969] font-bold hover:text-[#bf7969]/80 transition-colors duration-200"
                >
                  Contacto
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <style>
        {`
          mark.page-highlight {
            background: #d9a05b66;
            color: inherit;
            padding: 0 .1em;
            border-radius: .2em;
          }

          #about strong {
            font-weight: 800;
          }
        `}
      </style>
      
      <main>
        {/* Hero Section */}
        <section id="home" className="pt-20 min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo Image */}
            <div className="mb-8">
              <img 
                src="/Recurso 3.svg" 
                alt="Tesela 40 Logo" 
                className="mx-auto h-8 sm:h-10 md:h-12 w-auto"
              />
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Tesela 40
            </h1>
            
            <h2 className="text-xl sm:text-2xl md:text-3xl mb-8" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Artesanía contemporánea que cuenta historias
            </h2>

            <p className="text-lg sm:text-xl mb-8" style={{ color: '#efebe0' }}>
              <span style={{ color: '#d9a05b' }}>✨</span> Estamos afinando los últimos detalles...
            </p>

            <div className="mb-8">
              <button
                onClick={() => scrollToSection('waitlist')}
                className="bg-[#bf7969] text-[#efebe0] border border-[#efebe0] px-8 py-4 rounded-lg font-semibold hover:bg-[#bf7969]/90 transition-all duration-300 transform hover:scale-105"
              >
                <div>¡Unirme a la lista de espera ya!</div>
                <div className="text-xs mt-1 opacity-90">Y recibir un detalle especial en el primer pedido</div>
              </button>
            </div>

            {/* Scroll Arrow */}
            <div className="text-center mt-2">
              <button
                onClick={() => window.scrollBy({ top: 400, behavior: 'smooth' })}
                className="animate-bounce hover:text-[#efebe0]/80 transition-colors duration-200"
              >
                <ChevronDown size={32} />
              </button>
            </div>

            <div className="space-y-4 text-base sm:text-lg mt-6">
              <p className="text-lg sm:text-xl">Regalar algo bonito no debería ser complicado.</p>
              <p className="text-lg sm:text-xl">Encontrar algo auténtico, tampoco.</p>
              
              <div className="bg-[#efebe0]/60 p-6 rounded-full backdrop-blur-sm max-w-2xl mx-auto">
                <p className="space-y-4 text-base sm:text-lg mb-2 text-[#a2a183]">Regalos artesanales únicos:</p>
                <p className="text-base sm:text-lg font-bold mb-4 text-[#a2a183]">Flores preservadas, cerámica, aromas, gastronomía y más.</p>
                <p className="text-base sm:text-lg text-[#a2a183]">
                  Creamos combinaciones personalizadas y packs listos para enviar sin complicaciones.
                </p>
              </div>
            </div>
          </div>

          {/* Scroll Arrow */}
          <button
            onClick={() => scrollToSection('waitlist')}
            className="mt-12 animate-bounce hover:text-[#efebe0]/80 transition-colors duration-200"
          >
            <ChevronDown size={32} />
          </button>
        </section>

        {/* Decorative Border */}
        <div className="py-8 overflow-hidden">
          <div className="flex justify-center">
            <div className="flex space-x-4">
              {[...Array(20)].map((_, i) => (
                <img 
                  key={i}
                  src="/Recurso 13.svg" 
                  alt="" 
                  className="h-8 w-8"
                />
              ))}
            </div>
          </div>
        </div>

        {/* FORMULARIO MEJORADO CON TYPESCRIPT */}
        <section id="waitlist" className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <form
              name="waitlist"
              method="POST"
              action="/"
              data-netlify="true"
              data-netlify-recaptcha="true"
              netlify-honeypot="bot-field"
              className="space-y-8 bg-[#efebe0]/80 p-8 rounded-lg backdrop-blur-sm"
              onSubmit={handleSubmit}
            >
              {/* Honeypot mejorado - múltiples campos ocultos */}
              <div className="hidden" aria-hidden="true">
                <label>
                  No rellenar si eres humano:
                  <input type="text" name="bot-field" autoComplete="off" tabIndex={-1} />
                </label>
                <input type="text" name="website" autoComplete="off" tabIndex={-1} />
                <input type="email" name="email-confirm" autoComplete="off" tabIndex={-1} />
                <input type="tel" name="phone-check" autoComplete="off" tabIndex={-1} />
              </div>

              {/* Campo oculto obligatorio para Netlify */}
              <input type="hidden" name="form-name" value="waitlist" />
              
              <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-[#a2a183]" style={{ fontFamily: 'Dancing Script, cursive' }}>
                Descubre antes que nadie nuestras combinaciones artesanales únicas
              </h3>

              <div>
                <label htmlFor="nombre" className="block text-sm font-medium mb-2 text-[#a2a183]">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="Nombre"
                  required
                  minLength={2}
                  maxLength={50}
                  className="w-full px-4 py-2 rounded-lg bg-white text-[#a2a183] placeholder-[#a2a183]/60 focus:outline-none focus:ring-2 focus:ring-[#bf7969]"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#a2a183]">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="Email"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white text-[#a2a183] placeholder-[#a2a183]/60 focus:outline-none focus:ring-2 focus:ring-[#bf7969]"
                />
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium mb-2 text-[#a2a183]">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="Teléfono"
                  maxLength={15}
                  className="w-full px-4 py-2 rounded-lg bg-white text-[#a2a183] placeholder-[#a2a183]/60 focus:outline-none focus:ring-2 focus:ring-[#bf7969]"
                />
              </div>

              <div>
                <label htmlFor="ideas" className="block text-sm font-medium mb-2 text-[#a2a183]">
                  Cuéntanos tus ideas
                </label>
                <textarea
                  id="ideas"
                  name="Ideas"
                  rows={4}
                  maxLength={500}
                  placeholder="Me encantaría ver productos como…"
                  className="w-full px-4 py-2 rounded-lg bg-white text-[#a2a183] placeholder-[#a2a183]/60 focus:outline-none focus:ring-2 focus:ring-[#bf7969] resize-none"
                />
              </div>

              <div>
                <label htmlFor="regalo" className="block text-sm font-medium mb-2 text-[#a2a183]">
                  ¿Buscas un regalo personalizado o para un evento único?
                </label>
                <textarea
                  id="regalo"
                  name="Regalo personalizado"
                  rows={4}
                  maxLength={500}
                  placeholder="Describe tu idea para un regalo especial…"
                  className="w-full px-4 py-2 rounded-lg bg-white text-[#a2a183] placeholder-[#a2a183]/60 focus:outline-none focus:ring-2 focus:ring-[#bf7969] resize-none"
                />
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="rgpd"
                  name="Acepta RGPD"
                  required
                  className="mt-1 w-4 h-4 text-[#bf7969] bg-white border-gray-300 rounded focus:ring-[#bf7969] focus:ring-2"
                />
                <label htmlFor="rgpd" className="text-sm text-[#a2a183]">
                  Acepto el tratamiento de mis datos para recibir información comercial de Tesela 40.
                </label>
              </div>

              {/* reCAPTCHA de Netlify - solo funciona en producción */}
              <div data-netlify-recaptcha="true" className="flex justify-center" />

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 transform ${
                  isSubmitting 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed scale-100' 
                    : 'bg-[#bf7969] text-[#efebe0] border border-[#efebe0] hover:bg-[#bf7969]/90 hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  '¡Unirme a la lista de espera ya!'
                )}
              </button>
            </form>
          </div>

          {/* Scroll Arrow */}
          <div className="text-center mt-12">
            <button
              onClick={() => scrollToSection('about')}
              className="animate-bounce hover:text-[#efebe0]/80 transition-colors duration-200"
            >
              <ChevronDown size={32} />
            </button>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-bold text-center mb-12" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Sobre nosotras
            </h3>
            
            <div className="space-y-6 text-base sm:text-lg leading-relaxed">
              <p>
                Tesela 40 nace de la pasión por la <strong>artesanía con una mirada contemporánea</strong> y el deseo de <strong>crear experiencias únicas</strong> a través de <strong>regalos cuidadosamente seleccionados</strong>. Y que, por fin, sea fácil regalar algo auténtico, original y bonito.
              </p>
              
              <p>
                Somos <strong>María</strong> y <strong>Rita</strong>, ratón de campo y ratón de ciudad. De Husillos (Palencia) a Barcelona, uniéndonos en Bilbao, una estudió cómo sembrar el campo, la otra cómo cultivar ideas. El <strong>arte y la naturaleza están presentes en todo lo que hacemos</strong>.
              </p>
              
              <p>
                Cada pieza de nuestras futuras colecciones cuenta una historia, conectando el trabajo de artesanos locales con momentos especiales en tu vida.
              </p>
              
              <p>
                <strong>Creemos en la belleza de lo hecho a mano y en el poder de los pequeños detalles para transformar lo cotidiano en extraordinario</strong>.
              </p>
              
              <div className="text-center pt-8">
                <p className="mb-6">
                  ¿Tienes curiosidad por saber lo que haremos? Únete a nuestra lista de espera, ¡falta poco!
                </p>
                <button
                  onClick={() => scrollToSection('waitlist')}
                  className="bg-[#bf7969] text-[#efebe0] border border-[#efebe0] px-8 py-3 rounded-lg font-semibold hover:bg-[#bf7969]/90 transition-all duration-300 transform hover:scale-105"
                >
                  ¡Unirme a la lista de espera ya!
                </button>
              </div>
            </div>
          </div>

          {/* Scroll Arrow */}
          <div className="text-center mt-12">
            <button
              onClick={() => scrollToSection('contact')}
              className="animate-bounce hover:text-[#efebe0]/80 transition-colors duration-200"
            >
              <ChevronDown size={32} />
            </button>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-3xl sm:text-4xl font-bold mb-12" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Contacto
            </h3>
            
            <div className="space-y-8">
              <div>
                <a 
                  href="mailto:info@tesela40.es"
                  className="text-xl sm:text-2xl hover:text-[#efebe0]/80 transition-colors duration-200 underline decoration-[#d9a05b] underline-offset-4"
                >
                  info@tesela40.es
                </a>
              </div>
              
              <div className="flex items-center justify-center space-x-3">
                <Instagram size={24} className="text-[#efebe0]" />
                <a 
                  href="https://www.instagram.com/tesela_40/#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg sm:text-xl hover:text-[#efebe0]/80 transition-colors duration-200 underline decoration-[#d9a05b] underline-offset-4"
                >
                  Únete al universo Tesela 40 en Instagram
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm opacity-60">
        <p>&copy; 2025 Tesela 40. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default App;