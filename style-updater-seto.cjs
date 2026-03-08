const fs = require('fs');

let css = `@import "tailwindcss";

@theme {
  --color-brand-bg: #F5F5F3; /* Main application background */
  --color-brand-sidebar: #E9EAE8; /* Slightly darker grey for the profile card area */
  --color-brand-dark: #1A1C1A; /* For main buttons */
  
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  
  --radius-sm: 0.5rem;
  --radius: 1rem;
  --radius-md: 1rem;
  --radius-lg: 1.5rem;
  --radius-xl: 2rem;
  --radius-2xl: 2.5rem;
  --radius-3xl: 3rem;
  --radius-full: 9999px;

  /* Very soft, elegant shadow matching the reference */
  --shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.03);
  --shadow-card: 0 8px 30px rgba(0, 0, 0, 0.04);
}

body {
  /* The outer background (behind the main app window) is a soft glowing gradient */
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  color: #1A1C1A;
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem; /* Space around the main app window */
}

/* We target the root #root to act as the main app window */
#root {
  background-color: var(--color-brand-bg);
  border-radius: 2rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.02);
  width: 100%;
  max-width: 1400px;
  height: calc(100vh - 2rem);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  letter-spacing: -0.02em;
}

/* Reset any wild chunky stuff from previous themes */
.font-black {
  font-weight: 600 !important;
}

/* Restore nice curves */
* {
  border-color: rgba(0,0,0,0.05); /* very soft borders if any */
}

button, .rounded-xl, .rounded-2xl {
  border-radius: 9999px !important; /* Force pill shapes on interactive elements */
}

/* Specific component tweaks matching Seto UI */
.bg-white {
  background-color: #FFFFFF !important;
}

.shadow-card {
  box-shadow: var(--shadow-card) !important;
  border: none !important;
}
`;

fs.writeFileSync('src/index.css', css);

let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Revert previous extreme color replacements.
// We had replaced things with amber-900. Let's trace back to neutral grays and blacks.
app = app.replace(/amber-900/g, 'gray-900');
app = app.replace(/amber-50/g, 'gray-100');
app = app.replace(/text-amber-600/g, 'text-gray-900');
app = app.replace(/bg-amber-600/g, 'bg-gray-900 text-white');
app = app.replace(/border-amber-600/g, 'border-gray-200');

// 2. Fix layout and aesthetics to match Seto.
// Remove hard borders
app = app.replace(/border-r /g, '');
app = app.replace(/border-t /g, '');
app = app.replace(/border-b /g, '');
app = app.replace(/border /g, '');
app = app.replace(/border-gray-200/g, '');
app = app.replace(/border-2/g, '');

// The main layout background should be transparent because #root has the color now, 
// but we need to ensure the inner wrappers don't force white full screen.
// Find the outer min-h-screen bg-gray-50 flex
app = app.replace(/className="min-h-screen[^"]*"/g, 'className="w-full h-full flex"');

// 3. Sidebar styling
// Sidebar should have pale background, no border
app = app.replace(/aside className="w-72 bg-white/g, 'aside className="w-72 bg-[#F5F5F3]');

// Active Sidebar Link: In Seto, it's a white pill with text-gray-900.
// Our current dashboard active link structure looks like:
// bg-gray-50 text-gray-900
// We want: bg-white text-gray-900 shadow-sm
// Let's modify the standard link button classes
app = app.replace(/\? "bg-gray-50 text-gray-900" : "text-gray-500 hover:bg-gray-50"/g, '? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:bg-gray-200/50"');
app = app.replace(/\? "bg-gray-100/g, '? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:bg-gray-200/50"');

// 4. Cards and Components (Right side)
// The "Cards" (Resumen General boxes etc) should be white with large radius and soft shadow, NO border.
// Currently they might have 'bg-gray-50' or 'bg-white border'
app = app.replace(/className="([^"]*)bg-white border([^"]*)"/g, 'className="$1bg-white shadow-card rounded-3xl p-6$2"');
app = app.replace(/shadow-lg/g, 'shadow-card');

// 5. Typography Fixes
// Seto has very clean, soft H1s. Wait, we forced font-black in an earlier step via find/replace maybe?
// Actually we had `font-black tracking-tighter text-xl`. Let's soften it.
app = app.replace(/font-black tracking-tighter/g, 'font-semibold tracking-tight');
app = app.replace(/font-bold/g, 'font-medium'); // soften bold text

// "NUEVO ANALISIS" button -> Dark pill shape
// It probably looks like "bg-gray-900 text-white..."
// Ensure it's pill
app = app.replace(/rounded-xl/g, 'rounded-full');
app = app.replace(/rounded-2xl/g, 'rounded-[2rem]');
app = app.replace(/rounded-3xl/g, 'rounded-[2.5rem]');

// Profile box in sidebar (bottom left). Seto has a grey rounded box.
// Currently it's `p-4 border-t` or similar.
// Find the user profile div at bottom of aside
// "flex items-center gap-3 p-3 bg-gray-50 rounded-2xl" -> "flex items-center gap-3 p-4 bg-[#E9EAE8] rounded-[2rem] mx-4 mb-4"
app = app.replace(/flex items-center gap-3 p-3 bg-gray-50 rounded-2xl/g, 'flex items-center gap-3 p-4 bg-[#E9EAE8] rounded-[2rem] mx-4 mb-4');

// Primary background of the main content area is the same brand-bg
app = app.replace(/<main className="flex-1 overflow-y-auto">/g, '<main className="flex-1 overflow-y-auto bg-[#F5F5F3] px-4">');

fs.writeFileSync('src/App.tsx', app);
console.log('Seto Soft UI theme applied successfully.');
