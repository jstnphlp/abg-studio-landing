import Image from "next/image";

/** Original Cycles reflections; purely decorative and outside the form flow. */
export function BookingChrome() {
  return (
    <div className="abg-booking-chrome" aria-hidden="true">
      <Image
        src="/chrome/hero-right-chrome.webp"
        alt=""
        fill
        unoptimized
        loading="eager"
        sizes="(max-width: 520px) 110vw, (max-width: 800px) 66vw, 46vw"
        draggable={false}
      />
    </div>
  );
}
