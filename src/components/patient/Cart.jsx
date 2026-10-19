import Art from "../../design/Art";
import React, { useState, useEffect } from "react";
import { PhoneFrame, ScreenHeader, CartItem, SummaryCard, CountUp, Button, IconButton } from "../../design/components";
import { getCart, setItemQty, removeFromCart, clearCart, onCartChange, groupCart, cartTotal } from "../../lib/storage";

const Cart = ({ onComplete, onBack }) => {
  const [cart, setCart] = useState(getCart());

  useEffect(() => {
    const unsubscribe = onCartChange(refresh);
    return unsubscribe;
  }, []);

  const refresh = () => setCart(getCart());

  const handleQty = (pharmacyId, medicineId, qty) => {
    setItemQty(pharmacyId, medicineId, qty);
    refresh();
  };

  const handleRemove = (pharmacyId, medicineId) => {
    removeFromCart(pharmacyId, medicineId);
    refresh();
  };

  const grouped = groupCart(cart);
  const grandTotal = cartTotal(cart);

  if (cart.length === 0) {
    return (
      <PhoneFrame tone="plain">
        <div className="h-screen">
          <ScreenHeader title="My Cart" onBack={onBack || null} />
          <div className="h-screen-body">
            <div className="h-empty">
              <IconButton icon="bag" size={30} />
              <b>Your cart is empty</b>
              <small>Add medicines from a pharmacy to get started</small>
            </div>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  const tones = ["cyan", "pink"];

  return (
    <PhoneFrame tone="plain">
      <div className="h-screen">
        <ScreenHeader
          title="My Cart"
          onBack={onBack || null}
          right={
            <button
              className="h-linkbtn is-danger"
              onClick={() => {
                if (confirm("Clear all items from cart?")) {
                  clearCart();
                  refresh();
                }
              }}
            >
              Clear cart
            </button>
          }
        />
        <div className="h-screen-body">
          <Art scene="cart" />

          {Object.entries(grouped).map(([pharmacyId, group]) => (
            <div key={pharmacyId}>
              <div className="h-groprow">
                <p>{pharmacyId === "medplus" ? "MedPlus Pharmacy" : "Alpha-Pharmacy"}</p>
                <span className="h-meta">Logistics · ₦{group.logisticsFee.toLocaleString()}</span>
              </div>
              {group.items.map((item, idx) => (
                <CartItem
                  key={item.medicineId}
                  tone={tones[idx % 2]}
                  name={item.medicationName}
                  meta={`₦${item.unitPrice.toLocaleString()} each`}
                  price={`₦${(item.unitPrice * item.quantity).toLocaleString()}`}
                  qty={item.quantity}
                  max={item.availableUnits}
                  onQty={(q) => handleQty(pharmacyId, item.medicineId, q)}
                  onRemove={() => handleRemove(pharmacyId, item.medicineId)}
                />
              ))}
            </div>
          ))}

          <SummaryCard
            rows={[
              ...Object.entries(grouped).map(([pid, g]) => [
                `${pid === "medplus" ? "MedPlus" : "Alpha-Pharmacy"} subtotal`,
                `₦${g.subtotal.toLocaleString()}`,
              ]),
              ...Object.values(grouped).map((g) => ["Logistics", `₦${g.logisticsFee.toLocaleString()}`, "teal"]),
            ]}
            total={<CountUp value={grandTotal} />}
          />
        </div>
        <div className="h-screen-cta">
          <Button onClick={() => { if (onComplete) onComplete(); }}>
            Checkout · <CountUp value={grandTotal} />
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
};

export default Cart;
