// ==UserScript==
// @name         Alt+C Code Capture
// @namespace    http://tampermonkey.net/
// @updateURL    https://raw.githubusercontent.com/Kerosene92/tamper_monkey_scripts/refs/heads/main/code_capture.user.js
// @downloadURL  https://raw.githubusercontent.com/Kerosene92/tamper_monkey_scripts/refs/heads/main/code_capture.user.js
// @version      1.0
// @description  Press Alt+C to input two codes and store them in variables
// @author       You
// @match        https://fa-esco-saasfaprod1.fa.ocs.oraclecloud.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==


(function () {
    'use strict';

    let firstCode = null;
    let secondCode = null;

    document.addEventListener('keydown', function (e) {
        if (e.altKey && e.key === 'c') {
            e.preventDefault();

            const input1 = prompt('Enter First Code:');
            if (input1 === null) return; // user cancelled

            const input2 = prompt('Enter Second Code:');
            if (input2 === null) return; // user cancelled

            firstCode = input1.trim();
            secondCode = input2.trim();

            console.log('[Alt+C Code Capture]');
            console.log('First Code:', firstCode);
            console.log('Second Code:', secondCode);

            alert(`✅ Codes saved!\n\nFirst Code:  ${firstCode}\nSecond Code: ${secondCode}`);
        }
    });

    // Expose variables globally so you can access them from the browser console
    window.__altC = {
        get firstCode() { return firstCode; },
        get secondCode() { return secondCode; }
    };

})();
