const fs = require('fs');

const css = `@import "tailwindcss";

@theme {
  --color-glass-border: rgba(255, 255, 255, 0.5);
  --color-glass-bg: rgba(255, 255, 255, 0.7);
  --shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
  --shadow-glass-colored: 0 10px 40px -10px rgba(138, 43, 226, 0.15);
  --font-sans: "Inter", "Plus Jakarta Sans", -apple-system, sans-serif;
}

body {
  /* Complex pastel gradient background matching the provided image */
  background: 
    radial-gradient(circle at 15% 50%, rgba(220, 210, 255, 0.6) 0%, transparent 40%),
    radial-gradient(circle at 85% 30%, rgba(255, 230, 240, 0.6) 0%, transparent 40%),
    radial-gradient(circle at 50% 80%, rgba(230, 245, 255, 0.6) 0%, transparent 50%),
    radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.8) 0%, transparent 30%);
  background-color: #f7f9fc;
  color: #2a2c35;
  font-family: var(--font-sans);
  min-height: 100vh;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

#root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: transparent;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px -1px rgba(0,0,0,0.02);
}

.glass-card {
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 12px 36px -4px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: transform 0.2s, box-shadow 0.2s;
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px -8px rgba(100, 100, 255, 0.08);
}

.glass-pill {
  background: white;
  border-radius: 9999px;
  box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.gradient-text {
  background: linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Scrollbar override */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.2);
}
`;

fs.writeFileSync('src/index.css', css);

let app = fs.readFileSync('src/App.tsx', 'utf8');

// The objective is to replace the harsh blocky grey/dark styles with airy glassmorphism.

// 1. Sidebar Styles
// Remove heavy backgrounds, replace with glass-panel layout
app = app.replace(/<aside className="[^"]*"/g, '<aside className="w-[100px] lg:w-72 glass-panel flex-shrink-0 flex flex-col hidden lg:flex border-r border-white/40 z-10"');

// 2. Active Sidebar Links
// Previously: view === "item" ? "bg-white text-gray-900 shadow-soft font-semibold" : "text-gray-500 hover:bg-gray-200/50"
app = app.replace(/view === "([a-zA-Z]+)" \? "[^"]*" : "[^"]*"/g, 'view === "$1" ? "bg-white text-indigo-900 shadow-[0_8px_20px_rgba(0,0,0,0.04)] font-bold rounded-2xl" : "text-gray-400 hover:bg-white/40 hover:text-gray-700 rounded-2xl"');

// 3. Main dark elements -> Light elegant elements with gradients
// e.g. `<button className="... bg-gray-900 text-white ...">`
app = app.replace(/bg-gray-900 text-white shadow-md hover:bg-gray-800/g, 'bg-white text-gray-800 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.1)] hover:-translate-y-0.5 border border-white/60');
app = app.replace(/bg-gray-900 text-white shadow-md/g, 'bg-white text-gray-800 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-white/60');
app = app.replace(/text-white shadow-md/g, 'shadow-[0_4px_24px_rgba(0,0,0,0.04)]');

// Also remove stray backgrounds and borders that clash
app = app.replace(/bg-gray-100/g, 'glass-card');
app = app.replace(/bg-gray-50/g, 'bg-white/50');
app = app.replace(/border border-gray-100/g, '');
app = app.replace(/border border-gray-200/g, 'border border-white/40');
app = app.replace(/shadow-soft/g, 'shadow-[0_4px_24px_rgba(0,0,0,0.04)]');

// 4. Texts and typography
// Make prominent headings gradient text
app = app.replace(/<h1 className="text-3xl font-semibold tracking-tight text-xl text-gray-800">/g, '<h1 className="text-4xl font-bold tracking-tight text-xl gradient-text bg-clip-text text-transparent pb-1">');
app = app.replace(/<h2 className="text-2xl font-semibold/g, '<h2 className="text-2xl font-bold text-gray-800');
app = app.replace(/text-gray-400 uppercase tracking-wider/g, 'text-gray-400 uppercase tracking-widest text-[10px] font-bold'); // Make labels crisper
app = app.replace(/text-gray-900/g, 'text-slate-800'); // Softer dark text

// 5. Enhance borders and rounded corners
// The image shows extremely rounded shapes
app = app.replace(/rounded-\[2rem\]/g, 'rounded-3xl');
app = app.replace(/rounded-lg/g, 'rounded-2xl');

// Remove some weird hardcoded colors from past
app = app.replace(/bg-\[\#f0f2f0\]/gi, '');

// 6. Fix individual stats cards coloring
// Replace simple text color with gradient or brand colors for stats icons
app = app.replace(/text-blue-600/g, 'text-indigo-500');
app = app.replace(/bg-blue-50/g, 'bg-indigo-50');
app = app.replace(/text-green-600/g, 'text-emerald-500');
app = app.replace(/bg-green-50/g, 'bg-emerald-50');
app = app.replace(/text-pink-600/g, 'text-rose-500');
app = app.replace(/bg-pink-50/g, 'bg-rose-50');
app = app.replace(/bg-gray-900 border border-white\/60/g, 'bg-purple-50'); // Fix for the Zap icon stat card

// 7. Inputs
app = app.replace(/<input([^>]*)className="([^"]*)"/g, (match, prefix, classNames) => {
    // Inject glass styling into inputs
    const newClasses = classNames.replace('bg-white', 'bg-white/60')
        .replace('bg-gray-50', 'bg-white/60')
        .replace('border-transparent', 'border-white/40')
        .replace('focus:ring-gray-100', 'focus:ring-indigo-100')
        .replace('focus:bg-white', 'focus:bg-white focus:shadow-md');
    return `<input${prefix}className="${newClasses}"`;
});

// 8. Custom Logo / Profile Circles
app = app.replace(/w-10 h-10 rounded-full bg-white text-gray-800 flex items-center justify-center/g, 'w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-white');
app = app.replace(/w-8 h-8 rounded-full bg-white text-gray-800 flex items-center justify-center/g, 'w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-white');
app = app.replace(/bg-gray-900 text-white shadow-\[0_4px_24px_rgba\(0,0,0,0\.04\)\] border border-white\/60 p-2 text-white shadow-md rounded-2xl/g, 'bg-white shadow-sm p-2 rounded-2xl');

// Final pass: cleanup any duplicate class names or weird collisions
app = app.replace(/ shadow-\[0_4px_24px_rgba\(0,0,0,0\.04\)\] hover:-translate-y-0\.5 border border-white\/60/g, ' shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-white/60 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(100,100,250,0.1)] transition-all');

// Fix the "Analizando Impacto" loader pulse
app = app.replace(/bg-white text-gray-800 shadow-\[0_4px_24px_rgba\(0,0,0,0\.04\)\] border border-white\/60 blur-3xl opacity-20/g, 'bg-indigo-300 blur-[80px] opacity-40');
app = app.replace(/Loader2 className="w-20 h-20 text-slate-800/g, 'Loader2 className="w-20 h-20 text-indigo-500');

fs.writeFileSync('src/App.tsx', app);
console.log('Glassmorphism Applied.');
