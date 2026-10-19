import Art from "../../design/Art";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PhoneFrame, ScreenHeader, Button, Chip, Icon, toast, toastAction } from "../../design/components";
import MedicineSheet from "./MedicineSheet";
import { getBin, putBin } from "../../lib/gistClient";
import { getOps } from "../../lib/heraClient";
import { useSmartBack } from "../../lib/useBack";

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;
const dayLabel = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
  } catch {
    return "";
  }
};

const DEFAULTS = {
  medplus: [
    { id: "m1", medication_name: "Paracetamol 500mg", stock: 100, unit_price: 500, category: "tablet", volume_ml: null, available_units: 100 },
    { id: "m2", medication_name: "Amoxicillin 250mg", stock: 60, unit_price: 1200, category: "tablet", volume_ml: null, available_units: 60 },
    { id: "m3", medication_name: "Vitamin C 1000mg", stock: 120, unit_price: 800, category: "tablet", volume_ml: null, available_units: 120 },
  ],
  "alpha-pharmacy": [
    { id: "a1", medication_name: "Paracetamol 500mg", stock: 80, unit_price: 450, category: "tablet", volume_ml: null, available_units: 80 },
    { id: "a2", medication_name: "Vitamin C 1000mg", stock: 150, unit_price: 750, category: "tablet", volume_ml: null, available_units: 150 },
    { id: "a3", medication_name: "Calcium Care 500mg", stock: 40, unit_price: 2900, category: "tablet", volume_ml: null, available_units: 40 },
  ],
};

const TABS = [["overview", "Overview"], ["team", "Team"], ["stock", "Stock"]];

const Tabs = ({ tab, onChange }) => (
  <div className="h-tabs2">
    {TABS.map(([k, label]) => (
      <button key={k} className={tab === k ? "is-on" : ""} onClick={() => onChange(k)}>{label}</button>
    ))}
  </div>
);

const PharmacyAdminForm = ({ pharmacyId }) => {
  const navigate = useNavigate();
  const smartBack = useSmartBack("/");
  const [bin, setBin] = useState(null);
  const [ops, setOps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [showJson, setShowJson] = useState(false);
  const [preview, setPreview] = useState(null);
  const [newMed, setNewMed] = useState({
    id: "",
    medication_name: "",
    stock: 0,
    unit_price: 0,
    category: "tablet",
    volume_ml: null,
    available_units: 0,
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [inventory, operations] = await Promise.all([
          getBin(pharmacyId),
          getOps(pharmacyId).catch(() => null),
        ]);
        if (!alive) return;
        setBin(inventory);
        setOps(operations);
      } catch (err) {
        console.error("Failed to load pharmacy data", err);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [pharmacyId]);

  /**
   * Every write re-reads the inventory first, so a patient paying (which
   * deducts stock) at the same moment can never be silently overwritten.
   */
  const writeInventory = useCallback(async (mutate) => {
    const fresh = await getBin(pharmacyId);
    const next = mutate({ ...fresh, medicines: [...(fresh.medicines || [])] });
    await putBin(pharmacyId, next);
    setBin(await getBin(pharmacyId));
    return next;
  }, [pharmacyId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMed({ ...newMed, [name]: value });
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!newMed.medication_name || !newMed.unit_price || !newMed.id) {
      toast("Please fill all required fields.");
      return;
    }
    if ((bin?.medicines || []).some((m) => m.id === newMed.id)) {
      toast(`ID "${newMed.id}" is already in the inventory.`);
      return;
    }
    try {
      const med = { ...newMed, stock: Number(newMed.stock) || 0, unit_price: Number(newMed.unit_price) || 0, available_units: Number(newMed.stock) || 0 };
      await writeInventory((b) => ({ ...b, medicines: [...b.medicines, med] }));
      toast(`${med.medication_name} added to inventory.`);
      setNewMed({ id: "", medication_name: "", stock: 0, unit_price: 0, category: "tablet", volume_ml: null, available_units: 0 });
    } catch (err) {
      console.error(err);
      toast("Failed to add medicine.");
    }
  };

  const handleSaveMedicine = async (draft) => {
    try {
      await writeInventory((b) => ({
        ...b,
        medicines: b.medicines.map((m) => {
          if (m.id !== draft.id) return m;
          const stock = Number(draft.stock) || 0;
          return { ...m, ...draft, stock, unit_price: Number(draft.unit_price) || 0, available_units: stock };
        }),
      }));
      toast(`${draft.medication_name} updated.`);
      setEditing(null);
    } catch (err) {
      console.error(err);
      toast("Failed to save changes.");
    }
  };

  const handleDeleteMedicine = async (medId) => {
    const victim = (bin?.medicines || []).find((m) => m.id === medId);
    if (!victim) return;
    const index = bin.medicines.findIndex((m) => m.id === medId);
    try {
      await writeInventory((b) => ({ ...b, medicines: b.medicines.filter((m) => m.id !== medId) }));
      toastAction(`${victim.medication_name} removed`, "Undo", async () => {
        await writeInventory((b) => {
          const meds = [...b.medicines];
          meds.splice(Math.min(index, meds.length), 0, victim);
          return { ...b, medicines: meds };
        });
        toast(`${victim.medication_name} restored.`);
      });
    } catch (err) {
      console.error(err);
      toast("Failed to remove medicine.");
    }
  };

  const handleAdjustStock = async (medId, delta) => {
    try {
      await writeInventory((b) => ({
        ...b,
        medicines: b.medicines.map((m) => {
          if (m.id !== medId) return m;
          const stock = Math.max(0, (m.stock || 0) + delta);
          return { ...m, stock, available_units: stock };
        }),
      }));
    } catch (err) {
      console.error(err);
      toast("Failed to update stock.");
    }
  };

  const handleRestoreDefaults = async () => {
    try {
      await writeInventory((b) => ({ ...b, medicines: DEFAULTS[pharmacyId] || b.medicines }));
      toast("Default inventory restored.");
    } catch (err) {
      console.error(err);
      toast("Failed to restore defaults.");
    }
  };

  const pharmacyName = pharmacyId === "medplus" ? "MedPlus Pharmacy" : "Alpha-Pharmacy";

  const visibleMedicines = useMemo(() => {
    const list = [...(bin?.medicines || [])];
    const q = query.trim().toLowerCase();
    const filtered = q ? list.filter((m) => m.medication_name.toLowerCase().includes(q)) : list;
    const sorters = {
      name: (a, b) => a.medication_name.localeCompare(b.medication_name),
      price: (a, b) => a.unit_price - b.unit_price,
      stock: (a, b) => (a.available_units || 0) - (b.available_units || 0),
    };
    return filtered.sort(sorters[sortKey] || sorters.name);
  }, [bin, query, sortKey]);

  if (loading) {
    return (
      <PhoneFrame tone="plain">
        <div className="h-screen">
          <ScreenHeader title={pharmacyName} onBack={smartBack} />
          <div className="h-screen-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="h-skeleton"><i className="sk-well" /><i className="sk-line w80" /><i className="sk-line w40" /></div>
            <div className="h-skeleton"><i className="sk-line w60" /><i className="sk-line w80" /></div>
          </div>
        </div>
      </PhoneFrame>
    );
  }
  if (!bin) {
    return (
      <PhoneFrame tone="plain">
        <div className="h-screen">
          <ScreenHeader title={pharmacyName} onBack={smartBack} />
          <div className="h-screen-body" style={{ textAlign: "center", padding: "60px 24px", color: "#ef4a5a" }}>
            Pharmacy not found.
          </div>
        </div>
      </PhoneFrame>
    );
  }

  const sales = ops?.daily_sales || [];
  const maxRev = Math.max(1, ...sales.map((d) => d.revenue));
  const today = sales[sales.length - 1];
  const onDuty = (ops?.staff || []).filter((s) => s.status === "on_duty").length;
  const threshold = ops?.settings?.low_stock_threshold ?? 20;
  const lowStock = (bin.medicines || []).filter((m) => (m.available_units ?? 0) <= threshold);

  return (
    <PhoneFrame tone="plain">
      <div className="h-screen">
        <ScreenHeader
          title={pharmacyName}
          onBack={smartBack}
          right={<button className="h-roleswap" onClick={() => navigate("/patient")}>Patient view</button>}
        />
        <div className="h-screen-body">
          <Art scene={tab === "overview" ? "dashboard" : "admin"} compact />
          <Tabs tab={tab} onChange={setTab} />

          {tab === "overview" && (
            <>
              <div className="h-statgrid">
                <div className="h-stat"><small>Revenue today</small><b>{naira(today?.revenue)}</b></div>
                <div className="h-stat"><small>Orders today</small><b>{today?.orders ?? 0}</b></div>
                <div className="h-stat"><small>Staff on duty</small><b>{onDuty}</b></div>
                <div className="h-stat"><small>Riders ready</small><b>{(ops?.riders || []).filter((r) => r.status === "available").length}</b></div>
              </div>

              <div className="h-sum" style={{ marginBottom: 12 }}>
                <p className="h-sumhead">
                  <span>Last 14 days</span>
                  <span className="h-micro">{naira(sales.reduce((a, d) => a + d.revenue, 0))} total</span>
                </p>
                <div className="h-chart">
                  {sales.map((d, i) => (
                    <i
                      key={d.date}
                      className={i === sales.length - 1 ? "is-today" : ""}
                      style={{ height: `${Math.max(6, (d.revenue / maxRev) * 100)}%` }}
                      title={`${d.date} · ${d.orders} orders · ${naira(d.revenue)}`}
                    />
                  ))}
                </div>
                <div className="h-chartlabels">
                  <span className="h-micro">{dayLabel(sales[0]?.date)}</span>
                  <span className="h-micro">Today</span>
                </div>
              </div>

              {lowStock.length > 0 && (
                <>
                  <div className="h-label">Restock soon</div>
                  {lowStock.map((m) => (
                    <div key={m.id} className="h-invitem">
                      <div><p>{m.medication_name}</p><small>{m.available_units} left · threshold {threshold}</small></div>
                      <Chip tone="concern">Low</Chip>
                    </div>
                  ))}
                </>
              )}

              <div className="h-label">Restock log</div>
              {(ops?.restock_log || []).map((r, i) => (
                <div key={i} className="h-invitem">
                  <div><p>{r.note}</p><small>{new Date(r.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · {r.items} items</small></div>
                </div>
              ))}
            </>
          )}

          {tab === "team" && (
            <>
              <div className="h-label">Staff on shift</div>
              {(ops?.staff || []).map((s) => (
                <div key={s.id} className="h-invitem">
                  <div><p>{s.name}</p><small>{s.role} · {s.shift}</small></div>
                  <Chip>{s.status === "on_duty" ? "On duty" : "Off duty"}</Chip>
                </div>
              ))}
              <div className="h-label">Delivery riders</div>
              {(ops?.riders || []).map((r) => (
                <div key={r.id} className="h-invitem">
                  <div><p>{r.name}</p><small>{r.vehicle}</small></div>
                  <Chip>{r.status === "available" ? "Available" : "On delivery"}</Chip>
                </div>
              ))}
              {ops?.settings && (
                <div className="h-sum" style={{ marginTop: 14 }}>
                  <p><span>Opening hours</span><b>{ops.settings.opening_hours}</b></p>
                  <p><span>Accepts prescriptions</span><b>{ops.settings.accepts_prescriptions ? "Yes" : "No"}</b></p>
                  <p><span>Low stock threshold</span><b>{ops.settings.low_stock_threshold}</b></p>
                </div>
              )}
            </>
          )}

          {tab === "stock" && (
            <>
              <div className="h-searchbar">
                <input className="h-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search medicines" />
                <Button variant="outline" size="md" fit onClick={() => setSortKey(sortKey === "name" ? "price" : sortKey === "price" ? "stock" : "name")}>
                  Sort: {sortKey}
                </Button>
              </div>

              <div className="h-list">
                {visibleMedicines.length === 0 ? (
                  <small className="h-meta" style={{ display: "block", padding: "10px 0" }}>No medicines match.</small>
                ) : (
                  visibleMedicines.map((m) => (
                    <div key={m.id} className="h-adminrow">
                      <button className="h-lmain" style={{ background: "none", border: 0, textAlign: "left", cursor: "pointer", padding: 0 }} onClick={() => setEditing({ ...m })}>
                        <b>{m.medication_name}</b>
                        <small>{m.id} · {m.category}{m.volume_ml ? ` · ${m.volume_ml}ml` : ""} · {naira(m.unit_price)}</small>
                      </button>
                      {(m.available_units ?? 0) <= threshold && <Chip tone="concern">Low</Chip>}
                      <div className="h-stockadj">
                        <button onClick={() => handleAdjustStock(m.id, -1)} aria-label="Decrease stock">−</button>
                        <b>{m.available_units ?? 0}</b>
                        <button onClick={() => handleAdjustStock(m.id, 1)} aria-label="Increase stock">+</button>
                      </div>
                      <button className="h-linkbtn is-danger" onClick={() => handleDeleteMedicine(m.id)}>Remove</button>
                    </div>
                  ))
                )}
              </div>

              <div className="h-chipsrow" style={{ justifyContent: "flex-start", marginBottom: 16 }}>
                <Button variant="outline" size="md" fit onClick={() => setPreview((p) => (p ? null : visibleMedicines[0] || null))}>
                  {preview ? "Hide patient preview" : "Preview as patient"}
                </Button>
                <Button variant="outline" size="md" fit onClick={() => setShowJson((s) => !s)}>
                  {showJson ? "Hide gist payload" : "Show gist payload"}
                </Button>
                <Button variant="outline" size="md" fit onClick={handleRestoreDefaults}>Restore defaults</Button>
              </div>

              {preview && (
                <div className="h-previewrow">
                  <div className="h-licon"><Icon n="pill" size={15} /></div>
                  <div className="h-lmain">
                    <b>{preview.medication_name}</b>
                    <small>{naira(preview.unit_price)} · {preview.available_units > 0 ? "In Stock" : "Out of Stock"}</small>
                  </div>
                  <Chip>In Stock</Chip>
                </div>
              )}

              {showJson && (
                <pre className="h-json">{JSON.stringify(bin, null, 2)}</pre>
              )}

              <div className="h-sum" style={{ marginBottom: 16 }}>
                <p className="h-sumhead"><span>Add a medicine</span></p>
                <form onSubmit={handleAddMedicine}>
                  <div className="h-formrow">
                    <input className="h-input h-formfield" name="id" value={newMed.id} onChange={handleInputChange} placeholder="ID (e.g. m1)" required />
                    <input className="h-input h-formfield" name="medication_name" value={newMed.medication_name} onChange={handleInputChange} placeholder="Medicine Name" required />
                  </div>
                  <div className="h-formrow">
                    <input className="h-input h-formfield" name="stock" type="number" value={newMed.stock} onChange={handleInputChange} placeholder="Stock" required />
                    <input className="h-input h-formfield" name="unit_price" type="number" value={newMed.unit_price} onChange={handleInputChange} placeholder="Price (₦)" required />
                  </div>
                  <div className="h-formrow">
                    <select className="h-input h-formfield" name="category" value={newMed.category} onChange={handleInputChange}>
                      <option value="tablet">Tablet</option>
                      <option value="liquid">Liquid</option>
                    </select>
                    {newMed.category === "liquid" && (
                      <input className="h-input h-formfield" name="volume_ml" type="number" value={newMed.volume_ml || ""} onChange={handleInputChange} placeholder="Volume (ml)" />
                    )}
                  </div>
                  <Button type="submit">Add Medicine</Button>
                </form>
              </div>

              <p className="h-ttl">Current Inventory · {bin.medicines.length} items</p>
            </>
          )}
        </div>
      </div>

      {editing && (
        <MedicineSheet
          medicine={editing}
          threshold={threshold}
          onSave={handleSaveMedicine}
          onClose={() => setEditing(null)}
        />
      )}
    </PhoneFrame>
  );
};

export default PharmacyAdminForm;
