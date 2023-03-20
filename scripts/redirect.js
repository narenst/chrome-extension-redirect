// Actively watches the website url when opened and redirect if its a distraction

async function check_for_blocked_domain(forced = false) {
    //Check if plugin is active
    const focus_mode_response = await chrome.storage.local.get(['focus_mode']);
    if (focus_mode_response.focus_mode == 'OFF' && !forced) {
        //Plugin is currently paused
        return;
    }

    const storage_response = await chrome.storage.local.get(['blocked_urls']);
    const blocked_domains = storage_response.blocked_urls;

    const focus_url_response = await chrome.storage.local.get(['focus_url']);
    const focus_url = focus_url_response.focus_url;

    const current_domain = location.hostname;

    blocked_domains.forEach(blocked_domain => {
        if (current_domain === blocked_domain) {
            
            if (focus_url) {
                location.assign(focus_url);
            } else {
                location.assign("https://narenst.github.io/chrome-extension-redirect/html/placeholder.html");
            }
        }
    });
}

check_for_blocked_domain();

// Message is sent when the focus mode changes
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      check_for_blocked_domain(forced = true);
    }
);