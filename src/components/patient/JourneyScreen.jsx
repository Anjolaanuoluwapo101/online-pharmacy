import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Art from "../../design/Art";
import { PhoneFrame, ScreenHeader, Button, Chip, Icon } from "../../design/components";
import { calculateMedQuantity } from "../../lib/calc";
import { clearExtractionCache } from "../../lib/geminiClient";
import { useSmartBack } from "../../lib/useBack";

/* Ada's prescription — the smart-split demo order (4 medicines, 2 pharmacies). */
const ADA_RX = [
  { medication_name: "Paracetamol 500mg", dosage: "500mg tablet", frequency: "twice daily", duration: "5 days", route: "oral", instructions: "Take after food", confidence: 0.94 },
  { medication_name: "Amoxicillin 250mg", dosage: "250mg capsule", frequency: "thrice daily", duration: "2 days", route: "oral", instructions: "Complete the full course", confidence: 0.91 },
  { medication_name: "Vitamin C 1000mg", dosage: "1000mg tablet", frequency: "once daily", duration: "6 days", route: "oral", instructions: null, confidence: 0.88 },
  { medication_name: "Calcium Care 500mg", dosage: "500mg tablet", frequency: "once daily", duration: "2 days", route: "oral", instructions: "Take with water", confidence: 0.86 },
];

const STEPS = [
  ["We read the slip", "Our AI finds every medicine, dose and duration."],
  ["We match pharmacies", "Each drug goes to the cheapest pharmacy that has it."],
  ["We deliver and remind", "A rider brings it, and we nudge her on time."],
];

const JourneyScreen = () => {
  const navigate = useNavigate();
  const smartBack = useSmartBack("/");
  const [starting, setStarting] = useState(false);

  const startDemo = () => {
    setStarting(true);
    // a seeded slip must never be shadowed by a cached scan of the same photo
    clearExtractionCache();
    const enriched = ADA_RX.map((m) => ({ ...m, ...calculateMedQuantity(m) }));
    localStorage.setItem("hera_prescription_data", JSON.stringify(enriched));
    localStorage.removeItem("hera_prescription_image");
    setTimeout(() => navigate("/patient", { state: { startStep: "pharmacies" } }), 420);
  };

  return (
    <PhoneFrame tone="home">
      <div className="h-screen">
        <ScreenHeader title="hera." onBack={smartBack} />
        <div className="h-screen-body">
          <Art scene="ada" compact />

          <h1 className="h-display">Ada's prescription,<br />handled with care.</h1>
          <p className="h-body">One slip. Four medicines. Two pharmacies.</p>

          <div className="h-label2">Her slip</div>
          <div className="h-list">
            {ADA_RX.map((m) => (
              <div className="h-lrow" key={m.medication_name}>
                <div className="h-licon"><Icon n="pill" size={16} /></div>
                <div className="h-lmain">
                  <b>{m.medication_name}</b>
                  <small>{m.dosage} · {m.frequency} · {m.duration}</small>
                </div>
                <Chip>Qty {calculateMedQuantity(m).quantity}</Chip>
              </div>
            ))}
          </div>

          <div className="h-label2">What happens next</div>
          <div className="h-list">
            {STEPS.map(([title, sub], i) => (
              <div className="h-jstep" key={title}>
                <span className="h-jnum">{i + 1}</span>
                <div className="h-lmain">
                  <b>{title}</b>
                  <small>{sub}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-screen-cta">
          <Button onClick={startDemo} disabled={starting}>
            {starting ? "Preparing…" : "Start Ada's order"}
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
};

export default JourneyScreen;
