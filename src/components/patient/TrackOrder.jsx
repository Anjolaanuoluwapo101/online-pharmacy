import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import Art from "../../design/Art";
import { PhoneFrame, ScreenHeader, Timeline, Button, OrderSuccess, toast } from "../../design/components";
import { listOrders } from "../../lib/heraClient";
import { createDeliveryRunner } from "../../lib/deliverySim";
import { useSmartBack } from "../../lib/useBack";
import AppTabs from "../../design/AppTabs";
import { pharmacyIcon, patientIcon, riderIcon } from "../../design/mapIcons";

const STATUS_LABEL = {
  placed: "Order placed",
  confirmed: "Pharmacy confirmed",
  preparing: "Preparing your medicines",
  out_for_delivery: "On the way",
  delivered: "Delivered",
};

const money = (n) => `₦${Number(n || 0).toLocaleString()}`;

const when = (iso) => {
  try {
    return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
};

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 1) map.fitBounds(points, { padding: [34, 34] });
  }, [map, points]);
  return null;
}

const TrackOrder = () => {
  const navigate = useNavigate();
  const smartBack = useSmartBack("/patient");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const [tick, setTick] = useState(null);
  const [stageIdx, setStageIdx] = useState(-1);
  const [arrived, setArrived] = useState(false);
  const runnerRef = useRef(null);

  useEffect(() => {
    let alive = true;
    listOrders()
      .then((list) => {
        if (!alive) return;
        setOrders(list);
        const live = list.find((o) => o.status === "out_for_delivery") || list[0];
        if (live) setActiveId(live.id);
      })
      .catch((e) => console.error(e))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const active = orders.find((o) => o.id === activeId) || null;
  const activeOrders = orders.filter((o) => o.status !== "delivered" && o.id !== activeId);
  const pastOrders = orders.filter((o) => o.status === "delivered");

  // start / restart the ride whenever the watched order changes
  useEffect(() => {
    runnerRef.current?.destroy();
    runnerRef.current = null;
    if (!active) return;
    setArrived(false);
    setStageIdx(active.status === "delivered" ? (active.timeline?.length || 1) - 1 : 0);

    const runner = createDeliveryRunner(active, {
      onTick: (t) => setTick(t),
      onStage: (i) => {
        setStageIdx(i);
        const s = active.timeline?.[i];
        if (s) toast(`${STATUS_LABEL[s.status] || s.status} — ${s.note}`);
      },
      onArrive: () => {
        setArrived(true);
        toast("Delivered. Enjoy your medicines!");
      },
    });
    runnerRef.current = runner;
    runner.start();
    return () => runner.destroy();
  }, [active]);

  const routePts = useCallback(
    () => (active?.route || []).map((p) => [p[0], p[1]]),
    [active]
  );

  const travelledPts = useCallback(() => {
    const pts = routePts();
    if (!pts.length || !tick) return [];
    const upto = Math.max(2, Math.round(tick.travelFraction * (pts.length - 1)) + 1);
    return pts.slice(0, upto);
  }, [routePts, tick]);

  if (loading) {
    return (
      <PhoneFrame tone="plain">
        <div className="h-screen">
          <ScreenHeader title="Track Order" onBack={smartBack} />
          <div className="h-screen-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <div className="h-skeleton" style={{ width: "100%" }}><i className="sk-well" /><i className="sk-line w80" /><i className="sk-line w40" /></div>
            <span className="h-meta">Finding your order…</span>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  if (!active) {
    return (
      <PhoneFrame tone="plain">
        <div className="h-screen">
          <ScreenHeader title="Track Order" onBack={smartBack} />
          <div className="h-screen-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div className="h-empty">
              <b>No orders yet</b>
              <small>Your deliveries will appear here once you place an order.</small>
            </div>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  const steps = (active.timeline || []).map((s, i) => ({
    title: STATUS_LABEL[s.status] || s.status,
    sub: s.note,
    state: arrived || i < stageIdx ? "done" : i === stageIdx ? "current" : "pending",
  }));

  const rider = active.rider?.name || "Sadiq";
  const kmLeft = tick ? tick.remainingKm : 0;

  return (
    <PhoneFrame tone="track">
      <div className="h-screen">
        <ScreenHeader title="Track Order" onBack={smartBack} meta={active.id} />
        <div className="h-screen-body">
          {arrived && (
            <div className="h-notice is-ok" style={{ marginBottom: 12 }}>
              <strong>Delivered.</strong> Your medicines have arrived at your address.
            </div>
          )}

          <Art scene="track" compact />

          <div className="h-leaflet">
            <MapContainer center={[active.delivery?.lat || 6.5095, active.delivery?.lng || 3.3711]} zoom={13} zoomControl={false} attributionControl={false} scrollWheelZoom={false}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
                maxZoom={19}
              />
              <FitBounds points={routePts()} />
              <Polyline positions={routePts()} pathOptions={{ color: "#c9cacf", weight: 6, opacity: 0.85, lineCap: "round" }} />
              <Polyline positions={travelledPts()} pathOptions={{ color: "#269b91", weight: 6, opacity: 0.95, lineCap: "round" }} />
              {active.pharmacy_location && (
                <Marker position={[active.pharmacy_location.lat, active.pharmacy_location.lng]} icon={pharmacyIcon()} />
              )}
              {(active.pharmacies || []).filter((p) => p.id !== active.pharmacy_id).map((p) => (
                <Marker key={p.id} position={[p.lat, p.lng]} icon={pharmacyIcon()} />
              ))}
              <Marker position={[active.delivery?.lat || 6.5095, active.delivery?.lng || 3.3711]} icon={patientIcon()} />
              {tick?.riderVisible && tick.position && (
                <Marker position={[tick.position.lat, tick.position.lng]} icon={riderIcon()} />
              )}
            </MapContainer>
            <span className="h-live">{kmLeft.toFixed(1)} km · Live</span>
            <div className="h-rider">
              <i>{rider.slice(0, 1)}</i>
              <div>
                <p>{rider} · Hera Rider</p>
                <small>{arrived ? "Delivered" : <>Arriving in <b>{tick?.etaMinutes ?? 0} min</b></>}</small>
              </div>
            </div>
          </div>

          <Timeline steps={steps} />

          {activeOrders.length > 0 && (
            <>
              <div className="h-label">Other active orders</div>
              {activeOrders.map((o) => (
                <div
                  key={o.id}
                  className="h-invitem"
                  onClick={() => setActiveId(o.id)}
                  style={{ cursor: "pointer", outline: o.id === activeId ? "2px solid var(--teal)" : "none" }}
                >
                  <div>
                    <p>{o.id}</p>
                    <small>{when(o.created_at)} · {o.status.replace(/_/g, " ")}</small>
                  </div>
                  <b>{money(o.total)}</b>
                  <Button variant="outline" size="sm" fit onClick={(e) => { e.stopPropagation(); setActiveId(o.id); }}>
                    Watch
                  </Button>
                </div>
              ))}
            </>
          )}

          {pastOrders.length > 0 && (
            <>
              <div className="h-label">Past orders · {pastOrders.length}</div>
              {showPast ? (
                pastOrders.map((o) => (
                  <div key={o.id} className="h-invitem">
                    <div>
                      <p>{o.id}</p>
                      <small>{when(o.created_at)} · {o.pharmacy_id === "medplus" ? "MedPlus" : "Alpha-Pharmacy"}</small>
                    </div>
                    <b>{money(o.total)}</b>
                    <Button variant="outline" size="sm" fit onClick={() => setActiveId(o.id)}>Replay</Button>
                  </div>
                ))
              ) : (
                <button className="h-linkbtn" onClick={() => setShowPast(true)}>
                  Show {pastOrders.length} completed order{pastOrders.length > 1 ? "s" : ""}
                </button>
              )}
            </>
          )}
        </div>
        <div className="h-screen-cta">
          <Button onClick={() => navigate("/patient")}>Continue</Button>
        </div>
      </div>
      <AppTabs active="orders" />
    </PhoneFrame>
  );
};

export default TrackOrder;
