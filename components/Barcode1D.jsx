'use client';

const CODE39 = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000', '4': '000110001',
  '5': '100110000', '6': '001110000', '7': '000100101', '8': '100100100', '9': '001100100',
  'A': '100001001', 'B': '001001001', 'C': '101001000', 'D': '000011001', 'E': '100011000',
  'F': '001011000', 'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011', 'O': '100010010',
  'P': '001010010', 'Q': '000000111', 'R': '100000110', 'S': '001000110', 'T': '000010110',
  'U': '110000001', 'V': '011000001', 'W': '111000000', 'X': '010010001', 'Y': '110010000',
  'Z': '011010000', '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100'
};

export function encodeCode39(text) {
  const raw = String(text || 'BKS-000').toUpperCase().replace(/[^A-Z0-9\-\. \$\/\+\%]/g, '');
  const clean = '*' + (raw.length > 0 ? raw : 'BKS') + '*';
  const bars = [];
  const narrow = 2;
  const wide = 5;
  let currentX = 8; // Margin left

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const pattern = CODE39[char] || CODE39['-'];
    for (let p = 0; p < 9; p++) {
      const isBar = p % 2 === 0;
      const isWide = pattern[p] === '1';
      const w = isWide ? wide : narrow;
      if (isBar) {
        bars.push({ x: currentX, width: w });
      }
      currentX += w;
    }
    // Inter-character narrow space
    currentX += narrow;
  }
  return { bars, totalWidth: currentX + 8 };
}

export default function Barcode1D({ 
  value, 
  height = 56, 
  showText = true, 
  subtitle = 'KODE TIKET KASIR POS',
  className = '' 
}) {
  const displayCode = String(value || 'BKS-000').toUpperCase();
  const cleanCode = displayCode.replace(/^#/, '');
  const { bars, totalWidth } = encodeCode39(cleanCode);

  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-xl bg-white text-black border border-outline-variant/30 select-all shadow-inner ${className}`}>
      <svg 
        viewBox={`0 0 ${totalWidth} ${height}`} 
        className="w-full max-w-[280px] h-auto"
        style={{ shapeRendering: 'crispEdges' }}
      >
        <rect width="100%" height="100%" fill="#ffffff" />
        {bars.map((bar, idx) => (
          <rect key={idx} x={bar.x} y="0" width={bar.width} height={height} fill="#000000" />
        ))}
      </svg>
      {showText && (
        <div className="flex flex-col items-center mt-1.5 leading-tight">
          <span className="font-mono text-xs sm:text-sm font-extrabold tracking-widest text-black">
            *{cleanCode}*
          </span>
          {subtitle && (
            <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
