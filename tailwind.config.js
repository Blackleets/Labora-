/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './index.tsx', './App.tsx', './components/**/*.{ts,tsx}', './contexts/**/*.{ts,tsx}', './modules/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        ghibli: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif']
      },
      colors: {
        ghibli: {
          forest: 'var(--ghibli-forest, #2E5A44)',
          deepforest: 'var(--ghibli-deepforest, #213B2F)',
          moss: 'var(--ghibli-moss, #3B7258)',
          meadow: 'var(--ghibli-meadow, #4E7A60)',
          sage: 'var(--ghibli-sage, #5E8271)',
          softgreen: 'var(--ghibli-softgreen, #EBF3ED)',
          bordergreen: 'var(--ghibli-bordergreen, #D0E5D7)',
          clay: 'var(--ghibli-clay, #C96846)',
          terracotta: 'var(--ghibli-terracotta, #D97757)',
          warmearth: 'var(--ghibli-warmearth, #FAF3EE)',
          borderclay: 'var(--ghibli-borderclay, #EAD6C9)',
          amber: 'var(--ghibli-amber, #D9943B)',
          gold: 'var(--ghibli-gold, #B87A24)',
          softamber: 'var(--ghibli-softamber, #FEF7EB)',
          borderamber: 'var(--ghibli-borderamber, #FDE3B8)',
          sky: 'var(--ghibli-sky, #3A7596)',
          slateazure: 'var(--ghibli-slateazure, #4A6D7C)',
          softblue: 'var(--ghibli-softblue, #F2F7F9)',
          bordersky: 'var(--ghibli-bordersky, #D5E3E8)',
          cream: 'var(--ghibli-canvas, #FAF7F2)',
          parchment: 'var(--ghibli-parchment, #FAF6EE)',
          card: 'var(--ghibli-card, #FCFAF7)',
          border: 'var(--ghibli-border-subtle, #EBE3D5)',
          warmborder: 'var(--ghibli-border, #E8DFC8)'
        }
      }
    }
  },
  plugins: []
};
