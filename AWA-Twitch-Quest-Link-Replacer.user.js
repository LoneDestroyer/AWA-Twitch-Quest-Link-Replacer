// ==UserScript==
// @name        AWA Twitch Quest Link Replacer
// @description Replaces the Twitch Quest Links with a redirect to the popout so the Twitch Stream is not loaded.
// @author      Lone Destroyer
// @license     MIT
// @match       https://*.alienwarearena.com/control-center
// @match       https://*.twitch.tv/popout/*/extensions/ehc5ey5g9hoehi8ys54lr6eknomqgr/*
// @icon        https://github.com/LoneDestroyer/AWA-Twitch-Quest-Link-Replacer/blob/main/AWALogo.png?raw=true
// @version     3.3.1
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// @namespace https://github.com/LoneDestroyer
// @downloadURL https://raw.githubusercontent.com/LoneDestroyer/AWA-Twitch-Quest-Link-Replacer/main/AWA-Twitch-Quest-Link-Replacer.user.js
// @updateURL https://raw.githubusercontent.com/LoneDestroyer/AWA-Twitch-Quest-Link-Replacer/main/AWA-Twitch-Quest-Link-Replacer.user.js
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

    setInterval(function() {
        const currentURL = window.location.href;
        const title = document.title;
        const isComponentPage = currentURL.endsWith("component");
        const hasPanel = document.querySelector('.extension-panel');

        // Only redirect if on the component page, the title is not correct, and the ext panel is not present
        if (isComponentPage && title !== "Arena Rewards Tracker - Twitch" && !hasPanel) {
            // Extract the channel ID from the URL
            const channelName = currentURL.split('/popout/')[1].split('/')[0];
            // Construct the panel URL
            const panelURL = `https://www.twitch.tv/popout/${channelName}/extensions/ehc5ey5g9hoehi8ys54lr6eknomqgr/panel`;
            // Redirect to the panel URL
            window.location.href = panelURL;
        }
    }, 4000);

    //ADD AUTOMATION
    // CONSTANTS
    let onlineStreamers = [];
    const currentURL = window.location.href;
    const CHECK_INTERVAL = 10 * 60 * 1000; // 10 mins
    //TODO: Switch to a x2 ARP Stream by default

    // Get all online streamers
    function GetOnlineStreamers() {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://www.alienwarearena.com/twitch/live',
            onload: function(response) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');
                const mediaDivs = doc.querySelectorAll('div.media');
                mediaDivs.forEach(div => {
                    const img = div.querySelector('h5');
                    onlineStreamers.push(img.innerHTML);
                });
                console.log(`[AWA-Twitch-Quest-Link-Replacer LOG] List of online streamers`);
                console.log(onlineStreamers);
                checkIfOnline();
            }
        });
    }

    // Check if current streamer is online
    function checkIfOnline() {
        const channelName = currentURL.split('/popout/')[1].split('/')[0];
        console.log(`[Automation LOG] Current channel name: ${channelName}`);
        if (onlineStreamers.includes(channelName)) {
            console.log('%c%s', 'color:#00FF00',`[AWA-Twitch-Quest-Link-Replacer LOG] Current streamer is online.`);
        } else {
            console.log('%c%s', 'color:#ff0000',`[AWA-Twitch-Quest-Link-Replacer LOG] Streamer is offline. Switching to an online streamer...`);
            const onlineStreamer = onlineStreamers[Math.floor(Math.random() * onlineStreamers.length)];
            console.log(`[Automation LOG] Switching to ${onlineStreamer}`);

            window.location.href = `https://www.twitch.tv/popout/${onlineStreamer}/extensions/ehc5ey5g9hoehi8ys54lr6eknomqgr/component`;
        }
        onlineStreamers.length = 0;
    }

    setInterval(GetOnlineStreamers, CHECK_INTERVAL);
})();
