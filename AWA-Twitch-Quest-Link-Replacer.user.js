// ==UserScript==
// @name        AWA Twitch Quest Link Replacer
// @description Replaces the Twitch Quest Links with a redirect to the popout so the Twitch Stream is not loaded.
// @author      Lone Destroyer
// @license     CC0
// @match       https://*.alienwarearena.com/control-center
// @match       https://*.twitch.tv/popout/*/extensions/ehc5ey5g9hoehi8ys54lr6eknomqgr/component
// @icon        https://media.alienwarearena.com/images/favicons/favicon.ico
// @version     3.0
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

    const currentURL = window.location.href;
    const title = document.title;
    // Check if on the component page and the title of the tab is Twitch
    if (currentURL.endsWith("component") && title == "Twitch") {
        // Detect if a specific div is present, will retry maxAttempts times then redirect to the panel
        const targetDivSelector = "#root > div > div.Layout-sc-1xcs6mc-0.gyHpt > div > div > div"; // Checks for the new extension component div
        let attempts = 0;
        const maxAttempts = 5; // Retry 5 times (2.5s)
        const checkInterval = 500; // Check every 500ms (0.5s)

        const checkDivInterval = setInterval(function() {
            const targetDiv = document.querySelector(targetDivSelector);
            if (targetDiv) {
                // If Div is present, do nothing
                clearInterval(checkDivInterval); // Stop checking
            } else if (++attempts >= maxAttempts) {
                // If Div is not present after max attempts, redirect to the panel
                clearInterval(checkDivInterval);
                // Extract the channel ID from the URL
                const channelName = currentURL.split('/popout/')[1].split('/')[0];
                // Construct the panel URL
                const panelURL = `https://www.twitch.tv/popout/${channelName}/extensions/ehc5ey5g9hoehi8ys54lr6eknomqgr/panel`;
                // Redirect to the panel URL
                window.location.href = panelURL;
            }
        }, checkInterval);
    }
})();