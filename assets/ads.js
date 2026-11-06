// Ad slots: <div class="ad" data-slot="top"></div>. Nothing is loaded or shown until PD_CONFIG.ADSENSE_CLIENT is set.
(function () {
  const c = window.PD_CONFIG || {};
  const slots = document.querySelectorAll(".ad[data-slot]");
  if (!c.ADSENSE_CLIENT) { slots.forEach(s => s.remove()); return; }
  if (!document.querySelector('script[src*="adsbygoogle.js"]')) {      // the pages include it in <head>
    const s = document.createElement("script");
    s.async = true; s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(c.ADSENSE_CLIENT);
    document.head.appendChild(s);
  }
  slots.forEach(el => {
    const id = (c.ADSENSE_SLOTS || {})[el.dataset.slot];
    if (!id) { el.remove(); return; }
    const ins = document.createElement("ins");
    ins.className = "adsbygoogle"; ins.style.display = "block";
    ins.dataset.adClient = c.ADSENSE_CLIENT; ins.dataset.adSlot = id;
    ins.dataset.adFormat = "auto"; ins.dataset.fullWidthResponsive = "true";
    el.appendChild(ins);
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  });
})();
