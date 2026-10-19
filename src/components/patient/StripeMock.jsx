import Art from "../../design/Art";
import React, { useState, useEffect, useRef } from "react";
import { PhoneFrame, ScreenHeader, Button, toast } from "../../design/components";
import { PaymentProcessing, PaymentDone, PAY_STEPS } from "./PaymentProcessing";
import { getReminders, addReminder, setCart, getCart } from "../../lib/storage";
import { decrementStock } from "../../lib/gistClient";
import { placeOrderBounded } from "../../lib/orderFlow";

const BUDGET_MS = 5500;

const StripeMock = ({ onComplete, onBack, amount = 0 }) => {
  const [phase, setPhase] = useState("form");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
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
    if (!cardNumber || !expiry || !cvc) {
      alert("Please fill all card details.");
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
      const order = await placeOrderBounded({ cart: cartItems, method: "stripe" }).catch(() => null);
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
        <ScreenHeader title="Stripe" onBack={onBack || null} />

        {phase === "form" && (
          <div className="h-screen-body">
            <Art scene="pay" />
            <div className="h-amt">
              <span>Amount to pay</span>
              <b>₦{Number(amount || 0).toLocaleString()}</b>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="h-fieldlabel" htmlFor="st-card">Card number</label>
              <input
                id="st-card"
                className="h-input"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, "").replace(/(\d{4})(?=\d)/g, "$1 "))}
                placeholder="4242 4242 4242 4242"
                maxLength="19"
                required
              />
            </div>
            <div className="h-formrow">
              <div style={{ flex: 1 }}>
                <label className="h-fieldlabel" htmlFor="st-exp">Expiry</label>
                <input
                  id="st-exp"
                  className="h-input"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value.replace(/\D/g, "").replace(/(\d{2})(?=\d)/g, "$1/"))}
                  placeholder="MM/YY"
                  maxLength="5"
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="h-fieldlabel" htmlFor="st-cvc">CVC</label>
                <input
                  id="st-cvc"
                  className="h-input"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                  placeholder="123"
                  maxLength="3"
                  required
                />
              </div>
            </div>
            <div className="h-notice is-ok">
              <strong>Demo Mode:</strong> Any card details accepted. Simulated payment portal.
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
              {amount > 0 ? "Pay with Stripe" : "Nothing to pay"}
            </Button>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
};

export default StripeMock;
