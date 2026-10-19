import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createSolidPNG(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw image scanlines
  const lineLength = 1 + width * 3;
  const rawData = Buffer.alloc(height * lineLength);

  for (let y = 0; y < height; y++) {
    const offset = y * lineLength;
    rawData[offset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = offset + 1 + x * 3;
      // create subtle dark industrial gradient
      const factor = (y / height) * 0.4;
      rawData[pxOffset] = Math.max(0, Math.floor(r * (1 - factor)));
      rawData[pxOffset + 1] = Math.max(0, Math.floor(g * (1 - factor)));
      rawData[pxOffset + 2] = Math.max(0, Math.floor(b * (1 - factor)));
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressedData);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write 192x192 icon (Industrial Blue: 15, 23, 42)
const png192 = createSolidPNG(192, 192, 30, 64, 175);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// Write 512x512 icon
const png512 = createSolidPNG(512, 512, 15, 23, 42);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// Write maskable 512x512 icon
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), png512);

// Write 180x180 apple-touch-icon
const appleIcon = createSolidPNG(180, 180, 30, 64, 175);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

console.log('PWA PNG Icons generated successfully in public/');
