// ============================================================
//  𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦 𝗨𝗟𝗧𝗥𝗔 — Bot Configuration
//  Author: BL@CKN1TE — The Incisive Tri-Hat Hacker
//  Version: V16 ULTRA
//  Channel: https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f
// ============================================================

const settings = {
    // ─────────────────────────────────────────────
    // 🎩 BOT IDENTITY
    // ─────────────────────────────────────────────
    packname: process.env.BOT_NAME || '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦',
    author: '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘 • Tri-Hat Hacker',
    botName: process.env.BOT_NAME || '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦 𝗨𝗟𝗧𝗥𝗔',
    botOwner: process.env.BOT_OWNER || '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘',
    ownerName: process.env.BOT_OWNER 
        ? `${process.env.BOT_OWNER} THE INCISIVE TRI-HAT HACKER`
        : '𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘 𝗧𝗛𝗘 𝗜𝗡𝗖𝗜𝗦𝗜𝗩𝗘 𝗧𝗥𝗜-𝗛𝗔𝗧 𝗛𝗔𝗖𝗞𝗘𝗥',

    // ─────────────────────────────────────────────
    // 📞 OWNER NUMBERS (comma-separated, no spaces, no +)
    // ─────────────────────────────────────────────
    ownerNumber: process.env.OWNER_NUMBER || '263714799483,263780540231',

    // ─────────────────────────────────────────────
    // 🔗 OFFICIAL LINKS
    // ─────────────────────────────────────────────
    channelLink: process.env.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f',
    supportGroup: '',
    website: process.env.WEBSITE || 'http://145.239.65.118:20378',
    updateZipUrl: '',

    // ─────────────────────────────────────────────
    // 🎛️ BOT BEHAVIOUR
    // ─────────────────────────────────────────────
    commandMode: 'public',
    prefix: '.',
    maxStoreMessages: 20,
    storeWriteInterval: 10000,

    // ─────────────────────────────────────────────
    // 🌐 API KEYS
    // ─────────────────────────────────────────────
    giphyApiKey: process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC',

    // ─────────────────────────────────────────────
    // 📝 METADATA
    // ─────────────────────────────────────────────
    description: 'BL@CKN1TE-NXS ULTRA — Cyberpunk WhatsApp Bot by the Incisive Tri-Hat Hacker.',
    version: 'V16 ULTRA',

    // ─────────────────────────────────────────────
    // 🎨 BRANDING
    // ─────────────────────────────────────────────
    logo: process.env.LOGO_URL || 'https://i.ibb.co/hRbc4JJ8/logo.jpg',
    themeColor: '#00ff9d',
    mode: 'INFINITE',
    speed: 'PROMAX'
};

module.exports = settings;
