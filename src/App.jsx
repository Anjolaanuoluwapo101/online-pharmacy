import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoleSelector from "./components/RoleSelector";
import PatientFlow from "./components/patient/PatientFlow";
import ExtractionScreen from "./components/patient/ExtractionScreen";
import TrackOrder from "./components/patient/TrackOrder";
import Profile from "./components/patient/Profile";
import JourneyScreen from "./components/patient/JourneyScreen";
import PharmacyAdminForm from "./components/admin/PharmacyAdminForm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelector />} />
        <Route path="/patient" element={<PatientFlow />} />
        <Route path="/extract" element={<ExtractionScreen />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/journey" element={<JourneyScreen />} />
        <Route path="/medplus" element={<PharmacyAdminForm pharmacyId="medplus" />} />
        <Route path="/alpha-pharmacy" element={<PharmacyAdminForm pharmacyId="alpha-pharmacy" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;