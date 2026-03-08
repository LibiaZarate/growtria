const fs = require('fs');

let css = `@import "tailwindcss";

@theme {
  --color-indigo-50: #FAF4EB;
  --color-indigo-100: #F3E8DB;
  --color-indigo-200: #EBCDBC;
  --color-indigo-300: #E4B29C;
  --color-indigo-400: #DF9B7F;
  --color-indigo-500: #DB805E;
  --color-indigo-600: #D86B45;
  --color-indigo-700: #BA5431;

  --color-gray-50: #F6F4EF;
  --color-gray-100: #EDE9E1;
  --color-gray-200: #DCD6C9;
  --color-gray-300: #C2BAAA;
  --color-gray-400: #A89D8B;
  --color-gray-500: #887C68;
  --color-gray-600: #685A48;
  --color-gray-700: #4B4134;
  --color-gray-800: #3D352B;
  --color-gray-900: #2E2721;

  --font-sans: "Outfit", "Inter", sans-serif;
  
  --radius-lg: 0px;
  --radius-xl: 0px;
  --radius-2xl: 0px;
  --radius-3xl: 0px;

  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;
  --shadow-xl: none;
}

body {
  @apply bg-gray-50 text-gray-900 font-sans;
}

h1, h2, h3, .uppercase-header {
  @apply tracking-wider uppercase font-light;
}
`;

fs.writeFileSync('src/index.css', css);

let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('Outfit')) {
  html = html.replace('</head>', `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600&display=swap" rel="stylesheet">
  </head>`);
  fs.writeFileSync('index.html', html);
}

let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(/bg-\[\#F9FAFB\]/g, 'bg-gray-50');
app = app.replace(/text-\[\#111827\]/g, 'text-gray-900');
app = app.replace(/text-gray-900/g, 'text-gray-800'); // soften the darks

// Replace heavy shadows and rounded borders by simply stripping them or replacing them with a thin border where appropriate
app = app.replace(/shadow-xl/g, 'border border-gray-200');
app = app.replace(/shadow-lg/g, 'border border-gray-200');
app = app.replace(/shadow-sm/g, 'border border-gray-200');
app = app.replace(/border-gray-100/g, 'border-gray-200');

// Make borders sharper
app = app.replace(/rounded-3xl/g, 'rounded-none');
app = app.replace(/rounded-2xl/g, 'rounded-none');
app = app.replace(/rounded-xl/g, 'rounded-none');

// Make important text elegant
// For Dashboard "Impact Analyzer" -> uppercase
app = app.replace(/font-bold/g, 'font-medium uppercase tracking-widest text-[0.85em]');
app = app.replace(/font-semibold/g, 'font-medium uppercase tracking-wider text-[0.85em]');

// Replace some inner background styles for contrast
app = app.replace(/bg-white/g, 'bg-white/80 backdrop-blur-sm'); // give a nice airy feel to cards

// Specifically target the primary logo color if Zap is used, to make it consistent.
app = app.replace(/text-white/g, 'text-white font-medium');

fs.writeFileSync('src/App.tsx', app);
console.log('Styles updated.');
