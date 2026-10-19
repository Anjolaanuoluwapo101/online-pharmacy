import React, { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PhoneFrame } from "../../design/components";
import UploadPrescription from "./UploadPrescription";
import PharmacyMatch from "./PharmacyMatch";
import Cart from "./Cart";
import Checkout from "./Checkout";
import StripeMock from "./StripeMock";
import PaystackMock from "./PaystackMock";
import ReminderAlerts from "./ReminderAlerts";
import { getBin } from "../../lib/gistClient";
import { cartTotal } from "../../lib/storage";
import { useSmartBack } from "../../lib/useBack";

console.log("[prescilly] PatientFlow v3 loaded");

const steps = [
  { key: "upload", label: "Upload Prescription" },
  { key: "pharmacies", label: "Pharmacies" },
  { key: "cart", label: "Cart" },
  { key: "checkout", label: "Checkout" },
  { key: "payment", label: "Payment" },
  { key: "reminders", label: "Reminders" },
];

const PatientFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const smartBack = useSmartBack("/");
  const [step, setStep] = useState(() => {
    const q = new URLSearchParams(location.search).get("step");
    return location.state?.startStep || q || "upload";
  });
  const [stack, setStack] = useState([location.state?.startStep || "upload"]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [pharmacy, setPharmacy] = useState({ status: "idle", data: null });

  useEffect(() => {
    if (step === "pharmacies" && !pharmacy.data && pharmacy.status === "idle") {
      setPharmacy({ status: "loading", data: null });
      getBin("medplus")
        .then((medplus) => getBin("alpha-pharmacy").then((alpha) => ({ medplus, alpha })))
        .then((data) => setPharmacy({ status: "done", data }))
        .catch((err) => {
          console.error("Pharmacy prefetch failed", err);
          setPharmacy({ status: "idle", data: null });
        });
    }
  }, [step, pharmacy.data, pharmacy.status]);

  /* Forward moves push onto the step stack; back pops it — so the back arrow
     always returns to the step you actually came through. */
  const goTo = useCallback((next) => {
    setStack((s) => {
      const trimmed = s.filter((x, i) => s.indexOf(x) === i);
      return [...trimmed, next];
    });
    setStep(next);
  }, []);

  const goBack = useCallback(() => {
    setStack((s) => {
      if (s.length <= 1) return s;
      const next = [...s];
      next.pop();
      setStep(next[next.length - 1]);
      return next;
    });
  }, []);

  /* The amount is derived from the cart and carried down as a prop — it is
     never a global and never editable. */
  const amount = cartTotal();

  const stepIdx = Math.max(0, steps.findIndex((s) => s.key === step));

  const renderStep = () => {
    switch (step) {
      case "upload":
        return <UploadPrescription onComplete={() => navigate("/extract")} onBack={smartBack} />;
      case "pharmacies":
        return <PharmacyMatch onComplete={() => goTo("cart")} onBack={() => navigate("/extract")} pharmacyData={pharmacy.data} />;
      case "cart":
        return <Cart onComplete={() => goTo("checkout")} onBack={goBack} />;
      case "checkout":
        return (
          <Checkout
            amount={amount}
            onPaymentSelect={(method) => {
              setPaymentMethod(method);
              goTo("payment");
            }}
            onBack={goBack}
          />
        );
      case "payment":
        return paymentMethod === "stripe" ? (
          <StripeMock amount={amount} onComplete={() => goTo("reminders")} onBack={goBack} />
        ) : (
          <PaystackMock amount={amount} onComplete={() => goTo("reminders")} onBack={goBack} />
        );
      case "reminders":
        return <ReminderAlerts onFinish={() => { goTo("upload"); setPaymentMethod(null); }} onBack={goBack} />;
      default:
        return <UploadPrescription onComplete={() => navigate("/extract")} onBack={smartBack} />;
    }
  };

  return (
    <PhoneFrame tone="plain">
      <div className="h-screen">
        <div className="h-flowtop">
          <div className="h-stepper">
            <div className="h-steps">
              {steps.map((s, i) => (
                <i key={s.key} className={i < stepIdx ? "on" : i === stepIdx ? "cur" : ""} />
              ))}
            </div>
          </div>
          <div className="h-flowrow">
            <p>Step {stepIdx + 1} of {steps.length} · {steps[stepIdx].label}</p>
            <button className="h-roleswap" onClick={() => navigate("/medplus")}>Pharmacy view</button>
          </div>
        </div>
        <div className="h-screen-body">
          <div key={step} className="h-pagefade">{renderStep()}</div>
        </div>
      </div>
    </PhoneFrame>
  );
};

export default PatientFlow;
