import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Art from "../../design/Art";
import { PhoneFrame, ScreenHeader, Button, Icon } from "../../design/components";
import { listPatients, listOrders } from "../../lib/heraClient";
import { useSmartBack } from "../../lib/useBack";
import AppTabs from "../../design/AppTabs";

const Profile = () => {
  const navigate = useNavigate();
  const smartBack = useSmartBack("/");
  const [patient, setPatient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([listPatients(), listOrders().catch(() => [])])
      .then(([patients, orderList]) => {
        if (!alive) return;
        setPatient(patients[0] || null);
        setOrders(orderList.filter((o) => o.patient_id === patients[0]?.id));
      })
      .catch((e) => console.error(e))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const hue = patient?.avatar?.hue ?? 172;
  const avatarStyle = {
    background: `linear-gradient(140deg,hsl(${hue} 62% 58%),hsl(${(hue + 38) % 360} 58% 42%))`,
  };

  if (loading) {
    return (
      <PhoneFrame tone="plain">
        <div className="h-screen">
          <ScreenHeader title="Profile" onBack={smartBack} />
          <div className="h-screen-body">
            <div className="h-skeleton"><i className="sk-well" /><i className="sk-line w80" /><i className="sk-line w40" /></div>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  if (!patient) {
    return (
      <PhoneFrame tone="plain">
        <div className="h-screen">
          <ScreenHeader title="Profile" onBack={smartBack} />
          <div className="h-screen-body">
            <div className="h-empty">
              <b>No profile found</b>
              <small>We could not load your patient record.</small>
            </div>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame tone="plain">
      <div className="h-screen">
        <ScreenHeader title="Profile" onBack={smartBack} />
        <div className="h-screen-body">
          <Art scene="profile" compact />
          <div className="h-profile">
            <div className="h-avatar-lg" style={avatarStyle}>{patient.avatar?.initials || "AN"}</div>
            <p className="h-ttl">{patient.full_name}</p>
            <span className="h-micro">{patient.id}</span>
            <div className="h-chipsrow">
              <span className="h-chip"><Icon n="phone" size={11} />{patient.phone}</span>
              <span className="h-chip"><Icon n="pin" size={11} />{patient.location?.city || "Lagos"}</span>
            </div>
          </div>

          <div className="h-label">Delivery address</div>
          <div className="h-addr">
            <i><Icon n="home" size={18} /></i>
            <div>
              <p>Home</p>
              <small>{patient.location?.address}, {patient.location?.city}</small>
            </div>
          </div>
          <div className="h-row">
            <span>Coordinates</span>
            <b className="h-meta">{patient.location?.lat}, {patient.location?.lng}</b>
          </div>

          <div className="h-label">My orders · {orders.length}</div>
          {orders.length === 0 ? (
            <div className="h-sum h-empty">
              <small>No orders yet</small>
            </div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="h-invitem" onClick={() => navigate("/track")} style={{ cursor: "pointer" }}>
                <div>
                  <p>{o.id}</p>
                  <small>{new Date(o.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · {o.status.replace(/_/g, " ")}</small>
                </div>
                <b>₦{Number(o.total).toLocaleString()}</b>
              </div>
            ))
          )}
        </div>
        <div className="h-screen-cta has-tabs">
          <Button onClick={() => navigate("/patient")}>Order medicines</Button>
        </div>
      </div>
      <AppTabs active="profile" />
    </PhoneFrame>
  );
};

export default Profile;
