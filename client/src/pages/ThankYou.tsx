import { Link } from "wouter";
import SocialShare from "@/components/SocialShare";

export default function ThankYou() {
  const name = new URLSearchParams(window.location.search).get("name");
  return <main className="thanks"><div className="thanks-card"><div className="thanks-icon" aria-hidden="true">✓</div><p className="eyebrow">Kaizen OS · PhoennixAI</p><h1>You’re on the <em>list.</em></h1><p>{name ? `Thanks, ${name}. Your response helps us understand where Kaizen OS can make the strongest difference.` : "Thanks for registering your interest in Kaizen OS. Your response helps us understand where the product can make the strongest difference."}</p><SocialShare /><Link className="button-link" href="/">Back to Kaizen OS</Link></div></main>;
}
