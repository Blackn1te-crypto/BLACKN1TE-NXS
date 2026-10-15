/* =========================================================
   INLINE.JS — Client-side helpers for the BL@CKN1TE-NXS panel
   Author: BL@CKN1TE — The Incisive Tri-Hat Hacker
   Version: V16 ULTRA
   ========================================================= */

'use strict';

// =========================================================
// 🎯 AUTO-FOCUS — Bot name input on load
// =========================================================
window.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('userIdInput');
    if (input) {
        input.focus();
        console.log('%c🎩 BL@CKN1TE-NXS ULTRA · Panel Ready', 'color:#00ff9d;font-weight:700;font-size:14px;');
    }

    // Show channel info in the console
    console.log('%c🔗 Channel: https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f', 'color:#06b6d4;font-family:monospace;');
    console.log('%c♾️  INFINITE MODE: ENABLED', 'color:#7c3aed;font-weight:700;');
});

// =========================================================
// ⌨️ KEYBOARD SHORTCUTS
// =========================================================
document.addEventListener('keydown', (e) => {
    // Enter on bot name input → select bot
    // Enter on pair number → generate code
    if (e.key === 'Enter') {
        const userIdInput = document.getElementById('userIdInput');
        const pairNumber = document.getElementById('pairNumber');

        if (document.activeElement === userIdInput) {
            e.preventDefault();
            if (typeof selectUser === 'function') {
                selectUser();
            } else {
                document.getElementById('selectUserBtn')?.click();
            }
        } else if (document.activeElement === pairNumber) {
            e.preventDefault();
            document.getElementById('pairBtn')?.click();
        }
    }

    // Ctrl/Cmd + K → clear console
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        clearConsole();
        showToast('Console cleared', 'info');
    }

    // Ctrl/Cmd + L → focus bot name input
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        document.getElementById('userIdInput')?.focus();
    }
});

// =========================================================
// 🧹 CLEAR CONSOLE
// =========================================================
function clearConsole() {
    const c = document.getElementById('console');
    if (c) {
        c.innerHTML = '';
        // Add a fresh line so it doesn't look broken
        const div = document.createElement('div');
        div.className = 'console-line';
        div.style.cssText = 'color:#00ff9d;font-family:"JetBrains Mono",monospace;font-size:0.78rem;padding:4px 0;';
        div.textContent = '[system] Console cleared — awaiting events...';
        c.appendChild(div);
    } else {
        // Fallback: also try terminalBody (index.html uses this ID)
        const tb = document.getElementById('terminalBody');
        if (tb) {
            tb.innerHTML = '';
            const div = document.createElement('div');
            div.className = 'term-line';
            div.innerHTML = `<span class="term-time">[${new Date().toTimeString().slice(0,8)}]</span><span class="term-prefix">›</span><span class="term-msg info">Console cleared.</span>`;
            tb.appendChild(div);
        }
    }
}

// =========================================================
// 🔐 SAFE TEXT ESCAPE (XSS protection)
// =========================================================
function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// =========================================================
// 🎨 TOAST NOTIFICATIONS — Cyberpunk Style
// =========================================================
function showToast(message, type = 'info', duration = 3500) {
    // Cyberpunk palette matching the panel theme
    const palette = {
        info:    { color: '#06b6d4', icon: 'ℹ️',  glow: 'rgba(6, 182, 212, 0.6)' },
        success: { color: '#00ff9d', icon: '✅',  glow: 'rgba(0, 255, 157, 0.6)' },
        error:   { color: '#ff3b5c', icon: '❌',  glow: 'rgba(255, 59, 92, 0.6)' },
        warning: { color: '#ffb020', icon: '⚠️',  glow: 'rgba(255, 176, 32, 0.6)' },
        brand:   { color: '#7c3aed', icon: '🎩',  glow: 'rgba(124, 58, 237, 0.6)' }
    };

    const cfg = palette[type] || palette.info;

    // Check if the panel already has a toast container (index.html)
    let container = document.getElementById('toastContainer');

    if (!container) {
        // Fallback: create a floating toast
        const el = document.createElement('div');
        el.className = 'inline-toast';
        el.style.cssText = `
            position: fixed; top: 80px; right: 20px; z-index: 99999;
            background: rgba(5, 7, 13, 0.95);
            color: ${cfg.color};
            border: 1px solid ${cfg.color};
            border-left: 4px solid ${cfg.color};
            padding: 14px 20px; border-radius: 10px;
            font-family: 'JetBrains Mono', monospace; font-size: 0.82rem;
            letter-spacing: 1px;
            box-shadow: 0 0 25px ${cfg.glow}, 0 10px 40px rgba(0,0,0,0.6);
            backdrop-filter: blur(10px);
            display: flex; align-items: center; gap: 10px;
            max-width: 340px;
            animation: slideInToast 0.35s cubic-bezier(0.68, -0.55, 0.27, 1.55);
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        el.innerHTML = `<span style="font-size:1rem;">${cfg.icon}</span><span>${escapeHtml(message)}</span>`;

        // Ensure the animation keyframes exist
        if (!document.getElementById('__inline_toast_styles__')) {
            const style = document.createElement('style');
            style.id = '__inline_toast_styles__';
            style.textContent = `
                @keyframes slideInToast {
                    from { opacity: 0; transform: translateX(120%); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(el);

        // Auto-dismiss
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateX(120%)';
            setTimeout(() => el.remove(), 350);
        }, duration);

        return;
    }

    // Use panel's built-in toast container
    const t = document.createElement('div');
    t.className = 'toast ' + (type === 'brand' ? 'info' : type);
    t.innerHTML = `
        <i class="fas ${
            type === 'success' ? 'fa-check-circle' :
            type === 'error' ? 'fa-exclamation-circle' :
            type === 'warning' ? 'fa-exclamation-triangle' :
            type === 'brand' ? 'fa-hat-wizard' :
            'fa-info-circle'
        }"></i>
        <span>${escapeHtml(message)}</span>
        <span class="toast-close"><i class="fas fa-times"></i></span>
    `;
    container.appendChild(t);
    t.querySelector('.toast-close')?.addEventListener('click', () => t.remove());
    setTimeout(() => {
        if (t.parentNode) {
            t.style.opacity = '0';
            t.style.transform = 'translateX(100%)';
            setTimeout(() => t.remove(), 300);
        }
    }, duration);
}

// =========================================================
// 🎩 BRAND HELPERS
// =========================================================

// Copy text to clipboard with a toast
async function copyToClipboard(text, label = 'Text') {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        showToast(`${label} copied ✅`, 'success', 2000);
        return true;
    } catch (e) {
        showToast(`Copy failed: ${e.message}`, 'error');
        return false;
    }
}

// Format duration for display
function formatDuration(seconds) {
    const s = Math.floor(seconds);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
}

// Get current BL@CKN1TE brand timestamp
function brandTime() {
    return new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Check if element is visible in viewport
function isInViewport(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Debounce helper (useful for search inputs, resize handlers)
function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Throttle helper (useful for scroll, mousemove)
function throttle(fn, limit = 200) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// =========================================================
// 🎬 PRELOADER CONTROL — BL@CKN1TE-NXS ULTRA
// =========================================================
(function preloaderControl() {
    const preloader = document.getElementById('preloader');
    const status = document.getElementById('loaderStatus');

    const messages = [
        '⛧ Initializing Nexus core...',
        '▸ Connecting to WhatsApp servers...',
        '▸ Authenticating session...',
        '▸ Loading 125+ commands...',
        '▸ Arming infinite reconnect...',
        '▸ Starting heartbeat...',
        '▸ Syncing BL@CKN1TE-NXS ULTRA...',
        '✅ Ready to deploy.'
    ];

    let i = 0;
    let msgInterval = null;

    if (status) {
        msgInterval = setInterval(() => {
            if (i < messages.length) {
                status.textContent = messages[i];
                i++;
            } else {
                clearInterval(msgInterval);
                msgInterval = null;
            }
        }, 350);
    }

    // Hide the preloader
    function hidePreloader() {
        if (!preloader || preloader.dataset.hidden === '1') return;
        preloader.dataset.hidden = '1';

        if (status) status.textContent = '✅ Ready.';
        if (msgInterval) {
            clearInterval(msgInterval);
            msgInterval = null;
        }

        setTimeout(() => {
            preloader.classList.add('hide');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 700);
        }, 1200);
    }

    // Try to hide on socket connect
    try {
        if (typeof socket !== 'undefined' && socket && typeof socket.once === 'function') {
            socket.once('connect', () => {
                if (status) status.textContent = '✅ Connected to server.';
                hidePreloader();
            });
        }
    } catch (e) {
        // Socket not ready — will fall back to timeout
    }

    // Fallback timeout in case socket never connects
    setTimeout(hidePreloader, 4000);

    // Ultimate fallback: hide after window load + 3s
    window.addEventListener('load', () => {
        setTimeout(hidePreloader, 3000);
    });
})();

// =========================================================
// 📡 SESSION BADGE — show live online/offline in title
// =========================================================
(function titleBadge() {
    const baseTitle = '🎩 𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦 𝗨𝗟𝗧𝗥𝗔';
    let isOnline = false;

    function updateTitle() {
        document.title = isOnline ? `🟢 ${baseTitle}` : `🔴 ${baseTitle}`;
    }

    // Set base title immediately
    document.title = baseTitle;

    // If socket exists, listen for status changes
    try {
        if (typeof socket !== 'undefined' && socket && typeof socket.on === 'function') {
            socket.on('connect', () => { isOnline = true; updateTitle(); });
            socket.on('disconnect', () => { isOnline = false; updateTitle(); });
            socket.on('total-active', (data) => {
                isOnline = (data?.count || 0) > 0;
                updateTitle();
            });
        }
    } catch (e) {}
})();

// =========================================================
// 🎩 BRAND CONSOLE SIGNATURE
// =========================================================
(function brandSignature() {
    const asciiLogo = `
   ░▒▓█  𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦  𝗨𝗟𝗧𝗥𝗔  █▓▒░
        ⚡ V16 • CYBERPUNK CORE ⚡
        🎩 The Incisive Tri-Hat Hacker
        ♾️  INFINITE MODE: ENABLED
    `.trim();

    console.log(
        '%c' + asciiLogo,
        'color:#00ff9d;font-weight:700;font-size:11px;line-height:1.4;text-shadow:0 0 8px rgba(0,255,157,0.6);'
    );
    console.log(
        '%c🔗 Channel: https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f',
        'color:#06b6d4;font-family:monospace;font-size:11px;'
    );
    console.log(
        '%c📊 Loaded commands: ~125 · Mode: INFINITE · Speed: PROMAX',
        'color:#7c3aed;font-weight:700;font-size:11px;'
    );
    console.log(
        '%c✨ Welcome, Operator. You are now running BL@CKN1TE-NXS ULTRA.',
        'color:#00ff9d;font-weight:700;font-size:12px;text-shadow:0 0 10px rgba(0,255,157,0.8);'
    );
})();

// =========================================================
// 🌐 EXPOSE HELPERS GLOBALLY
// =========================================================
window.clearConsole = clearConsole;
window.escapeHtml = escapeHtml;
window.showToast = showToast;
window.copyToClipboard = copyToClipboard;
window.formatDuration = formatDuration;
window.brandTime = brandTime;
window.isInViewport = isInViewport;
window.debounce = debounce;
window.throttle = throttle;