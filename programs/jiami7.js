// ========== character library definitions (escaping fixed) ==========
        const lib1Original = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;':\\\",./<>?`~ ";
        const lib2Original = "1029384756qpwoeirutyalskdjfhgzmxncbvQPWOEIRUTYALSKDJFHGZMXNCBV!)@(#*$&%^_+-={|}[]\\:\";'<?>,/.~` ";
        const lib3Original = "0192837465pqowieurytlaksjdhfgmznxbcvPQOWIEURYTLAKSJDHFGMZNXBCV)!(@*#&$^%+_=-|{}\\][\":';?<>/,.~` ";
        
        const libSize = lib1Original.length; // 95
        
        // ========== utility functions ==========
        function formatLibRotation(rotation) {
            return rotation.toString().padStart(2, '0');
        }
        
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
        
        function generateLibStatusCode(lib1Rot, lib2Rot, lib3Rot) {
            return formatLibRotation(lib1Rot % libSize) + 
                   formatLibRotation(lib2Rot % libSize) + 
                   formatLibRotation(lib3Rot % libSize);
        }
        
        function rotateLib(lib, rotations) {
            rotations = rotations % lib.length;
            if (rotations === 0) return lib;
            return lib.substring(rotations) + lib.substring(0, rotations);
        }
        
        // ========== v5 position shufflelayer ==========
        function shufflePositions(text) {
            const chars = text.split('');
            const smallGroups = [];
            for (let i = 0; i < chars.length; i += 3) {
                smallGroups.push(chars.slice(i, Math.min(i + 3, chars.length)));
            }
            let fullSmallGroupCount = 0;
            for (const sg of smallGroups) {
                if (sg.length === 3) fullSmallGroupCount++;
                else break;
            }
            const fullBigGroupCount = Math.floor(fullSmallGroupCount / 3);
            const bigGroups = [];
            for (let i = 0; i < fullBigGroupCount; i++) {
                bigGroups.push([
                    smallGroups[i * 3].slice(),
                    smallGroups[i * 3 + 1].slice(),
                    smallGroups[i * 3 + 2].slice()
                ]);
            }
            const remainderGroups = [];
            for (let i = fullBigGroupCount * 3; i < smallGroups.length; i++) {
                remainderGroups.push(smallGroups[i].slice());
            }
            for (const bg of bigGroups) {
                const first = bg[1][0];
                bg[1] = [bg[1][1], bg[1][2], first];
                const last = bg[2][2];
                bg[2] = [last, bg[2][0], bg[2][1]];
            }
            bigGroups.reverse();
            let result = [];
            for (const bg of bigGroups) for (const sg of bg) result = result.concat(sg);
            for (const sg of remainderGroups) result = result.concat(sg);
            return result.join('');
        }
        
        function unshufflePositions(text) {
            const chars = text.split('');
            const smallGroups = [];
            for (let i = 0; i < chars.length; i += 3) {
                smallGroups.push(chars.slice(i, Math.min(i + 3, chars.length)));
            }
            let fullSmallGroupCount = 0;
            for (const sg of smallGroups) {
                if (sg.length === 3) fullSmallGroupCount++;
                else break;
            }
            const fullBigGroupCount = Math.floor(fullSmallGroupCount / 3);
            const bigGroups = [];
            for (let i = 0; i < fullBigGroupCount; i++) {
                bigGroups.push([
                    smallGroups[i * 3].slice(),
                    smallGroups[i * 3 + 1].slice(),
                    smallGroups[i * 3 + 2].slice()
                ]);
            }
            const remainderGroups = [];
            for (let i = fullBigGroupCount * 3; i < smallGroups.length; i++) {
                remainderGroups.push(smallGroups[i].slice());
            }
            bigGroups.reverse();
            for (const bg of bigGroups) {
                const last = bg[1][2];
                bg[1] = [last, bg[1][0], bg[1][1]];
                const first = bg[2][0];
                bg[2] = [bg[2][1], bg[2][2], first];
            }
            let result = [];
            for (const bg of bigGroups) for (const sg of bg) result = result.concat(sg);
            for (const sg of remainderGroups) result = result.concat(sg);
            return result.join('');
        }
        
        // ========== v6 chained avalanche ==========
        function chainAvalanche(text) {
            if (text.length === 0) return text;
            let result = text.split('');
            for (let i = 0; i < result.length - 1; i++) {
                const cNorm = result[i].charCodeAt(0) - 32;
                const nNorm = result[i + 1].charCodeAt(0) - 32;
                const mixed = (nNorm + cNorm) % 95 + 32;
                result[i + 1] = String.fromCharCode(mixed);
            }
            return result.join('');
        }
        
        function chainAvalancheReverse(text) {
            if (text.length === 0) return text;
            let result = text.split('');
            for (let i = result.length - 2; i >= 0; i--) {
                const cNorm = result[i].charCodeAt(0) - 32;
                const mixedNorm = result[i + 1].charCodeAt(0) - 32;
                let nNorm = (mixedNorm - cNorm) % 95;
                if (nNorm < 0) nNorm += 95;
                result[i + 1] = String.fromCharCode(nNorm + 32);
            }
            return result.join('');
        }
        
        // ========== v7 column transposition ==========
        function columnTranspose(text, key) {
            if (text.length === 0 || key.length === 0) return text;
            const numCols = key.length;
            const numRows = Math.ceil(text.length / numCols);
            const grid = [];
            for (let i = 0; i < numRows; i++) {
                grid[i] = [];
                for (let j = 0; j < numCols; j++) {
                    const index = i * numCols + j;
                    grid[i][j] = index < text.length ? text[index] : '';
                }
            }
            const keyOrder = key.split('').map((char, index) => ({
                char: char, index: index
            })).sort((a, b) => a.char.localeCompare(b.char));
            let result = '';
            for (let order of keyOrder) {
                const colIndex = order.index;
                for (let row = 0; row < numRows; row++) {
                    if (grid[row][colIndex]) {
                        result += grid[row][colIndex];
                    }
                }
            }
            return result;
        }
        
        function columnTransposeReverse(text, key) {
            if (text.length === 0 || key.length === 0) return text;
            const numCols = key.length;
            const numRows = Math.ceil(text.length / numCols);
            const remainder = text.length % numCols;
            const colLengths = [];
            for (let i = 0; i < numCols; i++) {
                if (remainder === 0 || i < remainder) {
                    colLengths[i] = numRows;
                } else {
                    colLengths[i] = numRows - 1;
                }
            }
            const keyOrder = key.split('').map((char, index) => ({
                char: char, index: index
            })).sort((a, b) => a.char.localeCompare(b.char));
            const columns = [];
            let pos = 0;
            for (let order of keyOrder) {
                const colIndex = order.index;
                const length = colLengths[colIndex];
                columns[colIndex] = text.substring(pos, pos + length);
                pos += length;
            }
            let result = '';
            for (let row = 0; row < numRows; row++) {
                for (let col = 0; col < numCols; col++) {
                    if (row < columns[col].length) {
                        result += columns[col][row];
                    }
                }
            }
            return result;
        }
        
        // ========== v7 key split (removed; key info output separately) ==========

        // implementation note
        function tripleLibEncrypt(text, key, initialStateCode) {
            const initState = parseLibStatusCode(initialStateCode);
            let lib1 = rotateLib(lib1Original, initState.lib1Rot);
            let lib2 = rotateLib(lib2Original, initState.lib2Rot);
            let lib3 = rotateLib(lib3Original, initState.lib3Rot);
            let lib1Rotations = initState.lib1Rot;
            let lib2Rotations = initState.lib2Rot;
            let lib3Rotations = initState.lib3Rot;
            let lib1RotationCount = 0;
            let lib2RotationCount = 0;
            const keyNum = parseInt(key) % libSize;
            let result = "";
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const position = i + 1;
                const charIndex1 = lib1.indexOf(char);
                
                if (charIndex1 === -1) {
                    result += char;
                    lib1 = rotateLib(lib1, 1);
                    lib1Rotations = (lib1Rotations + 1) % libSize;
                    lib1RotationCount++;
                    if (lib1RotationCount >= 12) {
                        lib1RotationCount = 0;
                        lib2 = rotateLib(lib2, 1);
                        lib2Rotations = (lib2Rotations + 1) % libSize;
                        lib2RotationCount++;
                        if (lib2RotationCount >= 12) {
                            lib2RotationCount = 0;
                            lib3 = rotateLib(lib3, 1);
                            lib3Rotations = (lib3Rotations + 1) % libSize;
                        }
                    }
                    continue;
                }
                
                let newIndex1 = (charIndex1 + position + keyNum) % libSize;
                let char1 = lib1[newIndex1];
                const charIndex2 = lib2.indexOf(char1);
                let newIndex2 = (charIndex2 + position + keyNum) % libSize;
                let char2 = lib2[newIndex2];
                const charIndex3 = lib3.indexOf(char2);
                let newIndex3 = (charIndex3 + position + keyNum) % libSize;
                let char3 = lib3[newIndex3];
                result += char3;
                
                lib1 = rotateLib(lib1, 1);
                lib1Rotations = (lib1Rotations + 1) % libSize;
                lib1RotationCount++;
                if (lib1RotationCount >= 12) {
                    lib1RotationCount = 0;
                    lib2 = rotateLib(lib2, 1);
                    lib2Rotations = (lib2Rotations + 1) % libSize;
                    lib2RotationCount++;
                    if (lib2RotationCount >= 12) {
                        lib2RotationCount = 0;
                        lib3 = rotateLib(lib3, 1);
                        lib3Rotations = (lib3Rotations + 1) % libSize;
                    }
                }
            }
            
            return {
                ciphertext: result,
                finalState: {
                    lib1Rot: lib1Rotations,
                    lib2Rot: lib2Rotations,
                    lib3Rot: lib3Rotations
                }
            };
        }
        
        // ========== Triple rotating librariesDecrypt ==========
        function tripleLibDecrypt(ciphertext, key, finalStateCode) {
            const finalState = parseLibStatusCode(finalStateCode);
            const textLength = ciphertext.length;
            const totalLib1Rotations = textLength;
            const totalLib2Rotations = Math.floor(textLength / 12);
            const totalLib3Rotations = Math.floor(textLength / 144);
            
            let initLib1Rot = (finalState.lib1Rot - totalLib1Rotations) % libSize;
            let initLib2Rot = (finalState.lib2Rot - totalLib2Rotations) % libSize;
            let initLib3Rot = (finalState.lib3Rot - totalLib3Rotations) % libSize;
            if (initLib1Rot < 0) initLib1Rot += libSize;
            if (initLib2Rot < 0) initLib2Rot += libSize;
            if (initLib3Rot < 0) initLib3Rot += libSize;
            
            let lib1 = rotateLib(lib1Original, initLib1Rot);
            let lib2 = rotateLib(lib2Original, initLib2Rot);
            let lib3 = rotateLib(lib3Original, initLib3Rot);
            let lib1RotationCount = 0;
            let lib2RotationCount = 0;
            const keyNum = parseInt(key) % libSize;
            let result = "";
            
            for (let i = 0; i < ciphertext.length; i++) {
                const char = ciphertext[i];
                const position = i + 1;
                const charIndex3 = lib3.indexOf(char);
                
                if (charIndex3 === -1) {
                    result += char;
                    lib1 = rotateLib(lib1, 1);
                    lib1RotationCount++;
                    if (lib1RotationCount >= 12) {
                        lib1RotationCount = 0;
                        lib2 = rotateLib(lib2, 1);
                        lib2RotationCount++;
                        if (lib2RotationCount >= 12) {
                            lib2RotationCount = 0;
                            lib3 = rotateLib(lib3, 1);
                        }
                    }
                    continue;
                }
                
                let originalIndex3 = (charIndex3 - position - keyNum) % libSize;
                if (originalIndex3 < 0) originalIndex3 += libSize;
                let char2 = lib3[originalIndex3];
                const charIndex2 = lib2.indexOf(char2);
                let originalIndex2 = (charIndex2 - position - keyNum) % libSize;
                if (originalIndex2 < 0) originalIndex2 += libSize;
                let char1 = lib2[originalIndex2];
                const charIndex1 = lib1.indexOf(char1);
                let originalIndex1 = (charIndex1 - position - keyNum) % libSize;
                if (originalIndex1 < 0) originalIndex1 += libSize;
                let originalChar = lib1[originalIndex1];
                result += originalChar;
                
                lib1 = rotateLib(lib1, 1);
                lib1RotationCount++;
                if (lib1RotationCount >= 12) {
                    lib1RotationCount = 0;
                    lib2 = rotateLib(lib2, 1);
                    lib2RotationCount++;
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
                }
            };
        }

        // ========== v7 complete encryption flow ==========
        // 1.Triple rotating libraries → 2.position shuffle+reverse → 3.chained avalanche → 4.column transposition
        function encryptV7(text, numKey, textKey, initialStateCode) {
            // Step 1: Triple Rotating Library Encryption (gear linkage)
            const tripleResult = tripleLibEncrypt(text, numKey, initialStateCode);
            
            // Step 2: position shuffle + reverse
            const shuffled = shufflePositions(tripleResult.ciphertext);
            const reversed = shuffled.split('').reverse().join('');
            
            // Step 3: chained avalanche
            const avalanched = chainAvalanche(reversed);
            
            // Step 4: column transposition
            const transposed = columnTranspose(avalanched, textKey);
            
            // Generate state code
            const statusCode = generateLibStatusCode(
                tripleResult.finalState.lib1Rot,
                tripleResult.finalState.lib2Rot,
                tripleResult.finalState.lib3Rot
            );
            
            return {
                ciphertext: transposed,
                stateCode: statusCode,
                numKey: numKey,
                finalState: tripleResult.finalState
            };
        }
        
        // ========== v7 complete decryption flow ==========
        // reverse order:4.column transpositionrestore → 3.chained avalancherestore → 2.reverse+positionrestore → 1.Triple rotating librariesDecrypt
        function decryptV7(ciphertext, textKey, numKey, stateCode) {
            // Step 4 inverse:column transpositionrestore
            const untransposed = columnTransposeReverse(ciphertext, textKey);
            
            // Step 3 inverse:chained avalancherestore
            const unavalanched = chainAvalancheReverse(untransposed);
            
            // Step 2 inverse:reverserestore + positionrestore
            const unreversed = unavalanched.split('').reverse().join('');
            const unshuffled = unshufflePositions(unreversed);
            
            // Step 1 inverse:Triple rotating librariesDecrypt
            const tripleResult = tripleLibDecrypt(unshuffled, numKey, stateCode);
            
            return {
                success: tripleResult.success,
                result: tripleResult.result,
                numKey: numKey,
                stateCode: stateCode,
                initialState: tripleResult.initialState
            };
        }
        
        // ========== UI event binding ==========
        const plaintextInput = document.getElementById('plaintext');
        const ciphertextInput = document.getElementById('ciphertext');
        const numKeyInput = document.getElementById('num-key');
        const textKeyInput = document.getElementById('text-key');
        const libStatusInput = document.getElementById('lib-status');
        const encryptBtn = document.getElementById('encrypt-btn');
        const decryptBtn = document.getElementById('decrypt-btn');
        const encryptedResult = document.getElementById('encrypted-result');
        const keyInfoResult = document.getElementById('key-info-result');
        const decryptedResult = document.getElementById('decrypted-result');
        const clearEncryptBtn = document.getElementById('clear-encrypt');
        const clearDecryptBtn = document.getElementById('clear-decrypt');
        const decryptNumKeyInput = document.getElementById('decrypt-num-key');
        const decryptTextKeyInput = document.getElementById('decrypt-text-key');
        const decryptStateInput = document.getElementById('decrypt-state');
        
        function clampNumKeyInput() {
            let v = parseInt(numKeyInput.value) || 0;
            if (v < 0) v = 0; else if (v > 94) v = 94;
            numKeyInput.value = v;
        }
        
        function validateTextKey() {
            let v = textKeyInput.value;
            if (v.length > 8) textKeyInput.value = v.substring(0, 8);
        }
        
        function clampDecryptNumKey() {
            let v = parseInt(decryptNumKeyInput.value) || 0;
            if (v < 0) v = 0; else if (v > 94) v = 94;
            decryptNumKeyInput.value = v;
        }
        
        function validateDecryptTextKey() {
            let v = decryptTextKeyInput.value;
            if (v.length > 8) decryptTextKeyInput.value = v.substring(0, 8);
        }
        
        function validateDecryptState() {
            let v = decryptStateInput.value.replace(/[^0-9]/g, '');
            if (v.length > 6) v = v.substring(0, 6);
            decryptStateInput.value = v;
        }
        
        encryptBtn.addEventListener('click', function() {
            const plaintext = plaintextInput.value;
            if (plaintext.trim() === "") {
                encryptedResult.textContent = "Please enter text to encrypt";
                encryptedResult.style.color = "#ff4444";
                return;
            }
            const textKey = textKeyInput.value;
            if (textKey.length === 0) {
                encryptedResult.textContent = "Enter textkey (8 digits)";
                encryptedResult.style.color = "#ff4444";
                return;
            }
            const numKey = parseInt(numKeyInput.value) || 0;
            const libStatus = libStatusInput.value.padEnd(6, '0').substring(0, 6);
            
            try {
                const result = encryptV7(plaintext, numKey, textKey, libStatus);
                // display preview
                encryptedResult.textContent = result.ciphertext;
                encryptedResult.style.color = "#ffd166";
                // Key info box display
                keyInfoResult.textContent = 'Numeric key: ' + numKey + ' | Text key: ' + textKey + ' | State code: ' + result.stateCode;
                keyInfoResult.style.color = "#ffaa00";
                // Auto-fill decryption area
                ciphertextInput.value = result.ciphertext;
                decryptNumKeyInput.value = numKey;
                decryptTextKeyInput.value = textKey;
                decryptStateInput.value = result.stateCode;
                // Update library status display
                document.getElementById('lib1-rotations').textContent = formatLibRotation(result.finalState.lib1Rot);
                document.getElementById('lib2-rotations').textContent = formatLibRotation(result.finalState.lib2Rot);
                document.getElementById('lib3-rotations').textContent = formatLibRotation(result.finalState.lib3Rot);
            } catch (error) {
                encryptedResult.textContent = "✖ Encryption failed: " + error.message;
                encryptedResult.style.color = "#ff4444";
            }
        });
        
        decryptBtn.addEventListener('click', function() {
            const ciphertext = ciphertextInput.value;
            if (ciphertext.trim() === "") {
                decryptedResult.textContent = "Please enter text to decrypt";
                decryptedResult.style.color = "#ff4444";
                return;
            }
            const textKey = decryptTextKeyInput.value;
            if (textKey.length === 0) {
                decryptedResult.textContent = "Enter textkey";
                decryptedResult.style.color = "#ff4444";
                return;
            }
            const numKey = parseInt(decryptNumKeyInput.value) || 0;
            const stateCode = decryptStateInput.value.padEnd(6, '0').substring(0, 6);
            if (stateCode.length !== 6 || !/^\d{6}$/.test(stateCode)) {
                decryptedResult.textContent = "Please enter a valid 6 digitsState code";
                decryptedResult.style.color = "#ff4444";
                return;
            }
            
            try {
                const result = decryptV7(ciphertext, textKey, numKey, stateCode);
                if (result.success) {
                    decryptedResult.textContent = result.result;
                    decryptedResult.style.color = "#ffd166";
                    document.getElementById('detected-lib1').textContent = stateCode.substring(0, 2);
                    document.getElementById('detected-lib2').textContent = stateCode.substring(2, 4);
                    document.getElementById('detected-lib3').textContent = stateCode.substring(4, 6);
                } else {
                    decryptedResult.textContent = "Decryption failed";
                    decryptedResult.style.color = "#ff4444";
                }
            } catch (error) {
                decryptedResult.textContent = "✖ Decryption failed: " + error.message;
                decryptedResult.style.color = "#ff4444";
            }
        });
        
        clearEncryptBtn.addEventListener('click', function() {
            plaintextInput.value = "";
            encryptedResult.textContent = "Waiting to encrypt...";
            encryptedResult.style.color = "#ffd166";
            keyInfoResult.textContent = "Waiting to encrypt...";
            keyInfoResult.style.color = "#ffaa00";
        });
        
        clearDecryptBtn.addEventListener('click', function() {
            ciphertextInput.value = "";
            decryptedResult.textContent = "Waiting to decrypt...";
            decryptedResult.style.color = "#ffd166";
            decryptNumKeyInput.value = "1";
            decryptTextKeyInput.value = "abcdefgh";
            decryptStateInput.value = "";
        });
        
        numKeyInput.addEventListener('input', clampNumKeyInput);
        numKeyInput.addEventListener('change', clampNumKeyInput);
        textKeyInput.addEventListener('input', validateTextKey);
        decryptNumKeyInput.addEventListener('input', clampDecryptNumKey);
        decryptNumKeyInput.addEventListener('change', clampDecryptNumKey);
        decryptTextKeyInput.addEventListener('input', validateDecryptTextKey);
        decryptStateInput.addEventListener('input', validateDecryptState);
