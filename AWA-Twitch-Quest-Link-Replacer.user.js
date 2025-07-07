// ==UserScript==
// @name        AWA Twitch Quest Link Replacer
// @description Replaces the Twitch Quest Links with a redirect to the popout so the Twitch Stream is not loaded.
// @author      Lone Destroyer
// @license     MIT
// @match       https://*.alienwarearena.com/control-center
// @match       https://*.twitch.tv/popout/*/extensions/ehc5ey5g9hoehi8ys54lr6eknomqgr/*
// @icon        https://github.com/LoneDestroyer/AWA-Twitch-Quest-Link-Replacer/blob/main/AWALogo.png?raw=true
// @version     3.4.0
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// @connect     alienwarearena.com
// @namespace   https://github.com/LoneDestroyer
// @downloadURL https://raw.githubusercontent.com/LoneDestroyer/AWA-Twitch-Quest-Link-Replacer/main/AWA-Twitch-Quest-Link-Replacer.user.js
// @updateURL   https://raw.githubusercontent.com/LoneDestroyer/AWA-Twitch-Quest-Link-Replacer/main/AWA-Twitch-Quest-Link-Replacer.user.js
// ==/UserScript==
// Thanks to floriegl for version 1.0

(function() {
    let css = `
    .user-profile__profile-card:has( > .user-profile__card-header #control-center__twitch-max-reached) .quest-list__play {
        display: none;
    }
    .user-profile__profile-card:has( > .user-profile__card-header #control-center__twitch-max-reached) .converted > .quest-list__play {
        display: inline-block;
    }`;
        if (typeof GM_addStyle !== "undefined") {
            GM_addStyle(css);
        }
        else {
            let styleNode = document.createElement("style");
            styleNode.appendChild(document.createTextNode(css));
            (document.querySelector("head") || document.documentElement).appendChild(styleNode);
        }
        let x = 0;
        const intervalID = setInterval(function () {
            const foundLinks = document.querySelectorAll(".user-profile__profile-card:has( > .user-profile__card-header #control-center__twitch-max-reached) a:has( > .quest-list__play)");
            if (foundLinks.length) {
                window.clearInterval(intervalID);
                for (const foundLink of foundLinks) {
                    const convertedLink = (foundLink.href.match(/(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([^\/?]+)/) || [])[1];
                    if (convertedLink != null) {
                        foundLink.href = "https://www.twitch.tv/popout/" + convertedLink + "/extensions/ehc5ey5g9hoehi8ys54lr6eknomqgr/component";
                        foundLink.classList.add("converted");
                    }
                }
            }
        if (++x === 20) {
            window.clearInterval(intervalID);
        }
        }, 500);

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
                redirectToExtensionPage(channelName, "panel");
            }
        }

        // Streamer Automation
        let onlineStreamers = [];
        let doubleARPStreamers = [];
        const CHECK_INTERVAL = 10 * 60 * 1000; // 10 mins

        // Get AWA online streamers
        function getOnlineStreamers(callback) {
            onlineStreamers = []; // Reset the list of online streamers
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://www.alienwarearena.com/twitch/live',
                onload: function(response) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');
                    const streamerNameDivs = doc.querySelectorAll('div.media-body h5.mt-0.mb-1');
                    streamerNameDivs.forEach(h5 => {
                        if (h5 && h5.textContent) {
                            onlineStreamers.push(h5.textContent.toLowerCase());
                        }
                    });
                    //console.log(`[AWA-Twitch-Quest-Link-Replacer] List of online streamers:`, onlineStreamers); // Uncomment for debugging
                    if (typeof callback === 'function') callback(onlineStreamers);
                },
                onerror: function() {
                    console.log('%c%s', 'color:#ff0000', '[AWA-Twitch-Quest-Link-Replacer] Failed to fetch online streamers.');
                    if (typeof callback === 'function') callback([]);
                }
            });
        }

        // Get list of 2x ARP streamers
        function getDoubleARPStreamers(callback) {
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://www.alienwarearena.com/page/hive-influencers',
                onload: function(response) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');
                    const streamerLinks = doc.querySelectorAll(
                        'div.card-footer ul.list-unstyled.list-inline.text-center.mx-auto.mb-0 li.list-inline-item a.text-white'
                    );
                    let doubleARPNames = [];
                    streamerLinks.forEach(link => {
                        const href = link.getAttribute('href');
                        const match = href && href.match(/twitch\.tv\/([^\/\?]+)/i); // Extract the Twitch username from the URL
                        if (match && match[1]) {
                            doubleARPNames.push(match[1]);
                        }
                    });
                    // Add manual entries and deduplicate/lowercase
                    const manualDoubleARP = ["3llebelle",]; // Names not shown on the AWA page but still eligible for 2x ARP
                    const allDoubleARP = Array.from(new Set([...doubleARPNames, ...manualDoubleARP].map(n => n.toLowerCase())));
                    //console.log('[AWA-Twitch-Quest-Link-Replacer] 2x ARP streamers:', allDoubleARP); // Uncomment for debugging
                    if (typeof callback === 'function') callback(allDoubleARP);
                },
                onerror: function() {
                    console.log('%c%s', 'color:#ff0000', '[AWA-Twitch-Quest-Link-Replacer] Failed to fetch double ARP streamers.');
                    if (typeof callback === 'function') callback([]);
                }
            });
        }

        // Helper to pick a random element from an array
        const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];

        // Check if current streamer is online
        function checkIfOnline(){
            const isStreamerOnline = onlineStreamers.includes(channelName);
            const isDoubleARP = doubleARPStreamers.includes(channelName);
            const availableDoubleARP = onlineStreamers.filter(name => doubleARPStreamers.includes(name));
            //console.log(`[AWA-Twitch-Quest-Link-Replacer] Current streamer: ${channelName}`); // Uncomment for debugging
            if (isStreamerOnline && isDoubleARP) {
                // Check if the current streamer is online and a 2x ARP streamer
                console.log('%c%s', 'color:#00FF00', `[AWA-Twitch-Quest-Link-Replacer] Current streamer is online and is a 2x ARP streamer.`);
            } else if (availableDoubleARP.length > 0) { // 2x ARP streamer online & current streamer is offline
                const onlineDoubleARP = pickRandom(availableDoubleARP);
                console.log(`[AWA-Twitch-Quest-Link-Replacer] Switching to 2x ARP streamer: ${onlineDoubleARP}`);
                redirectToExtensionPage(onlineDoubleARP, "component");
            } else if (isStreamerOnline) { // Current streamer is online but not a 2x ARP streamer
                console.log('%c%s', 'color:#FFD700', `[AWA-Twitch-Quest-Link-Replacer] Current streamer is online. No 2x ARP streamers available.`);
            } else if (onlineStreamers.length > 0) { // Streamer offline & No 2x ARP streamer online, randomly swap to online streamer
                console.log('%c%s', 'color:#ff0000',`[AWA-Twitch-Quest-Link-Replacer] Current streamer is offline. Switching to an online streamer...`);
                const onlineStreamer = pickRandom(onlineStreamers);
                redirectToExtensionPage(onlineStreamer, "component");
            } else {
                // No online streamers found
                console.log('%c%s', 'color:#ff0000', `[AWA-Twitch-Quest-Link-Replacer] No online streamers found at https://www.alienwarearena.com/twitch/live. Try checking the AWA Control Center.`);
            }
        };

        /* Redirects to the Twitch extension component or panel page for a given streamer
         * @param {string} streamerName - Twitch channel name
         * @param {"component"|"panel"} type - Type of extension page to redirect to */
        function redirectToExtensionPage(streamerName, type = "component"){
            if (!streamerName) {
                console.error("[AWA-Twitch-Quest-Link-Replacer] Tried to redirect with invalid streamer name:", streamerName);
                return;
            }
            window.location.href = `https://www.twitch.tv/popout/${streamerName}/extensions/ehc5ey5g9hoehi8ys54lr6eknomqgr/${type}`;
        };
        // Wait for page to load > Check if current streamer is online > Redirect to the panel if needed
        window.addEventListener('load', () => {
            getDoubleARPStreamers(names => {doubleARPStreamers = names;
                getOnlineStreamers(() => {checkIfOnline();
                    // Check if we're on the correct panel page if the streamer is online (or if the onlineStreamers list is empty)
                    if ((onlineStreamers.includes(channelName) || onlineStreamers.length === 0) && isComponentPage) {
                        setTimeout(() => {
                            checkAndRedirectPanel();
                        }, 4000); // Wait 4 seconds before running
                    }
                });
            });
            // Start periodic online streamer checks (does not re-fetch doubleARPStreamers)
            setInterval(() => getOnlineStreamers(checkIfOnline), CHECK_INTERVAL);
        });
    }
})();