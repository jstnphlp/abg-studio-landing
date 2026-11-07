"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function BookingCalendar({
  minimum,
  value,
  onChange,
}: {
  minimum: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [month, setMonth] = useState(
    () => new Date(`${value || minimum}T12:00:00`),
  );
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const count = Math.ceil((first.getDay() + days) / 7) * 7;
  const title = month.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
  return (
    <div className="abg-calendar" role="group" aria-label="Preferred date">
      <div className="abg-calendar-heading">
        <span aria-live="polite">{title}</span>
        <div>
          <button
            type="button"
            aria-label="Previous month"
            disabled={dateKey(first).slice(0, 7) <= minimum.slice(0, 7)}
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <div className="abg-calendar-grid">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <span className="abg-calendar-weekday" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: count }, (_, index) => {
          const date = new Date(
            month.getFullYear(),
            month.getMonth(),
            index - first.getDay() + 1,
          );
          const key = dateKey(date);
          return (
            <button
              type="button"
              key={key}
              className={
                date.getMonth() !== month.getMonth()
                  ? "abg-calendar-outside"
                  : undefined
              }
              disabled={key < minimum}
              aria-label={date.toLocaleDateString("en-PH", {
                dateStyle: "full",
              })}
              aria-pressed={value === key}
              aria-current={key === minimum ? "date" : undefined}
              onClick={() => onChange(key)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      <p className="abg-calendar-selection" aria-live="polite">
        {value
          ? new Date(`${value}T12:00:00`).toLocaleDateString("en-PH", {
              dateStyle: "long",
            })
          : "Choose your preferred date"}
      </p>
    </div>
  );
}
