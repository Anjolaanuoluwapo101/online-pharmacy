import React from "react";

export const PAY_STEPS = [
  "Contacting your bank…",
  "Verifying your card",
  "Confirming payment",
  "Placing your order",
  "Scheduling delivery",
];

/**
 * The processing state: a progress ring that fills with real elapsed time,
 * plus a live step list so the wait reads as progress rather than a freeze.
 */
export const PaymentProcessing = ({ percent, stepIndex }) => (
  <div className="h-paystate">
    <div className="h-payring" style={{ "--p": percent }}>
      <i />
      <b>{Math.round(percent)}%</b>
      <em>SECURE</em>
    </div>
    <div className="h-paysteps">
      {PAY_STEPS.map((s, i) => (
        <div
          key={s}
          className={`h-paystep ${i < stepIndex ? "is-done" : i === stepIndex ? "is-active" : ""}`}
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <i />
          <span>{s}</span>
        </div>
      ))}
    </div>
  </div>
);

/** Terminal success state. */
export const PaymentDone = ({ amount, reference }) => (
  <div className="h-payok">
    <div className="h-ok">
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    </div>
    <b>Payment successful</b>
    <small>₦{Number(amount || 0).toLocaleString()} paid{reference ? ` · ${reference}` : ""}</small>
  </div>
);
