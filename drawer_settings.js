// ============================================================
// drawer_settings.js
// Handles the Navigation Drawer logic for BL@CKN1TE-NXS
// Contact Owner | About | Settings | Logout (Terminate Session)
// ============================================================

(function () {
    'use strict';

    // ============================================================
    // 1. MODAL SYSTEM (Overlay + Content Container)
    // ============================================================
    function ensureModalExists() {
        if (document.getElementById('nexusModal')) return;

        const modalHTML = `
            <div id="nexusModal" class="nexus-modal-overlay">
                <div class="nexus-modal-box">
                    <div class="nexus-modal-header">
                        <span id="nexusModalTitle">PANEL</span>
                        <span class="nexus-close-btn" onclick="closeNexusModal()">
                            <i class="fas fa-times"></i>
                        </span>
                    </div>
                    <div class="nexus-modal-body" id="nexusModalBody"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    window.closeNexusModal = function () {
        const modal = document.getElementById('nexusModal');
        if (modal) modal.classList.remove('open');
    };

    function openNexusModal(title, bodyHTML) {
        ensureModalExists();
        document.getElementById('nexusModalTitle').innerText = title;
        document.getElementById('nexusModalBody').innerHTML = bodyHTML;
        document.getElementById('nexusModal').classList.add('open');
    }

    // ============================================================
    // 2. CONTACT OWNER (Working WhatsApp buttons inside modal)
    // ============================================================
    function showContactOwner() {
        const contacts = [
            { name: 'BL@CKN1TE (Main)', number: '263780540231' },
            { name: 'BL@CKN1TE (Alt)', number: '263714799483' }
        ];

        let html = `<p class="nexus-text">Reach the owner directly on WhatsApp:</p><div class="nexus-wa-list">`;

        contacts.forEach(c => {
            const waLink = `https://wa.me/${c.number}?text=${encodeURIComponent("Hello BL@CKN1TE, I need help with the bot!")}`;
            html += `
                <a href="${waLink}" target="_blank" class="nexus-wa-btn">
                    <svg class="nexus-wa-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <div>
                        <span class="nexus-wa-name">${c.name}</span>
                        <span class="nexus-wa-num">+${c.number}</span>
                    </div>
                </a>
            `;
        });

        html += `</div>`;
        openNexusModal('📱 CONTACT OWNER', html);
    }

    // ============================================================
    // 3. ABOUT PANEL
    // ============================================================
    function showAbout() {
        const html = `
            <div class="nexus-about">
                <h2>BL@CKN1TE-NXS</h2>
                <p class="nexus-tag">The Incisive Tri-Hat Hacker</p>
                <div class="nexus-about-line"></div>
                <ul class="nexus-about-list">
                    <li><i class="fas fa-check-circle"></i> WhatsApp Bot Control Panel</li>
                    <li><i class="fas fa-check-circle"></i> Multi-Session Support</li>
                    <li><i class="fas fa-check-circle"></i> Live Console Logs</li>
                    <li><i class="fas fa-check-circle"></i> Secure Pairing Code System</li>
                </ul>
                <div class="nexus-about-line"></div>
                <p class="nexus-version">Version 1.0.0</p>
                <p class="nexus-copyright">© 2025 BL@CKN1TE</p>
            </div>
        `;
        openNexusModal('ℹ️ ABOUT', html);
    }

    // ============================================================
    // 4. SETTINGS PANEL
    // ============================================================
    function showSettings() {
        const html = `
            <div class="nexus-settings">
                <div class="nexus-setting-row">
                    <label>Bot Display Name</label>
                    <input type="text" id="settingBotName" placeholder="BL@CKN1TE-NXS">
                </div>
                <div class="nexus-setting-row">
                    <label>Command Prefix</label>
                    <input type="text" id="settingPrefix" placeholder="." maxlength="2">
                </div>
                <div class="nexus-setting-row">
                    <label>Auto-Read Messages</label>
                    <select id="settingAutoRead">
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                    </select>
                </div>
                <button class="nexus-save-btn" onclick="saveNexusSettings()">
                    <i class="fas fa-save"></i> SAVE SETTINGS
                </button>
                <p class="nexus-hint">Settings are stored in your browser locally. Server-side sync requires an API endpoint.</p>
            </div>
        `;
        openNexusModal('⚙️ SETTINGS', html);

        // Load existing settings into the form
        setTimeout(() => {
            const s = JSON.parse(localStorage.getItem('nexusSettings') || '{}');
            if (s.botName) document.getElementById('settingBotName').value = s.botName;
            if (s.prefix) document.getElementById('settingPrefix').value = s.prefix;
            if (s.autoRead) document.getElementById('settingAutoRead').value = s.autoRead;
        }, 100);
    }

    window.saveNexusSettings = function () {
        const settings = {
            botName: document.getElementById('settingBotName').value.trim(),
            prefix: document.getElementById('settingPrefix').value.trim() || '.',
            autoRead: document.getElementById('settingAutoRead').value
        };
        localStorage.setItem('nexusSettings', JSON.stringify(settings));
        alert('✅ Settings saved successfully!');
        closeNexusModal();
    };

    // ============================================================
    // 5. LOGOUT (Terminate WhatsApp Session)
    // ============================================================
    function handleLogout() {
        const confirmed = confirm("⚠️ Are you sure you want to LOGOUT?\n\nThis will terminate your active WhatsApp session.");
        if (!confirmed) return;

        // Try to notify the server to terminate the session
        try {
            if (typeof socket !== 'undefined' && socket.emit) {
                socket.emit('logoutSession');
            }
        } catch (e) {
            console.warn('Socket emit failed:', e);
        }

        // Also try a fetch request as a fallback
        fetch('/api/logout', { method: 'POST' })
            .catch(() => { /* endpoint may not exist, ignore */ });

        alert('🚪 Session terminating...\nYou will need to re-pair WhatsApp.');

        // Reload the page after 2 seconds
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }

    // ============================================================
    // 6. DRAWER ITEM ROUTER
    // ============================================================
    document.addEventListener('click', function (e) {
        const item = e.target.closest('.drawer-item');
        if (!item) return;

        const action = item.dataset.action;
        if (!action) return;

        // Close the drawer first
        if (typeof window.toggleDrawer === 'function') {
            window.toggleDrawer();
        } else {
            const drawer = document.getElementById('sideDrawer');
            const overlay = document.getElementById('drawerOverlay');
            if (drawer) drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('open');
        }

        // Route based on data-action
        if (action === 'contact') {
            showContactOwner();
        } else if (action === 'about') {
            showAbout();
        } else if (action === 'settings') {
            showSettings();
        } else if (action === 'logout') {
            if (typeof window.nexusLogout === 'function') {
                window.nexusLogout();
            } else {
                handleLogout();
            }
        }
    });

    // ============================================================
    // 7. INJECT MODAL + BUTTON STYLES
    // ============================================================
    const style = document.createElement('style');
    style.innerHTML = `
        /* --- Modal Overlay --- */
        .nexus-modal-overlay {
            position: fixed; inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(6px);
            display: none;
            justify-content: center; align-items: center;
            z-index: 2000; padding: 20px;
        }
        .nexus-modal-overlay.open { display: flex; }

        .nexus-modal-box {
            width: 100%; max-width: 420px;
            background: #05070d;
            border: 1px solid #00ff80;
            border-radius: 16px;
            box-shadow: 0 0 40px rgba(0, 255, 128, 0.3);
            animation: nexusFadeIn 0.3s ease;
            overflow: hidden;
            max-height: 85vh;
            overflow-y: auto;
        }
        @keyframes nexusFadeIn {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .nexus-modal-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(0, 255, 128, 0.2);
            color: #00ff80; font-family: 'Orbitron', sans-serif;
            font-weight: 700; letter-spacing: 1px;
        }
        .nexus-close-btn { cursor: pointer; font-size: 1.2rem; transition: 0.2s; }
        .nexus-close-btn:hover { color: #fff; transform: rotate(90deg); }
        .nexus-modal-body { padding: 20px; color: #ccc; font-family: 'JetBrains Mono', monospace; }

        /* --- WhatsApp Contact Buttons --- */
        .nexus-text { text-align: center; margin-bottom: 15px; font-size: 0.9rem; }
        .nexus-wa-list { display: flex; flex-direction: column; gap: 12px; }
        .nexus-wa-btn {
            display: flex; align-items: center; gap: 14px;
            padding: 14px 18px;
            background: rgba(0, 255, 128, 0.05);
            border: 1px solid rgba(0, 255, 128, 0.3);
            border-radius: 12px;
            text-decoration: none; color: #fff;
            transition: all 0.3s ease;
        }
        .nexus-wa-btn:hover {
            background: rgba(0, 255, 128, 0.15);
            border-color: #00ff80;
            transform: translateX(5px);
            box-shadow: 0 0 20px rgba(0, 255, 128, 0.3);
        }
        .nexus-wa-icon {
            width: 28px; height: 28px; fill: #00ff80;
            filter: drop-shadow(0 0 5px rgba(0, 255, 128, 0.8));
            flex-shrink: 0;
        }
        .nexus-wa-name { display: block; font-weight: 700; font-size: 0.95rem; }
        .nexus-wa-num { display: block; font-size: 0.8rem; color: #00ff80; }

        /* --- About Panel --- */
        .nexus-about { text-align: center; }
        .nexus-about h2 {
            color: #00ff80; font-family: 'Orbitron', sans-serif;
            font-size: 1.5rem; margin-bottom: 5px;
            text-shadow: 0 0 10px rgba(0, 255, 128, 0.5);
        }
        .nexus-tag { color: #7c3aed; font-size: 0.85rem; margin-bottom: 20px; }
        .nexus-about-line {
            height: 1px; background: linear-gradient(90deg, transparent, #00ff80, transparent);
            margin: 15px 0;
        }
        .nexus-about-list { list-style: none; text-align: left; padding: 0; }
        .nexus-about-list li {
            padding: 8px 0; font-size: 0.85rem;
            display: flex; align-items: center; gap: 10px;
        }
        .nexus-about-list i { color: #00ff80; }
        .nexus-version { color: #00ff80; font-size: 0.8rem; }
        .nexus-copyright { color: #666; font-size: 0.75rem; }

        /* --- Settings Panel --- */
        .nexus-setting-row { margin-bottom: 15px; }
        .nexus-setting-row label {
            display: block; color: #00ff80; font-size: 0.8rem;
            margin-bottom: 6px; letter-spacing: 1px;
        }
        .nexus-setting-row input,
        .nexus-setting-row select {
            width: 100%; padding: 10px 12px;
            background: #0a0f17; border: 1px solid rgba(0, 255, 128, 0.3);
            border-radius: 8px; color: #fff;
            font-family: 'JetBrains Mono', monospace; font-size: 0.9rem;
            outline: none; transition: 0.3s;
            box-sizing: border-box;
        }
        .nexus-setting-row input:focus,
        .nexus-setting-row select:focus {
            border-color: #00ff80;
            box-shadow: 0 0 10px rgba(0, 255, 128, 0.3);
        }
        .nexus-save-btn {
            width: 100%; padding: 12px;
            background: linear-gradient(135deg, #00ff80, #06b6d4);
            border: none; border-radius: 8px;
            color: #05070d; font-weight: 700;
            font-family: 'Orbitron', sans-serif;
            cursor: pointer; margin-top: 10px;
            transition: 0.3s;
        }
        .nexus-save-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 255, 128, 0.4);
        }
        .nexus-hint {
            font-size: 0.7rem; color: #666;
            margin-top: 12px; text-align: center;
        }
    `;
    document.head.appendChild(style);

})();
