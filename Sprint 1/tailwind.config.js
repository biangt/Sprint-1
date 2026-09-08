/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind escanea estos archivos buscando clases para generar el CSS.
  // Si esta lista no incluye tus vistas .ejs, Tailwind no "ve" las clases
  // que usás ahí y termina generando un CSS vacío (la causa más común de
  // "Tailwind no funciona").
  content: ['./src/views/**/*.ejs'],
  // Red de seguridad: estas clases se generan a mano en @layer components
  // (no son utilidades de Tailwind), así que las forzamos a existir aunque
  // el escaneo de contenido no encuentre el nombre completo y literal en
  // algún .ejs (por ejemplo si alguien vuelve a armar una clase con
  // concatenación de texto en vez de un ternario completo).
  safelist: ['btn--primary', 'btn--secondary'],
  theme: {
    extend: {
      // Mismos tokens que ya habíamos sacado de Figma, ahora como
      // configuración de Tailwind en vez de variables CSS sueltas.
      colors: {
        bg: '#EFEFEF',
        surface: '#FFFFFF',
        primary: '#0CB093',
        dark: '#494F51',
        border: '#CCCCCC',
      },
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
      },
      boxShadow: {
        card: '0px 4px 8px 0px rgba(0, 0, 0, 0.25)',
        menu: '0px 0px 8px 0px rgba(0, 0, 0, 0.25)',
      },
      spacing: {
        lg: '128px', // margen lateral de sección en Desktop (1280px)
      },
    },
  },
  plugins: [],
};
