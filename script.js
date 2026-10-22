/* =========================================================
   SCRIPT.JS — Main frontend logic (Socket.IO)
   ========================================================= */

const socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000
});

let currentUserId = null;
let isPairing = false;
const startTime = Date.now();

// ===== SELECT / CREATE BOT =====
function selectUser() {
    const input = document.getElementById('userIdInput');
    const userId = input.value.trim();

    if (!userId) {
        showToast('Please enter a bot name', 'warning');
        input.focus();
        return;
    }

    if (!/^[a-zA-Z0-9_-]{2,30}$/.test(userId)) {
        showToast('Only letters, numbers, _ and - (2-30 chars)', 'error');
        return;
    }

    currentUserId = userId;
    socket.emit('set-user', userId);

    document.getElementById('activeBotName').innerText = '• ' + userId;
    document.getElementById('userDashboard').classList.remove('hidden');
    document.getElementById('stage1').classList.remove('hidden');
    document.getElementById('stage2').classList.add('hidden');
    document.getElementById('setupSection').classList.add('hidden');

    showToast('Bot selected: ' + userId, 'success');
}

// ===== SOCKET EVENTS =====
socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
});

socket.on('disconnect', () => {
    console.log('[Socket] Disconnected');
    showToast('Connection lost. Reconnecting...', 'error');
});

socket.on('total-active', (data) => {
    const count = typeof data === 'object' ? data.count : data;
    const sessionsCount = typeof data === 'object' ? data.sessions : count;
    document.getElementById('totalActive').innerText = count ?? 0;
    document.getElementById('sessionCount').innerText = sessionsCount ?? 0;
});

socket.on('pairing-code', (code) => {
    stopProgress();
    const el = document.getElementById('pairingResult');
    el.innerText = code;
    showToast('Pairing code received!', 'success');
    isPairing = false;
    document.getElementById('pairBtn').disabled = false;
});

socket.on('console', (log) => {
    const consoleDiv = document.getElementById('console');
    const entry = document.createElement('div');
    entry.className = 'log-line log-' + (log.type || 'info');
    entry.innerHTML = `<span class="log-time">[${log.timestamp}]</span> ${escapeHtml(log.message)}`;
    consoleDiv.appendChild(entry);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;

    while (consoleDiv.children.length > 500) {
        consoleDiv.removeChild(consoleDiv.firstChild);
    }
});

socket.on('connection-status', (status) => {
    const badge = document.getElementById('connectionStatus');
    const stage1 = document.getElementById('stage1');
    const stage2 = document.getElementById('stage2');

    if (status.connected) {
        badge.className = 'status-badge connected';
        badge.innerText = 'CONNECTED';
        stage1.classList.add('hidden');
        stage2.classList.remove('hidden');
        stopProgress();
    } else {
        badge.className = 'status-badge disconnected';
        badge.innerText = 'DISCONNECTED';
        if (stage2 && !stage2.classList.contains('hidden')) {
            stage1.classList.remove('hidden');
            stage2.classList.add('hidden');
        }
    }
});

// ===== PAIR BUTTON =====
document.getElementById('pairBtn').onclick = () => {
    if (isPairing) return;

    const number = document.getElementById('pairNumber').value.trim();
    if (!number) {
        showToast('Enter your WhatsApp number', 'warning');
        return;
    }
    if (!/^\d{8,15}$/.test(number)) {
        showToast('Number must be digits only, with country code', 'error');
        return;
    }

    isPairing = true;
    const btn = document.getElementById('pairBtn');
    btn.disabled = true;
    document.getElementById('pairingResult').innerText = '';

    startProgress();

    socket.emit('pair-request', { userId: currentUserId, number });

    setTimeout(() => {
        if (isPairing) {
            isPairing = false;
            btn.disabled = false;
            stopProgress();
            showToast('Request timed out. Try again.', 'error');
        }
    }, 60000);
};

// ===== LOGOUT =====
document.getElementById('logoutBtn').onclick = () => {
    if (!confirm('Are you sure you want to logout this bot?')) return;
    socket.emit('logout', currentUserId);
    document.getElementById('stage2').classList.add('hidden');
    document.getElementById('stage1').classList.remove('hidden');
    document.getElementById('setupSection').classList.remove('hidden');
    document.getElementById('userDashboard').classList.add('hidden');
    document.getElementById('userIdInput').value = '';
    currentUserId = null;
    showToast('Logged out.', 'info');
};

// ===== PROGRESS BAR =====
let progressInterval = null;

function startProgress() {
    const container = document.getElementById('progressContainer');
    const bar = document.getElementById('progressBar');

    container.style.display = 'block';
    bar.style.width = '0%';

    let width = 0;
    progressInterval = setInterval(() => {
        if (width >= 92) {
            clearInterval(progressInterval);
        } else {
            width += Math.random() * 4 + 1;
            if (width > 92) width = 92;
            bar.style.width = width + '%';
        }
    }, 220);
}

function stopProgress() {
    if (progressInterval) clearInterval(progressInterval);
    const bar = document.getElementById('progressBar');
    const container = document.getElementById('progressContainer');
    if (bar) bar.style.width = '100%';
    setTimeout(() => { if (container) container.style.display = 'none'; }, 700);
}

// ===== UPTIME =====
setInterval(() => {
    const secs = Math.floor((Date.now() - startTime) / 1000);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const txt = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m` : `${s}s`;
    const el = document.getElementById('uptimeText');
    if (el) el.innerText = txt;
}, 1000);