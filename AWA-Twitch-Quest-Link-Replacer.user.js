// ==UserScript==
// @name        AWA Twitch Quest Link Replacer
// @description Replaces the Twitch Quest Links with a redirect to the popout so the Twitch Stream is not loaded.
// @author      Lone Destroyer
// @license     CC0
// @match       https://*.alienwarearena.com/control-center
// @match       https://*.twitch.tv/popout/*/extensions/ehc5ey5g9hoehi8ys54lr6eknomqgr/component
// @icon        https://github.com/LoneDestroyer/AWA-Twitch-Quest-Link-Replacer/blob/main/AWALogo.png?raw=true
// @version     3.2
// @grant       GM_addStyle
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
        // Check if on the component page and the title of the tab is Twitch
        if (currentURL.endsWith("component") && title !== "Arena Rewards Tracker - Twitch") {
                    // Extract the channel ID from the URL
                    const channelName = currentURL.split('/popout/')[1].split('/')[0];
                    // Construct the panel URL
                    const panelURL = `https://www.twitch.tv/popout/${channelName}/extensions/ehc5ey5g9hoehi8ys54lr6eknomqgr/panel`;
                    // Redirect to the panel URL
                    window.location.href = panelURL;
        }
    }, 1000);
})();
