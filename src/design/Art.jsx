// Gentle cursive line-art, one scene per page. Strokes draw themselves in (see material.css).
const D = (d, c = 1, i = 0) => <path key={i + d.slice(0, 9)} d={d} className={`a${c}`} pathLength="1" style={{ '--i': i }} />;
const T = (x, y, r, s, kids) => <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>{kids}</g>;
const cap = (i) => [D('M-18-13H18a13 13 0 0 1 0 26H-18a13 13 0 0 1 0-26Z', 1, i), D('M3-13V13', 1, i + 1), D('M-25-4q2-7 9-8', 2, i + 2)];
const leaf = (i) => [D('M0 0C8-16 30-22 48-18C44 0 22 10 0 0Z', 1, i), D('M2-1C16-7 30-11 44-16', 1, i + 1)];
const spark = (i) => D('M0-9Q1-1 9 0Q1 1 0 9Q-1 1-9 0Q-1-1 0-9Z', 2, i);
const plus = (i) => D('M0-11V11M-11 0H11', 1, i);
const heart = (i) => D('M0 16C-32-6-18-30 0-13C18-30 32-6 0 16Z', 2, i);
const curl = (i) => D('M0 0c18-26 54-10 40 12c-10 14-32 4-22-9c6-7 18-3 13 5', 3, i);
const wave = (i) => D('M24 152C76 140 116 162 160 150S250 140 296 150', 3, i);
const bot = (x, i) => [D(`M${x} 136V94a8 8 0 0 1 8-8h24a8 8 0 0 1 8 8V136`, 1, i), D(`M${x + 6} 86v-9h28v9`, 1, i + 1), D(`M${x + 6} 108h28v18h-28Z`, 3, i + 2)];
const S = {
  welcome: () => <>{wave(0)}{T(160, 78, 0, 1.5, [heart(1)])}{T(160, 74, 0, .8, [plus(2)])}{T(64, 58, -28, 1, cap(3))}{T(262, 104, 24, 1, cap(6))}{T(84, 128, -20, 1, leaf(9))}{T(236, 52, 200, .9, leaf(11))}{T(30, 100, 0, .8, [curl(13)])}{T(120, 36, 0, 1, [spark(15)])}{T(290, 60, 0, .8, [spark(16)])}</>,
  scan: () => <>{wave(0)}{D('M112 30H198a8 8 0 0 1 8 8V128a8 8 0 0 1-8 8H112a8 8 0 0 1-8-8V38a8 8 0 0 1 8-8Z', 1, 1)}{D('M190 30v12a4 4 0 0 0 4 4h12', 1, 2)}{T(124, 62, 0, .75, [D('M-8-6V14M-8-6H0q9 0 9 7q0 7-9 7H-8M3 8L15 22M15 8L3 22', 1, 3)])}{D('M122 92c8-6 14 6 22 0s14 6 22 0s14 6 22 0', 3, 4)}{D('M122 108c8-6 14 6 22 0s14 6 22 0', 3, 5)}{D('M178 124a9 9 0 1 1-18 0a9 9 0 0 1 18 0Z', 2, 6)}{D('M84 52V40a14 14 0 0 1 14-14H110', 1, 7)}{D('M226 52V40a14 14 0 0 0-14-14H202', 1, 8)}{D('M84 112v12a14 14 0 0 0 14 14H110', 1, 9)}{D('M226 112v12a14 14 0 0 1-14 14H202', 1, 10)}{T(240, 118, -30, .9, leaf(11))}{T(62, 110, -25, .9, cap(13))}{T(262, 40, 0, 1, [spark(16)])}</>,
  extract: () => <>{wave(0)}{D('M192 78a42 42 0 1 1-84 0a42 42 0 0 1 84 0Z', 1, 1)}{D('M182 110l34 34q5 5 0 10', 1, 2)}{T(150, 78, -35, .85, cap(3))}{D('M56 100c12-22 34-22 46 0', 3, 6)}{D('M40 120c16-14 28-14 44 0', 3, 7)}{D('M226 88c8-6 14 6 22 0s14 6 22 0', 3, 8)}{D('M226 104c8-6 14 6 22 0', 3, 9)}{T(236, 56, -40, .9, leaf(10))}{T(70, 50, 0, 1.1, [spark(12)])}{T(280, 130, 0, .8, [spark(13)])}</>,
  pharmacy: () => <>{wave(0)}{D('M104 72V134H216V72', 1, 1)}{D('M90 72L102 38H218L230 72q-10 14-20 0q-10 14-20 0q-10 14-20 0q-10 14-20 0q-10 14-20 0q-10 14-20 0q-10 14-20 0Z', 1, 2)}{D('M146 134V110a14 14 0 0 1 28 0V134', 1, 3)}{D('M114 92h24v22h-24Z', 3, 4)}{T(196, 104, 0, .9, [plus(5), D('M12 0a12 12 0 1 1-24 0a12 12 0 0 1 24 0Z', 1, 6)])}{D('M262 100c-14-18-22-26-22-40a22 22 0 0 1 44 0c0 14-8 22-22 40Z', 2, 7)}{D('M269 60a7 7 0 1 1-14 0a7 7 0 0 1 14 0Z', 2, 8)}{T(54, 126, -20, .9, leaf(9))}{T(60, 50, 0, 1, [spark(11)])}</>,
  cart: () => <>{wave(0)}{D('M92 82H228L212 136H108Z', 1, 1)}{D('M102 104q58 12 116 0', 3, 2)}{D('M106 120q54 10 108 0', 3, 3)}{D('M122 82C122 34 198 34 198 82', 1, 4)}{T(150, 60, -20, .9, cap(5))}{T(204, 66, -60, .8, leaf(8))}{T(250, 50, 0, 1, [spark(10)])}{T(64, 70, 0, .8, [curl(11)])}</>,
  checkout: () => <>{wave(0)}{D('M96 50H220a10 10 0 0 1 10 10V108a10 10 0 0 1-10 10H96a10 10 0 0 1-10-10V60a10 10 0 0 1 10-10Z', 1, 1)}{D('M86 74H230', 1, 2)}{D('M102 98c14-12 26 10 40 0s22 8 34 0', 3, 3)}{D('M104 62h20', 2, 4)}{D('M252 82l24 8v20c0 18-10 28-24 34c-14-6-24-16-24-34V90Z', 1, 5)}{D('M241 112l8 8l15-16', 2, 6)}{T(56, 128, -20, .9, leaf(7))}{T(150, 140, 0, .9, [spark(9)])}</>,
  pay: () => <>{wave(0)}{D('M96 62H216a12 12 0 0 1 12 12V124a12 12 0 0 1-12 12H100a12 12 0 0 1-12-12V70', 1, 1)}{D('M88 70a12 12 0 0 1 12-12H190', 1, 2)}{D('M228 92H202a11 11 0 0 0 0 22H228', 1, 3)}{D('M206 103h.1', 2, 4)}{T(120, 36, 0, .9, [heart(5)])}{T(262, 64, 25, 1, cap(6))}{T(60, 120, -20, .8, leaf(9))}{T(272, 134, 0, .8, [spark(11)])}</>,
  reminder: () => <>{wave(0)}{D('M160 36c-24 0-38 18-38 42v22l-12 14H210l-12-14V78c0-24-14-42-38-42Z', 1, 1)}{D('M148 120a12 12 0 0 0 24 0', 1, 2)}{D('M160 36V28', 1, 3)}{D('M104 58c-8 7-12 16-12 26', 3, 4)}{D('M216 58c8 7 12 16 12 26', 3, 5)}{D('M92 40c-12 10-18 24-18 38', 3, 6)}{D('M228 40c12 10 18 24 18 38', 3, 7)}{T(256, 128, 25, 1, cap(8))}{D('M84 136a16 16 0 1 1-32 0a16 16 0 0 1 32 0Z', 2, 11)}{D('M68 126v10l7 4', 2, 12)}{T(52, 60, 0, 1, [spark(13)])}</>,
  admin: () => <>{D('M60 136H260', 3, 0)}{bot(70, 1)}{bot(118, 4)}{D('M196 56h44a6 6 0 0 1 6 6V136H190V62a6 6 0 0 1 6-6Z', 1, 9)}{D('M206 56v-8h24v8', 1, 10)}{D('M200 82l6 6l11-11', 2, 11)}{D('M224 84h14', 3, 12)}{D('M200 106l6 6l11-11', 2, 13)}{D('M224 108h14', 3, 14)}{T(150, 40, 0, 1, [spark(15)])}{T(262, 126, -30, .8, cap(16))}{T(36, 112, -30, .8, leaf(19))}</>,
  ada: () => <>{wave(0)}{D('M130 30a26 26 0 1 1 0 52 26 26 0 0 1 0-52Z', 1, 1)}{D('M108 42q4-14 22-14t22 14', 1, 2)}{D('M74 140C74 104 98 92 130 92C162 92 186 104 186 140', 1, 3)}{D('M118 56h6M136 56h6', 3, 4)}{D('M120 70q10 8 20 0', 2, 5)}{T(250, 92, -8, 1, [D('M-34-26h68a6 6 0 0 1 6 6v40a6 6 0 0 1-6 6h-68a6 6 0 0 1-6-6V-20a6 6 0 0 1 6-6Z', 1, 6), D('M-28-12h30', 3, 7), D('M-28 0h22', 3, 8), D('M-28 12h34', 3, 9)])}{T(46, 46, 0, 1, [spark(10)])}{T(302, 44, 0, .9, [spark(11)])}{T(30, 122, -20, .65, leaf(12))}</>,
  track: () => <>{wave(0)}{D('M56 132C92 100 128 128 168 96S236 62 262 42', 3, 1)}{T(56, 132, 0, 1, [D('M-12 0a12 12 0 1 0 24 0a12 12 0 1 0-24 0Z', 1, 2), D('M-6 0h12M0-6v12', 2, 3)])}{T(168, 96, -20, 1, [D('M0-9 9 9-9 9Z', 1, 4)])}{T(262, 42, 0, 1, [D('M0 16C-32-6-18-30 0-13C18-30 32-6 0 16Z', 2, 5)])}{T(112, 52, 0, 1, [spark(6)])}</>,
  dashboard: () => <>{wave(0)}{D('M56 136V104M84 136V86M112 136V94M140 136V72', 3, 1)}{D('M40 136H160', 1, 2)}{D('M186 70h56a6 6 0 0 1 6 6v60h-68V76a6 6 0 0 1 6-6Z', 1, 3)}{D('M196 62h8v-8h20v8h8', 1, 4)}{D('M200 96l6 6 11-11', 2, 5)}{T(268, 120, 0, 1, [spark(6)])}{T(64, 48, 0, 1, [spark(7)])}</>,
  profile: () => <>{wave(0)}{D('M160 40a24 24 0 1 1 0 48 24 24 0 0 1 0-48Z', 1, 1)}{D('M126 132q8-30 34-30t34 30', 1, 2)}{D('M258 96c-12-16-19-23-19-35a19 19 0 0 1 38 0c0 12-7 19-19 35Z', 2, 3)}{D('M264 61a6 6 0 1 1-12 0a6 6 0 0 1 12 0Z', 2, 4)}{T(60, 86, 0, 1, [spark(5)])}{T(232, 34, 0, .9, [spark(6)])}{T(52, 122, -20, .8, leaf(7))}</>,
};
const CAP = {
  scan: ['Show us your prescription', 'Lay it flat in good light and we will read the handwriting.'],
  extract: ['Reading the handwriting', 'Finding every medicine, dose and frequency.'],
  pharmacy: ['Pharmacies near you', 'Compare price and stock, then add what you need.'],
  cart: ['Your basket', 'Review quantities from each pharmacy.'],
  checkout: ['Almost there', 'Choose how you would like to pay.'],
  pay: ['Complete your payment', 'Confirm to place your order.'],
  reminder: ['Never miss a dose', 'We will nudge you at the right times.'],
  admin: ['Pharmacy stock', 'Keep medicines and prices up to date.'],
  ada: ['Meet Ada', 'She has a prescription ready, and a delivery on the way.'],
  track: ['On the way', 'Follow your rider all the way to your door.'],
  dashboard: ['Pharmacy pulse', 'Sales, staff and stock in one place.'],
  profile: ['Your details', 'So we always know where to deliver.'],
};
export default function Art({ scene, compact }) {
  const c = CAP[scene];
  return (
    <figure className={`h-art${compact ? " is-compact" : ""}`}>
      <svg viewBox="0 0 320 170" role="img" aria-label={c ? c[0] : 'Hera'}>
        <defs><radialGradient id={`g-${scene}`} cx="50%" cy="50%" r="60%"><stop offset="0" stopColor="#c3ebe5" /><stop offset="1" stopColor="#c3ebe5" stopOpacity="0" /></radialGradient></defs>
        <ellipse cx="160" cy="88" rx="150" ry="74" fill={`url(#g-${scene})`} />
        {S[scene]()}
      </svg>
      {c && !compact && <figcaption><b>{c[0]}</b><span>{c[1]}</span></figcaption>}
    </figure>
  );
}
