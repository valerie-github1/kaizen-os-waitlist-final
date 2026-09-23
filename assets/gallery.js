(() => {
  const gallery = document.querySelector('[data-product-gallery]');
  if (!gallery) return;
  const featureImage = gallery.querySelector('[data-gallery-feature-image]');
  const kicker = gallery.querySelector('[data-gallery-kicker]');
  const title = gallery.querySelector('[data-gallery-title]');
  const description = gallery.querySelector('[data-gallery-description]');
  const buttons = [...gallery.querySelectorAll('[data-gallery-view]')];

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-selected', String(isActive));
      });
      featureImage.src = button.dataset.image;
      featureImage.alt = button.dataset.alt;
      kicker.textContent = button.dataset.kicker;
      title.textContent = button.dataset.title;
      description.textContent = button.dataset.description;
    });
  });
})();
