import { useEffect, useRef, useState } from "react";

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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const active = views.find((view) => view.id === activeId) ?? views[0];

  useEffect(() => {
    if (!isLightboxOpen) return;
    const manageLightboxKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLightboxOpen(false);
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    document.body.classList.add("has-gallery-lightbox");
    document.addEventListener("keydown", manageLightboxKeys);
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      document.body.classList.remove("has-gallery-lightbox");
      document.removeEventListener("keydown", manageLightboxKeys);
    };
  }, [isLightboxOpen]);

  return <section className="product-gallery section" id="gallery" aria-labelledby="gallery-title">
    <div className="gallery-heading"><div><p className="eyebrow">A closer look</p><h2 className="section-title" id="gallery-title">Inside the <em>system.</em></h2></div><p className="gallery-intro">Three early-access views of Kaizen OS. Select a panel to explore the focus, rhythm and signal layers of the workspace.</p></div>
    <div className="gallery-feature"><button className="gallery-screen gallery-enlarge" type="button" onClick={() => setIsLightboxOpen(true)} aria-label={`Enlarge ${active.title} preview`}><img src={active.image} alt={active.alt} /><span className="gallery-zoom-cue" aria-hidden="true">↗ <small>Enlarge</small></span></button><div className="gallery-feature-copy"><p className="gallery-kicker">{active.eyebrow}</p><h3>{active.title}</h3><p>{active.description}</p><span className="gallery-note">Early-access preview · Interface still evolving</span></div></div>
    <div className="gallery-rail" role="tablist" aria-label="Kaizen OS product teaser views">{views.map((view) => <button key={view.id} className={`gallery-card ${activeId === view.id ? "is-active" : ""}`} type="button" role="tab" aria-selected={activeId === view.id} onClick={() => setActiveId(view.id)}><img src={view.image} alt="" /><span><strong>{view.eyebrow}</strong><small>{view.id === "focus" ? "Daily focus" : view.id === "rhythm" ? "Weekly rhythm" : "Progress signals"}</small></span></button>)}</div>
    {isLightboxOpen ? <div className="gallery-lightbox is-open" role="dialog" aria-modal="true" aria-labelledby="gallery-lightbox-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsLightboxOpen(false); }}><div className="gallery-lightbox-panel"><button ref={closeButtonRef} className="gallery-lightbox-close" type="button" aria-label="Close enlarged preview" onClick={() => setIsLightboxOpen(false)}><span aria-hidden="true">×</span><span>Close</span></button><img className="gallery-lightbox-image" src={active.image} alt={active.alt} /><div className="gallery-lightbox-caption"><p>{active.eyebrow}</p><strong id="gallery-lightbox-title">{active.title}</strong></div></div></div> : null}
  </section>;
}
