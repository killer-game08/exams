const DB = { get(k) { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } }, set(k, v) { localStorage.setItem(k, JSON.stringify(v)) }, del(k) { localStorage.removeItem(k) } };

function initDB() {
  if (!DB.get('users')) DB.set('users', []);
  if (!DB.get('apps')) DB.set('apps', []);
  if (!DB.get('reviews')) DB.set('reviews', []);
  if (!DB.get('courses')) DB.set('courses', [
    { id: 1, name: 'Повышение квалификации по охране труда', dur: '72 ч', price: '5000 ₽' },
    { id: 2, name: 'Переподготовка руководителей', dur: '250 ч', price: '15000 ₽' },
    { id: 3, name: 'Охрана труда для специалистов', dur: '40 ч', price: '3500 ₽' },
    { id: 4, name: 'Пожарная безопасность', dur: '24 ч', price: '2500 ₽' },
    { id: 5, name: 'Электробезопасность', dur: '72 ч', price: '6000 ₽' },
    { id: 6, name: 'Первая помощь', dur: '16 ч', price: '1800 ₽' }
  ]);
}

const Auth = {
  user: null,
  reg(d) { const u = DB.get('users') || []; if (u.find(x => x.login === d.login)) return { ok: false, msg: 'Этот логин уже занят' }; u.push(d); DB.set('users', u); return { ok: true, msg: 'Аккаунт создан! Сейчас войдите' } },
  login(l, p) { const u = (DB.get('users') || []).find(x => x.login === l && x.password === p); if (u) { this.user = u; DB.set('currentUser', u); return { ok: true, user: u } } return { ok: false, msg: 'Неверный логин или пароль' } },
  admin(l, p) { if (l === 'Admin26' && p === 'Demo20') { const a = { login: 'Admin26', role: 'admin', name: 'Администратор' }; this.user = a; DB.set('currentUser', a); return { ok: true, user: a } } return { ok: false, msg: 'Неверные данные администратора' } },
  out() { this.user = null; DB.del('currentUser') },
  check() { if (!this.user) this.user = DB.get('currentUser'); return !!this.user },
  isAdmin() { return this.user?.role === 'admin' },
  get() { if (!this.user) this.user = DB.get('currentUser'); return this.user }
};

const Apps = {
  create(d) { const a = DB.get('apps') || []; const n = { id: Date.now(), ...d, status: 'Новая', created: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }; a.push(n); DB.set('apps', a); return n },
  all() { return DB.get('apps') || [] },
  byUser(l) { return this.all().filter(x => x.userLogin === l) },
  upd(id, s) { const a = this.all(); const x = a.find(y => y.id === id); if (x) { x.status = s; DB.set('apps', a); return true } return false }
};

const Reviews = {
  create(d) { const r = DB.get('reviews') || []; r.push({ id: Date.now(), ...d, created: new Date().toLocaleString('ru-RU') }); DB.set('reviews', r) },
  all() { return DB.get('reviews') || [] },
  byUser(l) { return this.all().filter(x => x.userLogin === l) },
  has(appId, login) { return this.all().some(x => x.appId === appId && x.userLogin === login) }
};

const V = {
  login(v) { if (!v || v.length < 6) return { ok: false, msg: 'Минимум 6 символов' }; if (!/^[a-zA-Z0-9]+$/.test(v)) return { ok: false, msg: 'Только латиница и цифры' }; return { ok: true } },
  pass(v) { if (!v || v.length < 8) return { ok: false, msg: 'Минимум 8 символов' }; return { ok: true } },
  email(v) { if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v)) return { ok: false, msg: 'Некорректный email' }; return { ok: true } },
  phone(v) { if (!v || v.length < 18) return { ok: false, msg: 'Введите полный номер' }; return { ok: true } },
  req(v) { if (!v || !v.trim()) return { ok: false, msg: 'Обязательное поле' }; return { ok: true } },
  date(v) { if (!v) return { ok: false, msg: 'Выберите дату' }; const d = new Date(v); if (isNaN(d.getTime())) return { ok: false, msg: 'Некорректная дата' }; return { ok: true } }
};

const UI = {
  toast(msg, type = 'info', container) {
    const el = document.createElement('div'); el.className = `alert alert-${type}`;
    const icons = { success: '✓', error: '✕', warning: '!', info: 'ⓘ' };
    el.innerHTML = `<span style="font-weight:700;font-size:20px">${icons[type]}</span><span>${msg}</span>`;
    const t = container || document.querySelector('main') || document.body;
    t.insertBefore(el, t.firstChild);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(-10px)'; setTimeout(() => el.remove(), 300) }, 5000);
  },
  err(input, msg) { input.classList.add('error'); input.classList.remove('ok'); let h = input.parentElement.querySelector('.form-hint'); if (!h) { h = document.createElement('span'); h.className = 'form-hint'; input.parentElement.appendChild(h) } h.innerHTML = `⚠ ${msg}`; h.className = 'form-hint err' },
  ok(input, msg) { input.classList.remove('error'); input.classList.add('ok'); let h = input.parentElement.querySelector('.form-hint'); if (!h) { h = document.createElement('span'); h.className = 'form-hint'; input.parentElement.appendChild(h) } h.innerHTML = msg ? `✓ ${msg}` : ''; h.className = 'form-hint ok' },
  clear(input) { input.classList.remove('error', 'ok'); const h = input.parentElement.querySelector('.form-hint'); if (h) { h.innerHTML = ''; h.className = 'form-hint' } },
  clearForm(f) { f.querySelectorAll('.form-input,.form-select,.form-textarea').forEach(i => this.clear(i)) }
};

// ===== PHONE MASK — нормальная, без багов =====
function phoneMask(input) {
  input.addEventListener('focus', () => { if (input.value === '+7 ' || !input.value) input.value = '+7 '; });
  input.addEventListener('input', function () {
    let v = this.value.replace(/\\D/g, '');
    if (v.startsWith('7')) v = v.slice(1);
    let out = '+7';
    if (v.length > 0) { out += ' (' + v.slice(0, 3); if (v.length >= 3) out += ')' }
    if (v.length > 3) { out += ' ' + v.slice(3, 6) }
    if (v.length > 6) { out += '-' + v.slice(6, 8) }
    if (v.length > 8) { out += '-' + v.slice(8, 10) }
    this.value = out;
  });
}

function passToggle(btn, input) {
  btn.addEventListener('click', () => {
    const isP = input.type === 'password';
    input.type = isP ? 'text' : 'password';
    btn.innerHTML = isP ? '<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>';
  });
}

class Modal {
  constructor(id) { this.el = document.getElementById(id); this.el?.querySelector('.modal-close')?.addEventListener('click', () => this.close()); this.el?.addEventListener('click', e => { if (e.target === this.el) this.close() }) }
  open() { this.el.classList.add('active'); document.body.style.overflow = 'hidden' }
  close() { this.el.classList.remove('active'); document.body.style.overflow = '' }
}

function initMobile() {
  const btn = document.querySelector('.mobile-btn'), nav = document.querySelector('.nav');
  if (btn && nav) { btn.addEventListener('click', () => nav.classList.toggle('active')); document.addEventListener('click', e => { if (!btn.contains(e.target) && !nav.contains(e.target)) nav.classList.remove('active') }) }
}

function updateNav() {
  const nav = document.querySelector('.nav'); if (!nav) return;
  const u = Auth.get();
  nav.querySelectorAll('a').forEach(a => {
    const h = a.getAttribute('href') || '';
    if (h.includes('login') || h.includes('register')) a.style.display = u ? 'none' : 'flex';
    if (h.includes('profile') || h.includes('apply')) a.style.display = u ? 'flex' : 'none';
    if (h.includes('admin')) a.style.display = u?.role === 'admin' ? 'flex' : 'none';
  });
}

function logout() { Auth.out(); window.location.href = '../../index.html' }

document.addEventListener('DOMContentLoaded', () => { initDB(); initMobile(); updateNav(); if (DB.get('currentUser')) Auth.user = DB.get('currentUser') });

