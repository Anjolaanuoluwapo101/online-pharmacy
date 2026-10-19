import Art from "../../design/Art";
import React, { useState } from "react";
import { PhoneFrame, ScreenHeader, SectionLabel, PaymentRow, Button } from "../../design/components";

const Checkout = ({ onPaymentSelect, onBack, amount = 0 }) => {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
  });
  const [paymentMethod, setPaymentMethod] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.address || !paymentMethod) {
      alert("Please fill all fields and select a payment method.");
      return;
    }
    if (onPaymentSelect) onPaymentSelect(paymentMethod);
  };

  const field = (label, name, placeholder, type = "text") => (
    <div style={{ marginBottom: 12 }}>
      <label className="h-fieldlabel" htmlFor={`f-${name}`}>{label}</label>
      <input
        id={`f-${name}`}
        className="h-input"
        type={type}
        name={name}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        placeholder={placeholder}
        required
      />
    </div>
  );

  return (
    <PhoneFrame tone="plain">
      <div className="h-screen">
        <ScreenHeader title="Checkout" onBack={onBack || null} />
        <div className="h-screen-body">
          <Art scene="checkout" compact />

          <div className="h-amt">
            <span>Amount to pay</span>
            <b>₦{Number(amount || 0).toLocaleString()}</b>
          </div>

          <SectionLabel>Deliver to</SectionLabel>
          {field("Full name", "fullName", "Enter your full name")}
          {field("Phone number", "phone", "e.g. 08012345678", "tel")}
          {field("Delivery address", "address", "House number, street, area")}
          {field("City", "city", "e.g. Lagos")}

          <SectionLabel>Payment method</SectionLabel>
          <PaymentRow
            brand="stripe"
            label="Stripe"
            checked={paymentMethod === "stripe"}
            onClick={() => setPaymentMethod("stripe")}
          />
          <PaymentRow
            brand="paystack"
            label="Paystack"
            checked={paymentMethod === "paystack"}
            onClick={() => setPaymentMethod("paystack")}
          />
        </div>
        <div className="h-screen-cta">
          <Button onClick={handleSubmit} disabled={!paymentMethod || amount <= 0}>
            {amount > 0 ? "Proceed to Payment" : "Nothing to pay"}
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
};

export default Checkout;
