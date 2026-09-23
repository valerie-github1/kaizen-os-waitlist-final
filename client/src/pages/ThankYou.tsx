import { Link } from "wouter";

export default function ThankYou() {
  const name = new URLSearchParams(window.location.search).get("name");
  return <main className="thanks"><div className="thanks-card"><div className="thanks-icon" aria-hidden="true">✓</div><p className="eyebrow">Kaizen OS · PhoennixAI</p><h1>You’re on the <em>list.</em></h1><p>{name ? `Thanks, ${name}. We’ll contact you when an early-access invitation wave is ready.` : "Thank you for your interest in Kaizen OS. We’ll contact you when an early-access invitation wave is ready."}</p><Link className="button-link" href="/">Back to Kaizen OS</Link></div></main>;
}
