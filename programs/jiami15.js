// ---- Extracted inline script 1 from jiami15.html ----
// ========== character library definitions ==========
        const lib1Original = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;':\\\",./<>?`~ ";
        const lib2Original = "1029384756qpwoeirutyalskdjfhgzmxncbvQPWOEIRUTYALSKDJFHGZMXNCBV!)@(#*$&%^_+-={|}[]\\:\";'<?>,/.~` ";
        const lib3Original = "0192837465pqowieurytlaksjdhfgmznxbcvPQOWIEURYTLAKSJDHFGMZNXBCV)!(@*#&$^%+_=-|{}\\][\":';?<>/,.~` ";

        const libSize = lib1Original.length; // 95

        // ========== utility functions ==========
        function formatLibRotation(rotation) {
            return rotation.toString().padStart(2, '0');
        }

        // Fallback helpers required by encrypt/decrypt handlers even when external keyInputCheck.js is not deployed yet.
        if (typeof normalizeStateCode !== 'function') {
            window.normalizeStateCode = function(value, shouldPad = false) {
                let digits = String(value || '').replace(/\D/g, '').slice(0, 6);
                if (shouldPad) digits = digits.padEnd(6, '0');
                let result = '';
                for (let i = 0; i < digits.length; i += 2) {
                    let pair = digits.slice(i, i + 2);
                    if (pair.length === 2 && parseInt(pair, 10) > 94) pair = '94';
                    result += pair;
                }
                return result.slice(0, 6);
            };
        }

        function parseLibStatusCode(code) {
            const normalized = normalizeStateCode(code, true);
            if (normalized.length !== 6 || !/^\d{6}$/.test(normalized)) {
                throw new Error('Library state code must be exactly 6 digits');
            }
            const lib1Rot = parseInt(normalized.substring(0, 2), 10);
            const lib2Rot = parseInt(normalized.substring(2, 4), 10);
            const lib3Rot = parseInt(normalized.substring(4, 6), 10);
            if (lib1Rot > 94 || lib2Rot > 94 || lib3Rot > 94) {
                throw new Error('Each library rotation must be between 00 and 94');
            }
            return { lib1Rot, lib2Rot, lib3Rot };
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

        // implementation note
        // implementation note
        function seedToNumber(seed) {
            let h = 2166136261;
            for (let i = 0; i < seed.length; i++) {
                h ^= seed.charCodeAt(i);
                h = Math.imul(h, 16777619);
            }
            return h >>> 0;
        }

        // seeded pseudo-random number generator
        function mulberry32(seed) {
            return function() {
                seed |= 0; seed = seed + 0x6D2B79F5 | 0;
                let t = seed;
                t = Math.imul(t ^ t >>> 15, t | 1);
                t ^= t + Math.imul(t ^ t >>> 7, t | 61);
                return ((t ^ t >>> 14) >>> 0) / 4294967296;
            }
        }

        // implementation note
        class PerlinNoise1D {
            constructor(seed) {
                const rng = mulberry32(seedToNumber(seed));
                // Generate gradient table
                this.perm = [];
                for (let i = 0; i < 256; i++) this.perm[i] = i;
                // Fisher-Yatesshuffle
                for (let i = 255; i > 0; i--) {
                    const j = Math.floor(rng() * (i + 1));
                    [this.perm[i], this.perm[j]] = [this.perm[j], this.perm[i]];
                }
                // make a copy
                for (let i = 0; i < 256; i++) this.perm[256 + i] = this.perm[i];
            }

            fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
            lerp(a, b, t) { return a + t * (b - a); }
            grad(hash, x) {
                return (hash & 1) === 0 ? x : -x;
            }

            noise(x) {
                const X = Math.floor(x) & 255;
                x -= Math.floor(x);
                const u = this.fade(x);
                return this.lerp(
                    this.grad(this.perm[X], x),
                    this.grad(this.perm[X + 1], x - 1),
                    u
                );
            }

            // multi-layer overlay(fractal noise),return [-1, 1]
            fractal(x, octaves = 4) {
                let total = 0;
                let frequency = 1;
                let amplitude = 1;
                let maxValue = 0;
                for (let i = 0; i < octaves; i++) {
                    total += this.noise(x * frequency) * amplitude;
                    maxValue += amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                return total / maxValue;
            }
        }

        // Generate noise offset array,length=textlength,each item∈[0,94]
        function generateNoiseOffsets(length, seed) {
            const perlin = new PerlinNoise1D(seed);
            const offsets = [];
            const scale = 0.15; // smoothness
            for (let i = 0; i < length; i++) {
                const n = perlin.fractal(i * scale, 4); // [-1, 1]
                const normalized = (n + 1) / 2; // [0, 1]
                offsets.push(Math.floor(normalized * 95) % 95);
            }
            return offsets;
        }

        // Perlin noise offset(Encrypt)
        function perlinNoiseEncrypt(text, seed) {
            const offsets = generateNoiseOffsets(text.length, seed);
            let result = '';
            for (let i = 0; i < text.length; i++) {
                const c = text.charCodeAt(i);
                if (c >= 32 && c <= 126) {
                    const norm = c - 32;
                    const shifted = (norm + offsets[i]) % 95;
                    result += String.fromCharCode(shifted + 32);
                } else {
                    result += text[i];
                }
            }
            return result;
        }

        // Perlin noise offset(Decrypt)
        function perlinNoiseDecrypt(text, seed) {
            const offsets = generateNoiseOffsets(text.length, seed);
            let result = '';
            for (let i = 0; i < text.length; i++) {
                const c = text.charCodeAt(i);
                if (c >= 32 && c <= 126) {
                    const norm = c - 32;
                    let shifted = (norm - offsets[i]) % 95;
                    if (shifted < 0) shifted += 95;
                    result += String.fromCharCode(shifted + 32);
                } else {
                    result += text[i];
                }
            }
            return result;
        }

        // Draw noise curve
        function drawNoiseCanvas(length, seed) {
            const canvas = document.getElementById('noise-canvas');
            const ctx = canvas.getContext('2d');
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            // background grid
            ctx.strokeStyle = 'rgba(255,209,102,0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 10; i++) {
                const y = (H / 10) * i;
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
            }
            for (let i = 0; i <= 20; i++) {
                const x = (W / 20) * i;
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
            }

            if (length === 0) return;

            const offsets = generateNoiseOffsets(length, seed);

            // filled area
            const gradient = ctx.createLinearGradient(0, 0, 0, H);
            gradient.addColorStop(0, 'rgba(255,209,102,0.6)');
            gradient.addColorStop(1, 'rgba(255,209,102,0.05)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(0, H);
            for (let i = 0; i < offsets.length; i++) {
                const x = (i / Math.max(offsets.length - 1, 1)) * W;
                const y = H - (offsets[i] / 94) * H;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(W, H);
            ctx.closePath();
            ctx.fill();

            // curve
            ctx.strokeStyle = '#ffd166';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < offsets.length; i++) {
                const x = (i / Math.max(offsets.length - 1, 1)) * W;
                const y = H - (offsets[i] / 94) * H;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // label
            ctx.fillStyle = '#888';
            ctx.font = '11px Courier New';
            ctx.fillText('94', 5, 12);
            ctx.fillText('47', 5, H/2);
            ctx.fillText('0', 5, H - 5);
            ctx.fillText('length: ' + length, W - 90, 14);
        }

        // implementation note
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
            // implementation note
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
            // implementation note
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

        // ========== Triple Rotating Library Encryption ==========
        function validateCustomLibraries(customLibraries) {
            const requiredSet = new Set(Array.from(lib1Original));
            if (!Array.isArray(customLibraries) || customLibraries.length !== 3) {
                throw new Error('Exactly three custom libraries are required.');
            }
            customLibraries.forEach((library, index) => {
                const chars = Array.from(library);
                if (chars.length !== libSize || new Set(chars).size !== libSize || chars.some(ch => !requiredSet.has(ch))) {
                    throw new Error(`Custom library ${index + 1} must contain all 95 supported characters exactly once.`);
                }
            });
            return customLibraries;
        }

        // v15: source lookup uses the fixed custom base library, while
        // output lookup uses its rotated form. This prevents rotation from
        // cancelling itself and makes the state code affect the ciphertext.
        function tripleLibEncrypt(text, key, initialStateCode, customLibraries) {
            const bases = validateCustomLibraries(customLibraries);
            const initState = parseLibStatusCode(initialStateCode);
            let rotations = [initState.lib1Rot, initState.lib2Rot, initState.lib3Rot];
            let rotated = bases.map((lib, i) => rotateLib(lib, rotations[i]));
            let lib1Count = 0;
            let lib2Count = 0;
            const keyNum = parseInt(key, 10) % libSize;
            let result = '';

            function advance() {
                rotated[0] = rotateLib(rotated[0], 1);
                rotations[0] = (rotations[0] + 1) % libSize;
                lib1Count++;
                if (lib1Count >= 12) {
                    lib1Count = 0;
                    rotated[1] = rotateLib(rotated[1], 1);
                    rotations[1] = (rotations[1] + 1) % libSize;
                    lib2Count++;
                    if (lib2Count >= 12) {
                        lib2Count = 0;
                        rotated[2] = rotateLib(rotated[2], 1);
                        rotations[2] = (rotations[2] + 1) % libSize;
                    }
                }
            }

            for (let i = 0; i < text.length; i++) {
                const position = i + 1;
                let char = text[i];
                for (let layer = 0; layer < 3; layer++) {
                    const sourceIndex = bases[layer].indexOf(char);
                    if (sourceIndex === -1) break;
                    char = rotated[layer][(sourceIndex + position + keyNum) % libSize];
                }
                result += char;
                advance();
            }
            return {
                ciphertext: result,
                finalState: { lib1Rot: rotations[0], lib2Rot: rotations[1], lib3Rot: rotations[2] }
            };
        }

        function tripleLibDecrypt(ciphertext, key, finalStateCode, customLibraries) {
            const bases = validateCustomLibraries(customLibraries);
            const finalState = parseLibStatusCode(finalStateCode);
            const length = ciphertext.length;
            let rotations = [
                (finalState.lib1Rot - length) % libSize,
                (finalState.lib2Rot - Math.floor(length / 12)) % libSize,
                (finalState.lib3Rot - Math.floor(length / 144)) % libSize
            ].map(value => value < 0 ? value + libSize : value);
            const initialRotations = rotations.slice();
            let rotated = bases.map((lib, i) => rotateLib(lib, rotations[i]));
            let lib1Count = 0;
            let lib2Count = 0;
            const keyNum = parseInt(key, 10) % libSize;
            let result = '';

            function advance() {
                rotated[0] = rotateLib(rotated[0], 1);
                lib1Count++;
                if (lib1Count >= 12) {
                    lib1Count = 0;
                    rotated[1] = rotateLib(rotated[1], 1);
                    lib2Count++;
                    if (lib2Count >= 12) {
                        lib2Count = 0;
                        rotated[2] = rotateLib(rotated[2], 1);
                    }
                }
            }

            for (let i = 0; i < ciphertext.length; i++) {
                const position = i + 1;
                let char = ciphertext[i];
                for (let layer = 2; layer >= 0; layer--) {
                    const rotatedIndex = rotated[layer].indexOf(char);
                    if (rotatedIndex === -1) break;
                    let sourceIndex = (rotatedIndex - position - keyNum) % libSize;
                    if (sourceIndex < 0) sourceIndex += libSize;
                    char = bases[layer][sourceIndex];
                }
                result += char;
                advance();
            }
            return {
                success: true,
                result,
                initialState: { lib1Rot: initialRotations[0], lib2Rot: initialRotations[1], lib3Rot: initialRotations[2] }
            };
        }

        // ========== v8 bit encodinglayer ==========
        function charToCode(char) {
            const idx = lib1Original.indexOf(char);
            if (idx === -1) return null;
            if (idx < 31) {
                return { lib: '01', bits: (idx + 1).toString(2).padStart(5, '0') };
            } else if (idx < 63) {
                return { lib: '10', bits: (idx - 31).toString(2).padStart(5, '0') };
            } else {
                return { lib: '11', bits: (idx - 63).toString(2).padStart(5, '0') };
            }
        }

        function codeToChar(lib, bits) {
            const bitsNum = parseInt(bits, 2);
            let idx;
            if (lib === '01') {
                idx = bitsNum - 1;
            } else if (lib === '10') {
                idx = bitsNum + 31;
            } else {
                idx = bitsNum + 63;
            }
            if (idx < 0 || idx >= libSize) return null;
            return lib1Original[idx];
        }

        function bitEncodeChar(char) {
            const code = charToCode(char);
            if (!code) return char;
            if (code.lib === '01' && (code.bits === '11110' || code.bits === '10100' || code.bits === '01010')) {
                return char;
            }
            let newLib = code.lib;
            if (code.lib === '10') newLib = '11';
            else if (code.lib === '11') newLib = '10';
            let b = code.bits.split('');
            const xor12 = b[0] ^ b[1];
            const origB0 = b[0];
            b[0] = String(xor12);
            b[1] = (xor12 == origB0) ? '1' : '0';
            const xor34 = b[2] ^ b[3];
            const origB2 = b[2];
            b[2] = String(xor34);
            b[3] = (xor34 == origB2) ? '1' : '0';
            return codeToChar(newLib, b.join(''));
        }

        function bitDecodeChar(char) {
            const code = charToCode(char);
            if (!code) return char;
            if (code.lib === '01' && (code.bits === '11110' || code.bits === '10100' || code.bits === '01010')) {
                return char;
            }
            let origLib = code.lib;
            if (code.lib === '10') origLib = '11';
            else if (code.lib === '11') origLib = '10';
            let b = code.bits.split('');
            let origB0, origB1;
            if (b[1] === '1') {
                origB0 = b[0];
            } else {
                origB0 = b[0] === '0' ? '1' : '0';
            }
            origB1 = String(origB0 ^ parseInt(b[0]));
            let origB2, origB3;
            if (b[3] === '1') {
                origB2 = b[2];
            } else {
                origB2 = b[2] === '0' ? '1' : '0';
            }
            origB3 = String(origB2 ^ parseInt(b[2]));
            return codeToChar(origLib, origB0 + origB1 + origB2 + origB3 + b[4]);
        }

        function bitEncode(text) {
            return text.split('').map(bitEncodeChar).join('');
        }

        function bitDecode(text) {
            return text.split('').map(bitDecodeChar).join('');
        }

        // ========== v11 CBCXOR chainlayer ==========
        // group every 4 characters,key adds with first block mod 95(equivalent to XOR),result is chained forward

        function cbcEncrypt(text, cbcKey) {
            while (cbcKey.length < 4) cbcKey += cbcKey;
            cbcKey = cbcKey.substring(0, 4);

            const blockSize = 4;
            const fullBlocks = Math.floor(text.length / blockSize);

            // keyas initial"previous ciphertext block"
            let prev = [];
            for (let i = 0; i < blockSize; i++) {
                prev.push((cbcKey.charCodeAt(i) - 32 + 95) % 95);
            }

            let result = '';

            for (let b = 0; b < fullBlocks; b++) {
                let block = [];
                for (let i = 0; i < blockSize; i++) {
                    const idx = b * blockSize + i;
                    let norm = (text.charCodeAt(idx) - 32 + 95) % 95;
                    // implementation note
                    norm = (norm + prev[i]) % 95;
                    block.push(norm);
                    result += String.fromCharCode(norm + 32);
                }
                prev = block; // chained state transfer
            }

            // v14-pre2: encrypt remaining fewer than 4 characters with the current CBC chain state
            // This keeps the original length, avoids padding ambiguity, and no longer appends plaintext unchanged.
            for (let i = fullBlocks * blockSize; i < text.length; i++) {
                const remainIndex = i - fullBlocks * blockSize;
                let norm = (text.charCodeAt(i) - 32 + 95) % 95;
                norm = (norm + prev[remainIndex]) % 95;
                result += String.fromCharCode(norm + 32);
            }

            return result;
        }

        function cbcDecrypt(ciphertext, cbcKey) {
            while (cbcKey.length < 4) cbcKey += cbcKey;
            cbcKey = cbcKey.substring(0, 4);

            const blockSize = 4;
            const fullBlocks = Math.floor(ciphertext.length / blockSize);

            let prev = [];
            for (let i = 0; i < blockSize; i++) {
                prev.push((cbcKey.charCodeAt(i) - 32 + 95) % 95);
            }

            let result = '';

            for (let b = 0; b < fullBlocks; b++) {
                let currentBlock = [];
                for (let i = 0; i < blockSize; i++) {
                    const idx = b * blockSize + i;
                    const encNorm = (ciphertext.charCodeAt(idx) - 32 + 95) % 95;
                    currentBlock.push(encNorm);
                    // implementation note
                    let norm = (encNorm - prev[i]) % 95;
                    if (norm < 0) norm += 95;
                    result += String.fromCharCode(norm + 32);
                }
                prev = currentBlock; // chain using ciphertext
            }

            // v14-pre2: decrypt remaining fewer than 4 characters with the current CBC chain state
            for (let i = fullBlocks * blockSize; i < ciphertext.length; i++) {
                const remainIndex = i - fullBlocks * blockSize;
                const encNorm = (ciphertext.charCodeAt(i) - 32 + 95) % 95;
                let norm = (encNorm - prev[remainIndex]) % 95;
                if (norm < 0) norm += 95;
                result += String.fromCharCode(norm + 32);
            }

            return result;
        }

        // ========== v10 SHA-95reversible mixinglayer ==========
        // implementation note
        // block processing + inter-block state chain(SHA-256core architecture)

        function sha95DeriveState(shaKey) {
            let state = 42;
            for (let i = 0; i < shaKey.length; i++) {
                state = (state * 31 + shaKey.charCodeAt(i)) % 95;
            }
            return state;
        }

        function sha95KeyStream(length, shaKey) {
            let state = sha95DeriveState(shaKey);
            const stream = [];
            let k1 = (state * 7 + 3) % 95;
            let k2 = (state * 13 + 7) % 95;
            for (let i = 0; i < length; i++) {
                k1 = (k1 * 7 + 3) % 95;
                k2 = (k2 * 13 + 7) % 95;
                stream.push((k1 + k2) % 95);
            }
            return stream;
        }

        function sha95Encrypt(text, shaKey) {
            const blockSize = 8;
            let state = sha95DeriveState(shaKey);
            const keyStream = sha95KeyStream(text.length, shaKey);
            let result = '';

            for (let blockStart = 0; blockStart < text.length; blockStart += blockSize) {
                const blockEnd = Math.min(blockStart + blockSize, text.length);
                let blockResult = '';

                for (let j = blockStart; j < blockEnd; j++) {
                    const c = text.charCodeAt(j);
                    if (c < 32 || c > 126) {
                        blockResult += text[j];
                        continue;
                    }
                    let norm = c - 32;
                    const pos = j - blockStart;

                    // rotate character libraries
                    norm = (norm + (pos + 1) * 7) % 95;

                    // implementation note
                    norm = (norm + keyStream[j]) % 95;

                    // implementation note
                    norm = (norm + state * 3) % 95;

                    blockResult += String.fromCharCode(norm + 32);
                }

                result += blockResult;

                // Update state(based on ciphertext so decryption can recompute it)
                let blockSum = 0;
                for (let k = 0; k < blockResult.length; k++) {
                    blockSum = (blockSum + blockResult.charCodeAt(k)) % 95;
                }
                state = (blockSum + state * 5 + 1) % 95;
            }

            return result;
        }

        function sha95Decrypt(ciphertext, shaKey) {
            const blockSize = 8;
            let state = sha95DeriveState(shaKey);
            const keyStream = sha95KeyStream(ciphertext.length, shaKey);
            let result = '';

            for (let blockStart = 0; blockStart < ciphertext.length; blockStart += blockSize) {
                const blockEnd = Math.min(blockStart + blockSize, ciphertext.length);
                const blockCipher = ciphertext.substring(blockStart, blockEnd);

                for (let j = blockStart; j < blockEnd; j++) {
                    const c = ciphertext.charCodeAt(j);
                    if (c < 32 || c > 126) {
                        result += ciphertext[j];
                        continue;
                    }
                    let norm = c - 32;
                    const pos = j - blockStart;

                    // Round 3 inverse:state diffusionrestore
                    norm = (norm - state * 3) % 95;
                    if (norm < 0) norm += 95;

                    // implementation note
                    norm = (norm - keyStream[j]) % 95;
                    if (norm < 0) norm += 95;

                    // rotate character libraries
                    norm = (norm - (pos + 1) * 7) % 95;
                    if (norm < 0) norm += 95;

                    result += String.fromCharCode(norm + 32);
                }

                // implementation note
                let blockSum = 0;
                for (let k = 0; k < blockCipher.length; k++) {
                    blockSum = (blockSum + blockCipher.charCodeAt(k)) % 95;
                }
                state = (blockSum + state * 5 + 1) % 95;
            }

            return result;
        }

        // ========== v13 12×8keyMatrixlayer ==========
        // implementation note
        // implementation note
        function validateMatrixKey(matrixKey) {
            if (!matrixKey || matrixKey.length !== 12) {
                throw new Error('Matrix key must be 12 characters');
            }
            const seen = new Set();
            for (const ch of matrixKey) {
                if (lib2Original.indexOf(ch) === -1) {
                    throw new Error('Matrix key contains a character that is not in the lib2 character library: ' + ch);
                }
                if (seen.has(ch)) {
                    throw new Error('Matrix key cannot contain duplicate characters: ' + ch);
                }
                seen.add(ch);
            }
        }

        function buildMatrixFromLib2(matrixKey) {
            validateMatrixKey(matrixKey);
            const chars = [];
            for (const ch of matrixKey) chars.push(ch);
            for (const ch of lib2Original) {
                if (!matrixKey.includes(ch)) chars.push(ch);
            }
            const matrix = [];
            const pos = new Map();
            let idx = 0;
            for (let r = 0; r < 8; r++) {
                matrix[r] = [];
                for (let c = 0; c < 12; c++) {
                    const ch = idx < chars.length ? chars[idx] : null;
                    matrix[r][c] = ch;
                    if (ch !== null) pos.set(ch, { row: r, col: c });
                    idx++;
                }
            }
            return { matrix, pos };
        }

        function movePairInMatrix(matrix, p1, p2, dr, dc) {
            // conditional handling
            // implementation note
            for (let step = 1; step <= 96; step++) {
                const r1 = (p1.row + dr * step + 800) % 8;
                const c1 = (p1.col + dc * step + 1200) % 12;
                const r2 = (p2.row + dr * step + 800) % 8;
                const c2 = (p2.col + dc * step + 1200) % 12;
                if (matrix[r1][c1] !== null && matrix[r2][c2] !== null) {
                    return matrix[r1][c1] + matrix[r2][c2];
                }
            }
            throw new Error('Matrix move failed');
        }

        function matrixPairTransform(text, matrixKey, decrypt = false) {
            const built = buildMatrixFromLib2(matrixKey);
            const matrix = built.matrix;
            const pos = built.pos;
            let result = '';
            let i = 0;

            for (; i + 1 < text.length; i += 2) {
                const a = text[i];
                const b = text[i + 1];
                const p1 = pos.get(a);
                const p2 = pos.get(b);

                // implementation note
                if (!p1 || !p2) {
                    result += a + b;
                    continue;
                }

                if (p1.row === p2.row) {
                    // implementation note
                    result += decrypt ? movePairInMatrix(matrix, p1, p2, 1, 0)
                                      : movePairInMatrix(matrix, p1, p2, -1, 0);
                } else if (p1.col === p2.col) {
                    // implementation note
                    result += decrypt ? movePairInMatrix(matrix, p1, p2, 0, 1)
                                      : movePairInMatrix(matrix, p1, p2, 0, -1);
                } else {
                    // implementation note
                    result += decrypt ? movePairInMatrix(matrix, p1, p2, -1, -1)
                                      : movePairInMatrix(matrix, p1, p2, 1, 1);
                }
            }

            // append the final unpaired character unchanged
            if (i < text.length) result += text[i];
            return result;
        }

        function matrixPairEncrypt(text, matrixKey) {
            return matrixPairTransform(text, matrixKey, false);
        }

        function matrixPairDecrypt(text, matrixKey) {
            return matrixPairTransform(text, matrixKey, true);
        }

        // ========== v12 phantom noise layer ==========
        // implementation note
        function generatePhantomRandomText(length) {
            let text = '';
            for (let i = 0; i < length; i++) {
                text += lib1Original[Math.floor(Math.random() * lib1Original.length)];
            }
            return text;
        }

        function addPhantomNoise(ciphertext, n, m) {
            n = parseInt(n);
            m = parseInt(m);
            if (!Number.isInteger(n) || n < 1) throw new Error('Phantom interval N must be an integer greater than or equal to 1');
            if (!Number.isInteger(m) || m < 0) throw new Error('Phantom length M must be an integer greater than or equal to 0');
            if (m === 0 || ciphertext.length === 0) return ciphertext;

            let result = '';
            for (let i = 0; i < ciphertext.length; i += n) {
                const block = ciphertext.slice(i, i + n);
                result += block;
                // Insert random interference text only after a full N-character block when real ciphertext remains
                if (block.length === n && i + n < ciphertext.length) {
                    result += generatePhantomRandomText(m);
                }
            }
            return result;
        }

        function removePhantomNoise(noisyCiphertext, n, m) {
            n = parseInt(n);
            m = parseInt(m);
            if (!Number.isInteger(n) || n < 1) throw new Error('Phantom interval N must be an integer greater than or equal to 1');
            if (!Number.isInteger(m) || m < 0) throw new Error('Phantom length M must be an integer greater than or equal to 0');
            if (m === 0 || noisyCiphertext.length === 0) return noisyCiphertext;

            let result = '';
            let i = 0;
            while (i < noisyCiphertext.length) {
                result += noisyCiphertext.slice(i, i + n);
                i += n;
                // conditional handling
                if (i < noisyCiphertext.length) i += m;
            }
            return result;
        }

        // ========== v14-pre2 complete encryption flow ==========
        // implementation note
        function encryptV15Pre4(text, numKey, textKey, noiseKey, shaKey, cbcKey, initialStateCode, matrixKey, phantomN, phantomM, customLibraries) {
            // Step 0: CBCXOR chain
            const cbcResult = cbcEncrypt(text, cbcKey);

            // Step 1: SHA-95reversible mixinglayer
            const sha95Result = sha95Encrypt(cbcResult, shaKey);

            // Step 2: bit encodinglayer
            const bitEncoded = bitEncode(sha95Result);

            // implementation note
            const matrixEncoded = matrixPairEncrypt(bitEncoded, matrixKey);

            // Step 4: Triple Rotating Library Encryption
            const tripleResult = tripleLibEncrypt(matrixEncoded, numKey, initialStateCode, customLibraries);

            // Step 5: position shuffle
            const shuffled = shufflePositions(tripleResult.ciphertext);

            // Step 6: chained avalanche
            const avalanched = chainAvalanche(shuffled);

            // Step 7: column transposition
            const transposed = columnTranspose(avalanched, textKey);

            // Step 8: Perlin noise offset
            const noised = perlinNoiseEncrypt(transposed, noiseKey);

            // Step 9: reverse
            const reversed = noised.split('').reverse().join('');

            // implementation note
            const phantomNoised = addPhantomNoise(reversed, phantomN, phantomM);

            // Generate state code
            const statusCode = generateLibStatusCode(
                tripleResult.finalState.lib1Rot,
                tripleResult.finalState.lib2Rot,
                tripleResult.finalState.lib3Rot
            );

            return {
                ciphertext: phantomNoised,
                realCiphertext: reversed,
                stateCode: statusCode,
                phantomN: phantomN,
                phantomM: phantomM,
                matrixKey: matrixKey,
                numKey: numKey,
                finalState: tripleResult.finalState
            };
        }

        // ========== v14-pre2 complete decryption flow ==========
        // implementation note
        function decryptV15Pre4(ciphertext, textKey, numKey, noiseKey, shaKey, cbcKey, stateCode, matrixKey, phantomN, phantomM, customLibraries) {
            // implementation note
            const cleanCiphertext = removePhantomNoise(ciphertext, phantomN, phantomM);

            // Step 9 inverse:reverserestore
            const unreversed = cleanCiphertext.split('').reverse().join('');

            // implementation note
            const denoised = perlinNoiseDecrypt(unreversed, noiseKey);

            // Step 7 inverse:column transpositionrestore
            const untransposed = columnTransposeReverse(denoised, textKey);

            // Step 6 inverse:chained avalancherestore
            const unavalanched = chainAvalancheReverse(untransposed);

            // Step 5 inverse:positionrestore
            const unshuffled = unshufflePositions(unavalanched);

            // Step 4 inverse:Triple rotating librariesDecrypt
            const tripleResult = tripleLibDecrypt(unshuffled, numKey, stateCode, customLibraries);

            // implementation note
            const matrixDecoded = matrixPairDecrypt(tripleResult.result, matrixKey);

            // implementation note
            const bitDecoded = bitDecode(matrixDecoded);

            // Step 1 inverse:SHA-95reversible mixingrestore
            const sha95Decrypted = sha95Decrypt(bitDecoded, shaKey);

            // Step 0 inverse:CBCXOR chainDecrypt
            const cbcDecrypted = cbcDecrypt(sha95Decrypted, cbcKey);

            return {
                success: tripleResult.success,
                result: cbcDecrypted,
                numKey: numKey,
                stateCode: stateCode,
                initialState: tripleResult.initialState
            };
        }
        // ========== UI event binding ==========
        document.addEventListener('DOMContentLoaded', function() {
            // Update noise curve in real time
            function updateNoiseCanvas() {
                const text = document.getElementById('plaintext').value;
                const seed = document.getElementById('noise-key').value;
                drawNoiseCanvas(text.length, seed);
            }

            document.getElementById('plaintext').addEventListener('input', updateNoiseCanvas);
            document.getElementById('noise-key').addEventListener('input', updateNoiseCanvas);
            updateNoiseCanvas(); // Initialize

            if (typeof bindJiamiV14Pre2InputNormalizers === 'function') {
                bindJiamiV14Pre2InputNormalizers();
            } else {
                console.warn('keyInputCheck.js is not loaded; key input auto-checking is disabled.');
            }

            // Encryptbutton
            document.getElementById('encrypt-btn').addEventListener('click', function() {
                const plaintext = document.getElementById('plaintext').value;
                const numKey = document.getElementById('num-key').value;
                const textKey = document.getElementById('text-key').value;
                const noiseKey = document.getElementById('noise-key').value;
                const shaKey = document.getElementById('sha-key').value;
                const cbcKey = document.getElementById('cbc-key').value;
                const matrixKey = document.getElementById('matrix-key').value;
                let initialStateCode = document.getElementById('lib-status').value || '000000';
                const phantomN = document.getElementById('phantom-n').value;
                const phantomM = document.getElementById('phantom-m').value;
                const customLibraries = [1, 2, 3].map(i => document.getElementById(`custom-lib${i}`).value);

                if (!plaintext) {
                    alert('Please enter text to encrypt!');
                    return;
                }
                if (!numKey || numKey < 0 || numKey > 94) {
                    alert('Please enter a valid Numeric key(0-94)!');
                    return;
                }
                if (!textKey || textKey.length !== 8) {
                    alert('Please enter an 8-character text key！');
                    return;
                }
                if (!cbcKey || cbcKey.length !== 4) {
                    alert('Please enter a 4-character CBC key！');
                    return;
                }
                try {
                    validateMatrixKey(matrixKey);
                } catch (e) {
                    alert(e.message);
                    return;
                }
                if (!phantomN || parseInt(phantomN) < 1 || parseInt(phantomN) > 99) {
                    alert('Please enter a valid Phantom intervalN(1-99)!');
                    return;
                }
                if (phantomM === '' || parseInt(phantomM) < 0 || parseInt(phantomM) > 99) {
                    alert('Please enter a valid Phantom lengthM(0-99)!');
                    return;
                }
                if (!/^\d{6}$/.test(initialStateCode)) {
                    alert('Initial library state code must be 6 digits!');
                    return;
                }

                try {
                    const result = encryptV15Pre4(plaintext, numKey, textKey, noiseKey, shaKey, cbcKey, initialStateCode, matrixKey, phantomN, phantomM, customLibraries);
                    document.getElementById('encrypted-result').textContent = result.ciphertext;
                    const keyOutput = document.getElementById('key-info-result');
                    keyOutput.replaceChildren();
                    const outputLines = [
                        ['Perlin noise key', noiseKey],
                        ['SHA key', shaKey],
                        ['Numeric shift key', numKey],
                        ['Phantom keys', 'N = ' + phantomN + ', M = ' + phantomM],
                        ['Final library state code for decryption', result.stateCode],
                        ['CBC key', cbcKey],
                        ['Text key', textKey],
                        ['Matrix mixing key', matrixKey],
                        ['Custom library 1', customLibraries[0]],
                        ['Custom library 2', customLibraries[1]],
                        ['Custom library 3', customLibraries[2]]
                    ];
                    outputLines.forEach(([label, value], index) => {
                        const line = document.createElement('div');
                        line.className = index >= 8 ? 'output-key-line output-library-line' : 'output-key-line';
                        const labelNode = document.createElement('strong');
                        labelNode.textContent = label + ': ';
                        const valueNode = document.createElement('span');
                        valueNode.textContent = value;
                        line.append(labelNode, valueNode);
                        keyOutput.appendChild(line);
                    });
                    document.getElementById('open-output-key-modal').disabled = false;
                    document.getElementById('lib1-rotations').textContent = formatLibRotation(result.finalState.lib1Rot);
                    document.getElementById('lib2-rotations').textContent = formatLibRotation(result.finalState.lib2Rot);
                    document.getElementById('lib3-rotations').textContent = formatLibRotation(result.finalState.lib3Rot);

                    // Copy only the ciphertext. Encryption and decryption keys remain independent.
                    document.getElementById('ciphertext').value = result.ciphertext;
                    document.getElementById('ciphertext').dispatchEvent(new Event('input', { bubbles: true }));
                } catch (e) {
                    alert('Encryption error:' + e.message);
                    console.error(e);
                }
            });

            // Decryptbutton
            document.getElementById('decrypt-btn').addEventListener('click', function() {
                const ciphertext = document.getElementById('ciphertext').value;
                const numKey = document.getElementById('decrypt-num-key').value;
                const textKey = document.getElementById('decrypt-text-key').value;
                const noiseKey = document.getElementById('decrypt-noise-key').value;
                const shaKey = document.getElementById('decrypt-sha-key').value;
                const cbcKey = document.getElementById('decrypt-cbc-key').value;
                const matrixKey = document.getElementById('decrypt-matrix-key').value;
                let stateCode = document.getElementById('decrypt-state').value;
                const phantomN = document.getElementById('decrypt-phantom-n').value;
                const phantomM = document.getElementById('decrypt-phantom-m').value;
                const customLibraries = [1, 2, 3].map(i => document.getElementById(`decrypt-custom-lib${i}`).value);

                if (!ciphertext) {
                    alert('Please enter text to decrypt!');
                    return;
                }
                if (!numKey || numKey < 0 || numKey > 94) {
                    alert('Please enter a valid Numeric key(0-94)!');
                    return;
                }
                if (!textKey || textKey.length !== 8) {
                    alert('Please enter an 8-character text key!');
                    return;
                }
                if (!cbcKey || cbcKey.length !== 4) {
                    alert('Please enter a 4-character CBC key!');
                    return;
                }
                if (!stateCode || !/^\d{6}$/.test(stateCode)) {
                    alert('Please enter a 6-digit numeric library state code!');
                    return;
                }
                try {
                    validateMatrixKey(matrixKey);
                } catch (e) {
                    alert(e.message);
                    return;
                }
                if (!phantomN || parseInt(phantomN) < 1 || parseInt(phantomN) > 99) {
                    alert('Please enter a valid Phantom intervalN(1-99)!');
                    return;
                }
                if (phantomM === '' || parseInt(phantomM) < 0 || parseInt(phantomM) > 99) {
                    alert('Please enter a valid Phantom lengthM(0-99)!');
                    return;
                }

                try {
                    const result = decryptV15Pre4(ciphertext, textKey, numKey, noiseKey, shaKey, cbcKey, stateCode, matrixKey, phantomN, phantomM, customLibraries);
                    document.getElementById('decrypted-result').textContent = result.result;
                    document.getElementById('detected-lib1').textContent = formatLibRotation(result.initialState.lib1Rot);
                    document.getElementById('detected-lib2').textContent = formatLibRotation(result.initialState.lib2Rot);
                    document.getElementById('detected-lib3').textContent = formatLibRotation(result.initialState.lib3Rot);
                } catch (e) {
                    alert('Decryption error:' + e.message);
                    console.error(e);
                }
            });

            // Clearbutton
            document.getElementById('clear-encrypt').addEventListener('click', function() {
                document.getElementById('plaintext').value = '';
                document.getElementById('encrypted-result').textContent = 'Waiting to encrypt...';
                document.getElementById('key-info-result').textContent = 'Waiting to encrypt...';
                document.getElementById('open-output-key-modal').disabled = true;
                document.getElementById('lib1-rotations').textContent = '00';
                document.getElementById('lib2-rotations').textContent = '00';
                document.getElementById('lib3-rotations').textContent = '00';
                updateNoiseCanvas();
            });

            document.getElementById('clear-decrypt').addEventListener('click', function() {
                document.getElementById('ciphertext').value = '';
                document.getElementById('decrypted-result').textContent = 'Waiting to decrypt...';
                document.getElementById('detected-lib1').textContent = '00';
                document.getElementById('detected-lib2').textContent = '00';
                document.getElementById('detected-lib3').textContent = '00';
            });
        });

// ---- Extracted inline script 2 from jiami15.html ----
document.addEventListener('DOMContentLoaded', function () {
    const overlay = document.getElementById('key-modal');
    const dialog = overlay.querySelector('.key-modal-dialog');
    const openButtons = Array.from(document.querySelectorAll('.section-key-button'));
    const closeButton = document.getElementById('close-key-modal');
    const cancelButton = document.getElementById('cancel-key-modal');
    const saveButton = document.getElementById('save-key-modal');
    let previousFocus = null;
    let activeSection = null;
    let snapshot = {};

    function sectionInputs(section = activeSection) {
        return section ? Array.from(section.querySelectorAll('input')) : [];
    }
    function takeSnapshot() {
        snapshot = Object.fromEntries(sectionInputs().map(input => [input.id, input.value]));
    }
    function restoreSnapshot() {
        sectionInputs().forEach(input => {
            if (Object.hasOwn(snapshot, input.id)) {
                input.value = snapshot[input.id];
                input.dispatchEvent(new Event('input', { bubbles:true }));
            }
        });
    }
    function openModal(targetId) {
        activeSection = document.getElementById(targetId);
        if (!activeSection) return;

        // Each button opens and saves only its own independent key panel.
        overlay.querySelectorAll('.key-modal-section').forEach(section => {
            section.hidden = section !== activeSection;
        });
        document.getElementById('key-modal-title').textContent =
            targetId === 'encrypt-key-section' ? 'Encryption Key Configuration' : 'Decryption Key Configuration';

        takeSnapshot();
        previousFocus = document.activeElement;
        overlay.hidden = false;
        overlay.setAttribute('aria-hidden','false');
        document.body.classList.add('key-modal-open');
        requestAnimationFrame(() => {
            const first = sectionInputs()[0];
            if (first) first.focus(); else dialog.focus();
        });
    }
    function closeModal(restore) {
        if (restore) restoreSnapshot();
        overlay.hidden = true;
        overlay.setAttribute('aria-hidden','true');
        document.body.classList.remove('key-modal-open');
        activeSection = null;
        snapshot = {};
        if (previousFocus) previousFocus.focus();
    }
    openButtons.forEach(button => button.addEventListener('click', () => openModal(button.dataset.keyTarget)));
    closeButton.addEventListener('click', () => closeModal(false));
    saveButton.addEventListener('click', () => closeModal(false));
    cancelButton.addEventListener('click', () => closeModal(true));
    overlay.addEventListener('mousedown', event => { if (event.target === overlay) closeModal(true); });
    document.addEventListener('keydown', event => {
        if (overlay.hidden) return;
        if (event.key === 'Escape') { event.preventDefault(); closeModal(true); }
        if (event.key === 'Tab') {
            const focusable=Array.from(dialog.querySelectorAll('button:not([disabled]),input:not([disabled])')).filter(el=>el.offsetParent!==null);
            if(!focusable.length)return;
            const first=focusable[0],last=focusable[focusable.length-1];
            if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
            else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
        }
    });
});

// ---- Extracted inline script 3 from jiami15.html ----
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('output-key-modal');
    const dialog = modal.querySelector('.output-key-dialog');
    const open = document.getElementById('open-output-key-modal');
    const close = document.getElementById('close-output-key-modal');
    const done = document.getElementById('done-output-key-modal');
    let previousFocus = null;
    function openModal() {
        if (open.disabled) return;
        previousFocus = document.activeElement;
        modal.hidden = false; modal.setAttribute('aria-hidden','false');
        document.body.classList.add('key-modal-open'); dialog.focus();
    }
    function closeModal() {
        modal.hidden = true; modal.setAttribute('aria-hidden','true');
        document.body.classList.remove('key-modal-open');
        if (previousFocus) previousFocus.focus();
    }
    open.addEventListener('click', openModal); close.addEventListener('click', closeModal); done.addEventListener('click', closeModal);
    modal.addEventListener('mousedown', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (!modal.hidden && e.key === 'Escape') { e.preventDefault(); closeModal(); } });
});
