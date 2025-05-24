'use strict';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

const appName = 'com.marcon.axxis.explorer';

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == 'install') {
    console.log('This is a first install (background.js):');
    console.log(details);
    openTab(chrome.runtime.getURL('/installed.html'));
  } else if (details.reason == 'update') {
    let thisVersion = chrome.runtime.getManifest().version;
    console.log(
      'Updated from ' +
        details.previousVersion +
        ' to ' +
        thisVersion +
        ' (background.js):'
    );
    console.log(details);
  } else {
    console.log('This is an alternate onInstalled event (background.js):');
    console.log(details);
  }

  addClickEventListenerToExistingTab();
});

// Allow an external website to check if the extension is installed
// Also check if the extension allows access to local files
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.type === 'checkVersion') {
      let perm = "Don't know";

      chrome.extension.isAllowedFileSchemeAccess().then((result) => {
        const thisVersion = chrome.runtime.getManifest().version;
        request.version = thisVersion;
        request.status = 'success';
        request.message = 'Version check successful';
        request.localFilePermission = result;
        sendResponse(request);
      });
    } else {
      console.log('External request type unsupported (background.js)');
      request.status = 'error';
      request.message = 'Message request type is unsupported';
      sendResponse(request);
    }
  }
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'openLocalFile') {
    const path = decodeURIComponent(request.path)
      .replace('file:///', '')
      .replace('file://', '');

    // Check if the file extension is supported by the native app
    const bNativeAppExtension = ['.doc', '.docx', '.xls', '.xlsx'].some((ext) =>
      path.toLowerCase().endsWith(ext)
    );

    const bUnsafeAppExtension = [
      '.BAT',
      '.BIN',
      '.CAB',
      '.CMD',
      '.COM',
      '.CPL',
      '.EX_',
      '.EXE',
      '.GADGET',
      '.INF1',
      '.INS',
      '.INX',
      '.ISU',
      '.JOB',
      '.JSE',
      '.LNK',
      '.MSC',
      '.MSI',
      '.MSP',
      '.MST',
      '.PAF',
      '.PIF',
      '.PS1',
      '.REG',
      '.RGS',
      '.SCR',
      '.SCT',
      '.SHB',
      '.SHS',
      '.U3P',
      '.VB',
      '.VBE',
      '.VBS',
      '.VBSCRIPT',
      '.WS',
      '.WSF',
      '.WSH',
    ].some((ext) => path.toUpperCase().endsWith(ext));

    // Check if the path appears to be a folder, with either a trailing slash or backslash, or a directory with no extension
    const bFolder = !/\.[^/^\\.]+$/.test(path);

    if (bUnsafeAppExtension) {
      request.status = 'error';
      request.message = 'File extension is not supported';
      sendResponse(request);
    }
    // If we want to handle this request in the native app
    else if (bNativeAppExtension || bFolder) {
      request.path = path;
      appController(request, sender, sendResponse);
      // Keep the message channel open for sendResponse
      return true;
    }
    // Otherwise, we want to open it in a new tab of the browser
    else {
      console.log('Opening in browser tab (background.js)');
      const tab = sender.tab;
      openTab(request.path, tab, (createdTab) => {
        // When set using GPO, chrome.extension.isAllowedFileSchemeAccess returns false but tabs can be opened
        // Therefore, it is determined whether the tab can actually be opened.
        if (!createdTab) {
          // If the tab doesn't open
          openTab(chrome.runtime.getURL('/help/allow-access.html'), tab);
        }
      });

      request.status = 'success';
      request.message = 'Opening in a new browser tab';
      sendResponse(request);
    }
  } else if (request.type === 'checkInstalled') {
    appController(request, sender, sendResponse);
    // Keep the message channel open for sendResponse
    return true;
  } else {
    console.log('Request type unsupported (background.js)');
    request.status = 'error';
    request.message = 'Message request type is unsupported';
    sendResponse(request);
  }
});

const appController = (request, sender, sendResponse) => {
  let app = chrome.runtime.connectNative(appName);

  // Handle the response from the native app.  Will let us know if the parameters sent were valid.
  app.onMessage.addListener(function (msg) {
    console.log('Received message from app (background.js)');
    console.log(msg);
    sendResponse(msg);
  });

  // Handle disconnection.
  // Application only handles one request, then exits.
  // We must check the lastError message, otherwise it appears that the extension is throwing errors.
  app.onDisconnect.addListener(function () {
    let msg = chrome.runtime.lastError.message;

    console.log('Disconnected from app (background.js): ' + msg);

    if (msg.startsWith('Native host has exited.')) {
      // Do nothing, the app has closed itself, which is expected.
    } else if (msg.startsWith('Specified native messaging host not found.')) {
      // The native app is not installed
      request.status = 'error';
      request.message = 'Native app is not installed';
      sendResponse(request);

      openTab(chrome.runtime.getURL('/help/install.html'), sender.tab);
    } else {
      // The native app is not installed
      request.status = 'error';
      request.message = `Problem with native app (${msg})`;
      sendResponse(request);
    }

    app = null;
  });

  // Send the request to the native app.
  console.log('Sending message to app (background.js)');
  console.log(request);
  app.postMessage(request);
};

// Helper function to open a new tab
const openTab = (url, baseTab = null, callback = () => {}) => {
  chrome.tabs.create(
    {
      url: url,
      active: true,
      openerTabId: baseTab ? baseTab.id : undefined,
    },
    callback
  );
};

// Uses chrome.scripting and chrome.tabs APIs to add the click event listener to all existing tabs
const addClickEventListenerToExistingTab = () => {
  chrome.tabs.query(
    {
      url: ['*://*.marconmetalfab.com/*', '*://axx.is/*'],
    },
    (tabs) => {
      tabs.forEach((tab) => {
        chrome.scripting.executeScript(
          {
            files: ['contentScript.js'],
            target: {
              tabId: tab.id,
              allFrames: true,
            },
          },
          (result) => {
            if (typeof result === 'undefined') {
              console.log(
                `Content script failed to load (background.js) for tab: ${tab.id} url: ${tab.url}`
              );
            } else {
              console.log(
                `Content script loaded for existing tab (background.js) for tab: ${tab.id} url: ${tab.url}`
              );
            }
          }
        );
      });
    }
  );
};
