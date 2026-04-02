// ==UserScript==
// @name         Oracle Cloud Hotkey
// @version      1.1.3
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

    // ── code storage (no page reload) ────────────────────────────────────────

    let firstCode = null;
    let secondCode = null;

    window.__altC = {
        get firstCode()  { return firstCode;  },
        get secondCode() { return secondCode; },
    };

    // ── helpers ──────────────────────────────────────────────────────────────

    function setInput(input, value) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
            Object.getPrototypeOf(input), 'value'
        ).set;
        nativeSetter.call(input, value);
        input.dispatchEvent(new Event('input',  { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, keyCode: 13 }));
        input.dispatchEvent(new KeyboardEvent('keyup',   { bubbles: true, keyCode: 13 }));
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

        input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a', keyCode: 65, ctrlKey: true }));
        input.dispatchEvent(new KeyboardEvent('keyup',   { bubbles: true, key: 'a', keyCode: 65, ctrlKey: true }));
        document.execCommand('selectAll', false, null);
        document.execCommand('delete',    false, null);

        for (const char of value) {
            const keyCode = char.charCodeAt(0);
            input.dispatchEvent(new KeyboardEvent('keydown',  { bubbles: true, key: char, keyCode }));
            input.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: char, keyCode }));
            document.execCommand('insertText', false, char);
            input.dispatchEvent(new KeyboardEvent('keyup',    { bubbles: true, key: char, keyCode }));
        }

        input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Tab', keyCode: 9 }));
        input.dispatchEvent(new KeyboardEvent('keyup',   { bubbles: true, key: 'Tab', keyCode: 9 }));
        input.blur();
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ── Alt+C  →  capture codes (custom modal, no prompt/alert) ─────────────

    function showCodeModal() {
        // Remove any existing modal
        const existing = document.getElementById('__altC_modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = '__altC_modal';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 2147483647;
            background: rgba(0,0,0,0.45);
            display: flex; align-items: center; justify-content: center;
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            background: #fff; border-radius: 8px; padding: 28px 32px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25);
            display: flex; flex-direction: column; gap: 14px;
            min-width: 320px; font-family: Arial, sans-serif; font-size: 14px;
        `;

        box.innerHTML = `
            <div style="font-weight:bold;font-size:16px;margin-bottom:4px;">Enter Codes</div>
            <label style="display:flex;flex-direction:column;gap:4px;">
                First Code (Task Number)
                <input id="__altC_first" type="text" style="padding:7px 10px;border:1px solid #ccc;border-radius:4px;font-size:14px;" />
            </label>
            <label style="display:flex;flex-direction:column;gap:4px;">
                Second Code (Expenditure Type)
                <input id="__altC_second" type="text" style="padding:7px 10px;border:1px solid #ccc;border-radius:4px;font-size:14px;" />
            </label>
            <div id="__altC_confirm" style="display:none;color:green;font-weight:bold;">✅ Codes saved!</div>
            <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px;">
                <div id="__altC_cancel" style="padding:7px 18px;border:1px solid #ccc;border-radius:4px;cursor:pointer;background:#f5f5f5;user-select:none;">Cancel</div>
                <div id="__altC_save"   style="padding:7px 18px;border-radius:4px;cursor:pointer;background:#0066cc;color:#fff;font-weight:bold;user-select:none;">Save</div>
            </div>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        const firstInput  = document.getElementById('__altC_first');
        const secondInput = document.getElementById('__altC_second');
        const confirmMsg  = document.getElementById('__altC_confirm');

        // Pre-fill with current values if already set
        if (firstCode)  firstInput.value  = firstCode;
        if (secondCode) secondInput.value = secondCode;

        firstInput.focus();

        function closeModal() { overlay.remove(); }

        document.getElementById('__altC_cancel').addEventListener('mousedown', function(e) {
            e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
            closeModal();
        });

        document.getElementById('__altC_save').addEventListener('mousedown', function(e) {
            e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
            firstCode  = firstInput.value.trim();
            secondCode = secondInput.value.trim();
            console.log('[Alt+C Code Capture] First:', firstCode, '| Second:', secondCode);
            confirmMsg.style.display = 'block';
            setTimeout(closeModal, 900);
        });

        // Tab from first → second, Enter on second → save
        firstInput.addEventListener('keydown', function (e) {
            if (e.key === 'Tab') { e.preventDefault(); secondInput.focus(); }
            if (e.key === 'Escape') closeModal();
        });
        secondInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') document.getElementById('__altC_save').click();
            if (e.key === 'Escape') closeModal();
        });

        // Stop ALL events from leaking OUT of the modal to Oracle ADF
        // but only if they originated inside the overlay (not re-dispatched from our own handlers)
        ['keydown','keyup','keypress','click','mousedown','mouseup','mouseover','focus','blur','change','input'].forEach(function(type) {
            overlay.addEventListener(type, function(e) {
                e.stopImmediatePropagation();
                e.stopPropagation();
            }, false); // false = bubble phase, so our inner mousedown handlers fire first
        });
    }

    function handleAltC(e) {
        if (!e.altKey || e.code !== 'KeyX') return;
        e.preventDefault();
        e.stopImmediatePropagation();
        showCodeModal();
    }

    // ── Alt+X  →  run autofill ────────────────────────────────────────────────

    async function runHotkey() {
        // 1. Transaction Type → "Issue To Project"
        const txLabel = [...document.querySelectorAll('label')]
            .find(l => l.textContent.trim() === 'Transaction Type');
        if (txLabel) {
            const select = document.getElementById(txLabel.getAttribute('for'));
            if (select) {
                select.focus();
                select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));

                const option = [...select.options].find(o => o.title === 'Issue To Project');
                if (option) {
                    option.selected = true;
                    select.selectedIndex = option.index;
                }

                select.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                select.dispatchEvent(new MouseEvent('click',   { bubbles: true, cancelable: true }));
                select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                select.dispatchEvent(new Event('input',  { bubbles: true, cancelable: true }));
                select.dispatchEvent(new KeyboardEvent('keydown',  { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }));
                select.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }));
                select.dispatchEvent(new KeyboardEvent('keyup',    { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }));
                select.blur();
            }
        }

        // 2. Destination Account
        const destLabel = [...document.querySelectorAll('label[for]')]
            .find(l => l.textContent.trim() === 'Destination Account');
        if (destLabel) {
            const destInput = document.getElementById(destLabel.getAttribute('for'));
            if (destInput) {
                await typeIntoInput(destInput, '0090-0000-0567-0000000000-0000-0000-0000');
            }
        }

        // 3. Wait 1 second
        await wait(1000);

        // 4. Project Number
        const projectInput = document.querySelector('input[aria-label="Project Number"]');
        if (projectInput) {
            setInput(projectInput, '567');
        } else { console.warn('Input "Project Number" not found'); }

        // 5. Wait 2 seconds
        await wait(2000);

        // 6. Task Number  (uses captured firstCode)
        setInputByLabel('Task Number', firstCode ?? 'first code');

        // 7. Expenditure Type  (uses captured secondCode)
        setInputByLabel('Expenditure Type', secondCode ?? 'second code');
    }

    // ── hotkey registration ───────────────────────────────────────────────────

    function addHotkeys(win) {
        try {
            win.addEventListener('keydown', handleAltC,  true);
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
            try { addHotkeys(iframe.contentWindow); } catch (e) {}
        });
    }

    function init() {
        addHotkeys(window);
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
