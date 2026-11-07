"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ImagePlus,
  Sparkles,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { BookingCalendar } from "@/features/booking/components/booking-calendar";
import {
  photoSchema,
  preferredTimes,
  previewSchema,
} from "@/features/booking/request-preview";

type Photo = { file: File; url: string };
type RequestPreview = {
  name: string;
  date: string;
  time: string;
  note: string;
  photos: Photo[];
};
const steps = [
  "Select a date",
  "Your name",
  "Preferred time",
  "Your inspiration",
  "Request preview",
];
function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
function formattedDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-PH", {
    dateStyle: "long",
  });
}

export function BookingForm() {
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [minimumDate] = useState(today);
  const [draft, setDraft] = useState({ name: "", time: "", note: "" });
  const [preview, setPreview] = useState<RequestPreview | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const photoUrls = useRef(new Set<string>());
  useEffect(() => {
    const urls = photoUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  function attachPhotos(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const incoming = Array.from(input.files ?? []);
    const result = photoSchema.safeParse([
      ...photos.map((photo) => photo.file),
      ...incoming,
    ]);
    input.value = "";
    if (!result.success) {
      setPhotoError(result.error.issues[0].message);
      return;
    }
    setPhotoError("");
    const additions = incoming.map((file) => {
      const url = URL.createObjectURL(file);
      photoUrls.current.add(url);
      return { file, url };
    });
    setPhotos((current) => [...current, ...additions]);
  }
  function removePhoto(url: string) {
    URL.revokeObjectURL(url);
    photoUrls.current.delete(url);
    setPhotos((current) => current.filter((photo) => photo.url !== url));
    setPhotoError("");
  }
  function handleNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity() || step >= 4) return;
    const schema = previewSchema(today());
    if (step < 3) {
      const result =
        step === 0
          ? schema.shape.date.safeParse(selectedDate)
          : step === 1
            ? schema.shape.name.safeParse(draft.name)
            : schema.shape.time.safeParse(draft.time);
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
      setError("");
      setStep(step + 1);
      return;
    }
    const result = schema.safeParse({ ...draft, date: selectedDate });
    if (!result.success) {
      setError(result.error.issues[0].message);
      const field = result.error.issues[0].path[0];
      setStep(
        field === "date" ? 0 : field === "name" ? 1 : field === "time" ? 2 : 3,
      );
      return;
    }
    setError("");
    setPreview({ ...result.data, photos });
    setStep(4);
  }
  function back() {
    setError("");
    setStep((current) => Math.max(0, current - 1));
  }
  return (
    <div className="abg-booking" id="booking">
      <div className="abg-booking-top">
        <div className="abg-booking-topline">
          <span className="abg-overline">THE APPOINTMENT EDIT</span>
          <Sparkles aria-hidden="true" size={17} strokeWidth={1.2} />
        </div>
        <h2>
          Make it <em>yours.</em>
        </h2>
      </div>
      <div className="abg-demo-notice">
        <span className="abg-demo-dot" aria-hidden="true" />
        INTERACTIVE DEMO ? NO BOOKINGS ARE SENT
      </div>
      <div
        className="abg-step-progress"
        aria-label={`Step ${step + 1} of ${steps.length}: ${steps[step]}`}
      >
        {steps.map((label, index) => (
          <span
            key={label}
            className={index <= step ? "is-complete" : undefined}
            aria-hidden="true"
          />
        ))}
      </div>
      <form className="abg-form abg-wizard" onSubmit={handleNext}>
        <div className="abg-step-heading">
          <span>0{step + 1} / 05</span>
          <h3 ref={heading} tabIndex={-1}>
            {steps[step]}
          </h3>
        </div>
        <div className="abg-wizard-body" key={step}>
          {step === 0 && (
            <BookingCalendar
              minimum={minimumDate}
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setError("");
              }}
            />
          )}
          {step === 1 && (
            <div className="abg-field abg-step-field">
              <label htmlFor="abg-name">What should we call you?</label>
              <input
                id="abg-name"
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={80}
                placeholder="Full name"
                required
                value={draft.name}
                onChange={(event) => {
                  setDraft({ ...draft, name: event.target.value });
                  setError("");
                }}
              />
              <p>We?ll include your name in the request preview.</p>
            </div>
          )}
          {step === 2 && (
            <div className="abg-field abg-step-field">
              <label htmlFor="abg-time">Choose a preferred time</label>
              <select
                id="abg-time"
                name="time"
                required
                value={draft.time}
                onChange={(event) => {
                  setDraft({ ...draft, time: event.target.value });
                  setError("");
                }}
              >
                <option value="" disabled>
                  Select time
                </option>
                {preferredTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <p>
                {formattedDate(selectedDate)} ? Manila time
                <br />
                Times shown are examples, not confirmed availability.
              </p>
            </div>
          )}
          {step === 3 && (
            <div className="abg-field">
              <label htmlFor="abg-note">
                Anything we should know? <span>(optional)</span>
              </label>
              <textarea
                id="abg-note"
                name="note"
                maxLength={400}
                rows={4}
                placeholder="Your vision, inspiration, or special requests?"
                value={draft.note}
                onChange={(event) =>
                  setDraft({ ...draft, note: event.target.value })
                }
              />
              <div className="abg-photo-controls">
                <label className="abg-photo-add">
                  <ImagePlus size={17} aria-hidden="true" /> Add photos
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    aria-label="Add inspiration photos"
                    onChange={attachPhotos}
                    disabled={photos.length >= 4}
                  />
                </label>
                <span>Up to 4 ? JPG, PNG, WebP ? 5 MB each</span>
              </div>
              {photoError && (
                <p className="abg-form-error" role="alert">
                  {photoError}
                </p>
              )}
              {photos.length > 0 && (
                <ul className="abg-photo-list" aria-label="Attached photos">
                  {photos.map((photo) => (
                    <li key={photo.url}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- Local blob URLs never leave this browser. */}
                      <img
                        src={photo.url}
                        alt={photo.file.name}
                        width={56}
                        height={56}
                      />
                      <button
                        type="button"
                        aria-label={`Remove ${photo.file.name}`}
                        onClick={() => removePhoto(photo.url)}
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {step === 4 && preview && (
            <section
              className="abg-request-preview"
              aria-label="Request preview"
            >
              <div className="abg-result-title">
                <Check size={16} aria-hidden="true" /> Ready to review
              </div>
              <dl>
                <dt>Name</dt>
                <dd>{preview.name}</dd>
                <dt>Preferred date & time</dt>
                <dd>
                  {formattedDate(preview.date)} ? {preview.time} Manila
                </dd>
                <dt>Anything we should know?</dt>
                  <dd className="abg-preview-note" tabIndex={0}>
                  {preview.note || "No additional notes"}
                </dd>
              </dl>
              {preview.photos.length > 0 && (
                <div className="abg-preview-photos">
                  {preview.photos.map((photo) => (
                    // eslint-disable-next-line @next/next/no-img-element -- Local attachment preview.
                    <img
                      key={photo.url}
                      src={photo.url}
                      alt={photo.file.name}
                      width={64}
                      height={64}
                    />
                  ))}
                </div>
              )}
              <p>
                This is a demo. Your appointment has NOT been sent or confirmed.
                Photos have not been uploaded.
              </p>
            </section>
          )}
        </div>
        {error && (
          <p className="abg-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="abg-wizard-actions">
          <button
            type="button"
            className="abg-step-back"
            disabled={step === 0}
            onClick={back}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            {step === 4 ? "Back to edit" : "Back"}
          </button>
          {step < 4 && (
            <button
              type="submit"
              className="abg-book-button"
              disabled={step === 0 && !selectedDate}
            >
              {step === 3 ? "Preview request" : "Continue"}
              <ArrowUpRight aria-hidden="true" size={18} />
            </button>
          )}
        </div>
        <p className="abg-form-disclaimer">
          Details and photos stay on this device.
        </p>
      </form>
    </div>
  );
}
