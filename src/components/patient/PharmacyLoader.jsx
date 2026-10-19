import React from "react";
import Art from "../../design/Art";

const D = (d, c = 1, i = 0) => <path key={i + d.slice(0, 9)} d={d} className={`a${c}`} pathLength="1" style={{ "--i": i }} />;
const T = (x, y, r, s, kids) => <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>{kids}</g>;
const cap = (i) => [D('M-18-13H18a13 13 0 0 1 0 26H-18a13 13 0 0 1 0-26Z', 1, i), D('M3-13V13', 1, i + 1), D('M-25-4q2-7 9-8', 2, i + 2)];
const leaf = (i) => [D('M0 0C8-16 30-22 48-18C44 0 22 10 0 0Z', 1, i), D('M2-1C16-7 30-11 44-16', 1, i + 1)];
const spark = (i) => D('M0-9Q1-1 9 0Q1 1 0 9Q-1 1-9 0Q-1-1 0-9Z', 2, i);
const wave = (i) => D('M24 152C76 140 116 162 160 150S250 140 296 150', 3, i);

const PharmacyLoader = () => (
  <div className="h-loader-wrap">
    <figure className="h-art" style={{ margin: 0 }}>
      <svg viewBox="0 0 320 170" role="img" aria-label="Loading pharmacy inventory">
        <defs><radialGradient id="g-load" cx="50%" cy="50%" r="60%"><stop offset="0" stopColor="#c3ebe5" /><stop offset="1" stopColor="#c3ebe5" stopOpacity="0" /></radialGradient></defs>
        <ellipse cx="160" cy="88" rx="150" ry="74" fill="url(#g-load)" />
        {wave(0)}
        {D('M104 72V134H216V72', 1, 1)}
        {D('M90 72L102 38H218L230 72q-10 14-20 0q-10 14-20 0q-10 14-20 0q-10 14-20 0q-10 14-20 0q-10 14-20 0Z', 1, 2)}
        {D('M146 134V110a14 14 0 0 1 28 0V134', 1, 3)}
        {D('M114 92h24v22h-24Z', 3, 4)}
        {T(196, 104, 0, .9, [spark(5), D('M12 0a12 12 0 1 1-24 0a12 12 0 0 1 24 0Z', 1, 6)])}
        {D('M262 100c-14-18-22-26-22-40a22 22 0 0 1 44 0c0 14-8 22-22 40Z', 2, 7)}
        {D('M269 60a7 7 0 1 1-14 0a7 7 0 0 1 14 0Z', 2, 8)}
        {T(54, 126, -20, .9, leaf(9))}
        {T(60, 50, 0, 1, [spark(11)])}
      </svg>
    </figure>
    <div className="h-loader-status">
      <span className="h-loader-dot" />
      <span className="h-loader-dot" />
      <span className="h-loader-dot" />
      <p className="h-loader-txt">Loading pharmacy inventory</p>
    </div>
  </div>
);

export default PharmacyLoader;
