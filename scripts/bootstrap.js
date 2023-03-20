chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
      text: "ON",
    });
    chrome.action.setBadgeBackgroundColor({
      color: "green",
    });
    chrome.storage.local.set({focus_mode: "ON"});
});

async function bootstrap_values_in_storage() {
  const storage_response = await chrome.storage.local.get(['blocked_urls']);
  if (storage_response.blocked_urls === undefined) {
    chrome.storage.local.set({blocked_urls: []});
  }

  const focus_storage_response = await chrome.storage.local.get(['focus_url']);
  if (focus_storage_response.focus_url === undefined) {
    chrome.storage.local.set({focus_url: ""});
  }
}

bootstrap_values_in_storage();


chrome.alarms.onAlarm.addListener(() => {
  // console.log("Received the alarm, turning on the plugin now");

  chrome.action.setBadgeText({
      text: "ON",
  });
  chrome.action.setBadgeBackgroundColor({
      color: "green",
  });

  chrome.storage.local.set({focus_mode: "ON"});

  //Send message to redirect to check the url
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {focus_mode: "ON"});
  });
});


// Message is sent when the tab has to be closed
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

    if (request.closeThisTab) {
      // chrome.tabs.remove(sender.tab.id);
      console.log("Received close this ..");

      const internal_placeholder_url = chrome.runtime.getURL('html/sample.html');
      location.assign(internal_placeholder_url);
    }
  }
);
