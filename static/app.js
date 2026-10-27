const $ = (selector) => document.querySelector(selector);

async function api(url, options = {}) {
  const response = await fetch(url, {headers:{'Content-Type':'application/json'}, ...options});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
  return data;
}
function safe(text) { const node = document.createElement('span'); node.textContent = text ?? ''; return node.innerHTML; }
function showToast(message, isError = false) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.toggle('error', isError); toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3200);
}
function prettyDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

$('#request-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  const message = $('#submit-message'); message.textContent = '';
  try {
    const result = await api('/api/tickets', {method:'POST', body:JSON.stringify(payload)});
    message.innerHTML = `Request <strong>#${safe(result.ticket_no)}</strong> submitted for review. Save your ticket number and check the result using <strong>${safe(payload.contact_email)}</strong>.`;
    form.reset();
    $('#track-form [name="ticket_no"]').value = result.ticket_no;
    $('#track-form [name="email"]').value = payload.contact_email;
    showToast('Request submitted. You can track it on this page.');
  } catch (e) { showToast(e.message, true); }
});

$('#track-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const params = new URLSearchParams(new FormData(event.currentTarget));
  const target = $('#track-result'); target.innerHTML = '<div class="loading">Checking request…</div>';
  try {
    const result = await api(`/api/track?${params}`);
    const decision = result.approval_status;
    const decisionClass = decision.toLowerCase();
    const adminResult = result.admin_result
      ? `<div class="admin-result"><span>ADMIN RESPONSE</span><p>${safe(result.admin_result)}</p></div>`
      : '<div class="pending-note">The admin has not added a response yet. Check again later.</div>';
    target.innerHTML = `<div class="result-card">
      <div class="result-card-top"><div><span class="result-kicker">TICKET #${safe(result.ticket_no)}</span><h3>${safe(result.title)}</h3></div><span class="approval-pill approval-${decisionClass}">${safe(decision)}</span></div>
      <div class="result-meta"><span>Work status: ${safe(result.status)}</span><span>Submitted ${safe(prettyDate(result.created_at))}</span>${result.reviewed_at ? `<span>Reviewed ${safe(prettyDate(result.reviewed_at))}</span>` : ''}</div>
      ${adminResult}
    </div>`;
  } catch (e) { target.innerHTML = `<div class="lookup-error"><strong>Request not found</strong><p>${safe(e.message)}</p>Check that both details match the original request.</div>`; }
});
