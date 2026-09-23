(() => {
  const panel = document.querySelector('[data-share-panel]');
  if (!panel) return;

  const shareUrl = new URL('index.html', window.location.href).href;
  const shareText = 'I’ve joined the Kaizen OS early-access waitlist by PhoennixAI. Join me.';
  const xLink = panel.querySelector('[data-share-x]');
  const linkedinLink = panel.querySelector('[data-share-linkedin]');
  const instagramButton = panel.querySelector('[data-share-instagram]');
  const feedback = panel.querySelector('[data-share-feedback]');

  xLink.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  linkedinLink.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  const setFeedback = (text) => { feedback.textContent = text; };

  async function copyShareText() {
    const fullMessage = `${shareText} ${shareUrl}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(fullMessage);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = fullMessage;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  instagramButton.addEventListener('click', async () => {
    const shareData = { title: 'Kaizen OS early access', text: shareText, url: shareUrl };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setFeedback('Share sheet opened. Choose Instagram to share.');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    try {
      await copyShareText();
      setFeedback('Link copied. Instagram is opening so you can share it in a post or story.');
    } catch {
      setFeedback('Copy the page link from your browser, then share it on Instagram.');
    }
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  });
})();
