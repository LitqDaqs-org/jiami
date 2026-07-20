// ========== character library definitions ==========
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

            // append remaining fewer than 4 characters unchanged
            for (let i = fullBlocks * blockSize; i < text.length; i++) {
                result += text[i];
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

            // implementation note
            for (let i = fullBlocks * blockSize; i < ciphertext.length; i++) {
                result += ciphertext[i];
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

        // ========== v13 complete encryption flow ==========
        // implementation note
        function encryptV13(text, numKey, textKey, noiseKey, shaKey, cbcKey, initialStateCode, matrixKey, phantomN, phantomM) {
            // Step 0: CBCXOR chain
            const cbcResult = cbcEncrypt(text, cbcKey);

            // Step 1: SHA-95reversible mixinglayer
            const sha95Result = sha95Encrypt(cbcResult, shaKey);

            // Step 2: bit encodinglayer
            const bitEncoded = bitEncode(sha95Result);

            // implementation note
            const matrixEncoded = matrixPairEncrypt(bitEncoded, matrixKey);

            // Step 4: Triple Rotating Library Encryption
            const tripleResult = tripleLibEncrypt(matrixEncoded, numKey, initialStateCode);

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

        // ========== v13 complete decryption flow ==========
        // implementation note
        function decryptV13(ciphertext, textKey, numKey, noiseKey, shaKey, cbcKey, stateCode, matrixKey, phantomN, phantomM) {
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
            const tripleResult = tripleLibDecrypt(unshuffled, numKey, stateCode);

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
                const seed = document.getElementById('noise-key').value || 'default';
                drawNoiseCanvas(text.length, seed);
            }

            document.getElementById('plaintext').addEventListener('input', updateNoiseCanvas);
            document.getElementById('noise-key').addEventListener('input', updateNoiseCanvas);
            updateNoiseCanvas(); // Initialize

            // Encryptbutton
            document.getElementById('encrypt-btn').addEventListener('click', function() {
                const plaintext = document.getElementById('plaintext').value;
                const numKey = document.getElementById('num-key').value;
                const textKey = document.getElementById('text-key').value;
                const noiseKey = document.getElementById('noise-key').value || 'default';
                const shaKey = document.getElementById('sha-key').value || 'sha256';
                const cbcKey = document.getElementById('cbc-key').value || 'XKEY';
                const matrixKey = document.getElementById('matrix-key').value;
                const initialStateCode = document.getElementById('lib-status').value || '000000';
                const phantomN = document.getElementById('phantom-n').value;
                const phantomM = document.getElementById('phantom-m').value;

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
                    const result = encryptV13(plaintext, numKey, textKey, noiseKey, shaKey, cbcKey, initialStateCode, matrixKey, phantomN, phantomM);
                    document.getElementById('encrypted-result').textContent = result.ciphertext;
                    document.getElementById('key-info-result').textContent = 'Library state code: ' + result.stateCode + ' | CBC key: ' + cbcKey + ' | SHA key: ' + shaKey + ' | Numeric key: ' + numKey + ' | Text key: ' + textKey + ' | Noise seed: ' + noiseKey + ' | Matrix key: ' + matrixKey + ' | Phantom intervalN: ' + phantomN + ' | Phantom lengthM: ' + phantomM;
                    document.getElementById('lib1-rotations').textContent = formatLibRotation(result.finalState.lib1Rot);
                    document.getElementById('lib2-rotations').textContent = formatLibRotation(result.finalState.lib2Rot);
                    document.getElementById('lib3-rotations').textContent = formatLibRotation(result.finalState.lib3Rot);

                    // Auto-sync to decryption area
                    document.getElementById('ciphertext').value = result.ciphertext;
                    document.getElementById('decrypt-num-key').value = numKey;
                    document.getElementById('decrypt-text-key').value = textKey;
                    document.getElementById('decrypt-noise-key').value = noiseKey;
                    document.getElementById('decrypt-sha-key').value = shaKey;
                    document.getElementById('decrypt-cbc-key').value = cbcKey;
                    document.getElementById('decrypt-matrix-key').value = matrixKey;
                    document.getElementById('decrypt-state').value = result.stateCode;
                    document.getElementById('decrypt-phantom-n').value = phantomN;
                    document.getElementById('decrypt-phantom-m').value = phantomM;
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
                const noiseKey = document.getElementById('decrypt-noise-key').value || 'default';
                const shaKey = document.getElementById('decrypt-sha-key').value || 'sha256';
                const cbcKey = document.getElementById('decrypt-cbc-key').value || 'XKEY';
                const matrixKey = document.getElementById('decrypt-matrix-key').value;
                const stateCode = document.getElementById('decrypt-state').value;
                const phantomN = document.getElementById('decrypt-phantom-n').value;
                const phantomM = document.getElementById('decrypt-phantom-m').value;

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
                    const result = decryptV13(ciphertext, textKey, numKey, noiseKey, shaKey, cbcKey, stateCode, matrixKey, phantomN, phantomM);
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
