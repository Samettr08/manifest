/**
 * NopusVault — app.js
 * Akıllı arama motoru + GitHub status kontrolü + NopusManifest Lua jeneratör
 */

'use strict';
window.onerror = function(msg, src, lineno, colno, err) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:red;color:white;z-index:99999;padding:20px;font-size:24px';
    errorDiv.textContent = `ERROR: ${msg} at ${src}:${lineno}:${colno}\n${err?.stack || ''}`;
    document.body.appendChild(errorDiv);
};
window.addEventListener('unhandledrejection', function(e) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:50%;left:0;width:100%;background:red;color:white;z-index:99999;padding:20px;font-size:24px';
    errorDiv.textContent = `PROMISE REJECTION: ${e.reason?.message || e.reason}\n${e.reason?.stack || ''}`;
    document.body.appendChild(errorDiv);
});

// ═══════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════
const CFG = {
    DEPOT_FILE:   'https://raw.githubusercontent.com/Samettr08/manifest/refs/heads/main/depotkeys.json',
    STATUS_URL:   'https://raw.githubusercontent.com/Samettr08/bak-m/main/https.docs',
    STEAM_API:    'https://store.steampowered.com/api/appdetails',
    STEAM_SEARCH: 'https://store.steampowered.com/api/storesearch/',
    STEAM_CDN:    'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps',
    PROXY:        'https://corsproxy.io/?',
    TR_API:       'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=tr&dt=t&q=',
    STATUS_INTERVAL: 60000, // 1 dakikada bir status kontrol
};

// ═══════════════════════════════════════
//  AKILLI ARAMA — OYUN ALİAS VERİTABANI
//  Türkçe yazım, kısaltma, alternatif isimler
// ═══════════════════════════════════════
const GAME_ALIASES = {
    // GTA Serisi
    'gta 5': 271590,       'gta v': 271590,        'gta5': 271590,
    'grand theft auto 5': 271590,                   'grand theft auto v': 271590,
    'gta beş': 271590,     'grand theft oto': 271590,
    'gta 4': 12120,        'gta iv': 12120,         'gta dört': 12120,
    'gta san andreas': 12210,                        'san andreas': 12210,
    'gta vice city': 12110, 'vice city': 12110,
    'gta 3': 12100,        'gta three': 12100,       'gta üç': 12100,

    // Counter-Strike
    'cs2': 730,            'cs 2': 730,             'counter strike 2': 730,
    'counter-strike 2': 730,                         'csgo': 730,
    'cs go': 730,          'cs:go': 730,            'counter strike': 730,
    'cs': 730,

    // Dota
    'dota': 570,           'dota 2': 570,           'dota2': 570,
    'dota iki': 570,

    // PUBG
    'pubg': 578080,        'playerunknown': 578080,  'battlegrounds': 578080,
    'pubg mobile': 578080,

    // Cyberpunk
    'cyberpunk': 1091500,  'cyberpunk 2077': 1091500, 'cyber punk': 1091500,
    'cyberpunk77': 1091500,

    // Elden Ring
    'elden ring': 1245620, 'eldenring': 1245620,    'elden': 1245620,

    // Witcher
    'witcher 3': 292030,   'the witcher 3': 292030, 'witcher üç': 292030,
    'witcher': 292030,     'witcher iii': 292030,

    // Red Dead
    'rdr2': 1174180,       'red dead 2': 1174180,   'red dead redemption 2': 1174180,
    'red dead': 1174180,   'rdr': 1174180,

    // Apex
    'apex': 1172470,       'apex legends': 1172470, 'apex legend': 1172470,

    // Fortnite
    'fortnite': 1665460,   'fort nite': 1665460,

    // Minecraft
    'minecraft': 1672970,  'mine craft': 1672970,

    // Ark
    'ark': 346110,         'ark survival': 346110,  'ark survival evolved': 346110,

    // Rust
    'rust': 252490,

    // Terraria
    'terraria': 105600,

    // Stardew Valley
    'stardew': 413150,     'stardew valley': 413150,

    // Among Us
    'among us': 945360,    'among': 945360,

    // Fall Guys
    'fall guys': 1097150,

    // Valheim
    'valheim': 892970,

    // Hollow Knight
    'hollow knight': 367520, 'hollow': 367520,

    // Dark Souls
    'dark souls': 374320,   'dark souls 3': 374320,  'dark souls iii': 374320,
    'dark souls 1': 570940, 'dark souls remastered': 570940,
    'dark souls 2': 236430, 'dark souls ii': 236430,

    // Sekiro
    'sekiro': 814380,       'sekiro shadows': 814380,

    // Bloodborne — PC yok ama aramada çıksın
    'bloodborne': 814380,

    // Monster Hunter
    'monster hunter world': 582010, 'mhw': 582010, 'monster hunter': 582010,

    // Doom
    'doom': 2280,           'doom eternal': 782330,  'doom 2016': 379720,

    // Battlefield
    'bf4': 1238860,        'battlefield 4': 1238860,
    'bf5': 1238840,        'battlefield 5': 1238840, 'battlefield v': 1238840,
    'battlefield 1': 1238820,

    // Call of Duty
    'cod': 1938090,        'warzone': 1938090,       'call of duty': 1938090,
    'mw2': 1938090,        'modern warfare': 1938090,

    // FIFA / EA FC
    'fifa': 1905730,       'ea fc': 1905730,         'fc 24': 1905730,

    // Destiny
    'destiny': 1085660,    'destiny 2': 1085660,     'destiny iki': 1085660,

    // Path of Exile
    'poe': 238960,         'path of exile': 238960,

    // Hades
    'hades': 1145360,

    // Cuphead
    'cuphead': 268910,

    // Celeste
    'celeste': 504230,

    // Deep Rock
    'deep rock': 548430,   'drg': 548430,            'deep rock galactic': 548430,

    // Satisfactory
    'satisfactory': 526870,

    // No Man's Sky
    'no mans sky': 275850, 'nms': 275850,

    // Subnautica
    'subnautica': 264710,

    // Portal
    'portal 2': 620,       'portal iki': 620,        'portal': 400,

    // Left 4 Dead
    'l4d2': 550,           'left 4 dead 2': 550,     'left for dead': 550,

    // Team Fortress
    'tf2': 440,            'team fortress': 440,     'team fortress 2': 440,

    // Garry's Mod
    'gmod': 4000,          'garrys mod': 4000,       'garry s mod': 4000,

    // Half-Life
    'half life 2': 220,    'hl2': 220,               'half life': 70,
    'alyx': 546560,        'half life alyx': 546560,

    // Rocket League
    'rocket league': 252950, 'rl': 252950,

    // Overwatch
    'overwatch': 2357570,  'ow2': 2357570,           'overwatch 2': 2357570,

    // Hearthstone (Battle.net ama yine de)
    'hearthstone': 1464920,

    // Baldurs Gate
    'bg3': 1086940,        'baldurs gate 3': 1086940, 'baldur s gate 3': 1086940,
    'baldur gate': 1086940,

    // Divinity
    'divinity 2': 435150,  'dos2': 435150,           'divinity original sin 2': 435150,

    // Wasteland
    'wasteland 3': 1074420,

    // Pillars of Eternity
    'pillars of eternity': 291650, 'poe2': 560130,

    // Oxygen Not Included
    'oni': 457140,         'oxygen not included': 457140,

    // Cities Skylines
    'cities skylines': 255710, 'cities': 255710,

    // Civilization
    'civ 6': 289070,       'civilization 6': 289070,  'civ vi': 289070,
    'civilization vi': 289070,

    // Total War
    'total war warhammer': 364360, 'warhammer 3': 1142710,
    'total war': 8930,

    // Age of Empires
    'aoe4': 1466860,       'age of empires 4': 1466860, 'age of empires': 1466860,

    // Starcraft (Battle.net)
    'starcraft 2': 2565890,

    // Diablo
    'diablo 4': 2279460,   'diablo iv': 2279460,

    // Sea of Thieves
    'sea of thieves': 1172620, 'sot': 1172620,

    // Valoran't (Valorant değil, var mı?)
    // Tarkov
    'tarkov': 1368700,     'escape from tarkov': 1368700,

    // Hunt Showdown
    'hunt showdown': 594650, 'hunt': 594650,

    // DayZ
    'dayz': 221100,

    // Arma
    'arma 3': 107410,      'arma3': 107410,

    // War Thunder
    'war thunder': 236390,

    // World of Tanks
    'wot': 1407200,        'world of tanks': 1407200,

    // Star Wars
    'jedi survivor': 1775010, 'star wars jedi': 1775010,
    'battlefront 2': 1237950,

    // Halo
    'halo infinite': 1240440, 'halo': 1240440,

    // God of War
    'god of war': 1593500, 'gow': 1593500,
    'god of war ragnarok': 2322010,

    // Spider-Man
    'spider man': 1817070, 'spiderman': 1817070, 'marvel spider man': 1817070,

    // Hogwarts Legacy
    'hogwarts': 990080,    'hogwarts legacy': 990080,

    // Resident Evil
    're4': 2050650,        'resident evil 4': 2050650,
    'resident evil village': 1196590, 'village': 1196590,
    'resident evil': 304240,

    // Lies of P
    'lies of p': 1627720,

    // Alan Wake
    'alan wake 2': 1903620, 'alan wake': 108710,

    // Starfield
    'starfield': 1716740,

    // Armored Core
    'armored core 6': 1888160, 'ac6': 1888160,

    // Street Fighter
    'street fighter 6': 1364780, 'sf6': 1364780,

    // Tekken
    'tekken 8': 1778820,   'tekken': 1778820,

    // Forza
    'forza horizon 5': 1551360, 'forza': 1551360,

    // Need for Speed
    'nfs heat': 1222680,   'need for speed heat': 1222680,

    // The Forest
    'the forest': 242760,  'sons of the forest': 1150690,

    // Grounded
    'grounded': 962130,

    // Green Hell
    'green hell': 815370,

    // The Long Dark
    'the long dark': 305620,

    // Dead by Daylight
    'dbd': 381210,         'dead by daylight': 381210,

    // Phasmophobia
    'phasmo': 739630,      'phasmophobia': 739630,

    // Lethal Company
    'lethal company': 1966720,

    // Palworld
    'palworld': 1623730,

    // Helldivers
    'helldivers 2': 553850, 'helldivers': 553850,

    // Wukong
    'black myth wukong': 2358720, 'wukong': 2358720, 'black myth': 2358720,

    // Teknik oyunlar
    'factorio': 427520,
    'rimworld': 294100,
    'prison architect': 233450,
    'dwarf fortress': 975370,
};

// Türkçe sayı → rakam dönüşümü
const TR_NUMBERS = {
    'bir': '1', 'iki': '2', 'üç': '3', 'dört': '4', 'beş': '5',
    'altı': '6', 'yedi': '7', 'sekiz': '8', 'dokuz': '9', 'on': '10',
    'onbir': '11', 'oniki': '12', 'onüç': '13', 'ondört': '14', 'onbeş': '15',
    'iki bin': '2000', 'iki bin on yedi': '2017', 'iki bin yirmi': '2020',
    // Roman numerals
    'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5',
    'vi': '6', 'vii': '7', 'viii': '8', 'ix': '9', 'x': '10',
};

// ═══════════════════════════════════════
//  STATE
// ═══════════════════════════════════════
const S = {
    depotKeys:   {},
    isOnline:    false,
    currentApp:  null,
    currentData: null,
    screenshots: [],
    ssIdx:       0,
    recent:      [],
    lastQuery:   '',
    activeTab:   'depot',
    activePage:  'home',
};

// ═══════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════
const $  = id => document.getElementById(id);
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch {
        const el = Object.assign(document.createElement('textarea'), { value: t });
        el.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(el); el.select(); document.execCommand('copy'); el.remove();
        return true;
    }
}

let toastTm;
function showToast(msg, err = false) {
    const t = $('toast');
    $('toast-msg').textContent = msg;
    t.style.borderColor = err ? 'rgba(239,68,68,0.25)' : 'rgba(52,211,153,0.25)';
    t.style.color       = err ? '#f87171' : 'var(--green)';
    t.classList.add('show');
    clearTimeout(toastTm);
    toastTm = setTimeout(() => t.classList.remove('show'), 2800);
}

function setEl(id, val) { const e = $(id); if (e) e.textContent = val; }

// ═══════════════════════════════════════
//  FUZZY SEARCH ENGINE
// ═══════════════════════════════════════

/**
 * Metni normalize et:
 * - küçük harf
 * - Türkçe aksanlı harfleri normalize et
 * - çoklu boşluk temizle
 * - noktalama kaldır
 * - Türkçe sayıları rakama çevir
 * - Roman rakamları çevir
 */
function normalizeQuery(q) {
    if (!q) return '';

    let s = q.toLowerCase().trim();

    // Türkçe karakter normalize
    s = s
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');

    // Noktalama kaldır
    s = s.replace(/[^\w\s]/g, ' ');

    // Türkçe sayı kelimelerini rakama çevir (uzundan kısaya sırala)
    const numKeys = Object.keys(TR_NUMBERS).sort((a, b) => b.length - a.length);
    for (const word of numKeys) {
        const normWord = word
            .replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i')
            .replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ğ/g, 'g');
        const regex = new RegExp(`\\b${normWord}\\b`, 'gi');
        s = s.replace(regex, TR_NUMBERS[word]);
    }

    // Çoklu boşluğu temizle
    s = s.replace(/\s+/g, ' ').trim();

    return s;
}

/** Levenshtein mesafesi */
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i-1][j-1];
            else dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
        }
    }
    return dp[m][n];
}

/** Benzerlik skoru (0..1) */
function similarity(a, b) {
    if (a === b) return 1;
    if (!a || !b) return 0;
    const maxLen = Math.max(a.length, b.length);
    return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Ana akıllı arama fonksiyonu
 * Returns: { appId: number|null, confidence: string }
 */
function smartSearch(raw) {
    const q = normalizeQuery(raw);
    if (!q) return { appId: null, confidence: 'none' };

    // 1. Direkt sayısal ID mi?
    if (/^\d+$/.test(q.trim())) {
        return { appId: parseInt(q.trim()), confidence: 'exact_id' };
    }

    // 2. Alias veritabanında tam eşleşme
    if (GAME_ALIASES[q]) {
        return { appId: GAME_ALIASES[q], confidence: 'alias_exact' };
    }

    // 3. Normalize edilmiş alias ile tam eşleşme
    const normalizedAliases = {};
    for (const [key, val] of Object.entries(GAME_ALIASES)) {
        normalizedAliases[normalizeQuery(key)] = val;
    }
    if (normalizedAliases[q]) {
        return { appId: normalizedAliases[q], confidence: 'alias_normalized' };
    }

    // 4. Alias'larda içerme (substring)
    for (const [key, val] of Object.entries(normalizedAliases)) {
        if (key.includes(q) || q.includes(key)) {
            return { appId: val, confidence: 'alias_substring' };
        }
    }

    // 5. Fuzzy matching (Levenshtein benzerlik eşiği: 0.72)
    let bestScore = 0, bestAppId = null;
    for (const [key, val] of Object.entries(normalizedAliases)) {
        const score = similarity(q, key);
        if (score > bestScore) {
            bestScore = score;
            bestAppId = val;
        }
        // Token bazlı benzerlik — ilk kelimeyi karşılaştır
        const qTokens   = q.split(' ');
        const kTokens   = key.split(' ');
        if (qTokens.length > 0 && kTokens.length > 0) {
            const tokenSim = similarity(qTokens[0], kTokens[0]);
            if (tokenSim > bestScore && tokenSim > 0.8) {
                bestScore = tokenSim;
                bestAppId = val;
            }
        }
    }

    if (bestScore >= 0.72) {
        return { appId: bestAppId, confidence: `fuzzy_${Math.round(bestScore * 100)}%` };
    }

    // 6. Bulunamadı — Steam API ile dene
    return { appId: null, confidence: 'not_found_locally' };
}

// ═══════════════════════════════════════
//  GITHUB STATUS CHECK & WIFI ICONS
// ═══════════════════════════════════════
const SVG_WIFI_ONLINE = `<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px; height:20px; filter: drop-shadow(0 0 4px rgba(34,197,94,0.4))"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"/></svg>`;
const SVG_WIFI_OFFLINE = `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px; height:20px; filter: drop-shadow(0 0 4px rgba(239,68,68,0.4))"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"/></svg>`;
const SVG_WIFI_CHECKING = `<svg viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px; height:20px; animation: blink 1s infinite; filter: drop-shadow(0 0 4px rgba(234,179,8,0.4))"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"/></svg>`;

async function checkStatus() {
    const dot = $('status-dot');
    if (dot) dot.innerHTML = SVG_WIFI_CHECKING;
    setEl('status-label', 'Kontrol...');
    setEl('sysbar-gh', 'Kontrol ediliyor...');
    setEl('sd-last-check', new Date().toLocaleTimeString('tr-TR'));

    try {
        const res  = await fetch(CFG.STATUS_URL + '?t=' + Date.now());
        const text = await res.text();

        // Parse stats:"true" veya stats:"false"
        const match = text.match(/stats\s*:\s*["']?(true|false)["']?/i);
        const statsVal = match ? match[1].toLowerCase() : 'unknown';

        setEl('sd-stats-val', `stats:"${statsVal}"`);
        setEl('sd-last-check', new Date().toLocaleTimeString('tr-TR'));

        if (statsVal === 'true') {
            S.isOnline = true;
            if (dot) dot.innerHTML = SVG_WIFI_ONLINE;
            setEl('status-label', 'Online');
            setEl('sysbar-gh', 'Online ✓');
            setEl('sd-result', 'ONLINE — Sistem Aktif');
            setEl('sum-status', 'Online');
            setEl('st-status', 'Online');
            const sic = $('sys-icon-card');
            if (sic) { sic.style.background = 'rgba(52,211,153,0.1)'; sic.style.color = '#34d399'; }
            hideOffline();
        } else {
            S.isOnline = false;
            if (dot) dot.innerHTML = SVG_WIFI_OFFLINE;
            setEl('status-label', 'Offline');
            setEl('sysbar-gh', 'Offline ✗');
            setEl('sd-result', 'OFFLINE — Bakım Modu');
            setEl('sum-status', 'Offline');
            setEl('st-status', 'Offline');
            showOffline();
        }
    } catch (e) {
        // Ağ hatası → kısıtlayıcı olmayalım, devam et
        console.warn('Status kontrol hatası:', e);
        S.isOnline = true;
        if (dot) dot.innerHTML = SVG_WIFI_CHECKING;
        setEl('status-label', '?');
        setEl('sysbar-gh', 'Ulaşılamadı');
        setEl('sd-result', 'Bağlantı hatası');
        setEl('sd-stats-val', 'Hata');
    }
}

function showOffline() {
    $('offline-screen').classList.remove('hidden');
    $('app').style.pointerEvents = 'none';
    $('app').style.filter = 'blur(4px)';
}

function hideOffline() {
    $('offline-screen').classList.add('hidden');
    $('app').style.pointerEvents = 'all';
    $('app').style.filter = 'none';
}

// ═══════════════════════════════════════
//  SPLASH
// ═══════════════════════════════════════
async function runSplash() {
    const appEl = $('app');
    if (appEl) appEl.style.display = 'block';
    const splashEl = $('splash');
    if (splashEl) splashEl.style.display = 'none';
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// ═══════════════════════════════════════
//  DEPOT KEYS
// ═══════════════════════════════════════
async function loadDepotKeys() {
    try {
        const res = await fetch(CFG.DEPOT_FILE);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        S.depotKeys = await res.json();

        const count = Object.keys(S.depotKeys).length;
        const approxGames = Math.round(count / 3.2); // ortalama depot/oyun oranı

        setEl('sum-depots', count.toLocaleString('tr-TR'));
        setEl('sum-games',  approxGames.toLocaleString('tr-TR') + '+');
        setEl('sum-dlc',    'Steam API');
        setEl('sum-manifest', 'Lua');

        setEl('st-depots', count.toLocaleString('tr-TR'));
        setEl('st-games',  approxGames.toLocaleString('tr-TR') + '+');
        setEl('sysbar-time', new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));

        buildRangeChart();
    } catch (e) {
        console.error('Depot yüklenemedi:', e);
    }
}

function findDepotKeys(appId) {
    return Object.entries(S.depotKeys)
        .filter(([id]) => Math.abs(parseInt(id) - appId) <= 3000)
        .sort((a, b) => Math.abs(parseInt(a[0]) - appId) - Math.abs(parseInt(b[0]) - appId))
        .slice(0, 50);
}

// ═══════════════════════════════════════
//  RANGE CHART
// ═══════════════════════════════════════
function buildRangeChart() {
    const ids = Object.keys(S.depotKeys).map(Number);
    const ranges = [
        { l: '< 100k',    min: 1,       max: 99999 },
        { l: '100k-500k', min: 100000,  max: 499999 },
        { l: '500k-1M',   min: 500000,  max: 999999 },
        { l: '1M-2M',     min: 1000000, max: 1999999 },
        { l: '2M-3M',     min: 2000000, max: 2999999 },
        { l: '3M+',       min: 3000000, max: Infinity },
    ];
    const data = ranges.map(r => ({ ...r, c: ids.filter(id => id >= r.min && id <= r.max).length }));
    const mx   = Math.max(...data.map(d => d.c), 1);

    $('range-bars').innerHTML = data.map(d => `
        <div class="rbar-row">
            <span class="rbar-lbl">${d.l}</span>
            <div class="rbar-track"><div class="rbar-fill" style="width:${(d.c/mx*100).toFixed(1)}%"></div></div>
            <span class="rbar-cnt">${d.c.toLocaleString('tr-TR')}</span>
        </div>
    `).join('');
}

// ═══════════════════════════════════════
//  SEARCH
// ═══════════════════════════════════════
async function doSearch(rawQuery) {
    rawQuery = rawQuery?.trim();
    if (!rawQuery) return;

    S.lastQuery = rawQuery;
    showSearchState('loading');
    setEl('sp-loading-msg', `"${rawQuery}" aranıyor...`);

    // Akıllı arama motoru
    const { appId, confidence } = smartSearch(rawQuery);

    if (appId && findDepotKeys(appId).length > 0) {
        setEl('sp-loading-msg', `App ID ${appId} bulundu (${confidence}), detaylar yükleniyor...`);
        await fetchGame(appId);
        return;
    }

    // Steam API'den ara (sadece bizde varsa göstereceğiz)
    setEl('sp-loading-msg', 'Steam veritabanında aranıyor...');
    const steamId = await steamSearch(rawQuery);
    if (steamId && findDepotKeys(steamId).length > 0) {
        await fetchGame(steamId);
    } else {
        showSearchState('error');
        setEl('sp-error-msg', `"${rawQuery}" için veritabanımızda depot key bulunamadı.`);
    }
}

async function steamSearch(q) {
    try {
        const url  = CFG.PROXY + encodeURIComponent(CFG.STEAM_SEARCH + '?term=' + encodeURIComponent(q) + '&l=turkish&cc=tr');
        const res  = await fetch(url);
        const data = await res.json();
        return data?.items?.[0]?.id || null;
    } catch { return null; }
}

function showSearchState(name) {
    ['sp-welcome', 'sp-loading', 'sp-error', 'game-card'].forEach(id => {
        $(id)?.classList.add('hidden');
    });
    $(name === 'game' ? 'game-card' : `sp-${name}`)?.classList.remove('hidden');
}

// ═══════════════════════════════════════
//  FETCH GAME
// ═══════════════════════════════════════
async function fetchGame(appId) {
    S.currentApp = appId;

    const tryFetch = async (proxy) => {
        const base = `${CFG.STEAM_API}?appids=${appId}&cc=tr&l=turkish`;
        const url  = proxy ? CFG.PROXY + encodeURIComponent(base) : base;
        const r    = await fetch(url);
        return await r.json();
    };

    let json;
    try       { json = await tryFetch(true); }
    catch (e) { try { json = await tryFetch(false); } catch { json = null; } }

    const gameData = json?.[appId];
    if (!gameData?.success || !gameData?.data) {
        showSearchState('error');
        setEl('sp-error-msg', `App ID ${appId} için Steam'den veri alınamadı. Proxy sorunlu olabilir.`);
        return;
    }

    S.currentData = gameData.data;
    renderGame(appId, gameData.data);
}

// ═══════════════════════════════════════
//  RENDER GAME
// ═══════════════════════════════════════
function renderGame(appId, d) {
    // Image
    const img = d.header_image || `${CFG.STEAM_CDN}/${appId}/header.jpg`;
    $('gc-img').src = img;
    $('gc-img').alt = d.name || '';

    // Name
    setEl('gc-name', d.name || `App ${appId}`);

    // Tags
    const tags = $('gc-tags');
    tags.innerHTML = '';
    addTag(tags, '✓ Sistemde Mevcut', 'tag-green');
    if (d.type) addTag(tags, TR_TYPES[d.type] || d.type, 'tag-blue');
    if (d.is_free) addTag(tags, 'Ücretsiz', 'tag-purple');
    if (d.metacritic?.score) addTag(tags, 'MC: ' + d.metacritic.score, 'tag-gray');

    // Meta
    const meta = $('gc-meta');
    meta.innerHTML = '';
    if (d.release_date?.date) addMetaItem(meta, d.release_date.date, '🗓');
    if (d.developers?.[0])    addMetaItem(meta, d.developers[0], '🏢');
    if (d.genres?.length)     addMetaItem(meta, d.genres.map(g => g.description).join(', '), '🎮');

    // Steam link
    $('btn-steam').href = `https://store.steampowered.com/app/${appId}`;

    // Tab: DLC count
    const dlcIds = d.dlc || [];
    setEl('tab-dlc-count', dlcIds.length);

    // Screenshots
    S.screenshots = d.screenshots?.map(s => s.path_full) || [];

    // Render tab content
    renderTabDepot(appId);
    renderTabDLC(dlcIds);
    renderTabManifest(appId, d);
    renderTabSysReq(d.pc_requirements);
    renderTabDesc(d);
    renderTabScreenshots();

    // Switch to search page & activate first tab
    switchPage('search');
    switchTab('depot');
    showSearchState('game');

    // Add recent
    addRecent({ name: d.name || `App ${appId}`, appid: appId, img: d.capsule_image || img });
}

const TR_TYPES = { game:'Oyun', dlc:'DLC', demo:'Demo', mod:'Mod', video:'Video', series:'Seri' };

function addTag(parent, text, cls) {
    const span = document.createElement('span');
    span.className = 'tag ' + cls;
    span.textContent = text;
    parent.appendChild(span);
}

function addMetaItem(parent, text, icon) {
    const div = document.createElement('div');
    div.className = 'gc-meta-item';
    div.textContent = `${icon} ${text}`;
    parent.appendChild(div);
}

// ─── Tab: Depot Keys ─────────────────
function renderTabDepot(appId) {
    const pairs = findDepotKeys(appId);
    setEl('depot-found-count', `${pairs.length} depot bulundu`);
    const list = $('dk-list');
    list.innerHTML = '';

    if (!pairs.length) {
        list.innerHTML = '<p class="empty-p" style="padding:16px">Bu oyun için depot key bulunamadı.</p>';
        return;
    }

    pairs.forEach(([id, key]) => {
        const row = document.createElement('div');
        row.className = 'dk-item';
        row.innerHTML = `
            <span class="dk-id">${id}</span>
            <span class="dk-key">${key}</span>
            <button class="dk-copy" title="Kopyala" data-k="${key}">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.7">
                    <rect x="4" y="4" width="7" height="7" rx="1"/>
                    <path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1"/>
                </svg>
            </button>
        `;
        row.querySelector('.dk-copy').addEventListener('click', async (e) => {
            e.stopPropagation();
            await copyText(key);
            showToast(`#${id} kopyalandı!`);
        });
        list.appendChild(row);
    });
}

// ─── Tab: DLC ────────────────────────
function getDummyManifestId(depotId) {
    let hash = 0;
    const s = String(depotId) + "nopus";
    for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash |= 0;
    }
    const part1 = Math.abs(hash).toString().padEnd(9, '7');
    const part2 = Math.abs(hash * 31).toString().padEnd(10, '3');
    return (part1 + part2).substring(0, 19);
}

function renderTabDLC(dlcIds) {
    const list = $('dlc-list');
    list.innerHTML = '';

    const activeDlc = dlcIds.filter(id => findDepotKeys(id).length > 0);

    if (!activeDlc.length) {
        list.innerHTML = '<p class="empty-p" style="padding:16px">Bu oyun için DLC listesi veya keyleri bulunamadı.</p>';
        return;
    }

    activeDlc.forEach(id => {
        const dlcDepots = findDepotKeys(id);
        const a = document.createElement('div');
        a.className = 'dlc-row';
        a.style.flexDirection = 'column';
        a.style.alignItems = 'stretch';
        a.style.gap = '8px';
        
        let depotsHtml = '';
        dlcDepots.forEach(([depotId, key]) => {
            depotsHtml += `
                <div class="dlc-depot-item" style="margin-top: 6px; padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid var(--line2); font-family: monospace; font-size: 12px; display: flex; justify-content: space-between; align-items: center; border-radius: 4px;">
                    <span>Depot: <strong style="color: var(--blue); font-size: 13px;">${depotId}</strong> | Key: <span style="color: var(--text2);">${key}</span></span>
                    <button class="btn-xs dk-copy" data-key="${key}" style="padding: 4px 8px; font-size: 11px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: var(--blue); cursor: pointer; border-radius: 2px;">Kopyala</button>
                </div>
            `;
        });

        a.innerHTML = `
            <div style="display: flex; gap: 12px; align-items: center;">
                <img class="dlc-thumb" src="${CFG.STEAM_CDN}/${id}/header.jpg" alt="DLC ${id}" loading="lazy"
                     onerror="this.src='${CFG.STEAM_CDN}/${id}/capsule_231x87.jpg'" style="width: 120px; height: 45px; object-fit: cover; border-radius: 2px;">
                <div class="dlc-info" style="flex: 1;">
                    <div class="dlc-name" style="font-weight: 600; color: var(--text1); font-size: 14px;">DLC ID: ${id}</div>
                </div>
            </div>
            <div class="dlc-depots-container">${depotsHtml}</div>
        `;
        list.appendChild(a);
    });

    list.querySelectorAll('.dk-copy').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await copyText(btn.dataset.key);
            showToast('Depot Key kopyalandı!');
        });
    });
}

// ─── Tab: Manifest ───────────────────
function renderTabManifest(appId, d) {
    const lua = buildLua(appId, d);
    $('manifest-pre').innerHTML = luaHighlight(lua);
}

// ─── Tab: SysReq ─────────────────────
const SR_LABELS = {
    'OS':'İşletim Sistemi','Processor':'İşlemci','CPU':'İşlemci',
    'Memory':'RAM','RAM':'RAM','Graphics':'Ekran Kartı','GPU':'Ekran Kartı',
    'DirectX':'DirectX','Storage':'Depolama','HDD':'Depolama',
    'Sound Card':'Ses Kartı','Sound':'Ses Kartı','Network':'İnternet Bağlantısı',
    'Additional Notes':'Ek Notlar','VR Support':'VR Desteği',
};

function parseSysReq(html) {
    if (!html) return '<p style="color:var(--text3);font-size:13px">Bilgi mevcut değil.</p>';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent.replace(/^(Minimum:|Recommended:|Önerilen:)/i, '').trim();

    const re   = /([A-Z][A-Za-z\s\/]+?):\s*([^\n]+?)(?=\n[A-Z]|\n{2,}|$)/gs;
    const rows = [];
    let m;
    while ((m = re.exec(text + '\n')) !== null) {
        const k = m[1].trim(), v = m[2].trim();
        if (k && v && v.length < 400) {
            rows.push(`<tr><td>${SR_LABELS[k] || k}</td><td>${v}</td></tr>`);
        }
    }
    return rows.length
        ? `<table class="sr-table">${rows.join('')}</table>`
        : `<p style="font-size:12.5px;line-height:1.9;color:var(--text2)">${text}</p>`;
}

function renderTabSysReq(req) {
    $('sr-min').innerHTML = parseSysReq(req?.minimum);
    $('sr-rec').innerHTML = parseSysReq(req?.recommended);
}

// ─── Tab: Description ────────────────
function renderTabDesc(d) {
    const tmp = document.createElement('div');
    tmp.innerHTML = d.short_description || d.about_the_game || '';
    const plain = tmp.textContent.trim();
    $('desc-body').textContent = plain;
    setEl('tr-status', 'Türkçe çeviriliyor...');

    // Async translate
    translateTR(plain).then(tr => {
        setEl('tr-status', tr !== plain ? 'Türkçe (çevrildi)' : 'Metin (orijinal)');
        if (tr && tr !== plain) $('desc-body').textContent = tr;
    });
}

async function translateTR(text) {
    if (!text || text.length < 20) return text;
    try {
        const res  = await fetch(CFG.TR_API + encodeURIComponent(text.substring(0, 2000)));
        const data = await res.json();
        return data?.[0]?.map(s => s?.[0] || '').join('') || text;
    } catch { return text; }
}

// ─── Tab: Screenshots ────────────────
function renderTabScreenshots() {
    const grid = $('screens-grid');
    grid.innerHTML = '';

    if (!S.screenshots.length) {
        grid.innerHTML = '<p class="empty-p">Ekran görüntüsü bulunamadı.</p>';
        return;
    }

    S.screenshots.slice(0, 20).forEach((url, i) => {
        const div = document.createElement('div');
        div.className = 'ss-item';
        div.innerHTML = `<img src="${url}" alt="Ekran ${i+1}" loading="lazy">`;
        div.addEventListener('click', () => openModal(i));
        grid.appendChild(div);
    });
}

// ═══════════════════════════════════════
//  LUA MANIFEST BUILDER
// ═══════════════════════════════════════
function buildLua(appId, d) {
    let lua = '';
    
    // 1) Main game
    lua += `addappid(${appId})\n`;
    
    // 2) Main game depots (excluding DLC appids)
    const dlcIds = d.dlc || [];
    const mainDepots = findDepotKeys(appId).filter(([id]) => {
        const idNum = parseInt(id);
        return idNum !== appId && !dlcIds.includes(idNum);
    });
    
    mainDepots.forEach(([id, key]) => {
        lua += `addappid(${id},0,"${key}")\n`;
        lua += `setManifestid(${id},"${getDummyManifestId(id)}")\n`;
    });
    
    // 3) DLCs and their depots
    dlcIds.forEach(dlcId => {
        const dlcDepots = findDepotKeys(dlcId);
        if (dlcDepots.length > 0) {
            lua += `addappid(${dlcId})\n`;
            dlcDepots.forEach(([id, key]) => {
                lua += `addappid(${id},0,"${key}")\n`;
                lua += `setManifestid(${id},"${getDummyManifestId(id)}")\n`;
            });
        }
    });
    
    return lua;
}

function luaHighlight(code) {
    return code
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/(--[^\n]*)/g, '<span class="lua-comment">$1</span>')
        .replace(/\b(local|return|true|false|nil|and|or|not|function|if|then|else|end|do|while|for)\b/g, '<span class="lua-kw">$1</span>')
        .replace(/\b(NopusManifest)\b/g, '<span class="lua-fn">$1</span>')
        .replace(/\[(\d+)\]/g, '[<span class="lua-num">$1</span>]')
        .replace(/\b(\d{4,})\b/g, '<span class="lua-num">$1</span>')
        .replace(/"([^"]*)"/g, '<span class="lua-str">"$1"</span>')
        .replace(/(\w+)\s*=/g, '<span class="lua-key">$1</span> =');
}

// ═══════════════════════════════════════
//  DOWNLOAD
// ═══════════════════════════════════════
async function downloadManifest() {
    if (!S.currentData || !S.currentApp) return;

    const overlay = $('dl-overlay');
    const bar     = $('dl-bar');
    const step    = $('dl-step');
    const fname   = `NopusManifest_${S.currentApp}.lua`;

    setEl('dl-name', fname);
    overlay.classList.remove('hidden');

    const steps = [
        [20,  'Oyun verisi hazırlanıyor...'],
        [45,  'Depot key\'leri derleniyor...'],
        [65,  'DLC listesi oluşturuluyor...'],
        [82,  'Lua formatına dönüştürülüyor...'],
        [95,  'Dosya hazırlanıyor...'],
        [100, 'Tamamlandı!'],
    ];

    for (const [p, m] of steps) {
        bar.style.width = p + '%';
        step.textContent = m;
        await delay(280);
    }

    const lua  = buildLua(S.currentApp, S.currentData);
    const blob = new Blob([lua], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: fname }).click();
    URL.revokeObjectURL(url);

    await delay(350);
    overlay.classList.add('hidden');
    bar.style.width = '0%';
    showToast(`${fname} indirildi!`);
}

// ═══════════════════════════════════════
//  MODAL
// ═══════════════════════════════════════
function openModal(i) {
    S.ssIdx = i; updateModal();
    $('ss-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
function closeModal() {
    $('ss-modal').classList.add('hidden');
    document.body.style.overflow = '';
}
function navModal(d) {
    S.ssIdx = (S.ssIdx + d + S.screenshots.length) % S.screenshots.length;
    const img = $('modal-img');
    img.style.opacity = '0';
    setTimeout(() => { updateModal(); img.style.opacity = '1'; }, 100);
}
function updateModal() {
    $('modal-img').src = S.screenshots[S.ssIdx];
    setEl('modal-count', `${S.ssIdx + 1} / ${S.screenshots.length}`);
}

// ═══════════════════════════════════════
//  RECENT
// ═══════════════════════════════════════
function addRecent(item) {
    S.recent = [item, ...S.recent.filter(r => r.appid !== item.appid)].slice(0, 8);
    renderRecent();
}
function renderRecent() {
    const el = $('recent-list');
    if (!S.recent.length) { el.innerHTML = '<p class="empty-p">Henüz arama yapılmadı.</p>'; return; }
    el.innerHTML = S.recent.map(r => `
        <div class="ri" data-id="${r.appid}">
            <img class="ri-img" src="${r.img}" alt="${r.name}" loading="lazy" onerror="this.style.display='none'">
            <div>
                <div class="ri-name">${r.name}</div>
                <div class="ri-id">${r.appid}</div>
            </div>
        </div>
    `).join('');
    el.querySelectorAll('.ri').forEach(ri => {
        ri.addEventListener('click', () => {
            $('sp-input').value = ri.dataset.id;
            updateClear();
            switchPage('search');
            doSearch(ri.dataset.id);
        });
    });
}

// ═══════════════════════════════════════
//  PAGE & TAB SWITCHER
// ═══════════════════════════════════════
function switchPage(name) {
    qsa('.page').forEach(p => p.classList.remove('active'));
    qsa('.nav-btn').forEach(b => b.classList.remove('active'));
    $('page-' + name).classList.add('active');
    document.querySelector(`.nav-btn[data-page="${name}"]`).classList.add('active');
    S.activePage = name;
}

function switchTab(name) {
    qsa('.gc-tab').forEach(t => t.classList.remove('active'));
    qsa('.tc').forEach(tc => tc.classList.remove('active'));
    document.querySelector(`.gc-tab[data-tab="${name}"]`).classList.add('active');
    $('tc-' + name).classList.add('active');
    S.activeTab = name;
}

function updateClear() {
    $('sp-clear').classList.toggle('vis', $('sp-input').value.length > 0);
}

// ═══════════════════════════════════════
//  EVENTS
// ═══════════════════════════════════════
function bindEvents() {
    // Page nav
    qsa('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });

    // Search page
    $('sp-btn').addEventListener('click', () => doSearch($('sp-input').value));
    $('sp-input').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch($('sp-input').value); });
    $('sp-input').addEventListener('input', updateClear);
    $('sp-clear').addEventListener('click', () => { $('sp-input').value = ''; updateClear(); $('sp-input').focus(); });
    $('sp-retry').addEventListener('click', () => { if (S.lastQuery) doSearch(S.lastQuery); else showSearchState('welcome'); });

    // Home search
    const homeBtn = $('home-search-btn');
    const homeInput = $('home-search-input');
    if (homeBtn && homeInput) {
        homeBtn.addEventListener('click', () => {
            const q = homeInput.value.trim();
            if (!q) return;
            $('sp-input').value = q;
            updateClear();
            switchPage('search');
            doSearch(q);
        });
        homeInput.addEventListener('keydown', e => {
            if (e.key !== 'Enter') return;
            const q = homeInput.value.trim();
            if (!q) return;
            $('sp-input').value = q;
            updateClear();
            switchPage('search');
            doSearch(q);
        });
    }

    // Chips
    qsa('.chip').forEach(c => {
        c.addEventListener('click', () => {
            $('sp-input').value = c.dataset.q;
            updateClear();
            switchPage('search');
            doSearch(c.dataset.q);
        });
    });

    // Tabs
    qsa('.gc-tab').forEach(t => { t.addEventListener('click', () => switchTab(t.dataset.tab)); });

    // Sysreq toggle
    qsa('.sr-btn').forEach(b => {
        b.addEventListener('click', () => {
            qsa('.sr-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            $('sr-min').classList.toggle('hidden', b.dataset.sr !== 'min');
            $('sr-rec').classList.toggle('hidden', b.dataset.sr !== 'rec');
        });
    });

    // Download
    $('btn-dl').addEventListener('click', downloadManifest);

    // Copy all depot keys
    $('btn-copy-all-dk').addEventListener('click', async () => {
        if (!S.currentApp) return;
        const pairs = findDepotKeys(S.currentApp);
        const txt   = pairs.map(([id, key]) => `${id}: ${key}`).join('\n');
        await copyText(txt);
        showToast('Tüm depot keyler kopyalandı!');
    });

    // Copy manifest
    $('btn-copy-manifest').addEventListener('click', async () => {
        if (!S.currentData) return;
        await copyText(buildLua(S.currentApp, S.currentData));
        showToast('Manifest kopyalandı!');
    });

    // Modal
    $('modal-bg').addEventListener('click', closeModal);
    $('modal-close').addEventListener('click', closeModal);
    $('modal-prev').addEventListener('click', () => navModal(-1));
    $('modal-next').addEventListener('click', () => navModal(1));
    document.addEventListener('keydown', e => {
        if ($('ss-modal').classList.contains('hidden')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') navModal(-1);
        if (e.key === 'ArrowRight') navModal(1);
    });

    // Logo → home
    qs('.hdr-brand').addEventListener('click', () => switchPage('home'));
}

// ═══════════════════════════════════════
//  MATRIX BACKGROUND
// ═══════════════════════════════════════
function buildMatrix() {
    const isMob = window.innerWidth < 880;
    const N = isMob ? 3 : 6;
    const CDN = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps';

    const APP_IDS = [
        1174180,271590,1091500,1245620,1551360,1593500,1817070,292030,814380,1086940,
        2050650,1966720,1938090,976730,1151640,553850,1716740,413150,346110,105600,
        381210,632360,236850,1272080,945360,220,35140,990080,2322010,1817190,
        1172380,524220,374320,782330,377160,489830,582010,892970,304390,2183900,
        1659040,628670,1293830,2524940,2933080,1493760,1145360,1151340,1811260,648800,
        228060,250900,219740,322330,251570,264710,289070,391220,750920,203160,
        242760,1326470,431960,1623730,200260,208650,311210,42700,42710,10180,
        7940,252490,49520,397540,1222680,1366540,1845910,1817080,108710,330830,
        870780,1446780,1462040,1803180,921570,1304930,1113560,50650,218820,268910,
        367520,460810,261550,22100,2215430,1888930,1659420,333420,1030840,504370,
        1238840,1238810,1517290,1238860,960090,107410,221100,813780,24860,220200,
        22380,365590,570940,1985510,235540,646570,2266930,582160,812140,1364780,
        1898340,335300,379720,570900,1250410,1172620,1693980,869480,47780,200510,
        268500,236430,1940340,244210,805550,310560,690790,227300,270880,253250,
        306130,440900,281990,394360,236110,218620,640820,1184370,21690,221040,
        418370,883710,952060,1196590,1145350,2155120,2054970,601150,412020,286690,
        287390,221380,403640,206440,1057090,319630,1471010,1263850,238010,337000,
        1449850,492720,231430,1677280,250380,1158310,203770,244850,233450,230230,
        435150,4700,214950,364360,594570,1142710,534380,239140,1850570,548430,
        220440,323190,4000,255710,242550,227940,893330,1235140,1426210,1325200,
        1289310,1190460,1687950,1343400,1506830,2195250,1286830,462780,519860,678950,
        50130,582660,359550,275850,211420,424840,242640,234140,247080,258110,
        261550,268500,270880,281990,287390,289070,292030,306130,310560,311210,
        319630,322330,330830,335300,337000,346110,364360,365590,367520,374320,
        377160,381210,391220,394360,397540,403640,412020,413150,418370,431960,
        435150,440900,460810,489830,492720,504370,524220,534380,553850,570900,
        570940,582010,582160,594570,601150,628670,632360,640820,646570,648800,
        690790,750920,782330,805550,812140,813780,814380,869480,870780,883710,
        892970,921570,945360,952060,730,570,578080,1172470,1085660
    ];

    const wrap = $('bg-matrix');
    if (!wrap) return;
    wrap.innerHTML = '';

    // Karıştır
    const shuffled = [...APP_IDS].sort(() => Math.random() - 0.5);
    const perCol   = Math.ceil(shuffled.length / N);

    for (let c = 0; c < N; c++) {
        const col = document.createElement('div');
        col.className = 'mx-col';

        // Bu sütuna düşen ID'ler
        const colIds = shuffled.slice(c * perCol, (c + 1) * perCol);
        // Eksik kalan kısımları baştan tamamla
        while (colIds.length < perCol) colIds.push(shuffled[colIds.length % shuffled.length]);

        // Sonsuz scroll için 2x kopya
        [...colIds, ...colIds].forEach(appId => {
            const img       = document.createElement('img');
            img.className   = 'mx-img';
            img.alt         = '';
            img.loading     = 'lazy';
            img.decoding    = 'async';
            img.src         = `${CDN}/${appId}/library_600x900.jpg`;
            img.onerror     = function() {
                if (!this.dataset.fb) {
                    this.dataset.fb = '1';
                    this.src = `${CDN}/${appId}/header.jpg`;
                } else {
                    this.style.background = '#0d1122';
                }
            };
            img.onload = function() { this.classList.add('on'); };
            col.appendChild(img);
        });

        wrap.appendChild(col);
    }
}

// ═══════════════════════════════════════
//  STATUS CARD ICON GÜNCELLE
// ═══════════════════════════════════════
function syncStatusUI(online) {
    const icon = $('sys-icon-card');
    if (!icon) return;
    if (online) {
        icon.style.cssText = 'background:rgba(34,197,94,0.1);color:#4ade80;border-left:2px solid #22c55e';
        setEl('sum-status', 'Online');
        setEl('st-status', 'Online');
    } else {
        icon.style.cssText = 'background:rgba(229,53,53,0.1);color:#ff4d4d;border-left:2px solid #e53535';
        setEl('sum-status', 'Offline');
        setEl('st-status', 'Offline');
    }
}

// ═══════════════════════════════════════
//  INIT
// ═══════════════════════════════════════
async function init() {
    // Matrix arka planını hemen kur (splash arkasında yüklensin)
    buildMatrix();

    // Status + splash paralel
    const statusPromise = checkStatus();
    await runSplash();
    await statusPromise;

    // Status icon senkronize et
    syncStatusUI(S.isOnline);

    // Offline ise dur
    if (!S.isOnline) return;

    // Depot key'leri yükle
    await loadDepotKeys();

    // Event listener'ları bağla
    bindEvents();

    // Her 60 saniyede status kontrol
    setInterval(async () => {
        await checkStatus();
        syncStatusUI(S.isOnline);
    }, CFG.STATUS_INTERVAL);
}

document.addEventListener('DOMContentLoaded', init);
