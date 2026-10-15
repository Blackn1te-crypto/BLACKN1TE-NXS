/* =========================================================
   SCRIPT.JS — BL@CKN1TE-NXS ULTRA
   Frontend logic + Socket.IO bridge
   Author: BL@CKN1TE — The Incisive Tri-Hat Hacker
   Version: V16 ULTRA
   ========================================================= */

'use strict';

// =========================================================
// 🔌 SOCKET SETUP — Infinite reconnect
// =========================================================
const socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000
});

let currentUserId = null;
let isPairing = false;
const startTime = Date.now();

console.log('%c🎩 BL@CKN1TE-NXS ULTRA · Frontend Ready', 'color:#00ff9d;font-weight:700;font-size:13px;');

// =========================================================
// 🎯 SELECT / CREATE BOT
// =========================================================
function selectUser() {
    const input = document.getElementById('userIdInput');
    if (!input) return;

    const userId = input.value.trim();

    if (!userId) {
        showToast('Please enter a bot name', 'warning');
        input.focus();
        return;
    }

    // Allow letters, numbers, underscore, dash, @, dot (2-30 chars)
    if (!/^[a-zA-Z0-9_@.-]{2,30}$/.test(userId)) {
        showToast('Only letters, numbers, _ . - @ (2-30 chars)', 'error');
        return;
    }

    currentUserId = userId;
    socket.emit('set-user', userId);

    const activeEl = document.getElementById('activeBotName');
    if (activeEl) activeEl.innerText = '• ' + userId;

    document.getElementById('userDashboard')?.classList.remove('hidden');
    document.getElementById('stage1')?.classList.remove('hidden');
    document.getElementById('stage2')?.classList.add('hidden');
    document.getElementById('setupSection')?.classList.add('hidden');

    const display = document.getElementById('currentBotNameDisplay');
    if (display) display.innerText = userId;

    showToast('Bot selected: ' + userId, 'success');
}

// =========================================================
// 🔗 SOCKET EVENT HANDLERS
// =========================================================

// ── CONNECT ──
socket.on('connect', () => {
    console.log('[Socket] ✅ Connected:', socket.id);
    showToast('Connected to server', 'success', 2000);

    // If we had a bot selected, re-register it
    if (currentUserId) {
        socket.emit('set-user', currentUserId);
    }
});

// ── DISCONNECT ──
socket.on('disconnect', (reason) => {
    console.log('[Socket] ❌ Disconnected:', reason);
    showToast('Connection lost. Reconnecting...', 'error', 4000);
});

// ── RECONNECT ──
socket.io.on('reconnect', (attempt) => {
    console.log(`[Socket] ♾️ Reconnected after ${attempt} attempts`);
    showToast(`Reconnected (${attempt} attempts)`, 'success', 2500);
});

// ── TOTAL ACTIVE ──
socket.on('total-active', (data) => {
    const count = typeof data === 'object' ? data.count : data;
    const sessionsCount = typeof data === 'object' ? data.sessions : count;
    const onlineCount = typeof data === 'object' ? (data.online ?? count) : count;

    const totalEl = document.getElementById('totalActive');
    const sessEl = document.getElementById('sessionCount');
    if (totalEl) totalEl.innerText = count ?? 0;
    if (sessEl) sessEl.innerText = sessionsCount ?? 0;

    // Also update terminal status bar if present (index.html)
    const tsActive = document.getElementById('tsActiveVal');
    const tsSessions = document.getElementById('tsSessionsVal');
    if (tsActive) tsActive.innerText = onlineCount ?? count;
    if (tsSessions) tsSessions.innerText = sessionsCount ?? 0;

    // Update stat dots (index.html)
    const dotActive = document.getElementById('statDotActive');
    const dotSessions = document.getElementById('statDotSessions');
    if (dotActive) dotActive.classList.toggle('online', (onlineCount ?? count) > 0);
    if (dotSessions) dotSessions.classList.toggle('online', (sessionsCount ?? 0) > 0);
});

// ── SESSION STATUS (new: running vs connected) ──
socket.on('session-status', (data) => {
    console.log('[Socket] Session status:', data);
});

// ── PAIRING CODE ──
socket.on('pairing-code', (code) => {
    stopProgress();

    const el = document.getElementById('pairingResult');
    if (el) {
        // index.html uses a styled box
        el.innerHTML = `
            <div class="pairing-code-box">
                <div class="pairing-code-label">PAIRING CODE</div>
                <div class="pairing-code-value" id="pairingCodeValue">${code}</div>
                <button class="pairing-copy-btn" id="pairingCopyBtn" onclick="copyPairingCode()">
                    <i class="fas fa-copy"></i> COPY CODE
                </button>
                <div style="color:#888;font-size:0.7rem;margin-top:12px;">
                    Paste in WhatsApp → Linked Devices
                </div>
            </div>`;
    }

    showToast('🔑 Pairing code received!', 'success', 5000);
    isPairing = false;
    const btn = document.getElementById('pairBtn');
    if (btn) btn.disabled = false;
});

// ── LIVE CONSOLE ──
socket.on('console', (log) => {
    // Support both login.html (#console) and index.html (#terminalBody)
    const consoleDiv = document.getElementById('console');
    const terminalDiv = document.getElementById('terminalBody');

    if (consoleDiv) {
        const entry = document.createElement('div');
        entry.className = 'log-line log-' + (log.type || 'info');
        entry.innerHTML = `<span class="log-time">[${log.timestamp}]</span> ${escapeHtml(log.message)}`;
        consoleDiv.appendChild(entry);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
        while (consoleDiv.children.length > 500) {
            consoleDiv.removeChild(consoleDiv.firstChild);
        }
    }

    if (terminalDiv) {
        const entry = document.createElement('div');
        entry.className = 'term-line';
        const typeClass = log.type || 'info';
        const prefixClass = typeClass === 'error' ? 'err' : typeClass === 'warning' ? 'warn' : typeClass === 'info' ? 'info' : '';
        entry.innerHTML = `
            <span class="term-time">[${log.timestamp}]</span>
            <span class="term-prefix ${prefixClass}">›</span>
            <span class="term-msg ${typeClass}">${escapeHtml(log.message)}</span>
        `;
        terminalDiv.appendChild(entry);
        terminalDiv.scrollTop = terminalDiv.scrollHeight;
        while (terminalDiv.children.length > 200) {
            terminalDiv.removeChild(terminalDiv.firstChild);
        }
    }
});

// ── CONNECTION STATUS ──
socket.on('connection-status', (status) => {
    const badge = document.getElementById('connectionStatus');
    const stage1 = document.getElementById('stage1');
    const stage2 = document.getElementById('stage2');

    if (status.connected) {
        if (badge) {
            badge.className = 'status-badge connected';
            badge.innerText = 'CONNECTED';
        }
        stage1?.classList.add('hidden');
        stage2?.classList.remove('hidden');

        // Show success banner (index.html)
        const banner = document.getElementById('connectBanner');
        if (banner) banner.classList.add('show');

        stopProgress();
    } else {
        if (badge) {
            badge.className = 'status-badge disconnected';
            badge.innerText = 'DISCONNECTED';
        }
        if (stage2 && !stage2.classList.contains('hidden')) {
            stage1?.classList.remove('hidden');
            stage2?.classList.add('hidden');
        }
        const banner = document.getElementById('connectBanner');
        if (banner) banner.classList.remove('show');
    }

    // If the user ID is known, update the display
    if (status.user) {
        const activeBot = document.getElementById('activeBotName');
        if (activeBot) activeBot.innerText = status.user;
        const display = document.getElementById('currentBotNameDisplay');
        if (display) display.innerText = status.user;
    }
});

// ── BLACKLIST BLOCK ──
socket.on('blacklist-block', (data) => {
    showToast(data.message || '🚫 Access denied', 'error', 8000);
    stopProgress();
    isPairing = false;
    const btn = document.getElementById('pairBtn');
    if (btn) btn.disabled = false;
});

// ── SESSIONS LIST ──
socket.on('sessions-list', (sessions) => {
    console.log('[Socket] Sessions:', sessions);
});

// =========================================================
// 🚀 PAIR BUTTON
// =========================================================
const pairBtn = document.getElementById('pairBtn');
if (pairBtn) {
    pairBtn.onclick = () => {
        if (isPairing) return;
        if (!currentUserId) {
            showToast('Select a bot name first', 'warning');
            return;
        }

        const numberInput = document.getElementById('pairNumber');
        const number = numberInput?.value.trim();
        if (!number) {
            showToast('Enter your WhatsApp number', 'warning');
            numberInput?.focus();
            return;
        }
        if (!/^\d{8,15}$/.test(number)) {
            showToast('Digits only, with country code (e.g. 263714799483)', 'error');
            return;
        }

        isPairing = true;
        pairBtn.disabled = true;

        const resultEl = document.getElementById('pairingResult');
        if (resultEl) resultEl.innerHTML = '';

        startProgress();

        socket.emit('pair-request', { userId: currentUserId, number });

        // Timeout guard
        setTimeout(() => {
            if (isPairing) {
                isPairing = false;
                pairBtn.disabled = false;
                stopProgress();
                showToast('Request timed out. Try again.', 'error', 5000);
            }
        }, 60000);
    };
}

// =========================================================
// 🚪 LOGOUT BUTTON
// =========================================================
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.onclick = () => {
        if (!confirm('Are you sure you want to logout this bot?\n\nThis will unlink the WhatsApp session and require re-pairing.')) return;

        if (currentUserId) socket.emit('logout', currentUserId);

        document.getElementById('stage2')?.classList.add('hidden');
        document.getElementById('stage1')?.classList.remove('hidden');
        document.getElementById('setupSection')?.classList.remove('hidden');
        document.getElementById('userDashboard')?.classList.add('hidden');

        const input = document.getElementById('userIdInput');
        if (input) input.value = '';

        currentUserId = null;
        showToast('Logged out.', 'info');
    };
}

// =========================================================
// 📊 PROGRESS BAR
// =========================================================
let progressInterval = null;

function startProgress() {
    const container = document.getElementById('progressContainer');
    const bar = document.getElementById('progressBar');

    // index.html uses pair-progress container
    const pairProgress = document.getElementById('pairProgress');
    const pairFill = document.getElementById('pairProgressFill');
    const pairPct = document.getElementById('pairPercent');

    if (pairProgress) pairProgress.classList.add('show');
    if (pairFill) pairFill.style.width = '0%';
    if (pairPct) pairPct.innerText = '0%';

    if (container) container.style.display = 'block';
    if (bar) bar.style.width = '0%';

    let width = 0;
    if (progressInterval) clearInterval(progressInterval);

    progressInterval = setInterval(() => {
        if (width >= 92) {
            clearInterval(progressInterval);
            progressInterval = null;
        } else {
            width += Math.random() * 4 + 1;
            if (width > 92) width = 92;
            if (bar) bar.style.width = width + '%';
            if (pairFill) pairFill.style.width = width + '%';
            if (pairPct) pairPct.innerText = Math.floor(width) + '%';
        }
    }, 220);
}

function stopProgress() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }

    const bar = document.getElementById('progressBar');
    const container = document.getElementById('progressContainer');
    const pairProgress = document.getElementById('pairProgress');
    const pairFill = document.getElementById('pairProgressFill');
    const pairPct = document.getElementById('pairPercent');

    if (bar) bar.style.width = '100%';
    if (pairFill) pairFill.style.width = '100%';
    if (pairPct) pairPct.innerText = '100%';

    setTimeout(() => {
        if (container) container.style.display = 'none';
        if (pairProgress) pairProgress.classList.remove('show');
    }, 900);
}

// =========================================================
// ⏱️ UPTIME COUNTER
// =========================================================
setInterval(() => {
    const secs = Math.floor((Date.now() - startTime) / 1000);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const txt = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;

    const el = document.getElementById('uptimeText');
    if (el) el.innerText = txt;

    const tsEl = document.getElementById('tsUptimeVal');
    if (tsEl) tsEl.innerText = txt;
}, 1000);

// =========================================================
// 📋 COPY PAIRING CODE (for index.html)
// =========================================================
function copyPairingCode() {
    const el = document.getElementById('pairingCodeValue');
    if (!el) return;
    const code = el.innerText.trim();
    if (!code) return;

    const onOK = () => {
        const btn = document.getElementById('pairingCopyBtn');
        if (btn) {
            const orig = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> COPIED!';
            setTimeout(() => { btn.innerHTML = orig; }, 2000);
        }
        showToast('Pairing code copied ✅', 'success', 2000);
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(code).then(onOK).catch(() => fallbackCopy(code, onOK));
    } else {
        fallbackCopy(code, onOK);
    }
}

function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); cb && cb(); } catch (e) { showToast('Copy failed', 'error'); }
    document.body.removeChild(ta);
}

// =========================================================
// 🎯 EXPOSE GLOBALLY
// =========================================================
window.selectUser = selectUser;
window.copyPairingCode = copyPairingCode;
window.socket = socket;

// =========================================================
// 🚀 AUTO-INIT
// =========================================================
window.addEventListener('DOMContentLoaded', () => {
    console.log('%c♾️ BL@CKN1TE-NXS ULTRA · Frontend synced', 'color:#06b6d4;font-family:monospace;');
});