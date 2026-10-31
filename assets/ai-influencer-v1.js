// Consultation helper only. No network submission, account change or purchase.
(() => {
  const form = document.getElementById('influencer-brief');
  const result = document.getElementById('brief-result');
  const output = document.getElementById('brief-text');
  const status = document.getElementById('brief-status');
  form.addEventListener('input', () => {
    if (!result.hidden) {
      result.hidden = true;
      status.textContent = 'Answers changed. Prepare the brief again to update your email draft.';
    }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const value = name => String(fields.get(name) || '').trim();
    if (!value('brand') || !value('identity') || !value('goal')) {
      status.textContent = 'Please add a project name, character starting point and creative goal.';
      return;
    }
    const brief = [
      'GenieMade Ultra Premium — AI Influencer Consultation', '',
      `Brand / project: ${value('brand')}`,
      `Character starting point: ${value('identity')}`,
      `Audience and creative goal: ${value('goal')}`,
      `First deliverable: ${value('format')}`,
      `Timing: ${value('timing') || 'To discuss'}`,
      `Scope / budget guidance: ${value('scope') || 'To discuss'}`, '',
      'Please contact me to discuss a custom scope and quote. This is an inquiry, not a production booking.',
      'Please include input permissions, visible AI disclosure and the EverVerify provenance plan in the scope. Public registry display requires a separate choice.'
    ].join('\n');
    output.value = brief;
    document.getElementById('brief-email').href = 'mailto:support@geniemadeit.com?subject=' +
      encodeURIComponent('Ultra Premium AI Influencer Consultation') + '&body=' + encodeURIComponent(brief);
    result.hidden = false;
    status.textContent = 'Brief ready for your review. Nothing has been sent. Open the email draft or copy the brief.';
    output.focus();
  });
  document.getElementById('brief-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      status.textContent = 'Brief copied. Paste it into your email and send when ready. Nothing was sent by this page.';
    } catch {
      output.focus();
      output.select();
      status.textContent = 'Copy is unavailable in this browser. The brief is selected; use your device’s Copy command.';
    }
  });
})();
