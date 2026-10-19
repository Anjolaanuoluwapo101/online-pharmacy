import React from "react";
import { useNavigate } from "react-router-dom";
import { TabBar } from "./components";

/**
 * The app's primary navigation, built from the design system's TabBar
 * (the reference app's bottom nav with a centre scan button).
 */
const AppTabs = ({ active }) => {
  const navigate = useNavigate();
  const items = [
    { id: "home", icon: "home", label: "Home" },
    { id: "orders", icon: "bag", label: "Orders" },
    { id: "reminders", icon: "clock", label: "Reminders" },
    { id: "profile", icon: "user", label: "Profile" },
  ];

  return (
    <TabBar
      items={items}
      active={active}
      onScan={() => navigate("/patient")}
      onChange={(id) => {
        if (id === "home") navigate("/");
        else if (id === "orders") navigate("/track");
        else if (id === "reminders") navigate("/patient?step=reminders");
        else if (id === "profile") navigate("/profile");
      }}
    />
  );
};

export default AppTabs;
