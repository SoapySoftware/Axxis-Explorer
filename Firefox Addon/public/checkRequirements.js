'use strict';

(function () {
  const appName = 'com.marcon.axxis.explorer';
  let isAllRequirementsMet = true;

  const appController = (request, sendResponse) => {
    let app = browser.runtime.connectNative(appName);

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
      console.log(
        'Disconnected from app (background.js): ' +
          browser.runtime.lastError.message
      );

      if (
        browser.runtime.lastError.message.startsWith(
          'Specified native messaging host not found.'
        )
      ) {
        // The native app is not installed
        request.status = 'error';
        request.message = 'Native app is not installed';
        sendResponse(request);
      }

      app = null;
    });

    // Send the request to the native app.
    console.log('Sending message to app (background.js)');
    console.log(request);
    app.postMessage(request);
  };

  browser.permissions.getAll().then((permissions) => {
    console.log('Permissions granted (popup.js): ', permissions);

    let elem = document.getElementById('txtStatusFileUrls');

    if (
      !permissions.origins.includes('*://*.marconmetalfab.com/*') ||
      !permissions.origins.includes('*://axx.is/*')
    ) {
      isAllRequirementsMet = false;
      let elems = document.getElementsByClassName('some-requirements-missing');
      for (let elem of elems) {
        elem.classList.remove('d-none');
      }
      elems = document.getElementsByClassName('access-required');
      console.log(elems);
      for (let elem of elems) {
        elem.classList.remove('d-none');
      }
    }
  });

  // Async
  appController({ type: 'checkInstalled' }, (response) => {
    if (response.status === 'success') {
      if (isAllRequirementsMet) {
        let elems = document.getElementsByClassName('all-requirements-met');
        for (let elem of elems) {
          elem.classList.remove('d-none');
        }
      } else {
        let elems = document.getElementsByClassName(
          'some-requirements-missing'
        );
        for (let elem of elems) {
          elem.classList.remove('d-none');
        }
      }
    } else {
      let elems = document.getElementsByClassName('native-app-required');
      for (let elem of elems) {
        elem.classList.remove('d-none');
      }
    }
  });
})();
