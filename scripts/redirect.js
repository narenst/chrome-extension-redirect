// Actively watches the website url when opened and redirect if its a distraction

async function add_overlay_message(message) {
    const overlay_div = document.createElement('div');

    overlay_div.style = "position: fixed; display: none; width: 100%; height: 100%; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); z-index: 2; cursor: pointer;"
    overlay_div.style.display = "block";

    const redirect_text = document.createElement('div');
    redirect_text.style = "position: absolute; top: 50%; left: 50%; font-size: 50px; color: white; transform: translate(-50%,-50%); -ms-transform: translate(-50%,-50%);"
    redirect_text.innerText = message;
    overlay_div.appendChild(redirect_text);

    let body_elem = document.body;
    if (body_elem == null) {
        body_elem = document.createElement("body");
        document.body = body_elem;
    }
    body_elem.appendChild(overlay_div);
}

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

            // Stops the page from continuing to load in the background
            window.stop();

            if (focus_url) {
                add_overlay_message("Redirecting from distracting site to current focus");

                setTimeout(() => {
                    location.assign(focus_url);
                }, 2500);
                
            } else {
                add_overlay_message("Closing the distracting site. Set current focus in the plugin.");
                console.log("Closing the site .. after 5 seconds");

                // Send message to background script to close the tab; cannot do this here.
                // setTimeout(() => {
                //     chrome.runtime.sendMessage({closeThisTab: true});
                // }, 0);
                const internal_placeholder_url = chrome.runtime.getURL('html/sample.html');
                console.log(internal_placeholder_url);

                setTimeout(() => {
                    // location.replace(internal_placeholder_url);
                    location.assign("chrome-extension://heobemjdjhchegapajbjkaoeclhicnhc/html/sample.html");
                }, 5000);
                
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