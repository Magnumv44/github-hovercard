'use strict';

let contentJS = [
    'jquery.js',
    'mustache.js',
    'tooltipster.js',
    'tripleclick.js',
    'hovercard.js'
];

let contentCSS = [
    'tooltipster.css',
    'hovercard.css',
    'tomorrow-night.css'
];

let storage = chrome.storage.sync || chrome.storage.local;

function injectJS(tabId, files, callback) {
    let filesList = Array.isArray(files) ? files : [files];
    let injected = 0;

    function injectNextFile() {
        if (injected < filesList.length) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: [filesList[injected]]
            }, () => {
                console.log('"' + filesList[injected] + '" is injected.');
                injected++;
                injectNextFile();
            });
        } else {
            if (typeof callback === 'function') {
                callback();
            }
        }
    }
    injectNextFile();
}

function injectCSS(tabId, files, callback) {
    let filesList = Array.isArray(files) ? files : [files];
    let injected = 0;

    function injectNextFile() {
        if (injected < filesList.length) {
            chrome.scripting.insertCSS({
                target: { tabId: tabId },
                files: [filesList[injected]]
            }, () => {
                console.log('"' + filesList[injected] + '" is injected.');
                injected++;
                injectNextFile();
            });
        } else {
            if (typeof callback === 'function') {
                callback();
            }
        }
    }
    injectNextFile();
}

const GITHUB_DOMAIN = 'github.com';

function injector(details) {
    let tab = details.tabId;
    injectJS(tab, contentJS, () => {
        injectCSS(tab, contentCSS);
    });
}

function bindInjector(domains = []) {
    // always enable hovercard on GitHub
    if (domains.indexOf(GITHUB_DOMAIN) === -1) {
        domains.push(GITHUB_DOMAIN);
    }
    let filters = domains.map((domain) => { return { hostEquals: domain }; });
    if (chrome.webNavigation.onCommitted.hasListener(injector)) {
        chrome.webNavigation.onCommitted.removeListener(injector);
    }
    // rebind injector with different domains
    chrome.webNavigation.onCommitted.addListener(injector, { url: filters });
}

function init() {
    storage.get({
        domains: []
    }, (items = {}) => bindInjector(items.domains));
}

chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message.event === 'optionschange') {
        init();
        respond({ success: true });
    }
});

init();

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request) {
        if (request.message) {
            if (request.message === 'version') {
                sendResponse({ version: chrome.runtime.getManifest().version });
            }
        }
    }
});
