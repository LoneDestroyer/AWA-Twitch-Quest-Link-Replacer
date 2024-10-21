// ==UserScript==
// @name        Replace Alienware Arena Control Center Twitch links
// @description Replaces the Twitch quest links to the Twitch Alienware extension link in the Alienware Arena Control Center Twitch to not require the Twitch stream to be loaded
// @author      floriegl
// @license     CC0
// @match       https://*.alienwarearena.com/control-center
// @icon        https://media.alienwarearena.com/images/favicons/favicon.ico
// @version     1.0
// @grant       GM_addStyle
// @run-at      document-start
// @namespace https://greasyfork.org/users/703184
// @downloadURL https://update.greasyfork.org/scripts/493363/Replace%20Alienware%20Arena%20Control%20Center%20Twitch%20links.user.js
// @updateURL https://update.greasyfork.org/scripts/493363/Replace%20Alienware%20Arena%20Control%20Center%20Twitch%20links.meta.js
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
                foundLink.href = "https://www.twitch.tv/popout/" + convertedLink + "/extensions/ehc5ey5g9hoehi8ys54lr6eknomqgr/panel";
                foundLink.classList.add("converted");
            }
        }
    }
   if (++x === 20) {
       window.clearInterval(intervalID);
   }
}, 500);
})();
