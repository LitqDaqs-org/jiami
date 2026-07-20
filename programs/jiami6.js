var lib1Original = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;':\\\",./<>?`~ ";
        var lib2Original = "1029384756qpwoeirutyalskdjfhgzmxncbvQPWOEIRUTYALSKDJFHGZMXNCBV!)@(#*$&%^_+-={|}[]\\:\";'<?>,/.~` ";
        var lib3Original = "0192837465pqowieurytlaksjdhfgmznxbcvPQOWIEURYTLAKSJDHFGMZNXBCV)!(@*#&$^%+_=-|{}\\][\":';?<>/,.~` ";
        var libSize = lib1Original.length;

        document.getElementById('lib1-preview').textContent = lib1Original;
        document.getElementById('lib2-preview').textContent = lib2Original;
        document.getElementById('lib3-preview').textContent = lib3Original;

        function formatLibRotation(r) { return r.toString().padStart(2, '0'); }
        function parseLibStatusCode(code) {
            if (code.length !== 6 || !/^\d{6}$/.

test(code)) return { lib1Rot: 0, lib2Rot: 0, lib3Rot: 0 };
            return { lib1Rot: parseInt(code.substring(0, 2)), lib2Rot: parseInt(code.substring(2, 4)), lib3Rot: parseInt(code.substring(4, 6)) };
        }
        function generateLibStatusCode(a, b, c) {
            return formatLibRotation(a % libSize) + formatLibRotation(b % libSize) + formatLibRotation(c % libSize);
        }
        function rotateLib(lib, rotations) {
            rotations = rotations % lib.length;
            if (rotations === 0) return lib;
            return lib.substring(rotations) + lib.substring(0, rotations);
        }

        // ===== v6 Avalanche Effect Layer =====
        function avalancheEncrypt(text) {
            var chars = text.split('');
            var result = chars.slice();
            for (var i = 0; i < result.length

- 1; i += 2) {
                var idx1 = lib3Original.indexOf(result[i]);
                var idx2 = lib3Original.indexOf(result[i + 1]);
                if (idx1 === -1 || idx2 === -1) continue;
                var newIdx = (idx2 + idx1) % libSize;
                result[i + 1] = lib3Original[newIdx];
            }
            return result.join('');
        }
        function avalancheDecrypt(text) {
            var chars = text.split('');
            var result = chars.slice();
            for (var i = 0; i < result.length - 1; i += 2) {
                var idx1 = lib3Original.indexOf(result[i]);
                var idx2 = lib3Original.indexOf(result[i + 1]);
                if (idx1 === -1 || idx2 === -1) continue;
                var origIdx = (idx2 - idx1 + libSize) % libSize;
                result[i +

1] = lib3Original[origIdx];
            }
            return result.join('');
        }

        // ===== v5 position shufflelayer =====
        function shufflePositions(text) {
            var chars = text.split('');
            var smallGroups = [];
            for (var i = 0; i < chars.length; i += 3) smallGroups.push(chars.slice(i, Math.min(i + 3, chars.length)));
            var fullSmallGroupCount = 0;
            for (var j = 0; j < smallGroups.length; j++) { if (smallGroups[j].length === 3) fullSmallGroupCount++; else break; }
            var fullBigGroupCount = Math.floor(fullSmallGroupCount / 3);
            var bigGroups = [];
            for (var i = 0; i < fullBigGroupCount; i++) bigGroups.push([smallGroups[i*3].slice(), smallGroups[i*3+1].slice(), smallGroups[i*3+2].slice()]);
            var

remainderGroups = [];
            for (var i = fullBigGroupCount * 3; i < smallGroups.length; i++) remainderGroups.push(smallGroups[i].slice());
            for (var i = 0; i < bigGroups.length; i++) {
                var bg = bigGroups[i];
                var first = bg[1][0]; bg[1] = [bg[1][1], bg[1][2], first];
                var last = bg[2][2]; bg[2] = [last, bg[2][0], bg[2][1]];
            }
            bigGroups.reverse();
            var result = [];
            for (var i = 0; i < bigGroups.length; i++) for (var j = 0; j < 3; j++) result = result.concat(bigGroups[i][j]);
            for (var i = 0; i < remainderGroups.length; i++) result = result.concat(remainderGroups[i]);
            return result.join('');
        }
        function unshufflePositions(text) {
            var chars = text.

split('');
            var smallGroups = [];
            for (var i = 0; i < chars.length; i += 3) smallGroups.push(chars.slice(i, Math.min(i + 3, chars.length)));
            var fullSmallGroupCount = 0;
            for (var j = 0; j < smallGroups.length; j++) { if (smallGroups[j].length === 3) fullSmallGroupCount++; else break; }
            var fullBigGroupCount = Math.floor(fullSmallGroupCount / 3);
            var bigGroups = [];
            for (var i = 0; i < fullBigGroupCount; i++) bigGroups.push([smallGroups[i*3].slice(), smallGroups[i*3+1].slice(), smallGroups[i*3+2].slice()]);
            var remainderGroups = [];
            for (var i = fullBigGroupCount * 3; i < smallGroups.length; i++) remainderGroups.push(smallGroups[i].slice());
            bigGroups.reverse();

for (var i = 0; i < bigGroups.length; i++) {
                var bg = bigGroups[i];
                var last = bg[1][2]; bg[1] = [last, bg[1][0], bg[1][1]];
                var first = bg[2][0]; bg[2] = [bg[2][1], bg[2][2], first];
            }
            var result = [];
            for (var i = 0; i < bigGroups.length; i++) for (var j = 0; j < 3; j++) result = result.concat(bigGroups[i][j]);
            for (var i = 0; i < remainderGroups.length; i++) result = result.concat(remainderGroups[i]);
            return result.join('');
        }

        // ===== Triple Rotating Library Encryption =====
        function encryptEnhancedWithRotatingLibs(text, key, initialStateCode) {
            var initState = parseLibStatusCode(initialStateCode);
            var lib1 = rotateLib(lib1Original, initState.lib1Rot);
            var

lib2 = rotateLib(lib2Original, initState.lib2Rot);
            var lib3 = rotateLib(lib3Original, initState.lib3Rot);
            var lib1Rotations = initState.lib1Rot, lib2Rotations = initState.lib2Rot, lib3Rotations = initState.lib3Rot;
            var lib1RotationCount = 0, lib2RotationCount = 0;
            var keyNum = parseInt(key) % libSize;
            var result = "";
            for (var i = 0; i < text.length; i++) {
                var char = text[i], position = i + 1;
                var charIndex1 = lib1.indexOf(char);
                if (charIndex1 === -1) {
                    result += char;
                } else {
                    var newIndex1 = (charIndex1 + position + keyNum) % libSize;
                    var char1 = lib1[newIndex1];
                    var charIndex2 =

lib2.indexOf(char1);
                    var newIndex2 = (charIndex2 + position + keyNum) % libSize;
                    var char2 = lib2[newIndex2];
                    var charIndex3 = lib3.indexOf(char2);
                    var newIndex3 = (charIndex3 + position + keyNum) % libSize;
                    result += lib3[newIndex3];
                }
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
            // process flow
            var avalanched = avalancheEncrypt(result);
            var shuffled = shufflePositions(avalanched);
            var reversed = shuffled.split('').reverse().join('');
            var finalStateCode = generateLibStatusCode(lib1Rotations, lib2Rotations, lib3Rotations);
            return { ciphertext: reversed, stateCode: finalStateCode, finalState: { lib1Rot: lib1Rotations, lib2Rot: lib2Rotations, lib3Rot: lib3Rotations } };
        }

        // ===== Triple rotating librariesDecrypt =====
        function decryptEnhancedWithRotatingLibs(ciphertext, key, stateCode) {
            var finalState = parseLibStatusCode(stateCode);
            // process flow
            var reversed = ciphertext.split('').reverse().join('');
            var unshuffled = unshufflePositions(reversed);
            var unavalanched = avalancheDecrypt(unshuffled);
            var textLength = unavalanched.length;
            var initLib1Rot = (finalState.lib1Rot - textLength) % libSize;
            var initLib2Rot = (finalState.lib2Rot - Math.floor(textLength / 12)) % libSize;
            var initLib3Rot = (finalState.lib3Rot - Math.floor(textLength /

144)) % libSize;
            if (initLib1Rot < 0) initLib1Rot += libSize;
            if (initLib2Rot < 0) initLib2Rot += libSize;
            if (initLib3Rot < 0) initLib3Rot += libSize;
            var lib1 = rotateLib(lib1Original, initLib1Rot);
            var lib2 = rotateLib(lib2Original, initLib2Rot);
            var lib3 = rotateLib(lib3Original, initLib3Rot);
            var lib1RotationCount = 0, lib2RotationCount = 0;
            var keyNum = parseInt(key) % libSize;
            var result = "";
            for (var i = 0; i < unavalanched.length; i++) {
                var char = unavalanched[i], position = i + 1;
                var charIndex3 = lib3.indexOf(char);
                if (charIndex3 === -1) {
                    result += char;
                } else {
                    var

originalIndex3 = (charIndex3 - position - keyNum) % libSize;
                    if (originalIndex3 < 0) originalIndex3 += libSize;
                    var char2 = lib3[originalIndex3];
                    var charIndex2 = lib2.indexOf(char2);
                    var originalIndex2 = (charIndex2 - position - keyNum) % libSize;
                    if (originalIndex2 < 0) originalIndex2 += libSize;
                    var char1 = lib2[originalIndex2];
                    var charIndex1 = lib1.indexOf(char1);
                    var originalIndex1 = (charIndex1 - position - keyNum) % libSize;
                    if (originalIndex1 < 0) originalIndex1 += libSize;
                    result += lib1[originalIndex1];
                }
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
            return { success: true, result: result, initialState: { lib1Rot: initLib1Rot, lib2Rot: initLib2Rot, lib3Rot: initLib3Rot }, finalState: finalState };
        }

        // ===== UI =====
        var plaintextInput = document.getElementById('plaintext');
        var ciphertextInput = document.getElementById('ciphertext');
        var keyInput = document.getElementById('key');
        var decryptKeyInput = document.getElementById('decrypt-key');
        var decryptStateInput = document.getElementById('decrypt-state');
        var keyInfoEl = document.getElementById('key-info-result');
        var libStatusInput = document.getElementById('lib-status');

var encryptedResult = document.getElementById('encrypted-result');
        var decryptedResult = document.getElementById('decrypted-result');
        var lib1RotationsDisplay = document.getElementById('lib1-rotations');
        var lib2RotationsDisplay = document.getElementById('lib2-rotations');
        var lib3RotationsDisplay = document.getElementById('lib3-rotations');
        var detectedLib1Display = document.getElementById('detected-lib1');
        var detectedLib2Display = document.getElementById('detected-lib2');
        var detectedLib3Display = document.getElementById('detected-lib3');

        function clampKeyInput() {
            var v = parseInt(keyInput.value) || 0;
            if (v < 0) v = 0; else if (v > 94) v = 94;
            keyInput.value = v;
        }
        function

clampLibStatusInput() {
            var v = libStatusInput.value.replace(/\D/g, '');
            if (v.length > 6) v = v.substring(0, 6);
            libStatusInput.value = v;
            if (v.length === 6) {
                var s = parseLibStatusCode(v);
                lib1RotationsDisplay.textContent = formatLibRotation(s.lib1Rot);
                lib2RotationsDisplay.textContent = formatLibRotation(s.lib2Rot);
                lib3RotationsDisplay.textContent = formatLibRotation(s.lib3Rot);
            }
        }
        function doEncryptUI() {
            var plaintext = plaintextInput.value;
            if (plaintext.trim() === "") { encryptedResult.textContent = "Please enter text to encrypt"; return; }
            var key = parseInt(keyInput.value) || 0;
            var libStatus = libStatusInput.value.padEnd(6, '0').substring(0, 6);
            var result = encryptEnhancedWithRotatingLibs(plaintext, key, libStatus);
            encryptedResult.textContent = result.ciphertext;
            keyInfoEl.textContent = "Key: " + key + " | State code: " + result.stateCode;
            lib1RotationsDisplay.textContent = formatLibRotation(result.finalState.lib1Rot);
            lib2RotationsDisplay.textContent = formatLibRotation(result.finalState.lib2Rot);
            lib3RotationsDisplay.textContent = formatLibRotation(result.finalState.lib3Rot);
            ciphertextInput.value = result.ciphertext;
            decryptKeyInput.value = key;
            decryptStateInput.value = result.stateCode;
            var ds = parseLibStatusCode(result.stateCode);
            detectedLib1Display.textContent = formatLibRotation(ds.lib1Rot);
            detectedLib2Display.textContent = formatLibRotation(ds.lib2Rot);
            detectedLib3Display.textContent = formatLibRotation(ds.lib3Rot);
        }
        function doDecryptUI() {
            var ciphertext = ciphertextInput.value;
            if (ciphertext.trim() === "") { decryptedResult.textContent = "Please enter text to decrypt"; return; }
            var key = parseInt(decryptKeyInput.value) || 0;
            var stateCode = decryptStateInput.value.padEnd(6, '0').substring(0, 6);
            var result = decryptEnhancedWithRotatingLibs(ciphertext, key, stateCode);
            if (result.success) {
                decryptedResult.textContent = result.result;
                decryptedResult.style.color = "#ffd166";
                var isc = generateLibStatusCode(result.initialState.lib1Rot, result.initialState.lib2Rot, result.initialState.lib3Rot);
                libStatusInput.value =

isc;
                clampLibStatusInput();
                detectedLib1Display.textContent = formatLibRotation(result.finalState.lib1Rot);
                detectedLib2Display.textContent = formatLibRotation(result.finalState.lib2Rot);
                detectedLib3Display.textContent = formatLibRotation(result.finalState.lib3Rot);
            } else {
                decryptedResult.textContent = "Decryption failed: " + result.result;
                decryptedResult.style.color = "#ff4444";
            }
        }
        document.getElementById('encrypt-btn').addEventListener('click', doEncryptUI);
        document.getElementById('decrypt-btn').addEventListener('click', doDecryptUI);
        document.getElementById('clear-encrypt').addEventListener('click', function() { plaintextInput.value = ""; encryptedResult.textContent =

"Waiting to encrypt..."; });
        document.getElementById('clear-decrypt').addEventListener('click', function() { ciphertextInput.value = ""; decryptedResult.textContent = "Waiting to decrypt..."; });
        keyInput.addEventListener('input', clampKeyInput);
        keyInput.addEventListener('change', clampKeyInput);
        decryptKeyInput.addEventListener('input', function() { var v = parseInt(decryptKeyInput.value) || 0; if (v < 0) v = 0; if (v > 94) v = 94; decryptKeyInput.value = v; });
        decryptKeyInput.addEventListener('change', function() { var v = parseInt(decryptKeyInput.value) || 0; if (v < 0) v = 0; if (v > 94) v = 94; decryptKeyInput.value = v; });
        decryptStateInput.addEventListener('input', function() { var v = decryptStateInput.value.replace(/\D/g, ''); if (v.length > 6) v = v.substring(0, 6); decryptStateInput.value = v; });
        decryptStateInput.addEventListener('change', function() { var v = decryptStateInput.value.replace(/\D/g, ''); if (v.length > 6) v = v.substring(0, 6); decryptStateInput.value = v; });
        libStatusInput.addEventListener('input', clampLibStatusInput);
        libStatusInput.addEventListener('change', clampLibStatusInput);
        clampKeyInput();
        clampLibStatusInput();
        window.addEventListener('load', function() {
            plaintextInput.value = "Made from Litaiqi_Daquavis";
            keyInput.value = 1;
            libStatusInput.value = "000000";
            doEncryptUI();
            doDecryptUI();
        });
