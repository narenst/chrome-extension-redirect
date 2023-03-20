'use strict';

// console.log("Starting popup.js");

async function loadDistractionList() {
    const storage_response = await chrome.storage.local.get(['blocked_urls']);
    const urls = storage_response.blocked_urls;

    const pageList = document.getElementById('distracting-sites');
    pageList.innerHTML = '';

    if (urls.length == 0) {
        const default_message = document.createElement('td');
        default_message.innerText = "When you visit a distracting website, click the button below."
        pageList.appendChild(default_message);
    }

    urls.forEach((url, index) => {
        const pageItem = document.createElement('tr');

        const item_url = document.createElement('td');
        item_url.innerHTML = `${url}`;
        pageItem.appendChild(item_url);

        const link_td = document.createElement('td');
        const remove_link = document.createElement('a');
        remove_link.innerHTML = '[Remove]';
        remove_link.href = '';
        remove_link.onclick = (event) => {
            removeSiteFromDistractions(index)
        };
        link_td.appendChild(remove_link);

        pageItem.appendChild(link_td);

        pageList.appendChild(pageItem);
    });
}

async function loadFocusSite() {
    const focus_url_response = await chrome.storage.local.get(['focus_url']);
    const focus_url = focus_url_response.focus_url;

    const div_ref = document.getElementById('current-focus-site');
    div_ref.innerHTML = '';
    
    if (focus_url) {
        const a_ref = document.createElement('a');
        a_ref.href = focus_url;

        //Url can get very long
        const URL_MAX_LENGTH = 75;        
        a_ref.innerHTML = focus_url.length > URL_MAX_LENGTH ? 
                        focus_url.substring(0, 60) + '...' :
                        focus_url;
        div_ref.appendChild(a_ref);
    } else {
        // a_ref.innerText = "To pick a webpage or url to focus on, visit the page and click the button below."        
        const default_message = document.createElement('td');
        default_message.innerText = "To pick a webpage to focus on, visit the page and click the button below."
        div_ref.appendChild(default_message);
    }
}

async function loadStatus() {
    const status_response = await chrome.storage.local.get(['focus_mode']);
    const focus_mode = status_response.focus_mode;
    // console.log(`Focus mode: ${focus_mode}`);

    const status_bar = document.getElementById('status_bar');
    const messageElem = document.getElementById('pause-message')

    switch (focus_mode) {
        case "ON":
            status_bar.style = "background-color:green; height:10px; width:100%;";
            break;
        case "OFF":
            status_bar.style = "background-color:red; height:10px; width:100%;";
            if (!messageElem.innerText) {
                messageElem.innerText = `Focus mode is currently paused for a break. You can visit distracting sites during this time.`
            }
            break;
        default:
            status_bar.style = "background-color:yellow; height:10px; width:100%;";
    }
}

async function getCurrentTabUrl() {
    let queryOptions = { active: true, currentWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    if (tab) {
        return tab.url;
    }
}

async function removeSiteFromDistractions(index) {
    const storage_response = await chrome.storage.local.get(['blocked_urls']);
    const urls = storage_response.blocked_urls;

    urls.splice(index, 1); //Remove item at index
    await chrome.storage.local.set({blocked_urls: urls});

    loadDistractionList();    
}

async function addSiteToDistractions() {
    const storage_response = await chrome.storage.local.get(['blocked_urls']);
    const urls = storage_response.blocked_urls;

    const current_tab_url = await getCurrentTabUrl();
    if (current_tab_url) {
        const current_tab_domain = new URL(current_tab_url).hostname;
        urls.push(current_tab_domain);

        await chrome.storage.local.set({blocked_urls: urls});
    }

    loadDistractionList();
    await chrome.tabs.reload()
}


async function setSiteAsFocus() {
    const current_tab_url = await getCurrentTabUrl();

    if (current_tab_url && current_tab_url != 'chrome://newtab/') {
        await chrome.storage.local.set({focus_url: current_tab_url});
    }

    loadFocusSite();
}

document.getElementById('add-site-to-distraction-list').addEventListener('click', addSiteToDistractions);
document.getElementById('make-site-as-focus').addEventListener('click', setSiteAsFocus);

loadFocusSite();
loadDistractionList();
loadStatus();

async function setBreak(event) {
    const break_duration_mins = parseFloat(event.target.value);
    chrome.action.setBadgeText({
        text: "OFF",
    });
    chrome.action.setBadgeBackgroundColor({
        color: "red",
    });
    
    chrome.alarms.create({delayInMinutes: break_duration_mins});

    const min_suffix = (break_duration_mins > 1) ? "minutes" : "minute";

    // chrome.notifications.create({
    //     type:     'basic',
    //     iconUrl:  'redirect_icon.png',
    //     title:    `Focus mode paused for ${break_duration_mins} ${min_suffix}`,
    //     message:  'You can visit distracting sites during this time.',
    //     priority: 0
    // });

    // window.close();

    await chrome.storage.local.set({focus_mode: "OFF"});

    const messageElem = document.getElementById('pause-message')
    messageElem.innerText = `Focus mode paused for ${break_duration_mins} ${min_suffix}. You can visit distracting sites during this time.`
    loadStatus();
}

document.getElementById('pause-for-1min').addEventListener('click', setBreak);
document.getElementById('pause-for-10min').addEventListener('click', setBreak);