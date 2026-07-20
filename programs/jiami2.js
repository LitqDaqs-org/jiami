// define character set
        const charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;':\",./<>?`~ ";
        const charsetSize = charset.length;

        // initialize display
        document.getElementById('charset-length').textContent = charsetSize;


        // implementation note
        function formatKey(key) {
            let keyNum = parseInt(key) % charsetSize;
            return keyNum.toString().padStart(3, '0');
        }

        // encryption function
        function encryptWithKey(text, key) {
            let result = "";
            const keyNum = parseInt(key) % charsetSize;

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const position = i + 1; // 1-based character position
                const charIndex = charset.indexOf(char);

                // conditional handling
                if (charIndex === -1) {
                    result += char;
                    continue;
                }

                // calculate index
                let newIndex = charIndex + position + keyNum;

                // handle range overflow
                while (newIndex >= charsetSize) {
                    newIndex -= charsetSize;
                }

                result += charset[newIndex];
            }

            // implementation note
            return result + formatKey(keyNum);
        }

        // decryption function
        function decryptWithKey(ciphertext) {
            // conditional handling
            if (ciphertext.length < 3) {
                return {success: false, error: "Ciphertext is too short,Cannot extractkey"};
            }

            // extract key/state
            const keyStr = ciphertext.substring(ciphertext.length - 3);
            const keyNum = parseInt(keyStr) % charsetSize;

            // raw ciphertext
            const actualCipher = ciphertext.substring(0, ciphertext.length - 3);
            let result = "";

            for (let i = 0; i < actualCipher.length; i++) {
                const char = actualCipher[i];
                const position = i + 1; // 1-based character position
                const charIndex = charset.indexOf(char);

                // conditional handling
                if (charIndex === -1) {
                    result += char;
                    continue;
                }

                // calculate index
                let originalIndex = charIndex - position - keyNum;

                // handle range overflow
                while (originalIndex < 0) {
                    originalIndex += charsetSize;
                }

                result += charset[originalIndex];
            }

            return {success: true, result: result, key: keyNum, formattedKey: keyStr};
        }

        // get DOM elements
        const plaintextInput = document.getElementById('plaintext');
        const ciphertextInput = document.getElementById('ciphertext');
        const keyInput = document.getElementById('key');
        const keyDisplay = document.getElementById('key-display');
        const encryptBtn = document.getElementById('encrypt-btn');
        const decryptBtn = document.getElementById('decrypt-btn');
        const generateKeyBtn = document.getElementById('generate-key-btn');
        const encryptedResult = document.getElementById('encrypted-result');
        const decryptedResult = document.getElementById('decrypted-result');
        const detectedKeyDisplay = document.getElementById('detected-key');
        const keyStatusDisplay = document.getElementById('key-status');
        const clearEncryptBtn = document.getElementById('clear-encrypt');
        const clearDecryptBtn = document.getElementById('clear-decrypt');
        const encryptStatus = document.getElementById('encrypt-status');
        const decryptStatus = document.getElementById('decrypt-status');

        // display preview
        function updateKeyDisplay() {
            const keyValue = parseInt(keyInput.value) || 0;
            const formattedKey = formatKey(keyValue);
            keyDisplay.textContent = formattedKey;

            // implementation note
            keyInput.max = charsetSize;
        }

        // initialize display
        updateKeyDisplay();

        // display preview
        keyInput.addEventListener('input', updateKeyDisplay);

        // generate key/state
        generateKeyBtn.addEventListener('click', function() {
            const randomKey = Math.floor(Math.random() * charsetSize);
            keyInput.value = randomKey;
            updateKeyDisplay();
        });

        // event handling
        encryptBtn.addEventListener('click', function() {
            const plaintext = plaintextInput.value;
            if (plaintext.trim() === "") {
                encryptedResult.textContent = "Please enter text to encrypt";
                encryptedResult.style.color = "#f44336";
                encryptStatus.textContent = "Error: Please enter text to encrypt";
                encryptStatus.className = "status error";
                return;
            }

            const key = parseInt(keyInput.value) || 0;
            const encrypted = encryptWithKey(plaintext, key);
            encryptedResult.textContent = encrypted;
            encryptedResult.style.color = "#4CAF50";

            // auto-fill decryption input
            ciphertextInput.value = encrypted;

            // Update state
            encryptStatus.textContent = `Encryption successful! Key: ${formatKey(key)},appended to ciphertext`;
            encryptStatus.className = "status success";

            // decryption section
            analyzeCiphertext();
        });

        // extract key/state
        function analyzeCiphertext() {
            const ciphertext = ciphertextInput.value;
            if (ciphertext.length < 3) {
                detectedKeyDisplay.textContent = "Cannot extract";
                keyStatusDisplay.textContent = "Ciphertext is too short";
                keyStatusDisplay.style.color = "#f44336";
                return;
            }

            // extract key/state
            const keyStr = ciphertext.substring(ciphertext.length - 3);

            // implementation note
            if (/^\d{3}$/.test(keyStr)) {
                const keyNum = parseInt(keyStr);
                detectedKeyDisplay.textContent = `${keyStr} (${keyNum})`;
                keyStatusDisplay.textContent = "Key recognized";
                keyStatusDisplay.style.color = "#4CAF50";
            } else {
                detectedKeyDisplay.textContent = "Invalid format";
                keyStatusDisplay.textContent = "Last three digits are not a valid key";
                keyStatusDisplay.style.color = "#f44336";
            }
        }

        // event handling
        decryptBtn.addEventListener('click', function() {
            const ciphertext = ciphertextInput.value;
            if (ciphertext.trim() === "") {
                decryptedResult.textContent = "Please enter text to decrypt";
                decryptedResult.style.color = "#f44336";
                decryptStatus.textContent = "Error: Please enter text to decrypt";
                decryptStatus.className = "status error";
                return;
            }

            if (ciphertext.length < 3) {
                decryptedResult.textContent = "Ciphertext is too short,cannot decrypt";
                decryptedResult.style.color = "#f44336";
                decryptStatus.textContent = "Error: Ciphertext length is less than 3 digits; cannot extract key";
                decryptStatus.className = "status error";
                return;
            }

            const result = decryptWithKey(ciphertext);

            if (result.success) {
                decryptedResult.textContent = result.result;
                decryptedResult.style.color = "#4CAF50";

                // auto-fill decryption input
                plaintextInput.value = result.result;

                // implementation note
                keyInput.value = result.key;
                updateKeyDisplay();

                decryptStatus.textContent = `Decryption successful! Key used: ${result.formattedKey}`;
                decryptStatus.className = "status success";
            } else {
                decryptedResult.textContent = result.error;
                decryptedResult.style.color = "#f44336";
                decryptStatus.textContent = "Decryption failed";
                decryptStatus.className = "status error";
            }
        });

        // implementation note
        ciphertextInput.addEventListener('input', analyzeCiphertext);

        // encryption section
        clearEncryptBtn.addEventListener('click', function() {
            plaintextInput.value = "";
            keyInput.value = "0";
            updateKeyDisplay();
            encryptedResult.textContent = "Waiting to encrypt...";
            encryptedResult.style.color = "#4CAF50";
            encryptStatus.textContent = "";
            encryptStatus.className = "status";
        });

        // decryption section
        clearDecryptBtn.addEventListener('click', function() {
            ciphertextInput.value = "";
            decryptedResult.textContent = "Waiting to decrypt...";
            decryptedResult.style.color = "#4CAF50";
            detectedKeyDisplay.textContent = "Not detected";
            keyStatusDisplay.textContent = "Waiting for input";
            keyStatusDisplay.style.color = "";
            decryptStatus.textContent = "";
            decryptStatus.className = "status";
        });

        // implementation note
        window.addEventListener('load', function() {
            const exampleText = "Made by Litaiqi_Daquavis";
            plaintextInput.value = exampleText;

            // implementation note
            keyInput.value = 42;
            updateKeyDisplay();

            // implementation note
            const encryptedExample = encryptWithKey(exampleText, 42);
            encryptedResult.textContent = encryptedExample;
            encryptedResult.style.color = "#4CAF50";

            // display preview
            ciphertextInput.value = encryptedExample;

            // implementation note
            analyzeCiphertext();

            // implementation note
            const decryptedResultObj = decryptWithKey(encryptedExample);
            if (decryptedResultObj.success) {
                decryptedResult.textContent = decryptedResultObj.result;
                decryptedResult.style.color = "#4CAF50";
            }

            encryptStatus.textContent = "Sample text loaded. Enter your text and click Encrypt to begin.";
            encryptStatus.className = "status success";
        });

        // implementation note
        plaintextInput.addEventListener('input', function() {
            const text = plaintextInput.value;
            let invalidChars = [];

            for (let char of text) {
                if (charset.indexOf(char) === -1) {
                    if (!invalidChars.includes(char)) {
                        invalidChars.push(char);
                    }
                }
            }

            if (invalidChars.length > 0) {
                plaintextInput.style.borderColor = "#ff9800";
                plaintextInput.title = "Contains unsupported characters for encryption: " + invalidChars.join(', ');
            } else {
                plaintextInput.style.borderColor = "";
                plaintextInput.title = "";
            }
        });
