'use strict';

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// This file is loaded by the browser when the page is loaded, since the manifest specifies that "run_at": "document_idle"

// Catch all window click events and check if the target is a link.
// If it is a link and the href starts with "file://", then
// prevent the default action and send a message to the background script
// to open the local file.
// This is done to avoid opening local files in the browser.
if (!window.alreadyExecuted) {
  //console.log('Debug: Adding click handler...');
  window.addEventListener(
    'click',
    (evt) => {
      // If event is fired by user's operation then isTrusted == true.
      // https://developer.mozilla.org/ja/docs/Web/API/Event/isTrusted
      if (!evt.isTrusted) {
        return;
      }

      // Check if the target of the click (or a parent of the target) is a link or an area
      let target = evt.target;
      while (
        target &&
        target.tagName.toUpperCase() !== 'A' &&
        target.tagName.toUpperCase() !== 'AREA'
      ) {
        target = target.parentElement;
      }

      if (target) {
        // Handle SVG links
        const url =
          target instanceof SVGAElement ? target.href.baseVal : target.href;
        if (url.startsWith('file://')) {
          evt.preventDefault();
          // Catch the error for the extension is reloaded.
          try {
            if (url.toLowerCase().endsWith('.pdf')) {
              Object.assign(document.createElement('a'), {
                target: '_blank',
                href: url,
              }).click();
            } else {
              browser.runtime.sendMessage(
                {
                  type: 'openLocalFile',
                  path: url,
                },
                (response) => {
                  console.log('contentScript.js', response);

                  // Inject a script into the page to dispatch a custom event
                  const script = document.createElement('script');
                  script.textContent = `document.dispatchEvent(
                  new CustomEvent('axxis-explorer-open', {
                    bubbles: true,
                    detail: ${JSON.stringify(response)},
                  })
                );`;
                  script.onload = () => script.remove(); // Clean up after it's loaded
                  document.documentElement.appendChild(script);
                }
              );
            }
          } catch (ex) {
            console.log('Error sending message to background script:', ex);
          }
        }
      }
    },
    {
      capture: true,
    }
  );
}

window.alreadyExecuted = true;
