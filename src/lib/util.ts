export const PAL: [string, string][] = [
  ['#2f4858', '#e9c46a'], ['#7a2e2e', '#f2d0a4'], ['#1f3b2c', '#a7c4a0'], ['#3d2c5e', '#f4a6a6'],
  ['#8a4b14', '#f6e7c1'], ['#123c69', '#ee6c4d'], ['#4a3728', '#d9b48f'], ['#20524a', '#f7d08a'],
  ['#5c1a3b', '#f1b5cb'], ['#2b2d42', '#8ecae6'], ['#6b3e26', '#ffc857'], ['#1b4332', '#ffb4a2'],
];

export const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export const uuid = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16),
      );

export const nowISO = () => new Date().toISOString();

export function starPts(cx: number, cy: number, r: number) {
  const p: string[] = [];
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 ? r * 0.45 : r;
    p.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return p.join(' ');
}

export const fmtDay = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};
export const fmtMD = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
};
