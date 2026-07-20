(function () {
    'use strict';

    // Jiami v14 supports the 95 printable ASCII characters (space through ~).
    const SUPPORTED_CHARS = Array.from({ length: 95 }, (_, i) => String.fromCharCode(i + 32)).join('');

    function normalizeText(value, options = {}) {
        const {
            maxLength = Infinity,
            unique = false,
            digitsOnly = false,
            supportedOnly = false
        } = options;

        let result = '';
        for (const char of Array.from(String(value || ''))) {
            if (digitsOnly && !/\d/.test(char)) continue;
            if (supportedOnly && !SUPPORTED_CHARS.includes(char)) continue;
            if (unique && result.includes(char)) continue;
            result += char;
            if (Array.from(result).length >= maxLength) break;
        }
        return result;
    }

    function bindNormalizer(inputId, options) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const normalize = function () {
            const fixed = normalizeText(input.value, options);
            if (fixed === input.value) return;

            const cursor = input.selectionStart;
            input.value = fixed;
            if (cursor !== null) {
                const nextCursor = Math.min(cursor, fixed.length);
                input.setSelectionRange(nextCursor, nextCursor);
            }
            input.dispatchEvent(new Event('change', { bubbles: true }));
        };

        input.addEventListener('input', normalize);
        input.addEventListener('blur', normalize);
        normalize();
    }

    function bindV14InputNormalizers() {
        // Plaintext and fixed-length keys used by the v14 algorithm.
        bindNormalizer('plaintext', { supportedOnly: true });
        bindNormalizer('cbc-key', { supportedOnly: true, maxLength: 4 });
        bindNormalizer('decrypt-cbc-key', { supportedOnly: true, maxLength: 4 });
        bindNormalizer('text-key', { supportedOnly: true, unique: true, maxLength: 8 });
        bindNormalizer('decrypt-text-key', { supportedOnly: true, unique: true, maxLength: 8 });
        bindNormalizer('matrix-key', { supportedOnly: true, unique: true, maxLength: 12 });
        bindNormalizer('decrypt-matrix-key', { supportedOnly: true, unique: true, maxLength: 12 });

        // Numeric fields.
        for (const id of [
            'num-key', 'decrypt-num-key',
            'phantom-n', 'decrypt-phantom-n',
            'phantom-m', 'decrypt-phantom-m'
        ]) {
            bindNormalizer(id, { digitsOnly: true, maxLength: 2 });
        }
        bindNormalizer('lib-status', { digitsOnly: true, maxLength: 6 });
        bindNormalizer('decrypt-state', { digitsOnly: true, maxLength: 6 });

        // Custom libraries must use the same supported character set.
        for (let i = 1; i <= 3; i++) {
            bindNormalizer(`custom-lib${i}`, { supportedOnly: true, unique: true, maxLength: 95 });
            bindNormalizer(`decrypt-custom-lib${i}`, { supportedOnly: true, unique: true, maxLength: 95 });
        }

        // SHA and Noise keys intentionally remain unrestricted so Unicode works.
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindV14InputNormalizers);
    } else {
        bindV14InputNormalizers();
    }
})();
