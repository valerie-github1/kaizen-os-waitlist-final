import { FormEvent, useMemo, useState } from "react";
import ProductGallery from "@/components/ProductGallery";
import { Link, useLocation } from "wouter";

const BRAND = "/manus-storage/PhoennixAI_16d880ee.jpg";
const PRODUCT = "/manus-storage/kaizen-os-product-hero_b221c57c.png";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Home() {
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const emailIsValid = useMemo(() => EMAIL_PATTERN.test(email.trim()), [email]);
  const emailMessage = !email && !emailTouched ? "" : emailIsValid ? "Email looks good." : email ? "Enter a valid email address." : "Email address is required.";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailTouched(true);
    if (!emailIsValid) { setError(""); return; }
    if (!terms) { setError("Please confirm that you agree to the waitlist terms before continuing."); return; }
    setError(""); setIsLoading(true);
    window.setTimeout(() => setLocation(`/thank-you${firstName ? `?name=${encodeURIComponent(firstName)}` : ""}`), 480);
  }

  return <>
    <a className="skip-link" href="#waitlist">Skip to the waitlist form</a>
    <div className="site-shell">
      <header className="site-header"><Link className="brand" href="/"><span className="brand-mark"><img src={BRAND} alt="PhoennixAI phoenix mark" /></span><span className="brand-type">PhoennixAI<small>Kaizen OS · Early access</small></span></Link><nav className="site-nav" aria-label="Page sections"><a href="#gallery">Product</a><a href="#faq">FAQ</a></nav><span className="launch-pill">Private market test</span></header>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy"><p className="eyebrow">A quieter way to move forward</p><h1 id="hero-title">Small gains.<br/><em>Compounded.</em></h1><p className="lede">Kaizen OS helps ambitious teams turn intentional habits into a durable operating rhythm. Join the market-validation waitlist for a considered first look.</p><div className="signal-row"><span>Market test</span><span>Early access</span><span>Built for focus</span></div>
            <form className="waitlist-card" id="waitlist" onSubmit={submit} noValidate><p className="card-label">Register your interest</p><div className="field-grid"><div className="field"><label htmlFor="firstName">First name *</label><input id="firstName" name="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" placeholder="Your first name" required /></div><div className="field"><label htmlFor="email">Email address *</label><input id="email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} onBlur={() => setEmailTouched(true)} className={emailTouched || email ? (emailIsValid ? "is-valid" : "is-invalid") : ""} aria-invalid={emailTouched && !emailIsValid} aria-describedby="email-feedback" autoComplete="email" placeholder="you@example.com" required /><small className={`email-feedback ${emailTouched || email ? (emailIsValid ? "is-valid" : "is-invalid") : ""}`} id="email-feedback" aria-live="polite">{emailMessage}</small></div></div><div className="field-grid"><div className="field"><label htmlFor="company">Company or organisation</label><input id="company" autoComplete="organization" placeholder="Optional" /></div><div className="field"><label htmlFor="role">Role</label><input id="role" autoComplete="organization-title" placeholder="Optional" /></div></div><label className="consent"><input type="checkbox" checked={terms} onChange={(event) => { setTerms(event.target.checked); setError(""); }} /><p>I agree to the <Link href="/terms">waitlist terms</Link> and acknowledge the <Link href="/privacy">privacy notice</Link>. *</p></label><label className="consent"><input type="checkbox" /><p>I would also like occasional product news from PhoennixAI. You can unsubscribe at any time.</p></label><button className={`cta ${isLoading ? "is-loading" : ""}`} type="submit" disabled={isLoading}><span className="button-text">{isLoading ? "Saving your interest…" : "Register interest"}</span><span className="button-spinner" aria-hidden="true" /></button><p className="form-message is-error" aria-live="polite">{error}</p></form>
          </div>
          <div className="product-stage"><figure className="product-frame"><img src={PRODUCT} alt="A laptop displaying the Kaizen OS workspace" /><figcaption className="product-caption">A first look at the Kaizen OS workspace</figcaption></figure></div>
        </section>
        <ProductGallery />
        <section className="section"><p className="eyebrow">What to expect</p><h2 className="section-title">Designed for <em>deliberate</em> progress.</h2><p className="section-intro">This focused market test helps us learn where Kaizen OS can make the strongest difference before we invest in a broader launch.</p><div className="features"><article className="feature"><span className="feature-number">01 / Focus</span><h3>Make the next step obvious.</h3><p>Bring the work that matters into a clear, calm system for making steady decisions.</p></article><article className="feature"><span className="feature-number">02 / Rhythm</span><h3>Build a practice that lasts.</h3><p>Use a repeatable operating rhythm rather than relying on another burst of motivation.</p></article><article className="feature"><span className="feature-number">03 / Signal</span><h3>See what is moving.</h3><p>Keep the progress, trade-offs and lessons visible enough to make the next improvement count.</p></article></div></section>
        <section className="section promise" id="faq"><aside className="promise-card"><strong>A respectful waitlist.</strong><p>We ask for only what we need to run this market test, and separate optional product news from operational confirmation messages.</p></aside><div className="faq"><details><summary>What happens after I join?</summary><p>Your interest is recorded, and a confirmation email may be sent from our Google Workspace account. If Kaizen OS moves into early access, we may contact people whose context is a good fit.</p></details><details><summary>Is joining a purchase or a guarantee?</summary><p>No. The waitlist records interest only. It does not create a paid subscription or guarantee access, timing or a particular feature set.</p></details><details><summary>How can I leave the waitlist?</summary><p>Request removal through <a className="faq-link" href="https://phoennixai.com/" target="_blank" rel="noreferrer">PhoennixAI</a>. Optional product news can also be unsubscribed from directly in any product update email.</p></details></div></section>
      </main>
      <footer className="site-footer"><span>© 2026 PhoennixAI · Kaizen OS</span><span className="footer-links"><Link href="/privacy">Privacy notice</Link><Link href="/terms">Waitlist terms</Link></span></footer>
    </div>
  </>;
}
