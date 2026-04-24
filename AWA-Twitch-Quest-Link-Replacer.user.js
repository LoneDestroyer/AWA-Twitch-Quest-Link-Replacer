// ==UserScript==
// @name        AWA Twitch Quest Link Replacer
// @description Replaces the Twitch Quest Links with a redirect to the popout so the Twitch Stream is not loaded.
// @author      Lone Destroyer
// @license     MIT
// @match       https://*.alienwarearena.com/control-center
// @match       https://*.twitch.tv/popout/*/extensions/ehc5ey5g9hoehi8ys54lr6eknomqgr/*
// @icon        https://github.com/LoneDestroyer/AWA-Twitch-Quest-Link-Replacer/blob/main/AWALogo.png?raw=true
// @version     3.6.1
// @grant       GM_xmlhttpRequest
// @connect     alienwarearena.com
// @namespace   https://github.com/LoneDestroyer
// @downloadURL https://raw.githubusercontent.com/LoneDestroyer/AWA-Twitch-Quest-Link-Replacer/main/AWA-Twitch-Quest-Link-Replacer.user.js
// @updateURL   https://raw.githubusercontent.com/LoneDestroyer/AWA-Twitch-Quest-Link-Replacer/main/AWA-Twitch-Quest-Link-Replacer.user.js
// ==/UserScript==

(function() {
    // Replaces Twitch stream links on the Control Center with a popout redirect
    // Prevents loading the Twitch stream in the background
    function replaceTwitchQuestLinks() {
        document.querySelectorAll("a[href*='twitch.tv']:has(.quest-list__play):not([data-awa-converted])").forEach(link => {
            const channel = (link.href.match(/twitch\.tv\/([^\/?#]+)/) || [])[1];
            if (channel) {
                link.href = `https://www.twitch.tv/popout/${channel}/extensions/ehc5ey5g9hoehi8ys54lr6eknomqgr/component`;
                link.dataset.awaConverted = "1";
            }
        });
    }

    replaceTwitchQuestLinks();
    const observer = new MutationObserver(mutations => {
        if (mutations.some(m => m.addedNodes.length > 0)) replaceTwitchQuestLinks();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Only run streamer automation on Twitch extension popout pages
    if (window.location.hostname.endsWith("twitch.tv") && window.location.pathname.includes("/popout/")) {
        const currentURL = window.location.href;
        const channelName = currentURL.split('/popout/')[1].split('/')[0].toLowerCase();
        const isComponentPage = currentURL.endsWith("component");
        
        function checkAndRedirectPanel() {
            const title = document.title;
            const hasPanel = document.querySelector('.extension-panel');
            // Only redirect if on the component page, the title is not correct, and the ext panel is not present
            if (title !== "Arena Rewards Tracker - Twitch" && !hasPanel) {
                console.log(`[AWA-Twitch-Quest-Link-Replacer] Redirecting to panel for ${channelName} (title: "${title}", panel found: ${Boolean(hasPanel)})`);
                redirectToExtensionPage(channelName, "panel");
            }
        }

        // Streamer Automation
        const CHECK_INTERVAL = 10 * 60 * 1000; // 10 mins
        const TIERS = [
            ['featured', 'Featured', /Featured/i],
            ['hive', 'Hive', /Hive/i],
            ['nexus', 'Nexus', /Nexus/i],
            ['partners', 'Partners', /Partners/i]
        ];
        const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];

        // Get live quest streamers from the AWA quests page, grouped by tier (Featured > Hive > Nexus > Partners)
        function getQuestStreamers(callback) {
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://www.alienwarearena.com/quests',
                onload: function(response) {
                    const tempDiv = document.createElement('div');
                    const tierSets = { featured: new Set(), hive: new Set(), nexus: new Set(), partners: new Set() };
                    tempDiv.innerHTML = response.responseText;

                    tempDiv.querySelectorAll('.user-profile__profile-card').forEach(section => {
                        const cardHeader = section.querySelector('.user-profile__card-header h3');
                        if (!cardHeader?.textContent.includes('Watch Twitch')) return;

                        section.querySelectorAll('.card-table-heading').forEach(heading => {
                            const tier = TIERS.find(([, , match]) => match.test(heading.textContent || ''))?.[0];
                            if (!tier) return;

                            // Each heading is followed by its stream rows.
                            let row = heading.parentElement?.nextElementSibling;
                            while (row?.classList.contains('card-table-row')) {
                                const channel = row.querySelector('.quest-list__stream-live')?.textContent.includes('LIVE')
                                    ? (row.querySelector('a[href*="twitch.tv/"]')?.getAttribute('href').match(/twitch\.tv\/([^\/\?]+)/i) || [])[1]?.toLowerCase()
                                    : '';
                                if (channel) tierSets[tier].add(channel);
                                row = row.nextElementSibling;
                            }
                        });
                    });

                    const questStreamers = Object.fromEntries(
                        Object.entries(tierSets).map(([key, value]) => [key, [...value]])
                    );
                    //console.log('[AWA-Twitch-Quest-Link-Replacer] Twitch Quest streamers:', questStreamers); // Uncomment for debugging
                    callback(questStreamers);
                },
                onerror: function() {
                    console.log('%c%s', 'color:#ff0000', '[AWA-Twitch-Quest-Link-Replacer] Failed to fetch quest streamers.');
                    callback({ featured: [], hive: [], nexus: [], partners: [] });
                }
            });
        }

        // Redirect to the highest tier available (Featured > Hive > Nexus > Partners)
        function checkAndRedirect(questStreamers) {
            const bestTier = TIERS.find(([key]) => questStreamers[key].length > 0);
            if (!bestTier) {
                console.log('%c%s', 'color:#ff0000', '[AWA-Twitch-Quest-Link-Replacer] No Twitch quest streamers found. Try checking the AWA Control Center.');
                return;
            }

            const [tierKey, tierLabel] = bestTier;
            // Stay on the current channel if it is already in the best available tier.
            if (questStreamers[tierKey].includes(channelName)) {
                console.log('%c%s', 'color:#00FF00', `[AWA-Twitch-Quest-Link-Replacer] Current streamer is already at best available tier (${tierLabel}).`);
            } else {
                const target = pickRandom(questStreamers[tierKey]);
                console.log(`[AWA-Twitch-Quest-Link-Replacer] Switching to ${tierLabel} streamer: ${target}`);
                redirectToExtensionPage(target, "component");
            }
        }

        function refreshQuestRouting() {
            getQuestStreamers(questStreamers => {
                checkAndRedirect(questStreamers);
                if (isComponentPage) setTimeout(checkAndRedirectPanel, 4000);
            });
        }

        /* Redirects to the Twitch extension component or panel page for a given streamer
         * @param {string} streamerName - Twitch channel name
         * @param {"component"|"panel"} type - Type of extension page to redirect to */
        function redirectToExtensionPage(streamerName, type = "component") {
            if (!streamerName) {
                console.error("[AWA-Twitch-Quest-Link-Replacer] Tried to redirect with invalid streamer name:", streamerName);
                return;
            }
            window.location.href = `https://www.twitch.tv/popout/${streamerName}/extensions/ehc5ey5g9hoehi8ys54lr6eknomqgr/${type}`;
        }

        // Wait for page to load > Fetch quest streamers > Redirect based on tier priority
        window.addEventListener('load', () => {
            refreshQuestRouting();
            setInterval(refreshQuestRouting, CHECK_INTERVAL);
        });
    }
})();