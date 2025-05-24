'use strict';

const appName = 'com.marcon.axxis.explorer';

// Check whether new version is installed
browser.runtime.onInstalled.addListener(function (details) {
  if (details.reason == 'install') {
    console.log('This is a first install (background.js):', details);
    openTab(browser.runtime.getURL('/installed.html'));
  } else if (details.reason == 'update') {
    let thisVersion = browser.runtime.getManifest().version;
    console.log(
      'Updated from ' +
        details.previousVersion +
        ' to ' +
        thisVersion +
        ' (background.js):'
    );
    console.log(details);
  } else {
    console.log(
      'This is an alternate onInstalled event (background.js):',
      details
    );
  }

  browser.permissions.getAll().then((permissions) => {
    console.log('Permissions granted (background.js):', permissions);
  });

  addClickEventListenerToExistingTab();
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'openLocalFile') {
    // Specific to firefox add on, we include the source so the helper app can spawn a new process
    // and not just open the file in the current process.
    request.application = 'firefox';

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
      console.log('Opening in browser tab (background.js)', request.path);
      const tab = sender.tab;
      openTab(
        request.path,
        tab,
        (createdTab) => {
          console.log('Tab created (background.js)', createdTab);
        },
        (createdTab) => {
          console.log('Tab creation failed (background.js)', createdTab);
        }
      );

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
  let app = browser.runtime.connectNative(appName);

  // Handle the response from the native app.  Will let us know if the parameters sent were valid.
  app.onMessage.addListener(function (msg) {
    console.log('Received message from app (background.js)', msg);
    sendResponse(msg);
  });

  // Handle disconnection.
  // Application only handles one request, then exits.
  // We must check the lastError message, otherwise it appears that the extension is throwing errors.
  app.onDisconnect.addListener(function (e) {
    console.log('Disconnected from app (background.js): ', e);
    let msg = '';

    if (e.error != null) {
      msg = e.error.message;
    }

    if (msg.startsWith('Native host has exited.')) {
      // Do nothing, the app has closed itself, which is expected.
    } else if (msg.startsWith('No such native application')) {
      // The native app is not installed
      request.status = 'error';
      request.message = 'Native app is not installed';
      sendResponse(request);

      openTab(browser.runtime.getURL('/help/install.html'), sender.tab);
    } else {
      // The native app is not installed
      request.status = 'error';
      request.message = `Problem with native app (${msg})`;
      sendResponse(request);
    }

    app = null;
  });

  // Send the request to the native app.
  console.log('Sending message to app (background.js)', request);
  app.postMessage(request);
};

// Helper function to open a new tab
const openTab = (
  url,
  baseTab = null,
  onCreated = () => {},
  onError = () => {}
) => {
  let loc = {
    url: url,
    active: true,
    openerTabId: baseTab ? baseTab.id : undefined,
  };

  console.log('Opening tab (background.js)', loc);

  let creating = browser.tabs.create(loc);

  creating.then(onCreated, onError);
};

// Uses browser.scripting and browser.tabs APIs to add the click event listener to all existing tabs
const addClickEventListenerToExistingTab = () => {
  browser.tabs.query(
    {
      url: ['*://*.marconmetalfab.com/*', '*://axx.is/*'],
    },
    (tabs) => {
      tabs.forEach((tab) => {
        browser.scripting.executeScript(
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
