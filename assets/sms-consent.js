(function () {
  "use strict";

  let config = { opt_in_enabled: false };
  let loaded = false;

  function wrapper(prefix) { return document.getElementById(prefix + "SmsOptin"); }

  function render(prefix) {
    const box = wrapper(prefix);
    if (!box) return;
    box.hidden = !(loaded && config.opt_in_enabled && box.dataset.eligible === "true");
    const disclosure = box.querySelector("[data-sms-disclosure]");
    if (disclosure && config.disclosure_text) disclosure.textContent = config.disclosure_text;
  }

  async function load() {
    try {
      const response = await fetch("/api/sms/config", { credentials: "same-origin" });
      const body = await response.json();
      if (response.ok && body && body.ok) config = body;
    } catch (_) {
      config = { opt_in_enabled: false };
    }
    loaded = true;
    document.querySelectorAll("[data-sms-optin]").forEach((box) => render(box.dataset.smsOptin));
    return config;
  }

  function showForMode(prefix, eligible) {
    const box = wrapper(prefix);
    if (!box) return;
    box.dataset.eligible = eligible ? "true" : "false";
    render(prefix);
  }

  function consentPayload(prefix) {
    const box = wrapper(prefix);
    if (!box || box.hidden || !config.opt_in_enabled) return { ok: true, value: null };
    const phone = document.getElementById(prefix + "SmsPhone");
    const accepted = document.getElementById(prefix + "SmsAccepted");
    const terms = document.getElementById(prefix + "SmsTerms");
    const touched = !!(phone.value.trim() || accepted.checked || terms.checked);
    if (!touched) return { ok: true, value: null };
    if (!accepted.checked) return { ok: false, error: "Check the SMS consent box, or clear the phone number." };
    if (!terms.checked) return { ok: false, error: "Accept the Terms and acknowledge the Privacy Policy separately." };
    const digits = phone.value.replace(/\D/g, "");
    if (!phone.checkValidity() || !((digits.length === 10) || (digits.length === 11 && digits.startsWith("1")))) return { ok: false, error: "Enter a valid US mobile number for text updates." };
    return {
      ok: true,
      value: {
        phone: phone.value.trim(),
        accepted: true,
        terms_accepted: true,
        disclosure_version: config.disclosure_version,
        source_url: window.location.origin + window.location.pathname,
      },
    };
  }

  window.GenieSms = { load, showForMode, consentPayload };
  load();
})();
