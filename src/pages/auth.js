import { supabase } from '../lib/supabase.js';

export function renderAuth(app, router, state) {
  let isLogin = true;

  function render() {
    app.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-logo">💰</div>
          <h1 class="auth-title">${isLogin ? 'Bienvenido' : 'Crear cuenta'}</h1>
          <p class="auth-subtitle">${isLogin ? 'Ingresá a tu cuenta para continuar' : 'Registrate para comenzar a gestionar tus finanzas'}</p>
          <div class="auth-error" id="auth-error"></div>
          <form id="auth-form">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" id="auth-email" placeholder="tu@email.com" required />
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input type="password" class="form-input" id="auth-password" placeholder="••••••••" required minlength="6" />
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:14px;font-size:0.95rem;" id="auth-submit">
              ${isLogin ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          </form>
          <p class="auth-toggle">
            ${isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
            <a id="auth-toggle-link">${isLogin ? 'Registrate' : 'Iniciá sesión'}</a>
          </p>
        </div>
      </div>`;

    document.getElementById('auth-toggle-link').addEventListener('click', () => {
      isLogin = !isLogin;
      render();
    });

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const errEl = document.getElementById('auth-error');
      const btn = document.getElementById('auth-submit');

      btn.textContent = 'Cargando...';
      btn.disabled = true;

      let result;
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }

      if (result.error) {
        errEl.textContent = result.error.message;
        errEl.classList.add('visible');
        btn.textContent = isLogin ? 'Iniciar sesión' : 'Registrarse';
        btn.disabled = false;
        return;
      }

      state.user = result.data.user;
      router.navigate('/');
    });
  }

  render();
}
