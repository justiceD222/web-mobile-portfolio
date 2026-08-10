(function () {
  const endpoint = "/api/view-event";

  function getClientHints() {
    const uaData = navigator.userAgentData;
    return uaData ? {
      mobile: uaData.mobile,
      platform: uaData.platform,
      brands: uaData.brands
    } : null;
  }

  function sendViewEvent() {
    if (location.protocol === "file:") return;
    if (!navigator.sendBeacon && !window.fetch) return;

    const payload = {
      pageUrl: location.href,
      referrer: document.referrer || "",
      title: document.title,
      userAgent: navigator.userAgent,
      platform: navigator.platform || "",
      language: navigator.language || "",
      languages: navigator.languages || [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      screen: {
        width: window.screen ? window.screen.width : null,
        height: window.screen ? window.screen.height : null,
        pixelRatio: window.devicePixelRatio || 1
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      clientHints: getClientHints(),
      viewedAt: new Date().toISOString()
    };

    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true
    }).catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sendViewEvent, { once: true });
  } else {
    sendViewEvent();
  }
})();
