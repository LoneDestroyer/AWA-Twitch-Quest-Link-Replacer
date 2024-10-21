// ==UserScript==
// @name        AWA Twitch Quest Link Replacer
// @description Replaces the Twitch Quest Links with a redirect to the popout so the Twitch Stream is not loaded. 
// @author      Lone Destroyer
// @license     CC0
// @match       https://*.alienwarearena.com/control-center
// @icon        https://media.alienwarearena.com/images/favicons/favicon.ico
// @version     2.0
// @grant       GM_addStyle
// @run-at      document-start
// @namespace https://github.com/LoneDestroyer
// @downloadURL https://raw.githubusercontent.com/LoneDestroyer/AWA-Twitch-Quest-Link-Replacer/main/AWA-Twitch-Quest-Link-Replacer.user.js
// @updateURL https://raw.githubusercontent.com/LoneDestroyer/AWA-Twitch-Quest-Link-Replacer/main/AWA-Twitch-Quest-Link-Replacer.user.js
//Thanks to floriegl for version 1.0
// ==/UserScript==

(function() {
let css = `
.user-profile__profile-card:has( > .user-profile__card-header #control-center__twitch-max-reached) .quest-list__play {
    display: none;
}
.user-profile__profile-card:has( > .user-profile__card-header #control-center__twitch-max-reached) .converted > .quest-list__play {
    display: inline-block;
}
`;
if (typeof GM_addStyle !== "undefined") {
    GM_addStyle(css);
} else {
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
})();
