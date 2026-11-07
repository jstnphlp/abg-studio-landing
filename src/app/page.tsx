import Link from "next/link";
import { ArrowUpRight, Asterisk } from "lucide-react";

import { BookingForm } from "@/components/portfolio/booking-form";
import { ThemeToggle } from "@/features/appearance/components/theme-toggle";
import { Starfield } from "@/features/appearance/components/starfield";
import { HeroLogo } from "@/features/brand/components/hero-logo";
import "./portfolio.css";

export default function Home() {
  return (
    <div className="abg-site">
      <a href="#main" className="abg-skip">
        Skip to content
      </a>
      <div className="abg-site-noise" aria-hidden="true" />
      <header className="abg-header">
        <Link
          href="/"
          className="abg-navbar-star"
          aria-label="ABG Studios — Home"
        >
          <svg
            viewBox="0 0 40 40"
            width="36"
            height="36"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M20 1C22 14 26 18 39 20C26 22 22 26 20 39C18 26 14 22 1 20C14 18 18 14 20 1Z" />
          </svg>
        </Link>
        <nav aria-label="Main navigation">
          <ThemeToggle />
          <a href="#booking" className="abg-nav-book">
            Book a visit <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </nav>
      </header>

      <main id="main">
        <section className="abg-hero" aria-labelledby="abg-hero-heading">
          <Starfield />
          <div className="abg-hero-left">
            <div className="abg-hero-kicker">
              <Asterisk size={16} strokeWidth={1} aria-hidden="true" />
              INDEPENDENT BEAUTY STUDIO <span className="abg-dot">•</span>{" "}
              MANILA
            </div>
            <h1 id="abg-hero-heading" className="abg-sr-only">
              ABG Studios — a new expression of beauty
            </h1>
            <HeroLogo />
            <div className="abg-hero-lower">
              <div>
                <p className="abg-tagline">
                  A new expression
                  <br />
                  of <em>beauty.</em>
                </p>
                <p className="abg-lede">
                  Considered details. Bold expression. An experience designed to
                  feel entirely yours.
                </p>
                <a className="abg-text-link" href="#booking">
                  Plan your visit <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              </div>
              <span className="abg-edition">
                EST. MANILA <span>✦</span> ISSUE 001
              </span>
            </div>
          </div>
          <div className="abg-hero-right">
            <BookingForm />
          </div>
        </section>
      </main>
    </div>
  );
}
