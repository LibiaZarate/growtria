const fs = require('fs');

let css = `@import "tailwindcss";

@theme {
  --color-brand-bg: #F9FAFA; /* Main application background - very light pale */
  --color-brand-sidebar: #F1F3F2; /* Sidebar background */
  
  --font-sans: "Inter", -apple-system, sans-serif;
  
  --radius-sm: 0.5rem;
  --radius: 1rem;
  --radius-md: 1rem;
  --radius-lg: 1.5rem;
  --radius-xl: 2rem;
  --radius-2xl: 2.5rem;
  --radius-3xl: 3rem;
  --radius-full: 9999px;

  /* Real Seto soft shadow */
  --shadow-soft: 0 4px 14px 0 rgba(0,0,0,0.03);
  --shadow-card: 0 4px 20px rgba(0,0,0,0.03);
}

body {
  /* Subtle pastel glow at the bottom edges */
  background: radial-gradient(circle at bottom left, rgba(235,215,200,0.4) 0%, transparent 40%),
              radial-gradient(circle at bottom right, rgba(245,210,195,0.4) 0%, transparent 40%);
  background-color: var(--color-brand-bg);
  color: #1A1C1A;
  font-family: var(--font-sans);
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

#root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: transparent;
}
`;

fs.writeFileSync('src/index.css', css);

let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix typography: remove the aggressive tech-black weight
app = app.replace(/font-black tracking-tighter/g, 'font-semibold tracking-tight text-xl');
app = app.replace(/font-bold/g, 'font-medium'); // soften bold globally
app = app.replace(/uppercase-header/g, 'capitalize font-bold');

// 2. Fix rounded corners globally from our previous tech theme
app = app.replace(/rounded-none/g, 'rounded-[2rem]');
// Buttons "Nuevo Analisis" was made rounded-none, let's force all interactive pills
app = app.replace(/rounded-\[2rem\] px-4/g, 'rounded-full px-6'); // typical button shape

// 3. Left Sidebar Active Link Pill
// Seto active sidebar link: background white with soft shadow, text dark.
// Right now it might be `bg-gray-900 text-white` because of our amber-900 replace.
// Let's find exactly the sidebar nav links.
app = app.replace(/bg-gray-900 text-white/g, 'bg-gray-900 text-white shadow-xl'); // Let's keep primary action buttons black.

// WAIT! I messed up the active sidebar link in step 1. Let's find the specific ternary operator.
// `view === "dashboard" ? "bg..." : "..."`
const sidebarItems = ['dashboard', 'chat', 'analyze', 'history', 'settings'];
sidebarItems.forEach(item => {
    // Try to catch whatever the current string is
    const regex = new RegExp(`view === "${item}" \\? "[^"]*" : "[^"]*"`, 'g');
    app = app.replace(regex, `view === "${item}" ? "bg-white text-gray-900 shadow-soft font-semibold" : "text-gray-500 hover:bg-gray-200/50"`);
});

// Sidebar background
// Replace the outer <aside> classes:
app = app.replace(/aside className="[^"]*"/g, 'aside className="w-72 bg-[#f0f2f0] flex-shrink-0 flex flex-col hidden lg:flex rounded-tr-3xl rounded-br-3xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10"');

// 4. White Cards for the Stats Area
// Currently they have no explicit background because I stripped it earlier.
// `className="w-full p-3 ..."` -> let's make sure the stat cards have bg-white
// Looking for the main Top 4 cards container or similar. 
// "ANALISIS TOTALES", "COMPLETADOS", etc.
// The easiest is to inject `bg-white shadow-card rounded-[2rem]` into any wrapper that is a card.
// Let's replace any `rounded-\[2rem\]` that lacks backgrounds with white.
app = app.replace(/border-gray-200/g, 'border-transparent'); // Hide remaining borders
app = app.replace(/shadow-sm/g, 'shadow-card bg-white rounded-3xl border border-gray-100'); // Add soft white cards

// Main Content background
app = app.replace(/<main className="flex-1 overflow-y-auto bg-\[\#[A-F0-9]*\] px-4">/gi, '<main className="flex-1 overflow-y-auto px-8 py-8">');

// The bottom left profile box:
// Currently: `p-4 bg-[#E9EAE8] rounded-[2rem] mx-4 mb-4`
app = app.replace(/bg-\[\#E9EAE8\]/g, 'bg-gray-200/60 shadow-inner');

// Change the huge text "Impact Analyzer" on the top left.
app = app.replace(/<span className="font-semibold text-lg tracking-tight">Impact Analyzer<\/span>/g, '<span className="font-bold text-xl tracking-tight">IMPACT</span>');
// Fix the Zap icon to match the cute star icon in Seto (Sparkles looks better)
app = app.replace(/<Zap className="w-5 h-5/g, '<Sparkles className="w-5 h-5');

fs.writeFileSync('src/App.tsx', app);
console.log('Seto V2 Applied.');
