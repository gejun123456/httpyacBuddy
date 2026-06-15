const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = path.join(__dirname, '..', 'assets', 'icon.svg');
const OUT = path.join(__dirname, '..', 'assets', 'icon.png');

(async () => {
  const svg = fs.readFileSync(SRC);
  await sharp(svg, { density: 384 })
    .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(OUT);
  const { size } = fs.statSync(OUT);
  console.log(`icon.png written: ${size} bytes`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
