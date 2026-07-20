// define character set
        const charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
        
        
        // encryption function
        function encrypt(text) {
            let result = "";
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
                let newIndex = charIndex + position;
                
                // conditional handling
                while (newIndex >= charset.length) {
                    newIndex -= charset.length;
                }
                
                result += charset[newIndex];
            }
            return result;
        }
        
        // decryption function
        function decrypt(text) {
            let result = "";
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
                let originalIndex = charIndex - position;
                
                // conditional handling
                while (originalIndex < 0) {
                    originalIndex += charset.length;
                }
                
                result += charset[originalIndex];
            }
            return result;
        }
        
        // get DOM elements
        const plaintextInput = document.getElementById('plaintext');
        const ciphertextInput = document.getElementById('ciphertext');
        const encryptBtn = document.getElementById('encrypt-btn');
        const decryptBtn = document.getElementById('decrypt-btn');
        const encryptedResult = document.getElementById('encrypted-result');
        const decryptedResult = document.getElementById('decrypted-result');
        const clearEncryptBtn = document.getElementById('clear-encrypt');
        const clearDecryptBtn = document.getElementById('clear-decrypt');
        
        // event handling
        encryptBtn.addEventListener('click', function() {
            const plaintext = plaintextInput.value;
            if (plaintext.trim() === "") {
                encryptedResult.textContent = "Please enter text to encrypt";
                encryptedResult.style.color = "#f44336";
                return;
            }
            
            const encrypted = encrypt(plaintext);
            encryptedResult.textContent = encrypted;
            encryptedResult.style.color = "#4CAF50";
            
            // auto-fill decryption input
            ciphertextInput.value = encrypted;
        });
        
        // event handling
        decryptBtn.addEventListener('click', function() {
            const ciphertext = ciphertextInput.value;
            if (ciphertext.trim() === "") {
                decryptedResult.textContent = "Please enter text to decrypt";
                decryptedResult.style.color = "#f44336";
                return;
            }
            
            const decrypted = decrypt(ciphertext);
            decryptedResult.textContent = decrypted;
            decryptedResult.style.color = "#4CAF50";
            
            // auto-fill decryption input
            plaintextInput.value = decrypted;
        });
        
        // encryption section
        clearEncryptBtn.addEventListener('click', function() {
            plaintextInput.value = "";
            encryptedResult.textContent = "Waiting to encrypt...";
            encryptedResult.style.color = "#4CAF50";
        });
        
        // decryption section
        clearDecryptBtn.addEventListener('click', function() {
            ciphertextInput.value = "";
            decryptedResult.textContent = "Waiting to decrypt...";
            decryptedResult.style.color = "#4CAF50";
        });
        
        // implementation note
        window.addEventListener('load', function() {
            const exampleText = "Made by Litaiqi_Daquavis";
            plaintextInput.value = exampleText;
            
            // implementation note
            const encryptedExample = encrypt(exampleText);
            encryptedResult.textContent = encryptedExample;
            encryptedResult.style.color = "#4CAF50";
            
            // display preview
            ciphertextInput.value = encryptedExample;
            
            // implementation note
            const decryptedExample = decrypt(encryptedExample);
            decryptedResult.textContent = decryptedExample;
            decryptedResult.style.color = "#4CAF50";
        });
        // implementation note
        plaintextInput.addEventListener('input', function() {
            const text = plaintextInput.value;
            let invalidChars = [];
            
            for (let char of text) {
                if (charset.indexOf(char) === -1 && char !== ' ' && char !== '\n') {
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
