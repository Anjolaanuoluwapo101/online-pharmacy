import Art from "../../design/Art";
import React, { useState, useEffect, useRef } from "react";
import { PhoneFrame, ScreenHeader, Button, toast } from "../../design/components";
import { PaymentProcessing, PaymentDone, PAY_STEPS } from "./PaymentProcessing";
import { getReminders, addReminder, setCart, getCart } from "../../lib/storage";
import { decrementStock } from "../../lib/gistClient";
import { placeOrderBounded } from "../../lib/orderFlow";

const BUDGET_MS = 5500;

const PaystackMock = ({ onComplete, onBack, amount = 0 }) => {
  const [phase, setPhase] = useState("form");
  const [email, setEmail] = useState("");
  const [percent, setPercent] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [reference, setReference] = useState(null);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearInterval), []);

  const handlePay = async (e) => {
    e.preventDefault();
    if (amount <= 0) {
      toast("Nothing to pay — your cart is empty.");
      return;
    }
    if (!email) {
      alert("Please enter your email address.");
      return;
    }

    setPhase("processing");
    setPercent(0);
    setStepIdx(0);
    const started = Date.now();

    const ticker = setInterval(() => {
      const elapsed = Date.now() - started;
      setPercent(Math.min(97, (elapsed / BUDGET_MS) * 100));
      setStepIdx(Math.min(PAY_STEPS.length - 1, Math.floor((elapsed / BUDGET_MS) * PAY_STEPS.length)));
    }, 110);
    timers.current.push(ticker);

    const cartItems = getCart();

    // local work first — instant, never blocked by the network
    const prescription = JSON.parse(localStorage.getItem("hera_prescription_data") || "[]");
    const now = new Date();
    prescription.forEach((med) => {
      const endDate = new Date(now);
      const durMatch = med.duration?.match(/\d+/);
      if (durMatch) endDate.setDate(now.getDate() + parseInt(durMatch[0], 10));
      addReminder({
        id: `${med.medication_name}-${Date.now()}-${Math.random()}`,
        medication_name: med.medication_name,
        dosage: med.dosage,
        frequency: med.frequency,
        times_per_day: med.frequency === "twice daily" ? 2 : med.frequency === "thrice daily" ? 3 : 1,
        start_date: now.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        status: "active",
      });
    });
    setCart([]);
    localStorage.removeItem("hera_prescription_data");

    // network work in the background — bounded, never blocks the UI
    const network = (async () => {
      await Promise.allSettled(
        cartItems.map((i) => decrementStock(i.pharmacyId, i.medicineId, i.quantity).catch(() => {}))
      );
      const order = await placeOrderBounded({ cart: cartItems, method: "paystack" }).catch(() => null);
      return order;
    })();

    const timeout = new Promise((r) => setTimeout(() => r(null), BUDGET_MS));
    const order = await Promise.race([network, timeout]);
    if (order?.id) setReference(`DEMO-${order.id}`);

    clearInterval(ticker);
    setPercent(100);
    setStepIdx(PAY_STEPS.length);
    setPhase("done");
    setTimeout(() => { if (onComplete) onComplete(); }, 1000);
  };

  return (
    <PhoneFrame tone="plain">
      <div className="h-screen">
        <ScreenHeader title="Paystack" onBack={onBack || null} />

        {phase === "form" && (
          <div className="h-screen-body">
            <Art scene="pay" />
            <div className="h-amt">
              <span>Amount to pay</span>
              <b>₦{Number(amount || 0).toLocaleString()}</b>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="h-fieldlabel" htmlFor="py-email">Email address</label>
              <input
                id="py-email"
                className="h-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="h-notice is-ok">
              <strong>Demo Mode:</strong> Simulated Paystack inline popup.
            </div>
          </div>
        )}

        {phase === "processing" && (
          <div className="h-screen-body">
            <PaymentProcessing percent={percent} stepIndex={stepIdx} />
          </div>
        )}

        {phase === "done" && (
          <div className="h-screen-body">
            <PaymentDone amount={amount} reference={reference} />
          </div>
        )}

        {phase === "form" && (
          <div className="h-screen-cta">
            <Button onClick={handlePay} disabled={amount <= 0}>
              {amount > 0 ? "Pay with Paystack" : "Nothing to pay"}
            </Button>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
};

export default PaystackMock;
