const testData = {
  patterns: [
    {
      "post": "1 (7 reglas para que tu hijo coma de todo - Parte 1)",
      "hooks": "Ganchos visuales (el profesional hablando directamente a la cámara) y de contenido (texto en pantalla).",
      "theme": "Educación alimentaria.",
      "style": "Directo, tipo clase rápida."
    },
    {
      "post": "2 (Los niños te miran)",
      "hooks": "Emocional (El niño aprende de ti, no de lo que dices).",
      "theme": "Crianza y ejemplo.",
      "style": "Reflexivo."
    }
  ]
};

console.log(testData.patterns.map(p => {
  if (typeof p === 'object') {
    return JSON.stringify(p);
  }
  return p;
}));
