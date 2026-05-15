// One-off generator: writes a stylized SVG tee per product into public/images/tees/.
// Re-run if you change colors/graphics, or just delete files and swap in real photos.
const fs = require('fs');
const path = require('path');
const products = require('../data/products.json');

const outDir = path.join(__dirname, '..', 'public', 'images', 'tees');
fs.mkdirSync(outDir, { recursive: true });

const colorMap = {
  Black: '#0a0a0a',
  Bone: '#ece6da',
  White: '#f5f5f5',
  Grey: '#9aa0a6',
  Navy: '#0e1a35',
  Purple: '#3a1f5d',
  Sage: '#a8b89c',
  Rust: '#a44a2a',
  Cream: '#efe6cf',
  Sand: '#d6c4a3',
  Red: '#c8202b',
  Forest: '#1f3a2f',
  Charcoal: '#2a2a2a',
};

// Draws an outline tee silhouette in path commands sized to a 600x600 viewBox.
const teePath = `M150 130 L240 90 L300 130 L360 90 L450 130 L500 200 L450 235 L425 215 L425 510 L175 510 L175 215 L150 235 L100 200 Z`;

function teeSVG({ baseColor, graphic, label }) {
  const bg = colorMap[baseColor] || '#222';
  const inkOnDark = ['#0a0a0a','#0e1a35','#3a1f5d','#1f3a2f','#2a2a2a','#a44a2a','#c8202b'].includes(bg);
  const ink = inkOnDark ? '#f5f5f5' : '#0a0a0a';
  const accent = '#ff3b30';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="${label}">
  <rect width="600" height="600" fill="#f3f1ec"/>
  <g stroke="${ink}" stroke-width="3" stroke-linejoin="round">
    <path d="${teePath}" fill="${bg}"/>
  </g>
  <g transform="translate(300 320)" text-anchor="middle" font-family="Impact, 'Anton', 'Archivo Black', system-ui, sans-serif" fill="${ink}">
    ${graphic(ink, accent)}
  </g>
</svg>`;
}

const graphics = {
  'rebel-static': (ink, accent) => `
    <g font-size="74" font-weight="900" letter-spacing="-2">
      <text y="-6" fill="${accent}">REBEL</text>
      <text y="62" fill="${ink}">STATIC</text>
    </g>
    <g stroke="${ink}" stroke-width="2" opacity="0.5">
      ${Array.from({length: 7}, (_, i) => `<line x1="-110" y1="${90 + i*8}" x2="110" y2="${90 + i*8}"/>`).join('')}
    </g>`,
  'neon-warning': (ink, accent) => `
    <g>
      <polygon points="0,-90 100,80 -100,80" fill="none" stroke="#e6ff00" stroke-width="10"/>
      <text y="55" font-size="80" font-weight="900" fill="#e6ff00">!</text>
    </g>`,
  'concrete-bloom': (ink, accent) => `
    <g fill="${accent}" opacity="0.85">
      ${[0,60,120,180,240,300].map(a => `<circle cx="${Math.cos(a*Math.PI/180)*60}" cy="${Math.sin(a*Math.PI/180)*60}" r="34"/>`).join('')}
      <circle cx="0" cy="0" r="34" fill="${ink}"/>
    </g>`,
  'midnight-grid': (ink, accent) => `
    <g stroke="${ink}" stroke-width="2" fill="none" opacity="0.7">
      ${Array.from({length: 6}, (_, i) => `<line x1="-100" y1="${-60+i*24}" x2="100" y2="${-60+i*24}"/>`).join('')}
      ${Array.from({length: 9}, (_, i) => `<line x1="${-100+i*25}" y1="-60" x2="${-100+i*25}" y2="60"/>`).join('')}
    </g>`,
  'afterhours': (ink, accent) => `
    <text y="20" font-size="86" font-weight="900" letter-spacing="-3" fill="${accent}">AFTER</text>
    <text y="92" font-size="56" font-weight="700" letter-spacing="6" fill="${ink}">H O U R S</text>`,
  'ghost-script': (ink, accent) => `
    <text y="20" font-family="Georgia, serif" font-style="italic" font-size="60" fill="${ink}" opacity="0.5">ghost</text>
    <text y="80" font-family="Georgia, serif" font-style="italic" font-size="60" fill="${ink}" opacity="0.5">script</text>`,
  'rust-belt': (ink, accent) => `
    <g font-size="58" font-weight="900" letter-spacing="2">
      <text y="-10" fill="${ink}">RUST</text>
      <text y="50" fill="${ink}">BELT</text>
    </g>
    <rect x="-80" y="70" width="160" height="6" fill="${accent}"/>`,
  'static-bloom': (ink, accent) => `
    <g opacity="0.75">
      ${Array.from({length: 60}, () => {
        const x = (Math.random()*220) - 110;
        const y = (Math.random()*180) - 90;
        const r = 2 + Math.random()*5;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${accent}"/>`;
      }).join('')}
    </g>`,
  'border-town': (ink, accent) => `
    <g stroke="${ink}" stroke-width="3" fill="none">
      <polyline points="-100,40 -80,40 -80,-10 -60,-10 -60,30 -40,30 -40,-30 -10,-30 -10,40 20,40 20,-20 50,-20 50,40 80,40 80,0 100,0 100,40"/>
    </g>
    <text y="80" font-size="22" font-weight="700" letter-spacing="6" fill="${ink}">BORDER TOWN</text>`,
  'siren': (ink, accent) => `
    <line x1="-110" y1="60" x2="110" y2="-60" stroke="${ink}" stroke-width="18"/>
    <text y="92" font-size="34" font-weight="900" letter-spacing="10" fill="${ink}">SIREN</text>`,
  'off-grid': (ink, accent) => `
    <g stroke="${ink}" stroke-width="2" fill="none" opacity="0.8">
      ${[20,40,60,80,100].map(r => `<ellipse cx="0" cy="0" rx="${r}" ry="${r*0.55}"/>`).join('')}
    </g>
    <text y="115" font-size="22" font-weight="700" letter-spacing="6" fill="${ink}">OFF GRID</text>`,
  'low-frequency': (ink, accent) => `
    <g stroke="${accent}" stroke-width="4" fill="none">
      <polyline points="-110,0 -90,-30 -70,30 -50,-60 -30,60 -10,-40 10,40 30,-50 50,50 70,-30 90,30 110,0"/>
    </g>
    <text y="70" font-size="22" font-weight="900" letter-spacing="6" fill="${ink}">LOW FREQUENCY</text>`,
};

for (const p of products) {
  const svg = teeSVG({
    baseColor: p.colors[0],
    graphic: graphics[p.id] || (ink => `<text y="20" font-size="60" font-weight="900" fill="${ink}">${p.name.toUpperCase()}</text>`),
    label: `${p.name} tee in ${p.colors[0].toLowerCase()}`,
  });
  fs.writeFileSync(path.join(outDir, `${p.id}.svg`), svg);
}
console.log(`Wrote ${products.length} SVG tees to ${outDir}`);
