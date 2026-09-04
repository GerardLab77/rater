const form = document.querySelector('#auth-form');
const heading = document.querySelector('#auth-heading');
const submit = document.querySelector('#auth-submit');
const switchButton = document.querySelector('#auth-switch');
const status = document.querySelector('#auth-status');
let loginMode = false;

switchButton.onclick = () => { loginMode = !loginMode; heading.innerHTML = loginMode ? 'Welcome<br /><em>back.</em>' : 'Keep it<br /><em>together.</em>'; submit.innerHTML = loginMode ? 'Log in <span>↗</span>' : 'Create account <span>↗</span>'; switchButton.textContent = loginMode ? 'Need an account? Sign up' : 'Already have an account? Log in'; };
form.onsubmit = async (event) => { event.preventDefault(); status.textContent = 'connecting...'; const email = document.querySelector('#auth-email').value; const password = document.querySelector('#auth-password').value; const result = loginMode ? await window.supabaseClient.auth.signInWithPassword({ email, password }) : await window.supabaseClient.auth.signUp({ email, password }); if (result.error) { status.textContent = result.error.message; return; } status.textContent = loginMode ? 'Logged in. Redirecting...' : 'Account created. Check your email if confirmation is enabled.'; if (loginMode || result.data.session) setTimeout(() => { window.location.href = 'index.html'; }, 600); };
