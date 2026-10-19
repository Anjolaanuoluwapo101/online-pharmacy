import { createContext, useContext, useRef, useState, useEffect } from 'react';
import './hera.css';
const P = {
 back:'m15 18-6-6 6-6', search:'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm10 18-4.3-4.3',
 bell:'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
 camera:'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
 bag:'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0',
 pin:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
 clock:'M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
 heart:'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z',
 check:'M20 6 9 17l-5-5', home:'m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
 user:'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
 phone:'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z',
 nav:'m3 11 19-9-9 19-2-8z', tag:'M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4zM7 7h.01',
 plus:'M5 12h14M12 5v14', minus:'M5 12h14', more:'M12 12h.01M19 12h.01M5 12h.01', circle:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM8 12h8',
 arrow:'M5 12h14m-7-7 7 7-7 7', scan:'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10',
  zap:'M13 2 3 14h9l-1 8 10-12h-9z', image:'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6',
  calendar:'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  pill:'m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Zm-3.5-12 7 7',
  info:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01',
};
const cx = (...a) => a.filter(Boolean).join(' ');
export const Icon = ({ n, size = 18, stroke = 2 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d={P[n]} /></svg>
);
/** tone: plain | home | track | success */
const Nest = createContext(false);
export const PhoneFrame = ({ tone = 'plain', children }) => {
  const nested = useContext(Nest); const ref = useRef(null);
  if (nested) return <>{children}</>;
  const move = (e) => { const el = ref.current; if (!el || e.pointerType === 'touch') return;
    const x = e.clientX / window.innerWidth, y = e.clientY / window.innerHeight;
    el.style.setProperty('--ry', `${(x - .5) * 8}deg`); el.style.setProperty('--rx', `${(.5 - y) * 6}deg`);
    el.style.setProperty('--mx', `${x * 100}%`); el.style.setProperty('--my', `${y * 100}%`); };
  const leave = () => { const el = ref.current; if (el) { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); } };
  return (
    <Nest.Provider value>
      <div className="h-stage" ref={ref} onPointerMove={move} onPointerLeave={leave}>
        <i className="h-orb o1" /><i className="h-orb o2" /><i className="h-orb o3" />
        <div className={cx('h-phone', `h-bg-${tone}`)}><i className="h-aurora" />{children}</div>
      </div>
    </Nest.Provider>
  );
};
export const IconButton = ({ icon, variant, badge, dot, size = 18, ...p }) => (
  <button className={cx('h-ibtn', variant && `is-${variant}`)} {...p}>
    <Icon n={icon} size={size} />{badge ? <span className="h-badge">{badge}</span> : null}{dot ? <i className="h-dot" /> : null}
  </button>
);
export const ScreenHeader = ({ title, onBack, right, meta }) => (
  <header className="h-head">
    {onBack !== null && <IconButton icon="back" onClick={onBack} />}
    <span className="h-head-title">{title}</span>
    {meta ? <span className="h-head-meta">{meta}</span> : right}
  </header>
);
/** variant: ink | teal | outline · size: md | sm | xs · fit = auto width */
export const Button = ({ variant = 'ink', size, fit, icon, children, ...p }) => (
  <button className={cx('h-btn', variant !== 'ink' && `is-${variant}`, size && `is-${size}`, fit && 'is-fit')} {...p}>{icon && <Icon n={icon} size={16} />}{children}</button>
);
export const GreetingBar = ({ name, city, avatar }) => (
  <div className="h-greet"><div className="h-avatar" style={{ backgroundImage: avatar && `url(${avatar})` }} />
    <div style={{ flex: 1 }}><small>{name}</small><b><Icon n="pin" size={13} />{city}</b></div><IconButton icon="bell" dot /></div>
);
export const HeroTitle = ({ light, strong }) => <h1 className="h-hero"><span>{light}</span>{strong}</h1>;
export const QuickActions = ({ items }) => (
  <div className="h-qa-grid">{items.map(([icon, label]) => <button key={label} className="h-qa"><i><Icon n={icon} size={15} /></i>{label}</button>)}</div>
);
export const ProductImage = ({ tone = 'cyan', src, className, style }) => (
  <div className={cx('h-img', `tone-${tone}`, className)} style={style}>
    {src ? <img src={src} alt="" /> : <><i className="h-citrus" /><i className="h-bottle" /></>}
  </div>
);
export const ProductCard = ({ tone, name, price, src, added, liked, onAdd }) => (
  <article className={cx('h-pcard', `tone-${tone}`)}>
    <ProductImage tone={tone} src={src} />
    <button className={cx('h-heart', liked && 'is-on')}><Icon n="heart" size={16} /></button>
    <div className="h-pinfo"><p>{name}</p><b>{price}</b></div>
    <button className={cx('h-add', added && 'is-added')} onClick={onAdd}><Icon n={added ? 'check' : 'plus'} size={20} /></button>
  </article>
);
export const Rail = ({ children }) => <div className="h-rail">{children}</div>;
export const TabBar = ({ items, active, onScan, onChange }) => {
  const t = (i) => <button key={i.id} className={cx('h-tab', active === i.id && 'is-on')} onClick={() => onChange?.(i.id)}>
    <span style={{ position: 'relative' }}><Icon n={i.icon} size={18} />{i.badge ? <span className="h-badge" style={{ top: -6, right: -9 }}>{i.badge}</span> : null}</span>{i.label}</button>;
  return <nav className="h-tabs">{items.slice(0, 2).map(t)}<button className="h-scan" onClick={onScan}><Icon n="scan" size={22} /></button>{items.slice(2).map(t)}</nav>;
};
export const Stepper = ({ value, onChange, max }) => (
  <div className="h-step"><button onClick={() => onChange(Math.max(0, value - 1))} aria-label="Decrease quantity"><Icon n="minus" size={13} /></button><span>{value}</span><button className="plus" onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)} aria-label="Increase quantity"><Icon n="plus" size={13} /></button></div>
);
export const Radio = ({ checked }) => <span className={cx('h-radio', checked && 'is-on')} />;
/** tone: teal(default) | concern | dosage */
export const Chip = ({ tone, children }) => <span className={cx('h-chip', tone && `is-${tone}`)}>{children}</span>;
/** Prescription scanner. boxes: [{label,color,style}] ; progress 0-100 shows scan line */
export const ScanFrame = ({ children, boxes = [], scanning }) => (
  <div className="h-scanframe"><div className="h-doc">{children}{scanning != null && <i className="h-scanline" style={{ top: `${scanning}%` }} />}</div>
    {['tl', 'tr', 'bl', 'br'].map((c) => <i key={c} className={cx('h-corner', c)} />)}
    {boxes.map((b) => <div key={b.label} className="h-sbox" style={{ '--c': b.color, ...b.style }}><em>{b.label}</em></div>)}
  </div>
);
export const ScanStatus = ({ title, children }) => <div className="h-status-txt">{title && <b>{title}</b>}{children}</div>;
/** state: idle | busy | done */
export const Shutter = ({ state = 'idle', progress = 0 }) => (
  <button className={cx('h-shutter', state !== 'idle' && `is-${state}`)} style={{ '--p': progress }}>
    {state === 'busy' && `${progress}%`}{state === 'done' && <Icon n="check" size={20} />}
  </button>
);
export const ScanControls = ({ left = 'image', right = 'zap', onLeft, onRight, children }) => (
  <div className="h-controls"><IconButton icon={left} variant="glass" onClick={onLeft} />{children}<IconButton icon={right} variant="glass" onClick={onRight} /></div>
);
export const ResultSheet = ({ title, chips, product, onView }) => (
  <section className="h-sheet"><div className="h-grab" />
    <h3><i><Icon n="check" size={16} /></i>{title}</h3>
    <div className="h-chips">{chips.map(([tone, t]) => <Chip key={t} tone={tone}>{t}</Chip>)}</div>
    <small>Recommended for you</small>
    <div className="h-rec"><ProductImage tone="pink" /><div><p>{product.name}</p><span>{product.meta}</span><b>{product.price}</b></div><Chip>{product.match} match</Chip></div>
    <Button onClick={onView}>View Product <Icon n="arrow" size={16} /></Button>
  </section>
);
export const ProductHero = ({ tone = 'pink', src, active = 1, count = 3 }) => (
  <><ProductImage tone={tone} src={src} className="h-hero-img" />
    <div className="h-dots">{Array.from({ length: count }, (_, i) => <i key={i} className={i === active ? 'is-on' : ''} />)}</div></>
);
export const ProductTitle = ({ name, pack }) => <div className="h-ptitle"><h2>{name}</h2><span>{pack}</span></div>;
export const BuyRow = ({ price, children }) => <div className="h-buyrow"><b>{price}</b>{children}</div>;
export const CartItem = ({ tone, src, name, meta, price, qty, onQty, onRemove, max }) => (
  <div className="h-citem"><ProductImage tone={tone} src={src} /><div><p>{name}</p><small>{meta}</small><footer><b>{price}</b><Stepper value={qty} onChange={onQty} max={max} /></footer>{onRemove && <div className="h-cirow"><button className="h-linkbtn is-danger" onClick={onRemove}>Remove</button></div>}</div></div>
);
export const PromoInput = ({ value, onChange, onApply, applied, focused }) => (
  <div className={cx('h-promo', focused && 'is-focus')}><Icon n="tag" size={15} />
    <input value={value} placeholder="Promo code" onChange={(e) => onChange(e.target.value)} />
    <button className={cx('h-apply', applied && 'is-applied')} onClick={onApply}>{applied ? <><Icon n="check" size={12} />Applied</> : 'Apply'}</button></div>
);
/** rows: [label, value, 'teal'?] */
export const SummaryCard = ({ rows, total }) => (
  <div className="h-sum">{rows.map(([l, v, t]) => <p key={l}>{l}<b className={t && 'is-teal'}>{v}</b></p>)}<hr /><div className="tot">Total<b>{total}</b></div></div>
);
export const SectionLabel = ({ children }) => <div className="h-label">{children}</div>;
export const AddressCard = ({ title, address, onChange }) => (
  <div className="h-addr"><i><Icon n="home" size={18} /></i><div><p>{title}</p><small>{address}</small></div><a onClick={onChange}>Change</a></div>
);
export const DeliveryOption = ({ title, eta, price, selected, fast, onClick }) => (
  <button className={cx('h-dopt', selected && 'is-on')} onClick={onClick}><p>{title}{fast && <Icon n="zap" size={11} />}</p><small>{eta}</small><b>{price}</b></button>
);
/** brand: apple | visa | stripe | paystack */
export const PaymentRow = ({ brand, label, checked, onClick }) => (
  <div className="h-pay" onClick={onClick}><i className={cx('h-brand', brand === 'visa' && 'is-visa', brand === 'stripe' && 'is-stripe', brand === 'paystack' && 'is-paystack')}>{brand === 'visa' ? 'VISA' : brand === 'apple' ? ' Pay' : brand === 'stripe' ? 'S' : 'pay'}</i><span>{label}</span><Radio checked={checked} /></div>
);
const CF = [[12,22,'#ef6a7d',20],[28,10,'#6d72f0',-30],[44,30,'#f5b73b',50],[60,8,'#1fa595',10],[74,24,'#ef6a7d',-60],[88,14,'#15141a',35],[20,60,'#f5b73b',-20],[82,56,'#6d72f0',70],[8,76,'#1fa595',15],[92,80,'#ef6a7d',-45]];
export const OrderSuccess = ({ orderId, detail }) => (
  <div className="h-success"><div className="h-confetti">{CF.map(([x, y, c, r], i) => <i key={i} style={{ left: `${x}%`, top: `${y}%`, background: c, transform: `rotate(${r}deg)` }} />)}</div>
    <div className="h-ok"><Icon n="check" size={38} stroke={2.6} /></div><h2>Order Placed!</h2><small>Order #{orderId} · {detail}</small></div>
);
export const MapCard = ({ distance, rider, eta, children }) => (
  <div className="h-map">{children ?? <><i className="h-route" /><i className="h-rider-pin"><Icon n="nav" size={13} /></i></>}
    <span className="h-live">{distance} · Live</span>
    <div style={{ position: 'absolute', top: 12, right: 12 }}><IconButton icon="nav" variant="glass" size={14} style={{ width: 34, height: 34 }} /></div>
    <div className="h-rider"><i>{rider[0]}</i><div><p>{rider} · Hera Rider</p><small>Arriving in <b>{eta}</b> min</small></div><IconButton icon="phone" variant="dark" size={15} style={{ width: 40, height: 40 }} /></div></div>
);
/** steps: [{title, sub, state:'done'|'current'|'pending'}] */
export const Timeline = ({ steps }) => (
  <ul className="h-tl" style={{ padding: '18px 20px', margin: '12px var(--px) 0' }}>{steps.map((s) => <li key={s.title} className={`is-${s.state}`}><i>{s.state !== 'pending' && <Icon n="check" size={12} stroke={3} />}</i><div><p>{s.title}</p><small>{s.sub}</small></div></li>)}</ul>
);

/** Animated number: <CountUp value={4200} /> -> ₦4,200 (eases from the previous value) */
export const CountUp = ({ value, prefix = '₦', ms = 700 }) => {
  const [n, setN] = useState(0); const from = useRef(0);
  useEffect(() => {
    const t0 = performance.now(), a = from.current; let raf;
    const tick = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); const v = Math.round(a + (value - a) * e);
      setN(v); from.current = v; if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return <>{prefix}{n.toLocaleString()}</>;
};

/** Material snackbar: toast('Added to cart') */
export const toast = (msg) => { const el = document.createElement('div'); el.className = 'h-snack'; el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 2800); };
/** Toast with an optional action button (used for undo). */
export const toastAction = (msg, actionLabel, onAction) => {
  const el = document.createElement('div');
  el.className = 'h-snack has-action';
  const text = document.createElement('span');
  text.textContent = msg;
  el.appendChild(text);
  if (actionLabel) {
    const btn = document.createElement('button');
    btn.className = 'h-snackbtn';
    btn.textContent = actionLabel;
    btn.onclick = () => { onAction?.(); el.remove(); };
    el.appendChild(btn);
  }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
};
