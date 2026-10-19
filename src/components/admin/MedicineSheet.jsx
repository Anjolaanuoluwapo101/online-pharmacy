import React, { useState, useEffect } from "react";
import { Button, Icon } from "../../design/components";

/**
 * Bottom sheet for editing one medicine in the pharmacy inventory.
 * Only draft state lives here — the parent decides when to write to the gist.
 */
const MedicineSheet = ({ medicine, threshold, onSave, onClose }) => {
  const [draft, setDraft] = useState(medicine);

  useEffect(() => {
    setDraft(medicine);
  }, [medicine]);

  if (!draft) return null;

  const set = (k, v) => setDraft({ ...draft, [k]: v });
  const low = (draft.available_units ?? 0) <= threshold;
  const canSave = draft.medication_name?.trim() && draft.id?.trim() && Number(draft.unit_price) > 0;

  return (
    <>
      <div className="h-sheet2">
        <div className="h-grab" />
        <div className="h-sheet2head">
          <h3>Edit medicine</h3>
          <button className="h-ibtn" onClick={onClose} aria-label="Close"><Icon n="plus" size={16} /></button>
        </div>

        <div className="h-formrow">
          <div style={{ flex: 1 }}>
            <label className="h-fieldlabel" htmlFor="ms-id">ID</label>
            <input id="ms-id" className="h-input h-formfield" value={draft.id || ""} onChange={(e) => set("id", e.target.value)} />
          </div>
          <div style={{ flex: 2 }}>
            <label className="h-fieldlabel" htmlFor="ms-name">Name</label>
            <input id="ms-name" className="h-input h-formfield" value={draft.medication_name || ""} onChange={(e) => set("medication_name", e.target.value)} />
          </div>
        </div>

        <div className="h-formrow">
          <div style={{ flex: 1 }}>
            <label className="h-fieldlabel" htmlFor="ms-price">Price (₦)</label>
            <input id="ms-price" className="h-input h-formfield" type="number" value={draft.unit_price ?? 0} onChange={(e) => set("unit_price", Number(e.target.value))} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="h-fieldlabel" htmlFor="ms-stock">Stock</label>
            <input id="ms-stock" className="h-input h-formfield" type="number" value={draft.stock ?? 0} onChange={(e) => set("stock", Number(e.target.value))} />
          </div>
        </div>

        <div className="h-formrow">
          <div style={{ flex: 1 }}>
            <label className="h-fieldlabel" htmlFor="ms-cat">Form</label>
            <select id="ms-cat" className="h-input h-formfield" value={draft.category || "tablet"} onChange={(e) => set("category", e.target.value)}>
              <option value="tablet">Tablet</option>
              <option value="liquid">Liquid</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="h-fieldlabel" htmlFor="ms-vol">Volume (ml)</label>
            <input id="ms-vol" className="h-input h-formfield" type="number" value={draft.volume_ml ?? ""} onChange={(e) => set("volume_ml", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
        </div>

        {low && (
          <div className="h-notice is-err" style={{ marginBottom: 12 }}>
            Below the low-stock threshold of {threshold}.
          </div>
        )}

        <div className="h-chipsrow" style={{ justifyContent: "flex-start" }}>
          <Button onClick={() => onSave(draft)} disabled={!canSave}>Save changes</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
      <div className="h-sheet2scrim" onClick={onClose} />
    </>
  );
};

export default MedicineSheet;
