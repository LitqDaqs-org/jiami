// implementation note
	const lib1Original = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;':\\\",./<>?`~ ";
	const lib2Original = "1029384756qpwoeirutyalskdjfhgzmxncbvQPWOEIRUTYALSKDJFHGZMXNCBV!)@(#*$&%^_+-={|}[]\\:\";'<?>,/.~` ";
	const lib3Original = "0192837465pqowieurytlaksjdhfgmznxbcvPQOWIEURYTLAKSJDHFGMZNXBCV)!(@*#&$^%+_=-|{}\\][\":';?<>/,.~` ";

        const libSize = lib1Original.length; // all libraries have the same length

        // display preview
        document.getElementById('lib1-preview').textContent = lib1Original;
        document.getElementById('lib2-preview').textContent = lib2Original;
        document.getElementById('lib3-preview').textContent = lib3Original;

        // implementation note
        function formatLibRotation(rotation) {
            return rotation.toString().padStart(2, '0');
        }

        // parse key/state
        function parseLibStatusCode(code) {
            if (code.length !== 6 || !/^\d{6}$/.test(code)) {
                return { lib1Rot: 0, lib2Rot: 0, lib3Rot: 0 };
            }

            return {
                lib1Rot: parseInt(code.substring(0, 2)),
                lib2Rot: parseInt(code.substring(2, 4)),
                lib3Rot: parseInt(code.substring(4, 6))
            };
        }

        // generate key/state
        function generateLibStatusCode(lib1Rot, lib2Rot, lib3Rot) {
            return formatLibRotation(lib1Rot % libSize) +
                   formatLibRotation(lib2Rot % libSize) +
                   formatLibRotation(lib3Rot % libSize);
        }

        // rotate character libraries
        function rotateLib(lib, rotations) {
            rotations = rotations % lib.length;
            if (rotations === 0) return lib;

            return lib.substring(rotations) + lib.substring(0, rotations);
        }

        // enhanced algorithm
        function encryptEnhancedWithRotatingLibs(text, key, initialStateCode) {
            // parse key/state
            const initState = parseLibStatusCode(initialStateCode);

            // initialize display
            let lib1 = rotateLib(lib1Original, initState.lib1Rot);
            let lib2 = rotateLib(lib2Original, initState.lib2Rot);
            let lib3 = rotateLib(lib3Original, initState.lib3Rot);

            // initialize display
            let lib1Rotations = initState.lib1Rot;
            let lib2Rotations = initState.lib2Rot;
            let lib3Rotations = initState.lib3Rot;

            // initialize display
            let lib1RotationCount = 0; // Lib 1 rotations since the last Lib 2 rotation
            let lib2RotationCount = 0; // Lib 2 rotations since the last Lib 3 rotation

            const keyNum = parseInt(key) % libSize;
            let result = "";

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const position = i + 1;

                // implementation note
                const charIndex1 = lib1.indexOf(char);

                if (charIndex1 === -1) {
                    // implementation note
                    result += char;

                    // rotate character libraries
                    lib1 = rotateLib(lib1, 1);
                    lib1Rotations = (lib1Rotations + 1) % libSize;
                    lib1RotationCount++;

                    // rotate character libraries
                    if (lib1RotationCount >= 12) {
                        lib1RotationCount = 0;
                        lib2 = rotateLib(lib2, 1);
                        lib2Rotations = (lib2Rotations + 1) % libSize;
                        lib2RotationCount++;

                        // rotate character libraries
                        if (lib2RotationCount >= 12) {
                            lib2RotationCount = 0;
                            lib3 = rotateLib(lib3, 1);
                            lib3Rotations = (lib3Rotations + 1) % libSize;
                        }
                    }

                    continue;
                }

                // implementation note
                let newIndex1 = (charIndex1 + position + keyNum) % libSize;
                let char1 = lib1[newIndex1];

                // implementation note
                const charIndex2 = lib2.indexOf(char1);
                let newIndex2 = (charIndex2 + position + keyNum) % libSize;
                let char2 = lib2[newIndex2];

                // implementation note
                const charIndex3 = lib3.indexOf(char2);
                let newIndex3 = (charIndex3 + position + keyNum) % libSize;
                let char3 = lib3[newIndex3];

                result += char3;

                // rotate character libraries
                lib1 = rotateLib(lib1, 1);
                lib1Rotations = (lib1Rotations + 1) % libSize;
                lib1RotationCount++;

                // rotate character libraries
                if (lib1RotationCount >= 12) {
                    lib1RotationCount = 0;
                    lib2 = rotateLib(lib2, 1);
                    lib2Rotations = (lib2Rotations + 1) % libSize;
                    lib2RotationCount++;

                    // rotate character libraries
                    if (lib2RotationCount >= 12) {
                        lib2RotationCount = 0;
                        lib3 = rotateLib(lib3, 1);
                        lib3Rotations = (lib3Rotations + 1) % libSize;
                    }
                }
            }

            // implementation note
            const reversedResult = result.split('').reverse().join('');

            // implementation note
            const finalStateCode = generateLibStatusCode(lib1Rotations, lib2Rotations, lib3Rotations);

            return {
                ciphertext: reversedResult + finalStateCode,
                finalState: {
                    lib1Rot: lib1Rotations,
                    lib2Rot: lib2Rotations,
                    lib3Rot: lib3Rotations
                }
            };
        }

        // enhanced algorithm
        function decryptEnhancedWithRotatingLibs(ciphertext, key) {
            if (ciphertext.length < 6) {
                return { success: false, result: "Ciphertext is too short" };
            }

            // extract key/state
            const stateCode = ciphertext.substring(ciphertext.length - 6);
            const finalState = parseLibStatusCode(stateCode);

            // raw ciphertext
            const actualCipher = ciphertext.substring(0, ciphertext.length - 6);

            // implementation note
            const reversedCipher = actualCipher.split('').reverse().join('');

            // rotate character libraries
            const textLength = reversedCipher.length;

            // rotate character libraries
            const totalLib1Rotations = textLength;

            // rotate character libraries
            const totalLib2Rotations = Math.floor(textLength / 12);

            // rotate character libraries
            const totalLib3Rotations = Math.floor(textLength / 144);

            // rotate character libraries
            let initLib1Rot = (finalState.lib1Rot - totalLib1Rotations) % libSize;
            let initLib2Rot = (finalState.lib2Rot - totalLib2Rotations) % libSize;
            let initLib3Rot = (finalState.lib3Rot - totalLib3Rotations) % libSize;

            // implementation note
            if (initLib1Rot < 0) initLib1Rot += libSize;
            if (initLib2Rot < 0) initLib2Rot += libSize;
            if (initLib3Rot < 0) initLib3Rot += libSize;

            // initialize display
            let lib1 = rotateLib(lib1Original, initLib1Rot);
            let lib2 = rotateLib(lib2Original, initLib2Rot);
            let lib3 = rotateLib(lib3Original, initLib3Rot);

            // initialize display
            let lib1RotationCount = 0;
            let lib2RotationCount = 0;

            const keyNum = parseInt(key) % libSize;
            let result = "";

            for (let i = 0; i < reversedCipher.length; i++) {
                const char = reversedCipher[i];
                const position = i + 1;

                // implementation note
                const charIndex3 = lib3.indexOf(char);

                if (charIndex3 === -1) {
                    // implementation note
                    result += char;

                    // rotate character libraries
                    lib1 = rotateLib(lib1, 1);
                    lib1RotationCount++;

                    // rotate character libraries
                    if (lib1RotationCount >= 12) {
                        lib1RotationCount = 0;
                        lib2 = rotateLib(lib2, 1);
                        lib2RotationCount++;

                        // rotate character libraries
                        if (lib2RotationCount >= 12) {
                            lib2RotationCount = 0;
                            lib3 = rotateLib(lib3, 1);
                        }
                    }

                    continue;
                }

                // implementation note
                let originalIndex3 = (charIndex3 - position - keyNum) % libSize;
                if (originalIndex3 < 0) originalIndex3 += libSize;
                let char2 = lib3[originalIndex3];

                // implementation note
                const charIndex2 = lib2.indexOf(char2);
                let originalIndex2 = (charIndex2 - position - keyNum) % libSize;
                if (originalIndex2 < 0) originalIndex2 += libSize;
                let char1 = lib2[originalIndex2];

                // implementation note
                const charIndex1 = lib1.indexOf(char1);
                let originalIndex1 = (charIndex1 - position - keyNum) % libSize;
                if (originalIndex1 < 0) originalIndex1 += libSize;
                let originalChar = lib1[originalIndex1];

                result += originalChar;

                // rotate character libraries
                lib1 = rotateLib(lib1, 1);
                lib1RotationCount++;

                // rotate character libraries
                if (lib1RotationCount >= 12) {
                    lib1RotationCount = 0;
                    lib2 = rotateLib(lib2, 1);
                    lib2RotationCount++;

                    // rotate character libraries
                    if (lib2RotationCount >= 12) {
                        lib2RotationCount = 0;
                        lib3 = rotateLib(lib3, 1);
                    }
                }
            }

            return {
                success: true,
                result: result,
                initialState: {
                    lib1Rot: initLib1Rot,
                    lib2Rot: initLib2Rot,
                    lib3Rot: initLib3Rot
                },
                finalState: finalState
            };
        }

        // get DOM elements
        const plaintextInput = document.getElementById('plaintext');
        const ciphertextInput = document.getElementById('ciphertext');
        const keyInput = document.getElementById('key');
        const libStatusInput = document.getElementById('lib-status');
        const encryptBtn = document.getElementById('encrypt-btn');
        const decryptBtn = document.getElementById('decrypt-btn');
        const encryptedResult = document.getElementById('encrypted-result');
        const decryptedResult = document.getElementById('decrypted-result');
        const clearEncryptBtn = document.getElementById('clear-encrypt');
        const clearDecryptBtn = document.getElementById('clear-decrypt');
        const lib1RotationsDisplay = document.getElementById('lib1-rotations');
        const lib2RotationsDisplay = document.getElementById('lib2-rotations');
        const lib3RotationsDisplay = document.getElementById('lib3-rotations');
        const detectedLib1Display = document.getElementById('detected-lib1');
        const detectedLib2Display = document.getElementById('detected-lib2');
        const detectedLib3Display = document.getElementById('detected-lib3');

        // implementation note
        function clampKeyInput() {
            let keyValue = parseInt(keyInput.value) || 0;

            if (keyValue < 0) {
                keyValue = 0;
            } else if (keyValue > 94) {
                keyValue = 94;
            }

            keyInput.value = keyValue;
        }

        // implementation note
        function clampLibStatusInput() {
            let statusValue = libStatusInput.value;

            // implementation note
            statusValue = statusValue.replace(/\D/g, '');

            // implementation note
            if (statusValue.length > 6) {
                statusValue = statusValue.substring(0, 6);
            }

            libStatusInput.value = statusValue;

            // display preview
            if (statusValue.length === 6) {
                const state = parseLibStatusCode(statusValue);
                lib1RotationsDisplay.textContent = formatLibRotation(state.lib1Rot);
                lib2RotationsDisplay.textContent = formatLibRotation(state.lib2Rot);
                lib3RotationsDisplay.textContent = formatLibRotation(state.lib3Rot);
            }
        }

        // event handling
        encryptBtn.addEventListener('click', function() {
            const plaintext = plaintextInput.value;
            if (plaintext.trim() === "") {
                encryptedResult.textContent = "Please enter text to encrypt";
                return;
            }

            const key = parseInt(keyInput.value) || 0;
            const libStatus = libStatusInput.value.padEnd(6, '0').substring(0, 6);

            const result = encryptEnhancedWithRotatingLibs(plaintext, key, libStatus);

            encryptedResult.textContent = result.ciphertext;

            // rotate character libraries
            lib1RotationsDisplay.textContent = formatLibRotation(result.finalState.lib1Rot);
            lib2RotationsDisplay.textContent = formatLibRotation(result.finalState.lib2Rot);
            lib3RotationsDisplay.textContent = formatLibRotation(result.finalState.lib3Rot);

            // auto-fill decryption input
            ciphertextInput.value = result.ciphertext;

            // display preview
            const detectedState = parseLibStatusCode(result.ciphertext.substring(result.ciphertext.length - 6));
            detectedLib1Display.textContent = formatLibRotation(detectedState.lib1Rot);
            detectedLib2Display.textContent = formatLibRotation(detectedState.lib2Rot);
            detectedLib3Display.textContent = formatLibRotation(detectedState.lib3Rot);
        });

        // event handling
        decryptBtn.addEventListener('click', function() {
            const ciphertext = ciphertextInput.value;
            if (ciphertext.trim() === "") {
                decryptedResult.textContent = "Please enter text to decrypt";
                return;
            }

            if (ciphertext.length < 6) {
                decryptedResult.textContent = "Ciphertext is too short,cannot decrypt";
                decryptedResult.style.color = "#ff4444";
                return;
            }

            const key = parseInt(keyInput.value) || 0;
            const result = decryptEnhancedWithRotatingLibs(ciphertext, key);

            if (result.success) {
                decryptedResult.textContent = result.result;
                decryptedResult.style.color = "#ffd166";

                // implementation note
                const initialStateCode = generateLibStatusCode(
                    result.initialState.lib1Rot,
                    result.initialState.lib2Rot,
                    result.initialState.lib3Rot
                );
                libStatusInput.value = initialStateCode;
                clampLibStatusInput();

                // display preview
                detectedLib1Display.textContent = formatLibRotation(result.finalState.lib1Rot);
                detectedLib2Display.textContent = formatLibRotation(result.finalState.lib2Rot);
                detectedLib3Display.textContent = formatLibRotation(result.finalState.lib3Rot);
            } else {
                decryptedResult.textContent = "Decryption failed: " + result.result;
                decryptedResult.style.color = "#ff4444";
            }
        });

        // event handling
        clearEncryptBtn.addEventListener('click', function() {
            plaintextInput.value = "";
            encryptedResult.textContent = "Waiting to encrypt...";
        });

        clearDecryptBtn.addEventListener('click', function() {
            ciphertextInput.value = "";
            decryptedResult.textContent = "Waiting to decrypt...";
        });

        // implementation note
        window.addEventListener('load', function() {
            const exampleText = "Made by Litaiqi_Daquavis";
            const exampleKey = 1;
            const exampleLibStatus = "000000";

            plaintextInput.value = exampleText;
            keyInput.value = exampleKey;
            libStatusInput.value = exampleLibStatus;

            // calculate index
            const result = encryptEnhancedWithRotatingLibs(exampleText, exampleKey, exampleLibStatus);

            encryptedResult.textContent = result.ciphertext;

            // rotate character libraries
            lib1RotationsDisplay.textContent = formatLibRotation(result.finalState.lib1Rot);
            lib2RotationsDisplay.textContent = formatLibRotation(result.finalState.lib2Rot);
            lib3RotationsDisplay.textContent = formatLibRotation(result.finalState.lib3Rot);

            // implementation note
            ciphertextInput.value = result.ciphertext;

            // display preview
            const detectedState = parseLibStatusCode(result.ciphertext.substring(result.ciphertext.length - 6));
            detectedLib1Display.textContent = formatLibRotation(detectedState.lib1Rot);
            detectedLib2Display.textContent = formatLibRotation(detectedState.lib2Rot);
            detectedLib3Display.textContent = formatLibRotation(detectedState.lib3Rot);

            // implementation note
            const decrypted = decryptEnhancedWithRotatingLibs(result.ciphertext, exampleKey);
            if (decrypted.success) {
                decryptedResult.textContent = decrypted.result;
            }
        });

        // implementation note
        keyInput.addEventListener('input', clampKeyInput);
        keyInput.addEventListener('change', clampKeyInput);
        libStatusInput.addEventListener('input', clampLibStatusInput);
        libStatusInput.addEventListener('change', clampLibStatusInput);

        // implementation note
        clampKeyInput();
        clampLibStatusInput();
