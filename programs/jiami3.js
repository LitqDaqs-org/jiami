// Define character set
        const charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;':\",./<>?`~ ";
        const charsetSize = charset.length;

        // Format key as three digits
        function formatKey(key) {
            let keyNum = parseInt(key) % charsetSize;
            return keyNum.toString().padStart(3, '0');
        }

        // Basic encryption algorithm (position + key)
        function encryptBasic(text, key) {
            let result = "";
            const keyNum = parseInt(key) % charsetSize;

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const position = i + 1;
                const charIndex = charset.indexOf(char);

                if (charIndex === -1) {
                    result += char;
                    continue;
                }

                let newIndex = charIndex + position + keyNum;
                while (newIndex >= charsetSize) {
                    newIndex -= charsetSize;
                }
                while (newIndex < 0) {
                    newIndex += charsetSize;
                }

                result += charset[newIndex];
            }

            return result + formatKey(keyNum);
        }

        // Basic decryption algorithm
        function decryptBasic(ciphertext) {
            if (ciphertext.length < 3) {
                return {success: false, result: "Ciphertext is too short"};
            }

            const keyStr = ciphertext.substring(ciphertext.length - 3);
            const keyNum = parseInt(keyStr) % charsetSize;
            const actualCipher = ciphertext.substring(0, ciphertext.length - 3);
            let result = "";

            for (let i = 0; i < actualCipher.length; i++) {
                const char = actualCipher[i];
                const position = i + 1;
                const charIndex = charset.indexOf(char);

                if (charIndex === -1) {
                    result += char;
                    continue;
                }

                let originalIndex = charIndex - position - keyNum;
                while (originalIndex < 0) {
                    originalIndex += charsetSize;
                }

                result += charset[originalIndex];
            }

            return {success: true, result: result, key: keyNum};
        }

        // Enhanced encryption algorithm (position + key + reversal)
        function encryptEnhanced(text, key) {
            // Encrypt with the basic algorithm first
            const basicResult = encryptBasic(text, key);
            // Remove the key part
            const cipherBody = basicResult.substring(0, basicResult.length - 3);
            const keyPart = basicResult.substring(basicResult.length - 3);

            // Reverse the ciphertext body
            const reversedBody = cipherBody.split('').reverse().join('');

            return reversedBody + keyPart;
        }

        // Enhanced decryption algorithm
        function decryptEnhanced(ciphertext) {
            if (ciphertext.length < 3) {
                return {success: false, result: "Ciphertext is too short"};
            }

            const keyStr = ciphertext.substring(ciphertext.length - 3);
            const keyNum = parseInt(keyStr) % charsetSize;
            const reversedBody = ciphertext.substring(0, ciphertext.length - 3);

            // Reverse back to the basic ciphertext
            const cipherBody = reversedBody.split('').reverse().join('');
            const fullCipher = cipherBody + keyStr;

            // Decrypt with the basic algorithm
            return decryptBasic(fullCipher);
        }

        // Get DOM elements
        const plaintextInput = document.getElementById('plaintext');
        const ciphertextInput = document.getElementById('ciphertext');
        const keyInput = document.getElementById('key');
        const keyDisplay = document.getElementById('key-display');
        const encryptBtn = document.getElementById('encrypt-btn');
        const decryptBtn = document.getElementById('decrypt-btn');
        const encryptedResult = document.getElementById('encrypted-result');
        const decryptedResult = document.getElementById('decrypted-result');
        const clearEncryptBtn = document.getElementById('clear-encrypt');
        const clearDecryptBtn = document.getElementById('clear-decrypt');

        // Update key display
        function updateKeyDisplay() {
            const keyValue = parseInt(keyInput.value) || 0;
            const formattedKey = formatKey(keyValue);
            keyDisplay.textContent = formattedKey;
        }

        // Initialize
        updateKeyDisplay();

        // Update display when key input changes
        keyInput.addEventListener('input', updateKeyDisplay);

        // Encrypt button event
        encryptBtn.addEventListener('click', function() {
            const plaintext = plaintextInput.value;
            if (plaintext.trim() === "") {
                encryptedResult.textContent = "Please enter text to encrypt";
                return;
            }

            const key = parseInt(keyInput.value) || 0;
            const encrypted = encryptEnhanced(plaintext, key);

            encryptedResult.textContent = encrypted;

            // Auto-fill the decrypt input
            ciphertextInput.value = encrypted;
        });

        // Decrypt button event
        decryptBtn.addEventListener('click', function() {
            const ciphertext = ciphertextInput.value;
            if (ciphertext.trim() === "") {
                decryptedResult.textContent = "Please enter text to decrypt";
                return;
            }

            const result = decryptEnhanced(ciphertext);

            if (result.success) {
                decryptedResult.textContent = result.result;
                decryptedResult.style.color = "#ffd166";

                // Update key display
                keyInput.value = result.key;
                updateKeyDisplay();
            } else {
                decryptedResult.textContent = "Decryption failed: " + result.result;
                decryptedResult.style.color = "#ff4444";
            }
        });

        // Clear button events
        clearEncryptBtn.addEventListener('click', function() {
            plaintextInput.value = "";
            encryptedResult.textContent = "Waiting for encryption...";
        });

        clearDecryptBtn.addEventListener('click', function() {
            ciphertextInput.value = "";
            decryptedResult.textContent = "Waiting for decryption...";
        });

        // Example on page load
        window.addEventListener('load', function() {
            const exampleText = "Made by Litaiqi_Daquavis";
            const exampleKey = 1;

            plaintextInput.value = exampleText;
            keyInput.value = exampleKey;
            updateKeyDisplay();

            // Calculate example
            const enhancedEncrypted = encryptEnhanced(exampleText, exampleKey);

            encryptedResult.textContent = enhancedEncrypted;

            // Fill decrypt input
            ciphertextInput.value = enhancedEncrypted;

            // Decrypt example
            const decrypted = decryptEnhanced(enhancedEncrypted);
            if (decrypted.success) {
                decryptedResult.textContent = decrypted.result;
            }
        });
