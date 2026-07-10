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

let storage = browser.storage.sync || browser.storage.local;

function injectJS(tabId, files, callback) {
    let filesList = Array.isArray(files) ? files : [files];
    let injected = 0;

    function injectNextFile() {
        if (injected < filesList.length) {
            browser.scripting.executeScript({
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
            browser.scripting.insertCSS({
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
    if (browser.webNavigation.onCommitted.hasListener(injector)) {
        browser.webNavigation.onCommitted.removeListener(injector);
    }
    // rebind injector with different domains
    browser.webNavigation.onCommitted.addListener(injector, { url: filters });
}

function init() {
    storage.get({
        domains: []
    }, (items = {}) => bindInjector(items.domains));
}

browser.runtime.onInstalled.addListener(init);
browser.runtime.onMessage.addListener((message, sender, respond) => {
    if (message.event === 'optionschange') {
        init();
        respond({ success: true });
    }
});

init();

browser.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request) {
        if (request.message) {
            if (request.message === 'version') {
                sendResponse({ version: browser.runtime.getManifest().version });
            }
        }
    }
});
