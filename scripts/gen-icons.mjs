// Generates simple solid-color PNG icons for the PWA using Node.js built-ins.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let k = 0; k < 8; k++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function u32(n) {
  const b = Buffer.allocUnsafe(4)
  b.writeUInt32BE(n, 0)
  return b
}

function chunk(type, data) {
  const t = Buffer.from(type)
  const crcInput = Buffer.concat([t, data])
  return Buffer.concat([u32(data.length), t, data, u32(crc32(crcInput))])
}

function createPng(width, height, r, g, b) {
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // RGB
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  // Build raw scanlines: filter byte (0) + RGB pixels
  const scanline = Buffer.allocUnsafe(1 + width * 3)
  scanline[0] = 0
  for (let x = 0; x < width; x++) {
    scanline[1 + x * 3] = r
    scanline[2 + x * 3] = g
    scanline[3 + x * 3] = b
  }
  const raw = Buffer.concat(Array.from({ length: height }, () => scanline))
  const compressed = deflateSync(raw)

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

// SL blue: #007db8 = 0, 125, 184
const [r, g, b] = [0, 125, 184]

writeFileSync('public/icon-192.png', createPng(192, 192, r, g, b))
writeFileSync('public/icon-512.png', createPng(512, 512, r, g, b))
writeFileSync('public/apple-touch-icon.png', createPng(180, 180, r, g, b))

console.log('Icons generated in public/')
