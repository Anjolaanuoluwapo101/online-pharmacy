import Art from "../../design/Art";
import React, { useState, useEffect } from "react";
import { PhoneFrame, ScreenHeader, Chip, Button, toast } from "../../design/components";
import PharmacyLoader from "./PharmacyLoader";
import { getBin, binIds } from "../../lib/gistClient";
import { addToCart, getCart, cartQuantity, onCartChange } from "../../lib/storage";

const PharmacyMatch = ({ onComplete, onBack, pharmacyData }) => {
  const [bins, setBins] = useState({});
  const [loading, setLoading] = useState(!pharmacyData);
  const [cart, setCart] = useState(getCart());
  const prescription = JSON.parse(localStorage.getItem("hera_prescription_data") || "[]");

  useEffect(() => {
    const unsubscribe = onCartChange(() => setCart(getCart()));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (pharmacyData) {
      setBins({
        medplus: pharmacyData.medplus,
        "alpha-pharmacy": pharmacyData.alpha,
      });
      setLoading(false);
      return;
    }
    const fetchAll = async () => {
      try {
        const [medplus, alpha] = await Promise.all([
          getBin(binIds.medplus),
          getBin(binIds["alpha-pharmacy"]),
        ]);
        setBins({
          medplus,
          "alpha-pharmacy": alpha,
        });
      } catch (err) {
        console.error("Failed to fetch pharmacy data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [pharmacyData]);

  const handleAddToCart = (pharmacyId, medicine) => {
    const med = prescription.find(
      (m) =>
        m.medication_name.toLowerCase().includes(medicine.medication_name.toLowerCase()) ||
        medicine.medication_name.toLowerCase().includes(m.medication_name.toLowerCase())
    );
    if (!med) {
      toast(`Couldn't match ${medicine.medication_name} to your prescription.`);
      return;
    }
    const qty = Math.min(med.quantity, medicine.available_units || 0);
    if (qty <= 0) {
      toast(`${medicine.medication_name} is out of stock at this pharmacy.`);
      return;
    }
    addToCart({
      pharmacyId,
      medicineId: medicine.id,
      medicationName: medicine.medication_name,
      quantity: qty,
      unitPrice: medicine.unit_price,
      logisticsFee: bins[pharmacyId]?.logistics_fee || 0,
      availableUnits: medicine.available_units || qty,
    });
    toast(`${qty} × ${medicine.medication_name} added from ${bins[pharmacyId]?.name}.`);
  };

  const getMedStock = (pharmacyBin, medName) => {
    const med = pharmacyBin?.medicines?.find(
      (m) => m.medication_name.toLowerCase().includes(medName.toLowerCase()) ||
             medName.toLowerCase().includes(m.medication_name.toLowerCase())
    );
    return med || null;
  };

  if (loading)
    return (
      <PhoneFrame tone="plain">
        <div className="h-screen">
          <ScreenHeader title="Pharmacies" onBack={onBack || null} />
          <PharmacyLoader />
        </div>
      </PhoneFrame>
    );

  return (
    <PhoneFrame tone="plain">
      <div className="h-screen">
        <ScreenHeader
          title="Pharmacies"
          onBack={onBack || null}
          meta={cart.length ? `${cart.length} item${cart.length > 1 ? "s" : ""}` : undefined}
        />
        <div className="h-screen-body">
          <Art scene="pharmacy" />
          {Object.entries(bins).map(([pharmacyId, bin]) => (
            <div key={pharmacyId} className="h-phcard">
              <header>
                <p>{bin.name}</p>
                <small>Logistics · ₦{bin.logistics_fee} · {bin.delivery_time}</small>
              </header>
              {prescription.map((med) => {
                const stockMed = getMedStock(bin, med.medication_name);
                const inCart = stockMed ? cartQuantity(pharmacyId, stockMed.id, cart) : 0;
                return (
                  <div key={med.medication_name} className="h-phrow">
                    <div>
                      <p>{med.medication_name}</p>
                      <small>{med.dosage} · {med.frequency}</small>
                    </div>
                    {stockMed ? (
                      <>
                        <b>₦{stockMed.unit_price}</b>
                        <Chip>{stockMed.available_units > 0 ? "In Stock" : "Out of Stock"}</Chip>
                        {inCart > 0 ? (
                          <Button variant="teal" size="sm" fit disabled>
                            ✓ Added{inCart > 1 ? ` ×${inCart}` : ""}
                          </Button>
                        ) : (
                          <Button
                            variant="ink"
                            size="sm"
                            fit
                            onClick={() => handleAddToCart(pharmacyId, stockMed)}
                            disabled={!(stockMed.available_units > 0)}
                          >
                            Add
                          </Button>
                        )}
                      </>
                    ) : (
                      <Chip tone="concern">Not available</Chip>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="h-screen-cta">
          <Button onClick={() => { if (onComplete) onComplete(); }}>
            {cart.length ? `Go to Cart · ${cart.length}` : "Go to Cart"}
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
};

export default PharmacyMatch;
