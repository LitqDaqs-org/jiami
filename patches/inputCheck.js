// Jiami v15 input filtering and complete key-panel validation.

function normalizeStateCode(value, shouldPad = false) {
    let digits = String(value || '').replace(/\D/g, '').slice(0, 6);
    if (shouldPad) digits = digits.padEnd(6, '0');
    let result = '';
    for (let i = 0; i < digits.length; i += 2) {
        let pair = digits.slice(i, i + 2);
        if (pair.length === 2 && Number(pair) > 94) pair = '94';
        result += pair;
    }
    return result.slice(0, 6);
}

function normalizeKeyText(value, options = {}) {
    const maxLength = options.maxLength || null;
    const unique = options.unique || false;
    const allowAllUnicode = options.allowAllUnicode || false;
    const library = options.library || lib1Original;
    let result = '';
    for (const ch of Array.from(String(value || ''))) {
        if (!allowAllUnicode && !library.includes(ch)) continue;
        if (unique && result.includes(ch)) continue;
        result += ch;
        if (maxLength && Array.from(result).length >= maxLength) break;
    }
    return result;
}

function bindKeyInput(inputId, options = {}) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const clean = () => {
        const cursor = input.selectionStart;
        const fixed = normalizeKeyText(input.value, options);
        if (input.value !== fixed) {
            input.value = fixed;
            if (cursor !== null) input.setSelectionRange(Math.min(cursor, fixed.length), Math.min(cursor, fixed.length));
        }
    };
    input.addEventListener('input', clean);
    input.addEventListener('blur', clean);
}

function bindDigitsOnly(inputId, maxLength = null) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', () => {
        let value = String(input.value).replace(/\D/g, '');
        if (maxLength) value = value.slice(0, maxLength);
        input.value = value;
    });
}

function normalizeEncryptText(value, library = lib1Original) {
    return Array.from(String(value || '')).filter(ch => library.includes(ch)).join('');
}

function bindEncryptTextInput(inputId, library = lib1Original) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const clean = () => {
        const original = input.value;
        const cursor = input.selectionStart ?? original.length;
        const fixed = normalizeEncryptText(original, library);
        if (fixed !== original) {
            const next = normalizeEncryptText(original.slice(0, cursor), library).length;
            input.value = fixed;
            input.setSelectionRange(next, next);
        }
    };
    input.addEventListener('input', clean);
    input.addEventListener('blur', clean);
    clean();
}

function validateStateCode(value, label) {
    const code = String(value ?? '');
    if (!/^\d{6}$/.test(code)) return `${label} must contain exactly 6 digits.`;
    for (let i = 0; i < 3; i++) {
        const pair = code.slice(i * 2, i * 2 + 2);
        if (Number(pair) > 94) return `${label} group ${i + 1} must be between 00 and 94.`;
    }
    return '';
}

function validateKeyPanel(mode) {
    const prefix = mode === 'decrypt' ? 'decrypt-' : '';
    const value = id => document.getElementById(prefix + id)?.value ?? '';
    const errors = [];
    const add = (field, message) => errors.push({ field: prefix + field, message });

    if (Array.from(value('cbc-key')).length !== 4) add('cbc-key', 'CBC key must contain exactly 4 characters.');
    if (value('sha-key').length === 0) add('sha-key', 'SHA key cannot be empty.');
    if (Array.from(value('matrix-key')).length !== 12) add('matrix-key', 'Matrix key must contain exactly 12 unique characters.');
    else if (new Set(Array.from(value('matrix-key'))).size !== 12) add('matrix-key', 'Matrix key characters must be unique.');

    const num = value('num-key');
    if (!/^\d+$/.test(num) || Number(num) < 0 || Number(num) > 94) add('num-key', 'Numeric key must be an integer from 0 to 94.');

    const text = Array.from(value('text-key'));
    if (text.length !== 8) add('text-key', 'Text key must contain exactly 8 characters.');
    else if (new Set(text).size !== 8) add('text-key', 'Text key characters must be unique.');

    if (value('noise-key').length === 0) add('noise-key', 'Perlin noise key cannot be empty.');

    const stateId = mode === 'decrypt' ? 'state' : 'lib-status';
    const stateError = validateStateCode(value(stateId), mode === 'decrypt' ? 'Library state code' : 'Initial library state code');
    if (stateError) add(stateId, stateError);

    const n = value('phantom-n');
    if (!/^\d+$/.test(n) || Number(n) < 1 || Number(n) > 99) add('phantom-n', 'Phantom interval N must be an integer from 1 to 99.');
    const m = value('phantom-m');
    if (!/^\d+$/.test(m) || Number(m) < 0 || Number(m) > 99) add('phantom-m', 'Phantom length M must be an integer from 0 to 99.');

    const required = new Set(Array.from(lib1Original));
    for (let i = 1; i <= 3; i++) {
        const library = Array.from(value(`custom-lib${i}`));
        if (library.length !== 95) add(`custom-lib${i}`, `Custom library ${i} must contain exactly 95 characters (including space).`);
        else if (new Set(library).size !== 95) add(`custom-lib${i}`, `Custom library ${i} contains duplicate characters.`);
        else if (library.some(ch => !required.has(ch))) add(`custom-lib${i}`, `Custom library ${i} contains unsupported characters or is missing required ones.`);
    }
    return errors;
}

function bindPanelValidation() {
    const encryptButton = document.getElementById('encrypt-btn');
    const decryptButton = document.getElementById('decrypt-btn');
    const ciphertext = document.getElementById('ciphertext');
    const configButtons = {
        encrypt: document.querySelector('[data-key-target="encrypt-key-section"]'),
        decrypt: document.querySelector('[data-key-target="decrypt-key-section"]')
    };

    const popup = document.createElement('div');
    popup.id = 'key-button-error-popup';
    popup.className = 'key-button-error-popup';
    popup.setAttribute('role', 'alert');
    popup.hidden = true;
    document.body.appendChild(popup);
    let activeMode = null;
    let activeErrors = [];

    function isKeyModalOpen() {
        const modal = document.getElementById('key-modal');
        return modal && !modal.hidden;
    }

    function popupAnchor() {
        // While a key modal is open, follow the first still-invalid input.
        // Once it is corrected, refresh() moves the popup to the next error.
        if (isKeyModalOpen() && activeErrors.length) {
            const invalidInput = document.getElementById(activeErrors[0].field);
            if (invalidInput && invalidInput.offsetParent !== null) return invalidInput;
        }
        return configButtons[activeMode];
    }

    function positionPopup() {
        if (popup.hidden || !activeMode) return;
        const anchor = popupAnchor();
        if (!anchor) return;
        const rect = anchor.getBoundingClientRect();
        const width = Math.min(360, window.innerWidth - 20);
        let left = Math.min(rect.left, window.innerWidth - width - 10);
        left = Math.max(10, left);
        let top = rect.bottom + 10;
        if (top + popup.offsetHeight > window.innerHeight - 10) top = Math.max(10, rect.top - popup.offsetHeight - 10);
        popup.style.width = `${width}px`;
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
    }

    function markFields(mode, errors) {
        const sectionId = mode === 'decrypt' ? 'decrypt-key-section' : 'encrypt-key-section';
        document.querySelectorAll(`#${sectionId} input`).forEach(input => {
            input.classList.remove('key-input-invalid');
            input.removeAttribute('aria-invalid');
        });
        errors.forEach(error => {
            const input = document.getElementById(error.field);
            if (input) { input.classList.add('key-input-invalid'); input.setAttribute('aria-invalid', 'true'); }
        });
    }

    function refresh() {
        const encErrors = validateKeyPanel('encrypt');
        const decryptNeeded = ciphertext.value.length > 0;
        const decErrors = decryptNeeded ? validateKeyPanel('decrypt') : [];
        markFields('encrypt', encErrors);
        markFields('decrypt', decErrors);

        // Invalid encryption keys always disable Encrypt. Decryption keys are
        // enforced once ciphertext exists, so an unused decryption panel stays quiet.
        encryptButton.disabled = encErrors.length > 0;
        encryptButton.setAttribute('aria-disabled', String(encErrors.length > 0));
        decryptButton.disabled = !decryptNeeded || decErrors.length > 0;
        decryptButton.setAttribute('aria-disabled', String(!decryptNeeded || decErrors.length > 0));

        for (const [mode, errors] of [['encrypt', encErrors], ['decrypt', decErrors]]) {
            const button = configButtons[mode];
            const bad = errors.length > 0;
            button.classList.toggle('key-button-invalid', bad);
            button.setAttribute('aria-invalid', String(bad));
            button.dataset.errorCount = bad ? String(errors.length) : '';
        }

        // When a modal is open, keep validation attached to that panel.
        // Outside the modal, encryption errors have priority, then decryption.
        const modal = document.getElementById('key-modal');
        const visibleSection = modal && !modal.hidden
            ? modal.querySelector('.key-modal-section:not([hidden])')
            : null;
        const modalMode = visibleSection
            ? (visibleSection.id === 'decrypt-key-section' ? 'decrypt' : 'encrypt')
            : null;
        const showMode = modalMode || (encErrors.length ? 'encrypt' : (decErrors.length ? 'decrypt' : null));
        const errors = showMode === 'encrypt' ? encErrors : (showMode === 'decrypt' ? decErrors : []);
        if (!showMode || errors.length === 0) {
            activeErrors = [];
            // If the current modal panel is now valid, hide its popup even if
            // the other independent panel still has an error.
            if (modalMode) {
                activeMode = modalMode;
                popup.hidden = true;
                popup.replaceChildren();
            } else {
                activeMode = null;
                popup.hidden = true;
                popup.replaceChildren();
            }
        } else {
            activeMode = showMode;
            activeErrors = errors;
            const title = document.createElement('strong');
            title.textContent = `${showMode === 'encrypt' ? 'Encryption' : 'Decryption'} keys: ${errors.length} problem${errors.length === 1 ? '' : 's'}`;
            const list = document.createElement('ul');
            errors.forEach(error => { const li = document.createElement('li'); li.textContent = error.message; list.appendChild(li); });
            popup.replaceChildren(title, list);
            popup.hidden = false;
            requestAnimationFrame(positionPopup);
        }
        return { encErrors, decErrors };
    }

    document.querySelectorAll('#key-modal input').forEach(input => {
        input.addEventListener('input', refresh);
        input.addEventListener('change', refresh);
        input.addEventListener('blur', refresh);
    });
    ciphertext.addEventListener('input', refresh);
    window.addEventListener('resize', positionPopup);
    window.addEventListener('scroll', positionPopup, true);
    document.querySelectorAll('.section-key-button').forEach(button => button.addEventListener('click', () => {
        activeMode = button.dataset.keyTarget.startsWith('decrypt') ? 'decrypt' : 'encrypt';
        setTimeout(() => { refresh(); positionPopup(); }, 0);
    }));

    window.validateKeyPanel = validateKeyPanel;
    window.refreshAllKeyValidation = refresh;
    refresh();
}

function bindJiamiV14Pre2InputNormalizers() {
    bindEncryptTextInput('plaintext', lib1Original);
    bindKeyInput('cbc-key', { maxLength: 4 });
    bindKeyInput('decrypt-cbc-key', { maxLength: 4 });
    bindKeyInput('text-key', { maxLength: 8, unique: true });
    bindKeyInput('decrypt-text-key', { maxLength: 8, unique: true });
    bindKeyInput('matrix-key', { maxLength: 12, unique: true, library: lib2Original });
    bindKeyInput('decrypt-matrix-key', { maxLength: 12, unique: true, library: lib2Original });
    bindKeyInput('sha-key', { allowAllUnicode: true });
    bindKeyInput('decrypt-sha-key', { allowAllUnicode: true });
    bindKeyInput('noise-key', { allowAllUnicode: true });
    bindKeyInput('decrypt-noise-key', { allowAllUnicode: true });
    for (let i = 1; i <= 3; i++) {
        bindKeyInput(`custom-lib${i}`, { maxLength: 95 });
        bindKeyInput(`decrypt-custom-lib${i}`, { maxLength: 95 });
    }
    for (const id of ['num-key','decrypt-num-key','phantom-n','decrypt-phantom-n','phantom-m','decrypt-phantom-m']) bindDigitsOnly(id);
    bindDigitsOnly('lib-status', 6);
    bindDigitsOnly('decrypt-state', 6);
    bindPanelValidation();
}
