"use client";

import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";

const services = [
  "Nail artistry (demo)",
  "Sculpted sets (demo)",
  "The finishing touch (demo)",
  "Not sure yet",
] as const;

const times = [
  "09:00",
  "10:30",
  "12:00",
  "13:30",
  "15:00",
  "16:30",
] as const;

function dateInputMinimum() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return [year, month, day].join("-");
}

type RequestPreview = {
  service: string;
  date: string;
  time: string;
};

export function BookingForm() {
  const [preview, setPreview] = useState<RequestPreview | null>(null);
  const [minimumDate] = useState(dateInputMinimum);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const date = String(data.get("date") ?? "");
    if (date < dateInputMinimum()) {
      form.querySelector<HTMLInputElement>("[name=date]")?.setCustomValidity(
        "Please choose a date that has not passed.",
      );
      form.reportValidity();
      return;
    }

    setPreview({
      service: String(data.get("service") ?? ""),
      date,
      time: String(data.get("time") ?? ""),
    });
  }

  return (
    <div className="abg-booking" id="booking">
      <div className="abg-booking-top">
        <div className="abg-booking-topline">
          <span className="abg-overline">THE APPOINTMENT EDIT</span>
          <Sparkles aria-hidden="true" size={17} strokeWidth={1.2} />
        </div>
        <h2>Make it <em>yours.</em></h2>
        <p>
          A considered experience starts here. Explore this booking interface as
          a preview of what the live studio site could become.
        </p>
      </div>

      <div className="abg-demo-notice">
        <span className="abg-demo-dot" aria-hidden="true" />
        INTERACTIVE DEMO · NO BOOKINGS ARE SENT
      </div>

      <form className="abg-form" onSubmit={handleSubmit} onChange={() => setPreview(null)}>
        <div className="abg-field">
          <label htmlFor="abg-service">01 / Your service</label>
          <select id="abg-service" name="service" required defaultValue="">
            <option value="" disabled>Choose an experience</option>
            {services.map((service) => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
        </div>

        <div className="abg-form-row">
          <div className="abg-field">
            <label htmlFor="abg-date">02 / Preferred date</label>
            <input
              id="abg-date"
              name="date"
              type="date"
              min={minimumDate}
              required
              onChange={(event) => event.currentTarget.setCustomValidity("")}
            />
          </div>
          <div className="abg-field">
            <label htmlFor="abg-time">03 / Preferred time</label>
            <select id="abg-time" name="time" required defaultValue="">
              <option value="" disabled>Select time</option>
              {times.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="abg-form-row">
          <div className="abg-field">
            <label htmlFor="abg-name">04 / Your name</label>
            <input
              id="abg-name"
              name="name"
              autoComplete="name"
              maxLength={80}
              placeholder="Full name"
              required
            />
          </div>
          <div className="abg-field">
            <label htmlFor="abg-email">05 / Email address</label>
            <input
              id="abg-email"
              name="email"
              autoComplete="email"
              type="email"
              maxLength={150}
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div className="abg-field">
          <label htmlFor="abg-note">06 / Anything we should know? <span>(optional)</span></label>
          <textarea
            id="abg-note"
            name="note"
            maxLength={400}
            rows={2}
            placeholder="Tell us about your vision..."
          />
        </div>

        <button type="submit" className="abg-book-button">
          Preview request
          <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.5} />
        </button>
        <p className="abg-form-disclaimer">
          Demo form only. Times are examples, not verified availability. No
          personal information is stored or transmitted.
        </p>
      </form>

      {preview && (
        <div className="abg-booking-result" role="status" aria-live="polite">
          <div className="abg-result-title">
            <Check size={16} aria-hidden="true" />
            Request preview created
          </div>
          <p>
            {preview.service} · {preview.date} · {preview.time}
          </p>
          <small>
            This is a visual demonstration. Your appointment has NOT been sent
            or confirmed.
          </small>
        </div>
      )}
    </div>
  );
}
