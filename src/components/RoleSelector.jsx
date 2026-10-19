import React from "react";
import { useNavigate } from "react-router-dom";
import { PhoneFrame, Icon } from "../design/components";
import Art from "../design/Art";
import AppTabs from "../design/AppTabs";

const Role = ({ to, icon, title, sub, primary }) => {
  const go = useNavigate();
  return (
    <button className={`h-role${primary ? " is-primary" : ""}`} onClick={() => go(`/${to}`)}>
      <i><Icon n={icon} size={22} /></i>
      <span><b>{title}</b><small>{sub}</small></span>
      <Icon n="arrow" size={18} />
    </button>
  );
};

const RoleSelector = () => (
  <PhoneFrame tone="home">
    <div className="h-screen">
      <div className="h-screen-body">
        <div className="h-brand-row"><span>prescilly.</span><small>Care, delivered</small></div>
        <Art scene="welcome" />
        <h1 className="h-display">Your prescription,<br />handled with care.</h1>
        <p className="h-lede">Scan it, compare nearby pharmacies, pay, and get gentle dose reminders.</p>
        <div className="h-label2">See it work</div>
        <Role primary to="journey" icon="zap" title="Meet Ada" sub="A guided order, from prescription to doorstep" />
        <div className="h-label2">For patients</div>
        <Role to="patient" icon="user" title="I need medicines" sub="Scan a prescription and get it delivered" />
        <div className="h-label2">For pharmacies</div>
        <Role to="medplus" icon="bag" title="MedPlus Pharmacy" sub="Update stock and prices" />
        <Role to="alpha-pharmacy" icon="pin" title="Alpha-Pharmacy" sub="Update stock and prices" />
      </div>
    </div>
    <AppTabs active="home" />
  </PhoneFrame>
);

export default RoleSelector;
