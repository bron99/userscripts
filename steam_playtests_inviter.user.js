// ==UserScript==
// @name        Steam Playtests Inviter
// @version     0.0.1
// @description Automatically try to invite your desired friend to all the playtests you have invites for
// @author      bron99
// @match       https://store.steampowered.com/account/gatedaccess
// @updateURL    https://raw.githubusercontent.com/bron99/userscripts/master/steam_playtests_inviter.user.js
// @downloadURL  https://raw.githubusercontent.com/bron99/userscripts/master/steam_playtests_inviter.user.js
// ==/UserScript==

'use strict';

let accessToken = null;
let playtestsArr = null;
let appIds = null;
let responses = [];

const getAccessToken = async () => {
    const url = 'https://store.steampowered.com/pointssummary/ajaxgetasyncconfig';

    try {
        const res = await fetch(url);

        if (res.status === 200) {
            const json = await res.json();
            return json.data.webapi_token;
        } else {
            alert('Failed to acquire access token');
            return null;
        }
    } catch (e) {
        console.log(e);
        return null;
    }
}

const getAllPlaytests = async () => {
    const url = `https://api.steampowered.com/IPlaytestService/GetUserStatus/v1/?access_token=${accessToken}`

    try {
        const res = await fetch(url, { method: 'POST' });

        if (res.status === 200) {
            const json = await res.json();
            return json.response.results;
        } else {
            alert('Failed to acquire playtests data');
            return null;
        }
    } catch (e) {
        console.log(e);
        return null;
    }
}

const inviteFriend = async (steamId, appId) => {
    const url = `https://api.steampowered.com/IPlaytestService/RequestInvite/v1/?access_token=${accessToken}&steamid=${steamId}&appid=${appId}`

    try {
        const res = await fetch(url, { method: 'POST' });

        if (res.status === 200) {
            const json = await res.json();
            return json;
        } else {
            console.log(res);
            return null;
        }
    } catch (e) {
        console.log(e);
        return null;
    }
}

const inject = () => {
    const template = document.createElement('template');
    template.innerHTML = `
        <div class='cROJXR4HCJQ- d9waEHrLEw4-'>Invite friends to playtests automatically</div>
        <div class='XNu--K6Bi-g- _7NetbyWHKE8-'>
            <div style="display: flex; gap: 5px;">
                <input placeholder="Insert friend's steamID64" class="steamid-input _9TAHsqA3-5Y- Focusable" type="text">
                <button class="playtest-submit TlSV2TKKPrw- Focusable" type="button" role="button" style="padding: 0px;"><span style="line-height: 41px; height: 42px; border-radius: 3px;">Invite Friend</span></button>
            </div>
            <div style="display: flex; gap: 5px;">
                <div class='s2NSXgyN9Lc-'>Total playtests: </div><div class='total s2NSXgyN9Lc-'></div>
            </div>
            <div style="display: flex; gap: 5px;">
                <div class='s2NSXgyN9Lc-'>Total playtests with invites left: </div><div class='total-inv s2NSXgyN9Lc-'></div>
            </div>
            <div style="display: flex; gap: 5px;">
                <div class='s2NSXgyN9Lc-'>Total invited successfully: </div><div class='total-res s2NSXgyN9Lc-'></div>
            </div>
        </div>
    `;
    const inviteBox = document.importNode(template.content, true);
    const submitButton = inviteBox.querySelector('.playtest-submit');
    const total = inviteBox.querySelector('.total');
    const totalInv = inviteBox.querySelector('.total-inv');
    const totalRes = inviteBox.querySelector('.total-res');
    const steamIdInput = inviteBox.querySelector('.steamid-input');

    submitButton.addEventListener('click', async () => {
        responses = [];
        const steamId = steamIdInput.value;
        accessToken = accessToken ?? await getAccessToken();
        playtestsArr = playtestsArr ?? await getAllPlaytests();

        total.innerHTML = playtestsArr.length;
        appIds = playtestsArr.filter(e => e.invites_remaining > 0).map(e => e.appid);
        totalInv.innerHTML = appIds.length;

        // to be changed if they ever rate limit it
        const results = await Promise.allSettled(appIds.map(appId => inviteFriend(steamId, appId)));
        responses = results.map(r => r.status === 'fulfilled' ? r.value : null);
        totalRes.innerHTML = responses.filter(e => e.response.status === 1).length;
    });

    const target = document.querySelector('.DAfWqmTfNwk-');
    target.insertBefore(inviteBox, target.firstChild);
};

// Delay long enough for SPA re-render
setTimeout(inject, 1500);