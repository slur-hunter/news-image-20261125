// news-image-20261125: a dense one-day news front page for Wednesday 25 November 2026.
// Drawn entirely in code with the Node standard library only (no network, no fonts on disk).
// Writes /output/entry.png (or $MAKEFUN_OUTPUT_DIR/entry.png), 1024x1024, deterministic.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024, H = 1024;
const buf = new Uint8Array(W * H * 3);
const PAPER: [number, number, number] = [250, 244, 228];
const INK: [number, number, number] = [24, 24, 24];
const RED: [number, number, number] = [178, 28, 28];
const NAVY: [number, number, number] = [30, 58, 95];
const GREY: [number, number, number] = [90, 90, 90];
const TAN: [number, number, number] = [216, 196, 138];
const WHITE: [number, number, number] = [255, 255, 255];
const SKY: [number, number, number] = [178, 214, 235];
const GREEN: [number, number, number] = [46, 125, 50];
const GOLD: [number, number, number] = [201, 162, 39];

function px(x: number, y: number, c: [number, number, number]) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
}
function fillRect(x: number, y: number, w: number, h: number, c: [number, number, number]) {
  for (let j = Math.max(0, y); j < Math.min(H, y + h); j++)
    for (let i = Math.max(0, x); i < Math.min(W, x + w); i++) px(i, j, c);
}
function rect(x: number, y: number, w: number, h: number, c: [number, number, number]) {
  fillRect(x, y, w, 1, c); fillRect(x, y + h - 1, w, 1, c);
  fillRect(x, y, 1, h, c); fillRect(x + w - 1, y, 1, h, c);
}
function hline(x: number, y: number, w: number, c: [number, number, number]) { fillRect(x, y, w, 1, c); }
function vline(x: number, y: number, h: number, c: [number, number, number]) { fillRect(x, y, 1, h, c); }
function line(x0: number, y0: number, x1: number, y1: number, c: [number, number, number]) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  for (let n = 0; n < 4000; n++) {
    px(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}
function circle(cx: number, cy: number, r: number, c: [number, number, number]) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++)
    if (x * x + y * y <= r * r) px(cx + x, cy + y, c);
}
function poly(points: [number, number][], c: [number, number, number]) {
  let minY = 1e9, maxY = -1e9;
  for (const [, y] of points) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const xs: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const [x0, y0] = points[i], [x1, y1] = points[(i + 1) % points.length];
      if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
        xs.push(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) px(x, y, c);
  }
}

// ---- 5x7 bitmap font (uppercase). Each glyph: 7 rows of 5 bits as strings. ----
const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '+': ['00000', '00100', '00100', '01110', '00100', '00100', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '$': ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '*': ['00000', '10101', '01110', '11111', '01110', '10101', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  _: ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  '#': ['01010', '01010', '11111', '01010', '11111', '01010', '01010'],
  '|': ['00100', '00100', '00100', '00100', '00100', '00100', '00100'],
  '<': ['00010', '00100', '01000', '10000', '01000', '00100', '00010'],
  '>': ['01000', '00100', '00010', '00001', '00010', '00100', '01000'],
  '[': ['01110', '01000', '01000', '01000', '01000', '01000', '01110'],
  ']': ['01110', '00010', '00010', '00010', '00010', '00010', '01110'],
  '@': ['01110', '10001', '10111', '10101', '10110', '10000', '01110'],
};
function drawText(x: number, y: number, text: string, scale: number, c: [number, number, number]) {
  const s = text.toUpperCase().replace(/—/g, '-').replace(/’/g, "'").replace(/“|”/g, '"').replace(/–/g, '-');
  let cx = x;
  for (const ch of s) {
    const g = FONT[ch] || FONT[' '];
    for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++)
      if (g[r][col] === '1') fillRect(cx + col * scale, y + r * scale, scale, scale, c);
    cx += 6 * scale;
  }
  return cx;
}
function textW(text: string, scale: number) {
  return text.length * 6 * scale - scale;
}
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}
function para(x: number, y: number, text: string, maxChars: number, scale: number, c: [number, number, number], maxLines = 99) {
  const lines = wrap(text, maxChars).slice(0, maxLines);
  lines.forEach((ln, i) => drawText(x, y + i * 8 * scale, ln, scale, c));
  return y + lines.length * 8 * scale;
}

// ---- background ----
fillRect(0, 0, W, H, PAPER);

// ---- top bar ----
fillRect(0, 0, W, 24, NAVY);
drawText(10, 8, 'THE WORLD IN ONE DAY', 1, WHITE);
drawText(560, 8, '50 STORIES - 7 REGIONS - EVERY ONE DATED 25 NOV 2026', 1, WHITE);

// ---- masthead ----
drawText(8, 34, 'WEDNESDAY 25 NOVEMBER 2026', 4, INK);
drawText(8, 66, 'SHENZHOU-24 LIFTS OFF  -  CHINA PROBES POLITBURO MEMBER  -  HUAWEI GUILTY IN US TRIAL', 1, RED);
hline(8, 82, 1008, INK);

// ---- big-number strip ----
const STATS: [string, string][] = [
  ['1ST', 'PAKISTANI IN ORBIT ON SHENZHOU-24'],
  ['4TH', 'POLITBURO MEMBER PROBED SINCE 2025'],
  ['-6%', 'NVIDIA SHARES AS BOUNCE FADES'],
  ['11', 'HURT IN HOUTHI STRIKE ON RIYADH'],
  ['5-1', 'REAL MADRID ROUT PSV'],
  ['116', 'WOMEN VIE FOR MISS UNIVERSE CROWN'],
];
{
  const cw = 1008 / 6;
  STATS.forEach(([n, label], i) => {
    const x = 8 + i * cw;
    if (i > 0) vline(Math.round(x), 90, 40, GREY);
    drawText(Math.round(x + 8), 92, n, 3, RED);
    para(Math.round(x + 8), 116, label, 26, 1, INK, 2);
  });
}
hline(8, 134, 1008, INK);

// ---- region bars ----
const REGIONS: [string, number, [number, number, number]][] = [
  ['EUROPE', 13, [30, 58, 95]],
  ['MIDDLE EAST', 6, [178, 28, 28]],
  ['NORTH AMERICA', 21, [46, 125, 50]],
  ['SOUTH AMERICA', 3, [201, 162, 39]],
  ['ASIA', 5, [120, 60, 160]],
  ['AFRICA', 1, [200, 120, 40]],
  ['OCEANIA', 1, [0, 130, 130]],
];
{
  let x = 8;
  for (const [, n, c] of REGIONS) {
    const w = Math.round((n / 50) * 1008);
    fillRect(x, 140, w, 14, c);
    if (w >= 24) drawText(x + Math.round(w / 2) - 3, 143, String(n), 1, WHITE);
    x += w;
  }
  drawText(8, 158, 'EUROPE 13  |  MIDDLE EAST 6  |  NORTH AMERICA 21  |  SOUTH AMERICA 3  |  ASIA 5  |  AFRICA 1  |  OCEANIA 1  =  50 STORIES', 1, INK);
}

// ---- scenes ----
function scene(kind: string, x: number, y: number, w: number, h: number) {
  fillRect(x, y, w, h, SKY);
  if (kind === 'rocket') {
    fillRect(x, y + h - 8, w, 8, GREEN);
    fillRect(x + Math.round(w * 0.46), y + 10, Math.round(w * 0.08), h - 26, WHITE);
    rect(x + Math.round(w * 0.46), y + 10, Math.round(w * 0.08), h - 26, RED);
    poly([[x + Math.round(w * 0.46), y + 10], [x + Math.round(w * 0.5), y + 2], [x + Math.round(w * 0.54), y + 10]], RED);
    circle(x + Math.round(w * 0.5), y + 22, 4, SKY);
    poly([[x + Math.round(w * 0.46), y + h - 16], [x + Math.round(w * 0.38), y + h - 6], [x + Math.round(w * 0.46), y + h - 10]], RED);
    poly([[x + Math.round(w * 0.54), y + h - 16], [x + Math.round(w * 0.62), y + h - 6], [x + Math.round(w * 0.54), y + h - 10]], RED);
    fillRect(x + Math.round(w * 0.47), y + h - 12, Math.round(w * 0.06), 6, [255, 180, 0]);
    for (let i = 0; i < 12; i++) circle(x + 8 + ((i * 37) % (w - 16)), y + 6 + ((i * 23) % 14), 1, WHITE);
  } else if (kind === 'court') {
    fillRect(x, y + h - 10, w, 10, [120, 120, 110]);
    fillRect(x + Math.round(w * 0.14), y + 20, Math.round(w * 0.72), h - 30, [235, 225, 200]);
    for (let i = 0; i < 4; i++) fillRect(x + Math.round(w * 0.20) + i * Math.round(w * 0.16), y + 26, 8, h - 42, NAVY);
    poly([[x + Math.round(w * 0.08), y + 20], [x + Math.round(w * 0.5), y + 4], [x + Math.round(w * 0.92), y + 20]], RED);
    fillRect(x + Math.round(w * 0.40), y + h - 20, Math.round(w * 0.2), 6, GOLD);
  } else if (kind === 'chip') {
    fillRect(x, y + h - 12, w, 12, [60, 60, 60]);
    fillRect(x + Math.round(w * 0.38), y + 10, Math.round(w * 0.24), h - 30, [20, 40, 30]);
    rect(x + Math.round(w * 0.38), y + 10, Math.round(w * 0.24), h - 30, GREEN);
    fillRect(x + Math.round(w * 0.45), y + 16, Math.round(w * 0.1), Math.round(h * 0.22), GOLD);
    for (let i = 0; i < 3; i++) {
      fillRect(x + Math.round(w * 0.24), y + 14 + i * 10, Math.round(w * 0.1), 3, GOLD);
      fillRect(x + Math.round(w * 0.66), y + 14 + i * 10, Math.round(w * 0.1), 3, GOLD);
    }
    drawText(x + Math.round(w * 0.38), y + h - 11, 'GUILTY', 1, WHITE);
  } else if (kind === 'chart') {
    fillRect(x, y + h - 18, w, 18, WHITE);
    line(x + 10, y + h - 30, x + Math.round(w * 0.5), y + 12, GREEN);
    line(x + Math.round(w * 0.5), y + 12, x + w - 10, y + h - 34, RED);
    circle(x + Math.round(w * 0.5), y + 12, 4, GREEN);
    circle(x + w - 10, y + h - 34, 4, RED);
    for (let i = 0; i < 5; i++) fillRect(x + 12 + i * 14, y + h - 24 - i * 4, 8, 6 + i * 4, NAVY);
  } else if (kind === 'radar') {
    fillRect(x, y, w, h, [20, 40, 30]);
    circle(x + Math.round(w * 0.5), y + Math.round(h * 0.55), 22, [40, 90, 50]);
    circle(x + Math.round(w * 0.5), y + Math.round(h * 0.55), 12, [60, 130, 70]);
    line(x + Math.round(w * 0.5), y + Math.round(h * 0.55), x + w - 8, y + 6, GREEN);
    circle(x + Math.round(w * 0.68), y + Math.round(h * 0.4), 4, RED);
    circle(x + Math.round(w * 0.3), y + Math.round(h * 0.65), 3, GOLD);
  } else if (kind === 'tower') {
    fillRect(x, y + h - 20, w, 20, [90, 90, 90]);
    fillRect(x + Math.round(w * 0.3), y + 8, Math.round(w * 0.4), h - 28, [70, 70, 80]);
    for (let r = 0; r < 4; r++) for (let c2 = 0; c2 < 3; c2++)
      fillRect(x + Math.round(w * 0.34) + c2 * 12, y + 14 + r * 12, 7, 7, [255, 220, 100]);
    circle(x + Math.round(w * 0.78), y + 16, 7, [255, 180, 0]);
    line(x + Math.round(w * 0.78), y + 16, x + Math.round(w * 0.78) - 14, y + 30, RED);
    line(x + Math.round(w * 0.78), y + 16, x + Math.round(w * 0.78) + 10, y + 30, RED);
  } else if (kind === 'rubble') {
    fillRect(x, y + h - 16, w, 16, [110, 100, 85]);
    poly([[x + 6, y + h - 16], [x + 30, y + 12], [x + 54, y + h - 16]], [140, 130, 115]);
    poly([[x + 50, y + h - 16], [x + 80, y + 6], [x + 110, y + h - 16]], [120, 110, 95]);
    poly([[x + 100, y + h - 16], [x + 130, y + 18], [x + 160, y + h - 16]], [140, 130, 115]);
    fillRect(x + Math.round(w * 0.6), y + 8, 30, 10, [60, 60, 60]);
  } else if (kind === 'ship') {
    fillRect(x, y + Math.round(h * 0.62), w, Math.round(h * 0.38), [40, 90, 140]);
    fillRect(x + Math.round(w * 0.15), y + Math.round(h * 0.4), Math.round(w * 0.7), 14, [120, 40, 40]);
    fillRect(x + Math.round(w * 0.3), y + Math.round(h * 0.2), Math.round(w * 0.25), 12, [200, 200, 200]);
    line(x + Math.round(w * 0.42), y + Math.round(h * 0.2), x + Math.round(w * 0.42), y + 4, INK);
    poly([[x + Math.round(w * 0.42), y + 4], [x + Math.round(w * 0.42), y + 12], [x + Math.round(w * 0.58), y + 8]], RED);
    circle(x + Math.round(w * 0.75), y + 12, 6, [255, 180, 0]);
  } else if (kind === 'scales') {
    fillRect(x, y + h - 14, w, 14, [90, 80, 60]);
    vline(x + Math.round(w * 0.5), y + 10, h - 24, GOLD);
    hline(x + Math.round(w * 0.25), y + 14, Math.round(w * 0.5), GOLD);
    line(x + Math.round(w * 0.25), y + 14, x + Math.round(w * 0.25), y + 30, GOLD);
    line(x + Math.round(w * 0.75), y + 14, x + Math.round(w * 0.75), y + 30, GOLD);
    poly([[x + Math.round(w * 0.18), y + 30], [x + Math.round(w * 0.25), y + 38], [x + Math.round(w * 0.32), y + 30]], GOLD);
    poly([[x + Math.round(w * 0.68), y + 30], [x + Math.round(w * 0.75), y + 38], [x + Math.round(w * 0.82), y + 30]], GOLD);
  } else if (kind === 'stadium') {
    fillRect(x, y + h - 24, w, 24, GREEN);
    fillRect(x, y + 6, w, Math.round(h * 0.45), [200, 200, 190]);
    for (let i = 0; i < 6; i++) fillRect(x + 8 + i * 16, y + 12, 10, 12, NAVY);
    circle(x + Math.round(w * 0.5), y + h - 12, 6, WHITE);
    line(x + 6, y + h - 12, x + w - 6, y + h - 12, WHITE);
  } else if (kind === 'crown') {
    fillRect(x, y + h - 18, w, 18, [150, 40, 90]);
    poly([[x + Math.round(w * 0.2), y + h - 18], [x + Math.round(w * 0.2), y + 14], [x + Math.round(w * 0.35), y + 26], [x + Math.round(w * 0.5), y + 8], [x + Math.round(w * 0.65), y + 26], [x + Math.round(w * 0.8), y + 14], [x + Math.round(w * 0.8), y + h - 18]], GOLD);
    circle(x + Math.round(w * 0.5), y + 8, 4, RED);
    circle(x + Math.round(w * 0.2), y + 14, 3, RED);
    circle(x + Math.round(w * 0.8), y + 14, 3, RED);
  } else if (kind === 'globe') {
    circle(x + Math.round(w * 0.5), y + Math.round(h * 0.5), Math.min(w, h) / 2 - 4, [40, 90, 140]);
    poly([[x + Math.round(w * 0.35), y + 10], [x + Math.round(w * 0.55), y + 14], [x + Math.round(w * 0.5), y + 30], [x + Math.round(w * 0.32), y + 26]], GREEN);
    poly([[x + Math.round(w * 0.55), y + Math.round(h * 0.55)], [x + Math.round(w * 0.72), y + Math.round(h * 0.6)], [x + Math.round(w * 0.66), y + h - 12], [x + Math.round(w * 0.52), y + h - 14]], GREEN);
    line(x + 6, y + Math.round(h * 0.5), x + w - 6, y + Math.round(h * 0.5), WHITE);
  } else if (kind === 'flag') {
    fillRect(x, y, w, h, [220, 220, 210]);
    vline(x + 14, y + 6, h - 12, INK);
    fillRect(x + 14, y + 8, Math.round(w * 0.55), 18, RED);
    fillRect(x + 14, y + 26, Math.round(w * 0.55), 18, WHITE);
    fillRect(x + 14, y + 44, Math.round(w * 0.55), 18, NAVY);
  } else if (kind === 'plane') {
    fillRect(x, y, w, h, [200, 220, 235]);
    poly([[x + 10, y + Math.round(h * 0.5)], [x + Math.round(w * 0.7), y + Math.round(h * 0.35)], [x + w - 8, y + Math.round(h * 0.45)], [x + Math.round(w * 0.7), y + Math.round(h * 0.55)]], [240, 240, 240]);
    poly([[x + Math.round(w * 0.4), y + Math.round(h * 0.35)], [x + Math.round(w * 0.5), y + 6], [x + Math.round(w * 0.55), y + Math.round(h * 0.4)]], [200, 200, 200]);
    fillRect(x + 12, y + h - 14, w - 24, 4, GREY);
  } else {
    fillRect(x, y + h - 16, w, 16, GREEN);
    circle(x + Math.round(w * 0.7), y + 12, 10, [255, 220, 100]);
    fillRect(x + 10, y + h - 34, 30, 18, [200, 200, 190]);
  }
}

// ---- heroes (1-3) ----
type Story = { n: number; place: string; region: string; head: string; deck: string; src: string; kind: string };
const HEROES: Story[] = [
  { n: 1, place: 'JIUQUAN, CHINA', region: 'ASIA', head: 'SHENZHOU-24 LIFTS OFF WITH PAKISTAN\'S FIRST ASTRONAUT', deck: 'Long March 2F launches at 00:18 UTC. Zeeshan Ali is the first Pakistani in orbit and the first foreign visitor to Tiangong.', src: 'REUTERS', kind: 'rocket' },
  { n: 2, place: 'BEIJING, CHINA', region: 'ASIA', head: 'CHINA PROBES POLITBURO MEMBER CHEN JINING', deck: 'Shanghai party chief under investigation; the fourth top leader probed since 2025. Shanghai pledges loyalty to Beijing.', src: 'XINHUA', kind: 'court' },
  { n: 3, place: 'NEW YORK, US', region: 'NORTH AMERICA', head: 'HUAWEI GUILTY OF STEALING TRADE SECRETS', deck: 'Convicted in a US trial over its Iran business; acquitted of racketeering. Huawei says the verdicts lack any legal basis.', src: 'REUTERS', kind: 'chip' },
];
{
  const cw = 336;
  HEROES.forEach((s, i) => {
    const x = 8 + i * cw;
    fillRect(x, 176, 4, 154, RED);
    drawText(x + 10, 178, s.n + '  ' + s.place + '  -  ' + s.region, 1, RED);
    scene(s.kind, x + 10, 192, cw - 20, 62);
    para(x + 10, 258, s.head, 26, 2, INK, 3);
    para(x + 10, 300, s.deck, 52, 1, INK, 3);
    drawText(x + 10, 324, '(' + s.src + ')', 1, GREY);
  });
}
hline(8, 334, 1008, INK);

// ---- illustrated stories 4-16 ----
const ILLU: Story[] = [
  { n: 4, place: 'WASHINGTON, US', region: 'NORTH AMERICA', head: 'TRUMP SET TO UNVEIL NEW TARIFFS', deck: 'Section 301 probe targets excess capacity in 16 partners.', src: 'REUTERS', kind: 'chart' },
  { n: 5, place: 'SANTA CLARA, US', region: 'NORTH AMERICA', head: 'NVIDIA BOUNCE FADES, SHARES SLIDE 6%', deck: 'Relief rally over Huang\'s return fizzles; Nasdaq falls 1.5%.', src: 'REUTERS', kind: 'chart' },
  { n: 6, place: 'LANGLEY, US', region: 'NORTH AMERICA', head: 'CIA AND SPY AGENCY HIT BY CYBER BREACH', deck: 'Some classified information exposed, source says.', src: 'REUTERS', kind: 'radar' },
  { n: 7, place: 'RIYADH, SAUDI ARABIA', region: 'MIDDLE EAST', head: 'HOUTHI DRONE HITS RIYADH TOWER, 11 HURT', deck: 'Financial Centre tower struck; two Indians among the injured.', src: 'AL JAZEERA', kind: 'tower' },
  { n: 8, place: 'GAZA', region: 'MIDDLE EAST', head: 'ISRAELI STRIKE KILLS HAMAS SECURITY CHIEF', deck: 'Naeem Abu Nahal among seven Palestinians killed Tuesday.', src: 'BBC', kind: 'rubble' },
  { n: 9, place: 'ZAPORIZHZHIA, UKRAINE', region: 'EUROPE', head: 'RUSSIAN STRIKE KILLS 2, WOUNDS 48', deck: 'Night attack on the southern city; Kyiv explains Libya strikes.', src: 'AP', kind: 'rubble' },
  { n: 10, place: 'CARTAGENA, COLOMBIA', region: 'SOUTH AMERICA', head: 'GUNMEN HOLD HOSTAGES IN CARTAGENA', deck: 'Armed men seize hostages after a failed truck robbery.', src: 'AP', kind: 'court' },
  { n: 11, place: 'LONDON, UK', region: 'EUROPE', head: 'UK SANCTIONS MYANMAR GENERALS', deck: 'Top military leaders hit after the Rohingya ruling.', src: 'BBC', kind: 'scales' },
  { n: 12, place: 'MADRID, SPAIN', region: 'EUROPE', head: 'REAL MADRID ROUT PSV 5-1', deck: 'Comeback win keeps a perfect Champions League start.', src: 'REUTERS', kind: 'stadium' },
  { n: 13, place: 'MILWAUKEE, US', region: 'NORTH AMERICA', head: 'BUCKS END 13-GAME SKID', deck: 'Hero scores 32 in a 116-111 win at Toronto.', src: 'REUTERS', kind: 'stadium' },
  { n: 14, place: 'SAN JUAN, PUERTO RICO', region: 'NORTH AMERICA', head: 'MISS UNIVERSE CROWNS ITS 75TH WINNER', deck: '116 women compete; Jennifer Barreto of Puerto Rico takes the crown.', src: 'AP', kind: 'crown' },
  { n: 15, place: 'JOHANNESBURG, S AFRICA', region: 'AFRICA', head: 'ZIMBABWEAN CONVICTED OVER UKRAINE FIGHT', deck: 'Court finds he tried to join Russia\'s war, Kyiv says.', src: 'BBC', kind: 'scales' },
  { n: 16, place: 'ANTALYA, TURKEY', region: 'EUROPE', head: 'COP31 FALLOUT: EU BLAMED FOR FAILURE', deck: 'Longest-ever climate talks ended without a deal.', src: 'REUTERS', kind: 'globe' },
];
{
  const rows: [number, number][] = [[5, 0], [4, 5], [4, 9]]; // [cols, startIdx]
  let y = 340;
  for (const [cols, start] of rows) {
    const cw = Math.floor(1008 / cols);
    for (let k = 0; k < cols; k++) {
      const s = ILLU[start + k];
      const x = 8 + k * cw;
      if (k > 0) vline(x - 4, y, 74, GREY);
      scene(s.kind, x, y, cw - 12, 30);
      fillRect(x, y, 18, 14, RED);
      drawText(x + (s.n < 10 ? 6 : 3), y + 3, String(s.n), 1, WHITE);
      para(x, y + 32, s.head, Math.floor((cw - 12) / 6) - 1, 1, INK, 2);
      para(x, y + 50, s.deck, Math.floor((cw - 12) / 6) - 1, 1, INK, 2);
      drawText(x, y + 68, s.place + ' (' + s.src + ')', 1, RED);
    }
    y += 78;
  }
}
hline(8, 576, 1008, INK);

// ---- world map with pins ----
drawText(8, 582, 'WHERE IT HAPPENED - PINS MATCH STORY NUMBERS', 1, INK);
{
  const mx = 8, my = 598, mw = 1008, mh = 96;
  fillRect(mx, my, mw, mh, [190, 220, 235]);
  const X = (lon: number) => mx + ((lon + 180) / 360) * mw;
  const Y = (lat: number) => my + ((75 - lat) / 135) * mh;
  const cont = (pts: [number, number][]) => poly(pts.map(([lo, la]) => [Math.round(X(lo)), Math.round(Y(la))] as [number, number]), TAN);
  cont([[-168, 66], [-140, 70], [-125, 72], [-110, 73], [-95, 80], [-85, 70], [-75, 73], [-65, 60], [-55, 52], [-60, 47], [-70, 42], [-75, 35], [-80, 32], [-85, 30], [-90, 21], [-95, 19], [-97, 16], [-105, 20], [-115, 28], [-125, 40], [-125, 49], [-140, 60], [-155, 58], [-165, 60]]);
  cont([[-55, 60], [-45, 60], [-40, 70], [-30, 68], [-22, 70], [-25, 76], [-40, 80], [-55, 76]]);
  cont([[-80, 10], [-75, 7], [-70, 11], [-62, 10], [-52, 5], [-50, 0], [-40, -5], [-35, -8], [-40, -20], [-48, -28], [-55, -35], [-65, -45], [-70, -52], [-73, -40], [-72, -30], [-70, -18], [-77, -12], [-80, -5], [-81, 0]]);
  cont([[-10, 36], [-9, 43], [-2, 48], [-5, 50], [0, 51], [3, 53], [8, 57], [10, 59], [18, 56], [21, 55], [24, 58], [28, 60], [30, 62], [32, 70], [40, 68], [45, 68], [40, 60], [35, 55], [30, 46], [28, 41], [23, 36], [19, 40], [12, 44], [8, 44], [3, 43], [-2, 37]]);
  cont([[-6, 35], [0, 36], [10, 37], [11, 34], [20, 32], [32, 31], [35, 28], [37, 22], [40, 15], [43, 11], [48, 11], [51, 12], [46, 5], [41, -2], [40, -10], [36, -18], [32, -26], [28, -33], [20, -35], [16, -28], [12, -18], [9, -1], [9, 4], [-8, 5], [-13, 8], [-17, 15], [-17, 21], [-15, 27], [-10, 31]]);
  cont([[35, 36], [36, 36], [43, 38], [48, 39], [50, 30], [54, 26], [57, 26], [58, 22], [61, 25], [66, 25], [70, 24], [72, 20], [77, 8], [80, 7], [85, 18], [89, 22], [92, 21], [94, 16], [97, 10], [100, 8], [104, 2], [108, 11], [110, 20], [114, 22], [120, 25], [122, 30], [127, 35], [130, 38], [132, 43], [138, 46], [141, 50], [142, 55], [140, 60], [142, 62], [156, 60], [160, 62], [162, 60], [158, 52], [162, 58], [170, 60], [170, 66], [178, 65], [178, 62], [170, 62], [165, 60], [158, 55], [155, 50], [150, 45], [142, 42], [140, 38], [135, 43], [130, 42], [128, 38], [126, 40], [122, 37], [120, 32], [115, 30], [110, 25], [105, 15], [100, 12], [95, 15], [90, 22], [85, 20], [80, 15], [75, 20], [70, 25], [65, 25], [60, 25], [55, 26], [52, 28], [50, 30], [48, 30], [44, 29], [42, 33], [40, 36], [38, 36]]);
  cont([[114, -22], [114, -30], [115, -35], [120, -34], [124, -33], [129, -32], [132, -32], [135, -35], [138, -35], [140, -38], [145, -38], [150, -37], [153, -32], [153, -27], [150, -22], [146, -19], [142, -11], [137, -12], [135, -15], [132, -12], [130, -13], [126, -14], [122, -17], [118, -20]]);
  const PINS: [number, number, number][] = [
    [1, 98, 40], [2, 116, 40], [3, -74, 41], [4, -77, 39], [5, -122, 37], [6, -76, 38],
    [7, 47, 25], [8, 34, 31], [9, 35, 48], [10, -75, 10], [11, 0, 51], [12, -4, 40],
    [13, -88, 43], [14, -66, 18], [15, 28, -26], [16, 31, 37],
  ];
  for (const [n, lo, la] of PINS) {
    const cx = Math.round(X(lo)), cy = Math.round(Y(la));
    circle(cx, cy, 8, RED);
    circle(cx, cy, 8, RED);
    const label = String(n);
    drawText(cx - (label.length === 1 ? 3 : 6), cy - 4, label, 1, WHITE);
  }
}
hline(8, 700, 1008, INK);

// ---- also-on list 17-50 ----
const ALSO: string[] = [
  '17 BERLIN: GERMAN BUSINESS MORALE RISES IN NOVEMBER (REUTERS)',
  '18 MEXICO CITY: MEXICO INFLATION HITS 3-MONTH HIGH (REUTERS)',
  '19 WASHINGTON: US CONSUMER CONFIDENCE AT NEAR 2-YEAR HIGH (REUTERS)',
  '20 TOKYO: NIKKEI SEEN AT 65,000 BY JUNE 2027 (REUTERS)',
  '21 NEW YORK: S&P 500 SEEN GAINING OVER 13% BY END 2027 (REUTERS)',
  '22 CARACAS: CITI WEIGHS RETURN TO VENEZUELA 5 YEARS AFTER EXIT (REUTERS)',
  '23 CARACAS: VENEZUELA REPORTS $237.5BN PUBLIC DEBT AFTER AUDIT (REUTERS)',
  '24 WASHINGTON: US FARM SECRETARY VOWS TO FIGHT COURT ORDER (REUTERS)',
  '25 WASHINGTON: NATO VOWS TO DEFEND SPACE AS THREATS GROW (REUTERS)',
  '26 BRUSSELS: EU PROPOSES 22ND RUSSIA SANCTIONS PACKAGE (REUTERS)',
  '27 KYIV: UKRAINE SHARES VIDEO OF STRIKES ON RUSSIAN SHIPS OFF LIBYA (AP)',
  '28 ADEN: HOUTHIS CLOSE IN ON ADEN, 60 KM AWAY (REUTERS)',
  '29 DAMASCUS: LANDMINE TOLL AT FIVE-YEAR HIGH, 7,000 HURT (REUTERS)',
  '30 LONDON: OXFAM SAYS GAZA ATTACKS LEFT A TOXIC WASTELAND (REUTERS)',
  '31 SEOUL: S KOREA EDUCATION MINISTER QUITS OVER EXAM CHEATING (AP)',
  '32 LONDON: TWO ARRESTED AFTER BREAK-IN AT PRINCE WILLIAM\'S HOME (AP)',
  '33 NEW YORK: GOLD EASES TO $3,544 AHEAD OF US INFLATION DATA (REUTERS)',
  '34 WASHINGTON: US INFLATION AND Q3 GDP DATA DUE, FED HIKE SEEN (REUTERS)',
  '35 BEIRUT: LEBANON AND QATAR CONDEMN HOUTHI ATTACK ON RIYADH (REUTERS)',
  '36 LONDON: BANK OF ENGLAND CHIEF BAILEY FACES MPS OVER RATES (REUTERS)',
  '37 LONDON: UK FIRMS AIDING UKRAINE WARNED TO BRACE FOR SABOTAGE (REUTERS)',
  '38 LONDON: ARSENAL HOLD 1-1 BY DORTMUND; MAN CITY DRAW 2-2 (REUTERS)',
  '39 ISTANBUL: GALATASARAY EDGE ASTON VILLA 1-0 IN EUROPE (REUTERS)',
  '40 INDIANAPOLIS: PACERS BEAT CHAMPIONS THUNDER 125-120 (REUTERS)',
  '41 HOUSTON: DURANT SCORES 32 AS ROCKETS BEAT CLIPPERS 116-104 (REUTERS)',
  '42 CHICAGO: BULLS BEAT TIMBERWOLVES 126-111 (REUTERS)',
  '43 PORTLAND: TRAIL BLAZERS BEAT 76ERS 128-111 (REUTERS)',
  '44 LOS ANGELES: LAKERS BEAT JAZZ 109-94 (REUTERS)',
  '45 PHOENIX: SUNS EDGE GRIZZLIES 105-103 IN OVERTIME (REUTERS)',
  '46 MINNEAPOLIS: TIMBERWOLVES ROUT NETS 142-116 (REUTERS)',
  '47 WASHINGTON: COMMANDERS BEAT BENGALS 22-20 AT THE GUN (REUTERS)',
  '48 DOHA: SURYAVANSHI, 15, SMASHES 204 OFF 53 BALLS, A RECORD (BBC)',
  '49 NEW YORK: DELL LIFTS FORECASTS AFTER RECORD QUARTER (REUTERS)',
  '50 SYDNEY: AUSTRALIA CPI HOTTER THAN FORECAST, AUSSIE JUMPS (REUTERS)',
];
drawText(8, 706, 'ALSO ON WEDNESDAY 25 NOVEMBER - 34 MORE STORIES', 1, INK);
{
  ALSO.forEach((item, i) => {
    const col = i < 17 ? 0 : 1;
    const row = i % 17;
    drawText(8 + col * 508, 722 + row * 13, item, 1, INK);
  });
}
hline(8, 946, 1008, INK);

// ---- date-check box + footer ----
rect(8, 952, 1008, 46, RED);
drawText(14, 956, 'DATE CHECK - WIRES READ TO 05:00 UTC, WED 25 NOV 2026. STILL DEVELOPING FROM TUE 24 NOV:', 1, RED);
drawText(14, 968, 'CHEN PROBE, HUAWEI VERDICT, RIYADH STRIKE. NOT TODAY: COP31 NO-DEAL END (22 NOV),', 1, INK);
drawText(14, 980, 'US MIDTERM VOTE (3 NOV), NVIDIA RECORD SURGE (23 NOV). THOSE STORIES ARE LEFT OUT.', 1, INK);
drawText(8, 1004, 'SOURCES: REUTERS, AP, BBC, AL JAZEERA, XINHUA, THE HINDU, USA TODAY. EVERY STORY REPORTED 25 NOV 2026. PICTURES AND MAP DRAWN IN CODE.', 1, GREY);

// ---- PNG encode (deterministic: fixed filter, no ancillary chunks) ----
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0;
  Buffer.from(buf.subarray(y * W * 3, (y + 1) * W * 3)).copy(raw, y * (1 + W * 3) + 1);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), png);
