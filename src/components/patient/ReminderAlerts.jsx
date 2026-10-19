import Art from "../../design/Art";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PhoneFrame, ScreenHeader, Chip, Button, Icon } from "../../design/components";
import {
  getReminders, updateReminderStatus, removeReminder,
  markDoseTaken, undoDose, snoozeReminder, pruneReminders,
} from "../../lib/storage";
import {
  dayKey, scheduleFor, todaysDoses, nextDose, minutesUntil, humanCountdown, adherence, courseDay, groupByTime,
} from "../../lib/reminders";
import AppTabs from "../../design/AppTabs";

const ReminderAlerts = ({ onFinish, onBack }) => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState(getReminders());
  const [now, setNow] = useState(new Date());

  const refresh = useCallback(() => setReminders(getReminders()), []);

  useEffect(() => {
    // one-time cleanup of duplicate records left by earlier test orders
    const removed = pruneReminders();
    if (removed) console.log(`[reminders] pruned ${removed} duplicate record(s)`);
    refresh();
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, [refresh]);

  const doses = todaysDoses(reminders, now);
  const slots = groupByTime(doses);
  const next = nextDose(reminders, now);
  const stats = adherence(reminders, 7, now);
  const key = dayKey(now);
  const takenCount = doses.filter((d) => d.taken).length;

  const handleTake = (dose) => {
    if (dose.taken) undoDose( dose.reminder.id, dose.key, dose.time);
    else markDoseTaken(dose.reminder.id, dose.key, dose.time);
    refresh();
  };

  const handleSnooze = (reminder) => {
    const until = new Date(Date.now() + 30 * 60000).toISOString();
    snoozeReminder(reminder.id, until);
    refresh();
  };

  const handleRemove = (reminder) => {
    removeReminder(reminder.id);
    refresh();
  };

  return (
    <PhoneFrame tone="success">
      <div className="h-screen">
        <ScreenHeader title="Reminders" onBack={onBack || null} />
        <div className="h-screen-body">
          {reminders.length === 0 ? (
            <div className="h-empty">
              <Art scene="reminder" />
              <b>No reminders yet</b>
              <small>Complete a purchase and we'll remind you when to take each medicine.</small>
              <Button variant="outline" onClick={onFinish}>Start New Order</Button>
            </div>
          ) : (
            <>
              {next && (
                <div className="h-nextdose">
                  <span className="h-micro">Next dose</span>
                  <div className="h-nextrow">
                    <div className="h-licon"><Icon n="clock" size={16} /></div>
                    <div className="h-lmain">
                      <b>{next.reminder.medication_name}</b>
                      <small>{next.reminder.dosage} · {next.time}</small>
                    </div>
                    <span className="h-nextin">in {humanCountdown(minutesUntil(next.at, now))}</span>
                  </div>
                </div>
              )}

              <div className="h-groprow">
                <p>Today</p>
                <span className="h-meta">{takenCount} of {doses.length} doses taken</span>
              </div>

              <div className="h-list">
                {slots.length === 0 ? (
                  <small className="h-meta" style={{ display: "block", padding: "10px 0" }}>
                    No doses scheduled for today.
                  </small>
                ) : (
                  slots.map((slot) => (
                    <div key={slot.time} className="h-timeslot">
                      <span className="h-slotlabel">{slot.time}</span>
                      <div className="h-slotdoses">
                        {slot.doses.map((d) => {
                          const overdue = !d.taken && d.at < now;
                          return (
                            <div key={`${d.reminder.id}-${d.time}`} className="h-dose">
                              <div className="h-lmain">
                                <b>{d.reminder.medication_name}</b>
                                <small>{d.reminder.dosage}{d.snoozed ? " · snoozed" : ""}</small>
                              </div>
                              <button
                                className={`h-dosecheck ${d.taken ? "is-on" : overdue ? "is-due" : ""}`}
                                onClick={() => handleTake(d)}
                                aria-label={d.taken ? "Mark as not taken" : "Mark as taken"}
                              >
                                {d.taken ? <Icon n="check" size={14} /> : ""}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="h-groprow">
                <p>Adherence · last 7 days</p>
                <span className="h-meta">{stats.pct}%</span>
              </div>
              <div className="h-adhere">
                {stats.perDay.map((d) => (
                  <div key={d.key} className="h-adhcell">
                    <i style={{ height: `${d.total ? Math.max(8, (d.taken / d.total) * 100) : 8}%` }} />
                    <small>{d.key.slice(8)}</small>
                  </div>
                ))}
              </div>

              <div className="h-groprow">
                <p>Your medicines</p>
                <span className="h-meta">{reminders.length}</span>
              </div>
              {reminders.map((r) => {
                const course = courseDay(r, now);
                const times = scheduleFor(r);
                return (
                  <div key={r.id} className="h-rcard">
                    <header>
                      <p>{r.medication_name}</p>
                      <Chip>{r.status === "taken" ? "✓ Taken" : r.status === "snoozed" ? "Snoozed" : "Active"}</Chip>
                    </header>
                    <small>
                      {r.dosage} · {r.frequency}
                      {times.length ? ` · ${times.length}× daily` : ""}
                      {course?.total ? ` · Day ${course.day} of ${course.total}` : ""}
                    </small>
                    <div className="h-ractions">
                      <Button variant="ink" size="xs" fit onClick={() => handleSnooze(r)}>Snooze 30m</Button>
                      <button className="h-linkbtn is-danger" style={{ marginLeft: "auto" }} onClick={() => handleRemove(r)}>
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="h-chipsrow" style={{ justifyContent: "flex-start", marginTop: 4 }}>
                <button className="h-roleswap" onClick={() => navigate("/track")}>Follow the rider</button>
                <button className="h-roleswap" onClick={() => navigate("/profile")}>My profile</button>
              </div>
            </>
          )}
        </div>
        {reminders.length > 0 && (
          <div className="h-screen-cta has-tabs">
            <Button onClick={onFinish}>Done</Button>
          </div>
        )}
      </div>
      <AppTabs active="reminders" />
    </PhoneFrame>
  );
};

export default ReminderAlerts;
