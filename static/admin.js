const $ = (selector, root = document) => root.querySelector(selector);
const loginView = $('#login-view');
const adminView = $('#admin-view');

async function api(url, options = {}) {
  const response = await fetch(url, {headers:{'Content-Type':'application/json'}, ...options});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
  return data;
}
function safe(text) { const node = document.createElement('span'); node.textContent = text ?? ''; return node.innerHTML; }
function showToast(message, isError = false) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.toggle('error', isError); toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3000);
}
function date(value) { return value ? new Date(value).toLocaleString() : 'Not reviewed'; }

async function showAdmin() {
  loginView.hidden = true; adminView.hidden = false;
  await Promise.all([loadRequests(), loadAnalytics()]);
}
async function loadAnalytics() {
  const data = await api('/api/admin/analytics');
  $('#pending-count').textContent = data.summary.pending;
  $('#approved-count').textContent = data.summary.approved;
  $('#rejected-count').textContent = data.summary.rejected;
  $('#total-count').textContent = data.summary.total_requests;
}
async function loadRequests() {
  const list = $('#request-list');
  try {
    const requests = await api('/api/admin/requests');
    if (!requests.length) { list.innerHTML = '<div class="empty-queue"><strong>No requests yet</strong>New requests submitted through the requester page will appear here.</div>'; return; }
    list.innerHTML = requests.map((item) => {
      const state = item.approval_status.toLowerCase();
      return `<article class="request-card" data-request-id="${item.id}">
        <div class="request-card-top"><div><div class="request-badges"><span class="roll-chip">Ticket #${safe(item.ticket_no)}</span><span class="department-chip">${safe(item.category)}</span><span class="priority priority-${item.priority.toLowerCase()}">${safe(item.priority)} priority</span></div><h3>${safe(item.title)}</h3></div><span class="approval-pill approval-${state}">${safe(item.approval_status)}</span></div>
        <p class="request-details">${safe(item.details || 'No additional details.')}</p>
        <div class="request-facts"><span><b>Reported by</b>${safe(item.requester)} · ${safe(item.contact_email)}</span><span><b>Location</b>${safe(item.location)}</span><span><b>Submitted</b>${safe(date(item.created_at))}</span></div>
        <label class="response-label">Response to requester<textarea class="decision-result" maxlength="500" rows="2" placeholder="Explain the decision in a short, clear message">${safe(item.admin_result || '')}</textarea></label>
        <div class="decision-row"><span>${item.reviewed_at ? `Last reviewed ${safe(date(item.reviewed_at))}` : 'Waiting for your decision'}</span><div><button class="button button-reject" data-decision="Rejected">Reject</button><button class="button button-approve" data-decision="Approved">Approve</button></div></div>
      </article>`;
    }).join('');
  } catch (e) { list.innerHTML = `<div class="empty-queue"><strong>Could not load requests</strong>${safe(e.message)}</div>`; }
}
async function refresh() {
  try { await Promise.all([loadRequests(), loadAnalytics()]); }
  catch (e) { showToast(e.message, true); }
}

$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault(); $('#login-error').textContent = '';
  const password = new FormData(event.currentTarget).get('password');
  try { await api('/api/admin/login', {method:'POST', body:JSON.stringify({password})}); await showAdmin(); }
  catch (e) { $('#login-error').textContent = e.message; }
});
$('#request-list').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-decision]');
  if (!button) return;
  const card = button.closest('.request-card');
  const result = $('.decision-result', card).value.trim();
  if (!result) { showToast('Add a response for the requester before saving the decision.', true); $('.decision-result', card).focus(); return; }
  button.disabled = true;
  try {
    const data = await api(`/api/admin/requests/${card.dataset.requestId}/decision`, {method:'POST', body:JSON.stringify({decision:button.dataset.decision, result})});
    showToast(data.message); await refresh();
  } catch (e) { showToast(e.message, true); button.disabled = false; }
});
$('#reload-button').addEventListener('click', refresh);
$('#logout-button').addEventListener('click', async () => {
  try { await api('/api/admin/logout', {method:'POST', body:'{}'}); }
  finally { adminView.hidden = true; loginView.hidden = false; $('#login-form').reset(); }
});

api('/api/admin/session').then((state) => { if (state.authenticated) showAdmin(); });
