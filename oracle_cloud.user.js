// ==UserScript==
// @name         Oracle Cloud Hotkey
// @version      1.0.1
// @updateURL    https://raw.githubusercontent.com/Kerosene92/tamper_monkey_scripts/refs/heads/main/oracle_cloud.user.js
// @downloadURL  https://raw.githubusercontent.com/Kerosene92/tamper_monkey_scripts/refs/heads/main/oracle_cloud.user.js
// @namespace    http://tampermonkey.net/
// @author       You
// @match        https://fa-esco-saasfaprod1.fa.ocs.oraclecloud.com/*
// @description  Oracle cloud movement requests autofiller
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ── helpers ──────────────────────────────────────────────────────────────

    function setInput(input, value) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
            Object.getPrototypeOf(input), 'value'
        ).set;
        nativeSetter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, keyCode: 13 }));
        input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, keyCode: 13 }));
    }

    function setInputByLabel(labelText, value) {
        const label = [...document.querySelectorAll('label')]
            .find(l => l.textContent.trim() === labelText);
        if (!label) { console.warn(`Label not found: "${labelText}"`); return; }
        const input = document.getElementById(label.getAttribute('for'));
        if (!input) { console.warn(`Input not found for label: "${labelText}"`); return; }
        setInput(input, value);
    }
    async function typeIntoInput(input, value) {
    input.focus();

    // Clear existing value by selecting all and deleting
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a', keyCode: 65, ctrlKey: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a', keyCode: 65, ctrlKey: true }));
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);

    // Type each character one by one
    for (const char of value) {
        const keyCode = char.charCodeAt(0);
        input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: char, keyCode }));
        input.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: char, keyCode }));
        document.execCommand('insertText', false, char);
        input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: char, keyCode }));
        await wait(30); // small delay between characters
    }

    // Confirm with Tab (ADF often triggers validation on tab-out)
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Tab', keyCode: 9 }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Tab', keyCode: 9 }));
    input.blur();
}

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ── main action ──────────────────────────────────────────────────────────

    async function runHotkey() {
    // 1. Select: Transaction Type → "Issue To Project"
    const txLabel = [...document.querySelectorAll('label')]
    .find(l => l.textContent.trim() === 'Transaction Type');
        if (txLabel) {
            const select = document.getElementById(txLabel.getAttribute('for'));
            if (select) {
                // Focus first
                select.focus();

                // Simulate opening the dropdown
                select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));

                // Select the option directly
                const option = [...select.options].find(o => o.title === 'Issue To Project');
                if (option) {
                    option.selected = true;
                    select.selectedIndex = option.index;
                }

                // Simulate closing the dropdown with the selection
                select.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                select.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                select.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

                // Simulate pressing Enter to confirm
                select.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }));
                select.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }));
                select.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }));

                select.blur();
    }
}

    // 2. Input: Destination Account
    //const destInput = document.querySelector('input[aria-label="Destination Account"]');
    //if (destInput) {
    //    setInput(destInput, '0090-0000-0567-0000000000-0000-0000-0000');
    //} else { console.warn('Input "Destination Account" not found'); }
   /// const destLabel = [...document.querySelectorAll('label[for]')]
    //.find(l => l.textContent.trim() === 'Destination Account');
      //  if (destLabel) {
         //   const destInput = document.getElementById(destLabel.getAttribute('for'));
          //  if (destInput) {
            //    setInput(destInput, '0090-0000-0567-0000000000-0000-0000-0000');
        //    } else { console.warn('Input for "Destination Account" not found'); }
      //  } else { console.warn('Label "Destination Account" not found'); }
        const destLabel = [...document.querySelectorAll('label[for]')]
        .find(l => l.textContent.trim() === 'Destination Account');
        if (destLabel) {
            const destInput = document.getElementById(destLabel.getAttribute('for'));
            if (destInput) {
                await typeIntoInput(destInput, '0090-0000-0567-0000000000-0000-0000-0000');
            }
        }
    // 3. Wait 2 seconds
    await wait(1000);

    // 4. Input: Project Number
    const projectInput = document.querySelector('input[aria-label="Project Number"]');
    if (projectInput) {
        setInput(projectInput, '567');
    } else { console.warn('Input "Project Number" not found'); }

    // 5. Wait 2 seconds
    await wait(2000);

    // 6. Input: Task Number
    setInputByLabel('Task Number', window.__altC.firstCode ?? 'first code');

    // 7. Input: Expenditure Organization
    setInputByLabel('Expenditure Type', window.__altC.secondCode ?? 'second code');
}

    // ── hotkey + iframe injection ─────────────────────────────────────────────

    function addHotkey(win) {
        try {
            win.addEventListener('keydown', function (e) {
                if (e.altKey && e.code === 'KeyX') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    runHotkey();
                }
            }, true);
        } catch (err) {}
    }

    function attachToIframes() {
        document.querySelectorAll('iframe').forEach(function (iframe) {
            try { addHotkey(iframe.contentWindow); } catch (e) {}
        });
    }

    function init() {
        addHotkey(window);
        attachToIframes();
        const observer = new MutationObserver(attachToIframes);
        observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    }

    if (document.body) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }

})();
