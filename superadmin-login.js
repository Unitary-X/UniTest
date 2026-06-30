(() => {
    const form = document.getElementById('superAdminForm');
    const emailEl = document.getElementById('saEmail');
    const passwordEl = document.getElementById('saPassword');
    const togglePw = document.getElementById('togglePw');
    const errEl = document.getElementById('saErr');
    const btn = document.getElementById('saBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    const recoverToggleBtn = document.getElementById('recoverToggleBtn');
    const recoverForm = document.getElementById('recoverForm');
    const recoverTokenEl = document.getElementById('recoverToken');
    const recoverEmailEl = document.getElementById('recoverEmail');
    const recoverNewPasswordEl = document.getElementById('recoverNewPassword');
    const recoverConfirmPasswordEl = document.getElementById('recoverConfirmPassword');
    const recoverErrEl = document.getElementById('recoverErr');
    const recoverBtn = document.getElementById('recoverBtn');
    const recoverBtnText = recoverBtn?.querySelector('.btn-text');
    const recoverBtnLoader = recoverBtn?.querySelector('.btn-loader');
    const toast = document.getElementById('toast');

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    function setLoading(loading) {
        btn.disabled = loading;
        btnText.hidden = loading;
        btnLoader.hidden = !loading;
    }

    function setRecoverLoading(loading) {
        if (!recoverBtn) return;
        recoverBtn.disabled = loading;
        if (recoverBtnText) recoverBtnText.hidden = loading;
        if (recoverBtnLoader) recoverBtnLoader.hidden = !loading;
    }

    function setSuperAdminSession(admin) {
        sessionStorage.setItem('chemtest_superadmin', JSON.stringify({
            ...admin,
            loggedInAt: new Date().toISOString(),
        }));
    }

    async function apiStaffLogin(email, password) {
        const res = await fetch('/api/auth/staff/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error('Invalid credentials');
        return res.json();
    }

    async function apiRecoverSuperAdminPassword({ token, email, newPassword, confirmPassword }) {
        const res = await fetch('/api/superadmin/password/recover', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-resync-token': token,
            },
            body: JSON.stringify({ email, newPassword, confirmPassword }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.error || 'Password recovery failed');
        return payload;
    }

    togglePw.addEventListener('click', () => {
        passwordEl.type = passwordEl.type === 'password' ? 'text' : 'password';
    });

    if (recoverToggleBtn && recoverForm) {
        recoverToggleBtn.addEventListener('click', () => {
            const opening = recoverForm.hidden;
            recoverForm.hidden = !opening;
            recoverToggleBtn.setAttribute('aria-expanded', opening ? 'true' : 'false');
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errEl.textContent = '';

        const email = String(emailEl.value || '').trim().toLowerCase();
        const password = String(passwordEl.value || '');

        if (!email || !password) {
            errEl.textContent = 'Enter email and password';
            return;
        }

        setLoading(true);
        try {
            const payload = await apiStaffLogin(email, password);
            const role = String(payload?.staff?.role || '');
            if (!/admin/i.test(role)) {
                errEl.textContent = 'This account is not authorized for super admin access';
                showToast('Access denied');
                setLoading(false);
                return;
            }

            // Keep super admin identity isolated from staff dashboard session.
            sessionStorage.removeItem('chemtest_staff');
            setSuperAdminSession({
                email: payload.staff.email,
                name: payload.staff.name,
                role: payload.staff.role,
                token: payload.token,
            });

            showToast('Login successful');
            setTimeout(() => {
                window.location.href = 'superadmin-dashboard.html';
            }, 350);
        } catch (_err) {
            errEl.textContent = 'Invalid super admin credentials';
            showToast('Login failed');
            setLoading(false);
        }
    });

    recoverForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (recoverErrEl) recoverErrEl.textContent = '';

        const token = String(recoverTokenEl?.value || '').trim();
        const email = String(recoverEmailEl?.value || '').trim().toLowerCase();
        const newPassword = String(recoverNewPasswordEl?.value || '');
        const confirmPassword = String(recoverConfirmPasswordEl?.value || '');

        if (!token || !email || !newPassword || !confirmPassword) {
            if (recoverErrEl) recoverErrEl.textContent = 'All recovery fields are required';
            return;
        }
        if (newPassword.length < 6) {
            if (recoverErrEl) recoverErrEl.textContent = 'New password must be at least 6 characters';
            return;
        }
        if (newPassword !== confirmPassword) {
            if (recoverErrEl) recoverErrEl.textContent = 'New password and confirm password do not match';
            return;
        }

        setRecoverLoading(true);
        try {
            await apiRecoverSuperAdminPassword({ token, email, newPassword, confirmPassword });
            showToast('Password reset successful. Please login now.');
            passwordEl.value = '';
            passwordEl.value = newPassword;
            if (recoverTokenEl) recoverTokenEl.value = '';
            if (recoverNewPasswordEl) recoverNewPasswordEl.value = '';
            if (recoverConfirmPasswordEl) recoverConfirmPasswordEl.value = '';
            if (recoverErrEl) recoverErrEl.textContent = '';
        } catch (err) {
            if (recoverErrEl) recoverErrEl.textContent = err.message || 'Recovery failed';
            showToast('Password recovery failed');
        } finally {
            setRecoverLoading(false);
        }
    });

    const toggleBtn = document.getElementById('toggleRecoverBtn');
    const recoverSection = document.getElementById('recoverSection');
    if (toggleBtn && recoverSection) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = recoverSection.style.display === 'none';
            recoverSection.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? 'Hide Password Reset' : 'Forgot Password?';
        });
    }
})();
