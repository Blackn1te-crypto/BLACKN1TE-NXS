// ============================================================
//  BL@CKN1TE-NXS — Bot Configuration
//  Author: BL@CKN1TE — The Incisive Tri-Hat Hacker
//  Version: V16 ULTRA
//  Channel: https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f
// ============================================================

const settings = {
    // ─────────────────────────────────────────────
    // 🎩 BOT IDENTITY
    // ─────────────────────────────────────────────
    packname: '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦',
    author: '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘 • Tri-Hat Hacker',
    botName: '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦 𝗨𝗟𝗧𝗥𝗔',
    botOwner: '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘',        // Owner display name
    ownerName: '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘 𝗧𝗛𝗘 𝗜𝗡𝗖𝗜𝗦𝗜𝗩𝗘 𝗧𝗥𝗜-𝗛𝗔𝗧 𝗛𝗔𝗖𝗞𝗘𝗥',

    // ─────────────────────────────────────────────
    // 📞 OWNER NUMBERS (no +, no spaces)
    //    Multiple numbers separated by comma
    // ─────────────────────────────────────────────
    ownerNumber: '263714799483,263780540231',

    // ─────────────────────────────────────────────
    // 🔗 OFFICIAL LINKS
    // ─────────────────────────────────────────────
    channelLink: 'https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f',
    supportGroup: 'https://chat.whatsapp.com/', // add your group link here if you have one
    website: 'http://145.239.65.118:20378',      // your live panel URL
    updateZipUrl: '',                            // optional — set your repo zip if you want auto-update

    // ─────────────────────────────────────────────
    // 🎛️ BOT BEHAVIOUR
    // ─────────────────────────────────────────────
    commandMode: 'public',       // 'public' | 'private'
    prefix: '.',                 // default prefix (also supports / and >)
    maxStoreMessages: 20,        // antidelete cache depth
    storeWriteInterval: 10000,   // ms — how often to flush antidelete store

    // ─────────────────────────────────────────────
    // 🌐 API KEYS
    // ─────────────────────────────────────────────
    giphyApiKey: process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC',

    // ─────────────────────────────────────────────
    // 📝 METADATA
    // ─────────────────────────────────────────────
    description: 'BL@CKN1TE-NXS ULTRA — Cyberpunk WhatsApp Bot by the Incisive Tri-Hat Hacker. Infinite lifetime connection, 125+ commands, AI engine, anti-* protocols, and PROMAX speed.',
    version: 'V16 ULTRA',

    // ─────────────────────────────────────────────
    // 🎨 BRANDING
    // ─────────────────────────────────────────────
    logo: 'https://i.ibb.co/hRbc4JJ8/logo.jpg',
    themeColor: '#00ff9d',
    mode: 'INFINITE',
    speed: 'PROMAX'
};

module.exports = settings;