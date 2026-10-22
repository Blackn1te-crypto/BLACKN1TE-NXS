/* =========================================================
   INLINE.JS — Small helpers used directly by the page
   ========================================================= */

// Auto-focus the bot name input on load
window.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('userIdInput');
    if (input) input.focus();
});

// Enter key = create/select bot
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const userIdInput = document.getElementById('userIdInput');
        const pairNumber = document.getElementById('pairNumber');

        if (document.activeElement === userIdInput) {
            selectUser();
        } else if (document.activeElement === pairNumber) {
            document.getElementById('pairBtn').click();
        }
    }
});

// Clear console
function clearConsole() {
    const c = document.getElementById('console');
    if (c) c.innerHTML = '';
}

// Safe text escape
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Toast notification
function showToast(message, type = 'info') {
    const colors = {
        info: '#06b6d4',
        success: '#00ff9d',
        error: '#ff3b5c',
        warning: '#ffb020'
    };
    const el = document.createElement('div');
    el.style.cssText = `
        position: fixed; top: 80px; right: 20px; z-index: 9999;
        background: #0f1420; color: ${colors[type] || colors.info};
        border: 1px solid ${colors[type] || colors.info};
        padding: 12px 18px; border-radius: 10px;
        font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        animation: fadeIn 0.3s ease;
    `;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

/* ===== PRELOADER ===== */
(function preloaderControl() {
    const preloader = document.getElementById('preloader');
    const status = document.getElementById('loaderStatus');

    const messages = [
        'Connecting to Nexus...',
        'Authenticating session...',
        'Loading modules...',
        'Syncing data...',
        'Ready.'
    ];

    let i = 0;
    const msgInterval = setInterval(() => {
        if (status && i < messages.length) {
            status.textContent = messages[i];
            i++;
        } else {
            clearInterval(msgInterval);
        }
    }, 400);

    function hidePreloader() {
        if (!preloader) return;
        if (status) status.textContent = 'Ready.';
        setTimeout(() => {
            preloader.classList.add('hide');
            setTimeout(() => { preloader.style.display = 'none'; }, 700);
        }, 1400);
    }

    if (typeof socket !== 'undefined') {
        socket.once('connect', hidePreloader);
    }
    setTimeout(hidePreloader, 4000);
})();
