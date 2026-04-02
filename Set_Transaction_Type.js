// ==UserScript==
// @name         Oracle - Set Transaction Type (Alt+G)
// @namespace    http://tampermonkey.net/
// @updateURL    https://raw.githubusercontent.com/Kerosene92/tamper_monkey_scripts/refs/heads/main/Set_Transaction_Type.user.js
// @downloadURL  https://raw.githubusercontent.com/Kerosene92/tamper_monkey_scripts/refs/heads/main/Set_Transaction_Type.user.js
// @version      1.0
// @description  Sets all "Transaction Type" selects to "Issue To Project"
// @match        https://fa-esco-saasfaprod1.fa.ocs.oraclecloud.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  const TARGET_VALUE = '1';
  const TARGET_TITLE = 'Issue To Project';
  const LABEL_TEXT   = 'Transaction Type';

  function setTransactionTypes() {
    const labels = [...document.querySelectorAll('label')]
      .filter(l => l.textContent.trim() === LABEL_TEXT);

    let count = 0;

    labels.forEach(label => {
      const forId  = label.getAttribute('for');
      let   select = forId
        ? document.getElementById(forId)
        : label.querySelector('select') ||
          label.parentElement?.querySelector('select');

      if (!select || select.tagName !== 'SELECT') return;

      let opt = [...select.options].find(
        o => o.value === TARGET_VALUE || o.title === TARGET_TITLE
      );

      if (!opt) {
        opt = new Option(TARGET_TITLE, TARGET_VALUE);
        opt.title    = TARGET_TITLE;
        opt.selected = true;
        select.appendChild(opt);
      }

      select.value = TARGET_VALUE;

      ['change', 'input'].forEach(type =>
        select.dispatchEvent(new Event(type, { bubbles: true }))
      );

      count++;
    });

    const msg = count
      ? `✓ Set ${count} "Transaction Type" field(s) to "${TARGET_TITLE}"`
      : '⚠ No "Transaction Type" selects found on this page.';

    console.log('[TxType]', msg);
    alert(msg);
  }

  document.addEventListener('keydown', e => {
    if (e.altKey && e.key === 'g') {
      e.preventDefault();
      setTransactionTypes();
    }
  });
})();
