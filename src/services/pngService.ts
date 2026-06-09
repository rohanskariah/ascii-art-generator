export const downloadPNG = (
  asciiArt: string,
  filename: string = 'ascii-art.png',
  textColor: string = '#D4AF37',
  bgColor: string = '#0a0a0a'
) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const fontSize = 28;
  const lineHeight = fontSize * 1.2;
  const font = `${fontSize}px "JetBrains Mono", "Courier New", monospace`;
  const padding = 96;

  ctx.font = font;
  const charWidth = ctx.measureText('M').width;

  const lines = asciiArt.split('\n');
  const maxLineLen = Math.max(...lines.map(l => l.length));

  const textW = maxLineLen * charWidth;
  const textH = lines.length * lineHeight;

  // Make it square using the larger dimension plus padding
  const side = Math.ceil(Math.max(textW, textH) + padding * 2);
  canvas.width = side;
  canvas.height = side;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, side, side);

  // Center the text block
  const offsetX = (side - textW) / 2;
  const offsetY = (side - textH) / 2;

  ctx.font = font;
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'top';

  lines.forEach((line, i) => {
    ctx.fillText(line, offsetX, offsetY + i * lineHeight);
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
