import { useState } from "react";

const SHARE_TEXT = "I’ve joined the Kaizen OS early-access waitlist by PhoennixAI. Join me.";

function shareUrl() {
  return new URL("/", window.location.origin).href;
}

export default function SocialShare() {
  const [feedback, setFeedback] = useState("");
  const url = shareUrl();
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  async function shareInstagram() {
    const data = { title: "Kaizen OS early access", text: SHARE_TEXT, url };
    if (navigator.share) {
      try {
        await navigator.share(data);
        setFeedback("Share sheet opened. Choose Instagram to share.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${url}`);
      setFeedback("Link copied. Instagram is opening so you can share it in a post or story.");
    } catch {
      setFeedback("Copy the page link from your browser, then share it on Instagram.");
    }
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  return <section className="share-panel" aria-labelledby="share-heading">
    <p className="share-kicker">Invite your circle</p>
    <h2 id="share-heading">Better with your <em>people.</em></h2>
    <p>Share the waitlist with someone who is building more intentionally.</p>
    <div className="share-actions">
      <a className="share-button share-x" href={xUrl} target="_blank" rel="noopener noreferrer" aria-label="Share Kaizen OS on X"><span aria-hidden="true">𝕏</span><span>Twitter</span></a>
      <button className="share-button share-instagram" type="button" onClick={shareInstagram} aria-label="Share Kaizen OS on Instagram"><span aria-hidden="true">◎</span><span>Instagram</span></button>
      <a className="share-button share-linkedin" href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="Share Kaizen OS on LinkedIn"><span aria-hidden="true">in</span><span>LinkedIn</span></a>
    </div>
    <p className="share-feedback" aria-live="polite">{feedback}</p>
  </section>;
}
