(() => {
  const gallery = document.querySelector('[data-product-gallery]');
  if (!gallery) return;

  const featureImage = gallery.querySelector('[data-gallery-feature-image]');
  const featureImageButton = gallery.querySelector('[data-gallery-feature-image-button]');
  const kicker = gallery.querySelector('[data-gallery-kicker]');
  const title = gallery.querySelector('[data-gallery-title]');
  const description = gallery.querySelector('[data-gallery-description]');
  const buttons = [...gallery.querySelectorAll('[data-gallery-view]')];
  const lightbox = gallery.querySelector('[data-gallery-lightbox]');
  const lightboxImage = gallery.querySelector('[data-gallery-lightbox-image]');
  const lightboxKicker = gallery.querySelector('[data-gallery-lightbox-kicker]');
  const lightboxTitle = gallery.querySelector('[data-gallery-lightbox-title]');
  const closeButton = gallery.querySelector('[data-gallery-lightbox-close]');

  let previouslyFocused = null;

  function currentView() {
    return buttons.find((button) => button.classList.contains('is-active')) || buttons[0];
  }

  function applyView(button) {
    buttons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-selected', String(isActive));
    });
    featureImage.src = button.dataset.image;
    featureImage.alt = button.dataset.alt;
    featureImageButton.setAttribute('aria-label', `Enlarge ${button.dataset.title} preview`);
    kicker.textContent = button.dataset.kicker;
    title.textContent = button.dataset.title;
    description.textContent = button.dataset.description;
  }

  function openLightbox() {
    const button = currentView();
    previouslyFocused = document.activeElement;
    lightboxImage.src = button.dataset.image;
    lightboxImage.alt = button.dataset.alt;
    lightboxKicker.textContent = button.dataset.kicker;
    lightboxTitle.textContent = button.dataset.title;
    lightbox.hidden = false;
    document.body.classList.add('has-gallery-lightbox');
    window.requestAnimationFrame(() => lightbox.classList.add('is-open'));
    closeButton.focus();
  }

  function closeLightbox() {
    if (lightbox.hidden) return;
    lightbox.classList.remove('is-open');
    document.body.classList.remove('has-gallery-lightbox');
    window.setTimeout(() => { lightbox.hidden = true; }, 180);
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => applyView(button));
  });

  featureImageButton.addEventListener('click', openLightbox);
  closeButton.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'Tab') {
      event.preventDefault();
      closeButton.focus();
    }
  });
})();
