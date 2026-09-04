const toast = document.querySelector('.toast');
const showToast = (message) => { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2400); };

function renderProfile(saved) {
  document.querySelector('#profile-total').textContent = 24 + saved.length;
  const scored = saved.filter((item) => Number(item.score));
  if (scored.length) document.querySelector('#profile-average').textContent = (scored.reduce((sum, item) => sum + Number(item.score), 0) / scored.length).toFixed(1);
  const tagCounts = saved.flatMap((item) => item.tags || []).reduce((all, tag) => { all[tag] = (all[tag] || 0) + 1; return all; }, { masterpiece: 4, 'comfort watch': 3, replayable: 2 });
  document.querySelector('#profile-tags').innerHTML = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag, count]) => `<span>#${tag} <b>${count}</b></span>`).join('');
  document.querySelector('#profile-activity').innerHTML = saved.slice(0, 3).map((item) => `<div class="activity-row"><span>${String(item.title).replace(/[<>]/g, '')}</span><b>${Number(item.score).toFixed(1)}</b></div>`).join('') || '<div class="activity-row"><span>Start rating to see activity</span><b>—</b></div>';
}

async function syncProfile() {
  let saved = JSON.parse(localStorage.getItem('common-ground-ratings') || '[]');
  if (window.supabaseClient) {
    const { data: sessionData } = await window.supabaseClient.auth.getSession();
    const session = sessionData.session;
    const link = document.querySelector('.auth-link');
    if (session) {
      link.textContent = 'Log out';
      link.onclick = async (event) => { event.preventDefault(); await window.supabaseClient.auth.signOut(); window.location.href = 'auth.html'; };
      const { data, error } = await window.supabaseClient.from('ratings').select('title,type,score,status,thought,review,tags,rewatchable,created_at').order('created_at', { ascending: false });
      if (!error) { saved = data || []; localStorage.setItem('common-ground-ratings', JSON.stringify(saved)); }
    }
  }
  renderProfile(saved);
}

document.querySelector('#share-profile').onclick = async () => { try { await navigator.clipboard.writeText(window.location.href); showToast('Profile link copied.'); } catch { showToast('Your profile is ready to share.'); } };
document.querySelector('#edit-profile').onclick = () => showToast('Profile editing is coming next.');
syncProfile();
