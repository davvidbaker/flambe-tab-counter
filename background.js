async function countTabsAndWindows() {
  const { tabs, windowCount } = await new Promise(resolve => {
    chrome.windows.getAll({ populate: true }, function(windows) {
      let tabs = [];
      let windowCount = 0;
      windows.forEach(function(window) {
        windowCount++;
        window.tabs.forEach(function(tab) {
          //collect all of the urls here, I will just log them instead
          // console.log(tab.url);
          tabs = [...tabs, tab.url];
        });
      });
      console.log('tabs length', tabs.length);
      resolve({ tabs, windowCount });
    });
  });

  return { tabCount: tabs.length, windowCount };
}

chrome.signedInDevices.get(deviceInfoArray =>
  console.log('deviceInfoArray', deviceInfoArray)
);

chrome.signedInDevices.onDeviceInfoChange.addListener(deviceInfoArray =>
  console.log('change in [deviceInfoArray]', deviceInfoArray)
);

/* 💁 Tab stuff */
async function postTabCount() {
  const { tabCount, windowCount } = await countTabsAndWindows();

  fetch('http://localhost:4000/api/tabs', {
    /* ⚠️ TODO FIX THIS   (the user id)*/
    body: JSON.stringify({
      user_id: 1,
      tabs: {
        count: tabCount,
        timestamp_integer: Date.now(),
        window_count: windowCount,
      },
    }),
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
  });
}

async function postSearchTerm(term) {
  fetch('http://localhost:4000/api/search_terms', {
    /* ⚠️ TODO FIX THIS user_id */
    body: JSON.stringify({
      user_id: 1,
      search_term: { term, timestamp_integer: Date.now() },
    }),
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
  });
}

// TODO count the number of tabs in each window, for a slightly more interesting plot
chrome.tabs.onCreated.addListener(postTabCount);
chrome.tabs.onRemoved.addListener(postTabCount);
chrome.tabs.onDetached.addListener(postTabCount);
chrome.tabs.onAttached.addListener(postTabCount);

/* 💁 Request stuff */
const filter = {
  urls: ['http://*/*', 'https://*/*'],
};

chrome.webRequest.onBeforeRequest.addListener(webRequest => {
  if (webRequest.method === 'GET') {
    // console.log('webRequest.url', webRequest.url, webRequest);
    const searchTerm = webRequest.url.match(/(&q|\?q)=(.*)&oq/);
    if (searchTerm) {
      const decodedURIComponent = decodeURIComponent(searchTerm[2]);
      const searchTermWithSpaces = decodedURIComponent.replace(/\+/g, ' ');
      console.log('search_term', searchTermWithSpaces);
      postSearchTerm(searchTermWithSpaces);
    }
  }

  // }
}, filter);

// chrome.webRequest.onCompleted.addListener(webRequest => {
//   console.log('onCompleted [webRequest]', webRequest);
//   requests = [...requests, webRequest];
// }, filter);
