import { useState } from "react";

const views = [
  {
    id: "focus",
    eyebrow: "01 / Focus",
    title: "Make the next step obvious.",
    description: "A clear operating surface for the work that deserves attention today.",
    image: "/manus-storage/kaizen-focus-dashboard_e366c741.png",
    alt: "Kaizen OS focus workspace preview",
  },
  {
    id: "rhythm",
    eyebrow: "02 / Rhythm",
    title: "Build a practice that lasts.",
    description: "A considered weekly cadence that makes reflection feel natural, not administrative.",
    image: "/manus-storage/kaizen-weekly-rhythm_4949d102.png",
    alt: "Kaizen OS weekly rhythm workspace preview",
  },
  {
    id: "signal",
    eyebrow: "03 / Signal",
    title: "See what is moving.",
    description: "A quiet view of progress, momentum, and the decisions that deserve a closer look.",
    image: "/manus-storage/kaizen-progress-signals_e51bf7a6.png",
    alt: "Kaizen OS progress signals workspace preview",
  },
];

export default function ProductGallery() {
  const [activeId, setActiveId] = useState(views[0].id);
  const active = views.find((view) => view.id === activeId) ?? views[0];

  return <section className="product-gallery section" id="gallery" aria-labelledby="gallery-title">
    <div className="gallery-heading"><div><p className="eyebrow">A closer look</p><h2 className="section-title" id="gallery-title">Inside the <em>system.</em></h2></div><p className="gallery-intro">Three early-access views of Kaizen OS. Select a panel to explore the focus, rhythm and signal layers of the workspace.</p></div>
    <div className="gallery-feature"><div className="gallery-screen"><img src={active.image} alt={active.alt} /></div><div className="gallery-feature-copy"><p className="gallery-kicker">{active.eyebrow}</p><h3>{active.title}</h3><p>{active.description}</p><span className="gallery-note">Early-access preview · Interface still evolving</span></div></div>
    <div className="gallery-rail" role="tablist" aria-label="Kaizen OS product teaser views">{views.map((view) => <button key={view.id} className={`gallery-card ${activeId === view.id ? "is-active" : ""}`} type="button" role="tab" aria-selected={activeId === view.id} onClick={() => setActiveId(view.id)}><img src={view.image} alt="" /><span><strong>{view.eyebrow}</strong><small>{view.id === "focus" ? "Daily focus" : view.id === "rhythm" ? "Weekly rhythm" : "Progress signals"}</small></span></button>)}</div>
  </section>;
}
