import React, { useEffect, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Art from "../../design/Art";
import { PhoneFrame, ScreenHeader, Shutter, Chip, Button, Icon } from "../../design/components";
import { extractFromImage } from "../../lib/geminiClient";
import { calculateMedQuantity } from "../../lib/calc";
import { useSmartBack } from "../../lib/useBack";

function hashImage(base64) {
  let h = 0;
  const step = Math.max(1, Math.floor(base64.length / 500));
  for (let i = 0; i < base64.length; i += step) {
    h = ((h << 5) - h + base64.charCodeAt(i)) | 0;
  }
  return `hera_img_${h}`;
}

const initial = { status: "idle", data: null, error: null };

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { status: "loading", data: null, error: null };
    case "done":
      return { status: "done", data: action.data, error: null };
    case "error":
      return { status: "error", data: null, error: action.error };
    default:
      return state;
  }
}

const confidenceMeta = (c) => {
  if (typeof c !== "number" || Number.isNaN(c)) return { tone: "", label: "Review" };
  if (c >= 0.8) return { tone: "", label: "High confidence" };
  if (c >= 0.5) return { tone: "is-amber", label: "Medium confidence" };
  return { tone: "is-concern", label: "Low confidence" };
};

const ExtractionScreen = () => {
  const navigate = useNavigate();
  const smartBack = useSmartBack("/patient");
  const [state, dispatch] = useReducer(reducer, initial);
  const [retryCount, setRetryCount] = useState(0);
  const ranRef = useRef(false);
  const bypassRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      const dataUrl = localStorage.getItem("hera_prescription_image");
      if (!dataUrl) {
        dispatch({ type: "error", error: "No prescription image found. Please go back and upload." });
        return;
      }
      const hash = hashImage(dataUrl.split(",")[1] || dataUrl);
      const cachedRaw = bypassRef.current ? null : localStorage.getItem(hash);
      bypassRef.current = false;
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          // only trust a NON-EMPTY cached result; an empty one used to freeze the screen on "Analysing"
          if (Array.isArray(cached.data) && cached.data.length > 0) {
            console.log("[extract] using cached result (no network call)");
            localStorage.setItem("hera_prescription_data", JSON.stringify(cached.data));
            dispatch({ type: "done", data: cached.data });
            return;
          }
        } catch (e) { /* fall through */ }
        localStorage.removeItem(hash);
      }
      dispatch({ type: "loading" });
      try {
        console.log("[extract] calling gemini");
        const raw = await extractFromImage(dataUrl);
        console.log("[extract] gemini returned", raw.length, "medications");
        if (!Array.isArray(raw)) {
          throw new Error("AI returned an unrecognized format. Please try again.");
        }
        if (raw.length === 0) {
          throw new Error("No medicines were detected. Try a clearer, well-lit photo of the prescription.");
        }
        const enriched = raw.map((med) => ({
          ...med,
          ...calculateMedQuantity(med),
        }));
        localStorage.setItem("hera_prescription_data", JSON.stringify(enriched));
        localStorage.setItem(hash, JSON.stringify({ data: enriched, ts: Date.now() }));
        dispatch({ type: "done", data: enriched });
      } catch (err) {
        console.error(err);
        dispatch({ type: "error", error: err.message || "Something went wrong." });
      }
    };

    run();
  }, [retryCount]);

  const { status, data, error } = state;

  /* Accessibility: read the medicines aloud with the browser voice engine. */
  const readAloud = () => {
    if (!("speechSynthesis" in window) || !data) return;
    const text = data
      .map((m) => `${m.medication_name}. ${m.dosage || ""}. Take ${m.frequency || ""} for ${m.duration || ""}.`)
      .join(" ");
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  if (status === "error") {
    return (
      <PhoneFrame tone="plain">
        <div className="h-screen">
          <ScreenHeader title="Extraction" onBack={smartBack} />
          <div className="h-screen-body">
            <div className="h-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4a5a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              <p className="h-alert">Extraction Failed</p>
              <small className="h-meta">{error}</small>
              <div className="h-chipsrow">
                <Button variant="outline" size="md" fit onClick={() => navigate("/patient")}>Back to Scan</Button>
                <Button size="md" fit onClick={() => { ranRef.current = false; bypassRef.current = true; setRetryCount((c) => c + 1); }}>Try Again</Button>
              </div>
            </div>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  if (status === "done" && data && data.length > 0) {
    const confs = data.map((m) => m.confidence).filter((c) => typeof c === "number" && !Number.isNaN(c));
    const avgConf = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : null;

    return (
      <PhoneFrame tone="plain">
        <div className="h-screen">
          <ScreenHeader title="Prescription" onBack={smartBack} right={<button className="h-roleswap" onClick={readAloud}>Read aloud</button>} />
          <div className="h-screen-body">
            <div className="h-summary">
              <span className="h-summary-count">{data.length}</span>
              <div>
                <p>medicines found</p>
                <small>AI review complete — confirm quantities below</small>
              </div>
              {avgConf !== null && (
                <div className="h-confbar" title={`${Math.round(avgConf * 100)}% average confidence`}>
                  <i style={{ width: `${Math.round(avgConf * 100)}%` }} />
                </div>
              )}
            </div>
            {data.map((med, i) => {
              const cm = confidenceMeta(med.confidence);
              return (
                <div key={i} className="h-medcard" style={{ animationDelay: `${i * 90}ms` }}>
                  <div className="h-medcard-head">
                    <div className="h-medwell"><Icon n="pill" size={20} /></div>
                    <div style={{ flex: 1 }}>
                      <p className="h-medname">{med.medication_name}</p>
                      <Chip className={cm.tone}>{cm.label}</Chip>
                    </div>
                    <div className="h-qty">{med.volume_ml ? `${med.volume_ml}ml` : `Qty ${med.quantity}`}</div>
                  </div>
                  <div className="h-meddosage">{med.dosage || "—"}</div>
                  <div className="h-medmeta">
                    <div className="h-medmeta-item"><Icon n="clock" size={14} /><div><small>Frequency</small><b>{med.frequency || "—"}</b></div></div>
                    <div className="h-medmeta-item"><Icon n="calendar" size={14} /><div><small>Duration</small><b>{med.duration || "—"}</b></div></div>
                    <div className="h-medmeta-item"><Icon n="info" size={14} /><div><small>Daily doses</small><b>{med.daily_dose_count || 1}× / day</b></div></div>
                    <div className="h-medmeta-item"><Icon n="pin" size={14} /><div><small>Route</small><b>{med.route || "Oral"}</b></div></div>
                  </div>
                  {med.instructions && <p className="h-medinstr">“{med.instructions}”</p>}
                </div>
              );
            })}
          </div>
          <div className="h-screen-cta">
            <Button onClick={() => navigate("/patient", { state: { startStep: "pharmacies" } })}>
              Continue to Pharmacies
            </Button>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame tone="plain">
      <div className="h-screen">
        <ScreenHeader title="Analysing" onBack={smartBack} />
        <div className="h-screen-body">
          <div className="h-stagewrap">
            <Art scene="extract" compact />
            <div className="h-stageline">
              <Shutter state="busy" progress={72} />
            </div>
            <p className="h-ttl">Reading your prescription…</p>
            <p className="h-meta h-centered">
              Gemini is detecting medicines, dosage and frequency. This usually takes a few seconds.
            </p>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
};

export default ExtractionScreen;
