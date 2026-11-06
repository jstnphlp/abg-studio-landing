import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  Instagram,
  MoveUpRight,
  Sparkles,
} from "lucide-react";

import { BookingForm } from "@/components/portfolio/booking-form";
import { portfolio } from "@/config/portfolio";
import "./portfolio.css";

function Starfield() {
  return (
    <div className="abg-stars" aria-hidden="true">
      {Array.from({ length: 52 }, (_, index) => {
        const x = (index * 73.79 + 7.13) % 100;
        const y = (index * 41.31 + 11.24) % 100;
        const size = index % 9 === 0 ? 2.6 : index % 3 === 0 ? 1.7 : 1;
        return (
          <span
            key={index}
            style={{
              left: x + "%",
              top: y + "%",
              width: size + "px",
              height: size + "px",
              animationDelay: ((index % 13) * -0.48) + "s",
              animationDuration: (3 + (index % 7) * 0.7) + "s",
            }}
          />
        );
      })}
    </div>
  );
}

function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className={"abg-brand" + (small ? " abg-brand-small" : "")} aria-label="ABG Studios — Home">
      <span className="abg-brand-script">abg</span>
      <span className="abg-brand-serif">STUDIOS</span>
    </Link>
  );
}

function ChromeSignature() {
  return (
    <div className="abg-logo-frame">
      <div className="abg-logo-orbit abg-logo-orbit-one" aria-hidden="true" />
      <div className="abg-logo-orbit abg-logo-orbit-two" aria-hidden="true" />
      {portfolio.chromeLogoVideo && portfolio.chromeLogoPoster ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={portfolio.chromeLogoPoster}
          className="abg-3d-video"
          aria-label="ABG Studios metallic typography"
        >
          <source src={portfolio.chromeLogoVideo} />
        </video>
      ) : portfolio.chromeLogoPoster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={portfolio.chromeLogoPoster} className="abg-3d-video" alt="ABG Studios chrome lettering" />
      ) : (
        <div className="abg-logo-display" aria-label="ABG Studios">
          <span className="abg-logo-script">abg</span>
          <span className="abg-logo-serif">STUDIOS</span>
          <span className="abg-logo-shine" aria-hidden="true" />
        </div>
      )}
      <div className="abg-logo-corner abg-logo-corner-top" />
      <div className="abg-logo-corner abg-logo-corner-bottom" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="abg-site">
      <a href="#main" className="abg-skip">Skip to content</a>
      <div className="abg-site-noise" aria-hidden="true" />
      <header className="abg-header">
        <Brand small />
        <nav aria-label="Main navigation">
          <a href="#about">The studio</a>
          <a href="#services">Services</a>
          <a href="#work">Our work</a>
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
              INDEPENDENT BEAUTY STUDIO <span className="abg-dot">•</span> MANILA
            </div>
            <h1 id="abg-hero-heading" className="abg-sr-only">
              ABG Studios — a new expression of beauty
            </h1>
            <ChromeSignature />
            <div className="abg-hero-lower">
              <div>
                <p className="abg-tagline">A new expression<br />of <em>beauty.</em></p>
                <p className="abg-lede">
                  Considered details. Bold expression. An experience designed to feel entirely yours.
                </p>
                <a className="abg-text-link" href="#work">
                  Explore our world <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              </div>
              <span className="abg-edition">EST. MANILA <span>✦</span> ISSUE 001</span>
            </div>
          </div>
          <div className="abg-hero-right">
            <BookingForm />
          </div>
          <a href="#about" className="abg-scroll-cue">
            <ArrowDown size={13} aria-hidden="true" /> SCROLL TO EXPLORE
          </a>
        </section>

        <section id="about" className="abg-intro abg-section">
          <div className="abg-section-index">01 / THE STUDIO</div>
          <div className="abg-intro-main">
            <span className="abg-asterisk" aria-hidden="true">✳</span>
            <h2>Beauty is in<br />the <em>details.</em></h2>
            <div className="abg-intro-foot">
              <p>
                We believe the most memorable looks begin with intention. ABG Studios
                is a space to experiment, express, and feel a little more like yourself.
              </p>
              <span>ARTISTRY <span className="abg-dot">✦</span> SELF EXPRESSION <span className="abg-dot">✦</span> DETAIL</span>
            </div>
          </div>
        </section>

        <section id="services" className="abg-services abg-section">
          <div className="abg-section-heading">
            <div>
              <div className="abg-section-index">02 / THE EXPERIENCE</div>
              <h2>The <em>service</em> edit.</h2>
            </div>
            <p>A starting point for the services and experiences that make ABG, ABG.</p>
          </div>
          <div className="abg-service-list">
            {portfolio.services.map((item) => (
              <a className="abg-service-row" href="#booking" key={item.number}>
                <span className="abg-service-number">{item.number}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <span className="abg-service-meta">{item.note}</span>
                <ArrowUpRight size={23} strokeWidth={1} aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>

        <section id="work" className="abg-work abg-section">
          <div className="abg-section-heading">
            <div>
              <div className="abg-section-index">03 / SELECTED WORK</div>
              <h2>A little <em>obsession.</em></h2>
            </div>
            <p>Conceptual visual studies. Replace these with the studio&apos;s real photography when ready.</p>
          </div>
          <div className="abg-work-grid">
            {portfolio.projects.map((project, index) => (
              <article className="abg-work-card" key={project.number}>
                <div className={"abg-work-art abg-work-art-" + project.art}>
                  <span className="abg-art-label">ABG / STUDY {project.number}</span>
                  <div className="abg-art-form" aria-hidden="true" />
                  <span className="abg-art-accent" aria-hidden="true">{index === 1 ? "✳" : "✦"}</span>
                  <span className="abg-art-bottom">VISUAL EXPLORATION — 00{index + 1}</span>
                </div>
                <div className="abg-work-info">
                  <div>
                    <h3>{project.title}</h3>
                    <span>{project.category}</span>
                  </div>
                  <MoveUpRight size={20} strokeWidth={1} aria-hidden="true" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="abg-outro abg-section" aria-labelledby="abg-outro-heading">
          <div className="abg-outro-star"><Sparkles size={34} strokeWidth={0.75} /></div>
          <div className="abg-section-index">04 / THE NEXT CHAPTER</div>
          <h2 id="abg-outro-heading">Something <em>beautiful</em><br />starts here.</h2>
          <a href="#booking" className="abg-final-link">Explore booking <ArrowRight size={18} aria-hidden="true" /></a>
        </section>
      </main>

      <footer className="abg-footer">
        <Brand small />
        <span>MANILA, PHILIPPINES</span>
        <span>© {new Date().getFullYear()} ABG STUDIOS · DESIGN TEMPLATE</span>
        <div className="abg-footer-links">
          <a href="#main">Back to top <ArrowUpRight size={13} aria-hidden="true" /></a>
          <Link href="/login">Staff login <ArrowUpRight size={13} aria-hidden="true" /></Link>
        </div>
      </footer>
    </div>
  );
}
