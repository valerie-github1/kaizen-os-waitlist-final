import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

const BRAND = "/manus-storage/PhoennixAI_16d880ee.jpg";
const PRODUCT = "/manus-storage/kaizen-os-product-hero_f0c08774.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!terms) { setError("Please confirm that you agree to the waitlist terms before continuing."); return; }
    setLocation(`/thank-you${firstName ? `?name=${encodeURIComponent(firstName)}` : ""}`);
  }

  return <>
    <a className="skip-link" href="#waitlist">Skip to the waitlist form</a>
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" href="/"><span className="brand-mark"><img src={BRAND} alt="PhoennixAI phoenix mark" /></span><span className="brand-type">PhoennixAI<small>Kaizen OS · Early access</small></span></Link>
        <span className="launch-pill">Private invitation waves</span>
      </header>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy"><p className="eyebrow">A quieter way to move forward</p><h1 id="hero-title">Small gains.<br/><em>Compounded.</em></h1><p className="lede">Kaizen OS helps ambitious teams turn intentional habits into a durable operating rhythm. Join the early-access waitlist for a considered first look.</p><div className="signal-row"><span>Early access</span><span>Invitation waves</span><span>Built for focus</span></div>
            <form className="waitlist-card" id="waitlist" onSubmit={submit}><p className="card-label">Request early access</p><div className="field-grid"><div className="field"><label htmlFor="firstName">First name *</label><input id="firstName" name="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" placeholder="Your first name" required /></div><div className="field"><label htmlFor="email">Email address *</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" required /></div></div><div className="field-grid"><div className="field"><label htmlFor="company">Company or organisation</label><input id="company" autoComplete="organization" placeholder="Optional" /></div><div className="field"><label htmlFor="role">Role</label><input id="role" autoComplete="organization-title" placeholder="Optional" /></div></div><label className="consent"><input type="checkbox" checked={terms} onChange={(event) => { setTerms(event.target.checked); setError(""); }} /><p>I agree to the <Link href="/terms">waitlist terms</Link> and acknowledge the <Link href="/privacy">privacy notice</Link>. *</p></label><label className="consent"><input type="checkbox" /><p>I would also like occasional product news from PhoennixAI. You can unsubscribe at any time.</p></label><button className="cta" type="submit">Request early access</button><p className="form-message is-error" aria-live="polite">{error}</p></form>
          </div>
          <div className="product-stage"><figure className="product-frame"><img src={PRODUCT} alt="A laptop displaying the Kaizen OS workspace" /><figcaption className="product-caption">A first look at the Kaizen OS workspace</figcaption></figure></div>
        </section>
        <section className="section"><p className="eyebrow">What to expect</p><h2 className="section-title">Designed for <em>deliberate</em> progress.</h2><p className="section-intro">Early access is intentionally paced. Each invitation wave helps us learn with a smaller group before the next one opens.</p><div className="features"><article className="feature"><span className="feature-number">01 / Focus</span><h3>Make the next step obvious.</h3><p>Bring the work that matters into a clear, calm system for making steady decisions.</p></article><article className="feature"><span className="feature-number">02 / Rhythm</span><h3>Build a practice that lasts.</h3><p>Use a repeatable operating rhythm rather than relying on another burst of motivation.</p></article><article className="feature"><span className="feature-number">03 / Signal</span><h3>See what is moving.</h3><p>Keep the progress, trade-offs and lessons visible enough to make the next improvement count.</p></article></div></section>
        <section className="section promise"><aside className="promise-card"><strong>A respectful waitlist.</strong><p>We ask for only what we need to manage early access, and separate optional product news from operational invitation messages.</p></aside><div className="faq"><details><summary>What happens after I join?</summary><p>Your submission is recorded and a confirmation email is sent. When a suitable invitation wave is ready, you may receive an invitation.</p></details><details><summary>Is joining a purchase or a guarantee?</summary><p>No. The waitlist records interest only. It does not create a paid subscription or guarantee access, timing or a particular feature set.</p></details><details><summary>How can I leave the waitlist?</summary><p>Use the contact details published on the production site to request removal. You can unsubscribe from optional product news through the email you receive.</p></details></div></section>
      </main>
      <footer className="site-footer"><span>© 2026 PhoennixAI · Kaizen OS</span><span className="footer-links"><Link href="/privacy">Privacy notice</Link><Link href="/terms">Waitlist terms</Link></span></footer>
    </div>
  </>;
}
