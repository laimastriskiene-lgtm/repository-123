import test from "node:test";
import assert from "node:assert/strict";
import { localDate, validDate, validateHabit, scheduleChanged, canLog, plannedDates, progressFor, currentStreak } from "./habitLogic.js";

const habit = { id: "h1", name: "Ėjimas", description: "", tracking_type: "quantity", target_value: 5, unit: "km", weekdays: [1, 3, 5], start_date: "2026-10-01", end_date: null, archived_at: null };
const log = (date, value, id = "h1") => ({ habit_id: id, local_date: date, value });
test("vietinė diena naudoja vietinius kalendoriaus laukus", () => {
  const date = { getFullYear: () => 2026, getMonth: () => 9, getDate: () => 12, toISOString: () => { throw new Error("UTC neturi būti naudojama"); } };
  assert.equal(localDate(date), "2026-10-12");
});
test("tikrinamos tikros kalendoriaus datos", () => {
  assert.equal(validDate("2026-02-29"), false);
  assert.equal(validDate("2024-02-29"), true);
});
test("pavadinimas ir dienos tikrinami prieš saugojimą", () => {
  assert.throws(() => validateHabit({ ...habit, name: "  " }));
  assert.throws(() => validateHabit({ ...habit, name: "a".repeat(201) }));
  assert.throws(() => validateHabit({ ...habit, weekdays: [] }));
  assert.throws(() => validateHabit({ ...habit, weekdays: [1, 1] }));
  assert.throws(() => validateHabit({ ...habit, weekdays: [8] }));
  assert.equal(validateHabit({ ...habit, name: "  Ėjimas  " }).name, "Ėjimas");
});
test("tikslas ir laikotarpis validuojami", () => {
  for (const target_value of [0, -1, Infinity, ""]) assert.throws(() => validateHabit({ ...habit, target_value }));
  assert.throws(() => validateHabit({ ...habit, tracking_type: "boolean", target_value: 2 }));
  assert.throws(() => validateHabit({ ...habit, end_date: "2026-09-30" }));
  assert.equal(validateHabit({ ...habit, tracking_type: "boolean", target_value: 1 }).target_value, 1);
});
test("istoriniai nustatymai atskirti nuo pavadinimo ir aprašymo", () => {
  assert.equal(scheduleChanged(habit, { ...habit, name: "Naujas", description: "Tekstas", weekdays: [5, 1, 3] }), false);
  for (const change of [{ tracking_type: "boolean" }, { target_value: 6 }, { unit: "m" }, { weekdays: [1] }, { start_date: "2026-10-02" }, { end_date: "2026-10-10" }]) {
    assert.equal(scheduleChanged(habit, { ...habit, ...change }), true);
  }
});
test("žymėjimas neleidžiamas ateityje, archyve ar už tvarkaraščio", () => {
  assert.equal(canLog(habit, "2026-10-12", "2026-10-12"), true);
  for (const date of ["2026-10-14", "2026-10-13", "2026-09-30", ""]) assert.equal(canLog(habit, date, "2026-10-12"), false);
  assert.equal(canLog({ ...habit, archived_at: "2026-10-12T10:00:00Z" }, "2026-10-12", "2026-10-12"), false);
  assert.equal(canLog({ ...habit, end_date: "2026-10-09" }, "2026-10-12", "2026-10-12"), false);
});
test("progresas skaičiuoja tik suplanuotas dienas iki šiandienos", () => {
  const logs = [log("2026-10-02", 5), log("2026-10-05", 4), log("2026-10-07", 7), log("2026-10-13", 100), log("2026-10-09", 9, "other")];
  assert.deepEqual(plannedDates(habit, "2026-10-01", "2026-10-31", "2026-10-12"), ["2026-10-02", "2026-10-05", "2026-10-07", "2026-10-09", "2026-10-12"]);
  assert.deepEqual(progressFor(habit, logs, "2026-10-01", "2026-10-31", "2026-10-12"), { done: 2, total: 5, percent: 40 });
});
test("tuščias arba apverstas laikotarpis yra netaikomas", () => {
  assert.equal(progressFor(habit, [], "2026-10-03", "2026-10-04", "2026-10-12").percent, null);
  assert.equal(progressFor(habit, [], "2026-10-31", "2026-10-01", "2026-10-12").percent, null);
});
test("serija praleidžia nebaigtą šiandieną ir nesuplanuotas dienas", () => {
  const logs = [log("2026-10-05", 5), log("2026-10-07", 5), log("2026-10-09", 5)];
  assert.equal(currentStreak(habit, logs, "2026-10-12"), 3);
  assert.equal(currentStreak(habit, [...logs, log("2026-10-12", 5)], "2026-10-12"), 4);
  assert.equal(currentStreak(habit, [...logs, log("2026-10-12", 0)], "2026-10-12"), 3);
  assert.equal(currentStreak(habit, logs, "2026-10-13"), 0);
  assert.equal(currentStreak(habit, logs, "2026-10-11"), 3);
});
test("pabaigos data ir metų perėjimas riboja suplanuotas dienas", () => {
  assert.deepEqual(plannedDates({ ...habit, weekdays: [1, 2, 3, 4, 5, 6, 7], start_date: "2026-12-30", end_date: "2027-01-02" }, "2026-12-01", "2027-01-31", "2027-01-10"),
    ["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
});
