const fs = require('fs');

let css = `@import "tailwindcss";

@theme {
  --color-accent-50: #EAE8E3;
  --color-accent-100: #DFDCD4;
  --color-accent-200: #C4C0B6;
  --color-accent-300: #A8A59C;
  --color-accent-400: #8D8A82;
  --color-accent-500: #6B6963;
  --color-accent-600: #1a1a1b; /* Main Dark Button / Accent Color */
  --color-accent-700: #121212;
  --color-accent-800: #0a0a0a;
  --color-accent-900: #000000;

  --color-gray-50: #F4F3EE; /* Super light beige paper background */
  --color-gray-100: #EBEAE4;
  --color-gray-200: #DCDAD2; /* For Grid lines */
  --color-gray-300: #C7C4BB;
  --color-gray-400: #A8A49A;
  --color-gray-500: #87847B;
  --color-gray-600: #6B6861;
  --color-gray-700: #4B4944;
  --color-gray-800: #33322E;
  --color-gray-900: #1E1D1A; /* Text color */

  --font-sans: "Inter", -apple-system, sans-serif;
  
  --radius-sm: 0.5rem;
  --radius: 1rem;
  --radius-md: 1rem;
  --radius-lg: 1.5rem;
  --radius-xl: 2rem;
  --radius-2xl: 2.5rem;
  --radius-3xl: 3rem;
  --radius-full: 9999px;

  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;
  --shadow-xl: none;
}

body {
  @apply bg-gray-50 text-gray-900 font-sans tracking-tight;
}

/* Force headings to be chunky block text */
h1, h2, h3, .text-2xl, .text-lg, .text-xl, .uppercase-header {
  @apply font-black tracking-tighter normal-case text-gray-900;
}

/* Override previous modifications to restore curves */
.rounded-none {
  @apply rounded-3xl;
}

/* We want buttons to be pill shaped */
button.rounded-none, button, .rounded-xl, .rounded-2xl {
  @apply rounded-full;
}

/* Enhance grid look: Add subtle background and stronger borders to panels */
aside, header, .border-gray-200 {
  @apply border-gray-200 border;
}
`;

fs.writeFileSync('src/index.css', css);

let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('Inter')) {
    // Replace Outfit with Inter
    html = html.replace('Family=Outfit:wght@200;300;400;500;600', 'family=Inter:wght@400;600;800;900');
    fs.writeFileSync('index.html', html);
}

let app = fs.readFileSync('src/App.tsx', 'utf8');

// Replace orange accent with the dark accent
app = app.replace(/orange-/g, 'accent-');

// Revert the uppercase tracking format to chunky black text
app = app.replace(/font-medium uppercase tracking-widest text-\[0\.85em\]/g, 'font-black tracking-tighter text-xl');
app = app.replace(/font-medium uppercase tracking-wider text-\[0\.85em\]/g, 'font-bold tracking-tight text-lg');

// We don't want the previous white transparency, we want solid pale blocks
app = app.replace(/bg-white\/80 backdrop-blur-sm/g, 'bg-gray-100 border border-gray-200');
// Some blocks were set to bg-white
app = app.replace(/bg-white([^/])/g, 'bg-gray-50$1');

// Improve button contrast (if previously setup for white text)
app = app.replace(/text-white font-medium/g, 'text-gray-50 font-bold tracking-tighter');

// Make borders more pronounced grid format
app = app.replace(/border-gray-100/g, 'border-gray-200');
app = app.replace(/shadow-sm/g, 'border-2 border-gray-200');

fs.writeFileSync('src/App.tsx', app);
console.log('RobCo theme applied.');
