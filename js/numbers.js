// numbers.js — number-line math + formatting helpers.
// Everything that turns a floor's numeric value into something the child sees
// lives here, so whole numbers / decimals / fractions render consistently.

/** Round away binary floating-point fuzz (0.30000000004 -> 0.3). */
export function round(x, p = 6) {
  const f = Math.pow(10, p);
  return Math.round(x * f) / f;
}

/** Stable string key for a floor value, so 0.1*3 and 0.3 match. */
export function key(x) {
  return String(Math.round(x * 1000));
}

/** All floor values from min to max inclusive, spaced by step (top-down order). */
export function rangeFloors(min, max, step) {
  const steps = Math.round((max - min) / step);
  const floors = [];
  for (let i = 0; i <= steps; i++) floors.push(round(min + i * step));
  return floors; // ascending
}

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

/** Decompose a value into a signed mixed fraction over a 12ths base (covers ½ ¼ ⅓ ⅙). */
export function toMixedFraction(value) {
  const sign = value < 0 ? '−' : '';
  const base = 12;
  let num = Math.round(Math.abs(value) * base);
  let den = base;
  const g = gcd(num, den);
  num /= g; den /= g;
  const whole = Math.floor(num / den);
  const rem = num - whole * den;
  return { sign, whole, num: rem, den };
}

/** Plain decimal text with trailing zeros trimmed: 1.5, 2, 0.1, −1.5 */
export function formatDecimal(value) {
  const s = parseFloat(round(value, 4).toFixed(4)).toString();
  return s.replace('-', '−'); // proper minus sign
}

/** Plain-text value (used for aria-labels and logs). */
export function formatValue(value, type) {
  if (type === 'fraction') {
    const f = toMixedFraction(value);
    if (f.num === 0) return (f.sign + f.whole);
    if (f.whole === 0) return `${f.sign}${f.num}/${f.den}`;
    return `${f.sign}${f.whole} ${f.num}/${f.den}`;
  }
  if (type === 'decimal') return formatDecimal(value);
  return String(value).replace('-', '−');
}

/**
 * Rich HTML for a value — stacked numerator/denominator for fractions.
 * Wrapped in a dir="ltr" span so digits + minus read correctly inside RTL.
 */
export function formatValueHTML(value, type) {
  if (type === 'fraction') {
    const f = toMixedFraction(value);
    if (f.num === 0) {
      return `<span class="numval" dir="ltr">${f.sign}${f.whole}</span>`;
    }
    const frac = `<span class="frac"><span class="frac-n">${f.num}</span><span class="frac-d">${f.den}</span></span>`;
    const wholePart = f.whole !== 0 ? `<span class="frac-w">${f.whole}</span>` : '';
    return `<span class="numval numval-frac" dir="ltr">${f.sign}${wholePart}${frac}</span>`;
  }
  const text = type === 'decimal' ? formatDecimal(value) : String(value).replace('-', '−');
  return `<span class="numval" dir="ltr">${text}</span>`;
}

/** Ground floor gets a special lobby label. */
export function isGround(value) {
  return Math.abs(value) < 1e-9;
}
