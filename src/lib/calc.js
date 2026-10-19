/*
  Auto-calculate purchase quantities from extracted prescription data.
  - dosage: e.g. "500mg tablet", "200mg/5ml syrup"
  - frequency: enum string
  - duration: e.g. "14 days", "1 month"
  - Returns: { quantity, volume_ml, total_pills_needed, daily_dose_count }
*/

// Frequency -> doses per day mapping
const FREQ_MAP = {
  "once daily": 1,
  "twice daily": 2,
  "thrice daily": 3,
  "every 6 hours": 4,
  "every 8 hours": 3,
  "every 12 hours": 2,
  "as needed": 1,
};

// Parse "500mg tablet" or "200mg/5ml syrup" -> { strength, form, volumePerUnit? }
function parseDosage(dosage) {
  if (!dosage) return { strength: null, form: null, volumePerUnit: null };
  const lower = dosage.toLowerCase();

  // Liquid form
  if (lower.includes("/5ml") || lower.includes("/ml")) {
    const match = dosage.match(/(\d+(?:\.\d+)?)\/5ml/i) || dosage.match(/(\d+(?:\.\d+)?)\/ml/i);
    const volume = match ? parseFloat(match[1]) : null;
    return { strength: null, form: "liquid", volumePerUnit: volume };
  }

  // Tablet/capsule form
  const match = dosage.match(/(\d+(?:\.\d+)?)\s*(mg|g|ml)/i);
  const strength = match ? match[1] : null;
  return { strength, form: "tablet", volumePerUnit: null };
}

// Duration string -> days number
function parseDurationDays(duration) {
  if (!duration) return NaN;
  const d = duration.toLowerCase().trim();

  // Common patterns
  const patterns = {
    "1 day": 1,
    "2 days": 2,
    "3 days": 3,
    "5 days": 5,
    "7 days": 7,
    "14 days": 14,
    "30 days": 30,
    "1 month": 30,
    "6 weeks": 42,
    "3 months": 90,
    "6 months": 180,
    "1 year": 365,
    "until finished": NaN,
    "lifetime": NaN,
  };
  if (patterns[d] !== undefined) return patterns[d];

  // Try extracting a number followed by "day(s)" or just a number
  const numMatch = duration.match(/(\d+)\s*day/i);
  if (numMatch) return parseInt(numMatch[1], 10);

  const justNum = duration.match(/^(\d+)$/);
  if (justNum) return parseInt(justNum[1], 10);

  return NaN;
}

/**
 * Core calculation routine.
 * @param {Object} med — extracted medication from Groq (has frequency, duration, dosage)
 * @returns {{quantity: number, volume_ml: number, total_pills_needed: number, daily_dose_count: number}}
 */
export function calculateMedQuantity(med) {
  const freq = med.frequency || "";
  const dur = med.duration || "";
  const dos = med.dosage || "";

  const dailyDoseCount = FREQ_MAP[freq] || 1;
  const totalDays = parseDurationDays(dur);
  const { form, volumePerUnit } = parseDosage(dos);

  let quantity = 0;        // total tablets/capsules to purchase
  let volume_ml = 0;       // total milliliters of liquid to purchase
  let total_pills_needed = 0;

  if (form === "liquid" && !isNaN(totalDays) && !isNaN(volumePerUnit)) {
    // Liquid: volume per dose × doses per day × days
    volume_ml = Math.ceil(volumePerUnit * dailyDoseCount * totalDays);
    total_pills_needed = dailyDoseCount;
  } else {
    // Tablet: doses per day × days = total tablets
    if (!isNaN(totalDays)) {
      quantity = dailyDoseCount * totalDays;
      total_pills_needed = quantity;
    }
  }

  return {
    quantity: Math.max(quantity, 1),
    volume_ml: Math.max(volume_ml, 0),
    total_pills_needed: total_pills_needed || undefined,
    daily_dose_count: dailyDoseCount,
  };
}
