(function () {
    function attr(name, value) {
        return value === undefined || value === null || value === '' ? '' : ` ${name}="${String(value).replace(/"/g, '&quot;')}"`;
    }

    function renderMatrixInput(prefix, desc) {
        return `
                <div class="input-group">
                    <label for="${prefix}matrix-key">Matrix key (12 unique characters):</label>
                    <input type="text" id="${prefix}matrix-key" maxlength="12" value="12hcd75ab390" placeholder="${prefix ? 'Matrix key used during encryption' : '12-character matrix key'}">
                    <div class="key-range">${desc}</div>
                </div>`;
    }

    window.renderJiamiLayout = function renderJiamiLayout(config) {
        const shaMax = attr('maxlength', config.shaMaxLength);
        const noiseMax = attr('maxlength', config.noiseMaxLength);
        const matrixEncrypt = config.hasMatrix ? renderMatrixInput('', config.matrixEncryptDesc) : '';
        const matrixDecrypt = config.hasMatrix ? renderMatrixInput('decrypt-', config.matrixDecryptDesc) : '';
        const headerImage = config.headerImage ? `
            <img class="header-work-together" src="${config.headerImage.src}" alt="${config.headerImage.alt || ''}">` : '';

        const layoutHtml = `
    <div class="container">
        <header>
            <h1>甲醚</h1>
            <div class="version-badge">${config.versionBadge}</div>
            <p class="subtitle">"Enter text"</p>
            <div class="warning">${config.warning}</div>${headerImage}
        </header>
        <div class="main-content">
            <div class="section">
                <h2>Encrypt</h2>
                <div class="controls-grid" style="grid-template-columns: 1fr 1fr;">
                    <div class="control-group">
                        <label for="cbc-key">CBC key (4 characters):</label>
                        <input type="text" id="cbc-key" maxlength="4" value="XKEY" placeholder="4-character CBC key">
                        <div class="key-range">Controls the CBC XOR chain layer</div>
                    </div>
                    <div class="control-group">
                        <label for="sha-key">SHA key:</label>
                        <input type="text" id="sha-key"${shaMax} value="sha256" placeholder="SHA key (controls reversible mixing layer)">
                        <div class="key-range">Controls SHA-95 reversible block mixing and state chain</div>
                    </div>
                </div>${matrixEncrypt}
                <div class="controls-grid-4">
                    <div class="control-group">
                        <label for="num-key">Numeric key(0-94):</label>
                        <input type="number" id="num-key" min="0" max="94" value="1" step="1">
                        <div class="key-range">Controls triple-library offset</div>
                    </div>
                    <div class="control-group">
                        <label for="text-key">Text key (8 characters):</label>
                        <input type="text" id="text-key" maxlength="8" value="abcdefgh" placeholder="8-character text key">
                        <div class="key-range">Controls column transposition order</div>
                    </div>
                    <div class="control-group">
                        <label for="noise-key">Noise key (seed):</label>
                        <input type="text" id="noise-key"${noiseMax} value="perlin99" placeholder="Noise seed">
                        <div class="key-range">Controls the Perlin noise curve</div>
                    </div>
                    <div class="control-group">
                        <label for="lib-status">Library state code (6 digits):</label>
                        <input type="text" id="lib-status" maxlength="6" value="000000" placeholder="e.g. 012345">
                        <div class="key-range">Initial rotations for the three libraries</div>
                    </div>
                </div>
                <div class="controls-grid" style="grid-template-columns: 1fr 1fr;">
                    <div class="control-group">
                        <label for="phantom-n">Phantom interval N:</label>
                        <input type="number" id="phantom-n" min="1" max="99" value="5" step="1">
                        <div class="key-range">Insert random text after every N real ciphertext characters</div>
                    </div>
                    <div class="control-group">
                        <label for="phantom-m">Phantom length M:</label>
                        <input type="number" id="phantom-m" min="0" max="99" value="3" step="1">
                        <div class="key-range">Insert M random characters each time</div>
                    </div>
                </div>
                <div class="input-group">
                    <label for="plaintext">Text to encrypt:</label>
                    <textarea id="plaintext" placeholder="Enter the text to encrypt...">Made by Litaiqi_Daquavis</textarea>
                </div>
                <div class="btn-group">
                    <button id="encrypt-btn" class="encrypt-btn"> Encrypt Text</button>
                    <button id="clear-encrypt" class="clear-btn">Clear</button>
                </div>
                <div class="result-container">
                    <div class="result-label">Encryption Result(Ciphertext):</div>
                    <div id="encrypted-result" class="result">Waiting to encrypt...</div>
                </div>
                <div class="result-container" style="border: 1px solid rgba(255,170,0,0.3);">
                    <div class="result-label">🔑 Key info (must be saved with ciphertext; required for decryption):</div>
                    <div id="key-info-result" class="result" style="color: #ffaa00;">Waiting to encrypt...</div>
                    <div style="color: #666; font-size: 0.8rem; margin-top: 5px; font-style: italic;">⚠️ Losing any key info will make decryption impossible!</div>
                </div>
                <div class="noise-canvas-container">
                    <div class="noise-canvas-label">🌊 Perlin noise curve visualization(offset values within ciphertext length)</div>
                    <canvas id="noise-canvas" width="1100" height="150"></canvas>
                </div>
                <div class="status-info">
                    <div class="status-item">
                        <div class="status-label">Lib 1current rotations</div>
                        <div id="lib1-rotations" class="status-value">00</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">Lib 2current rotations</div>
                        <div id="lib2-rotations" class="status-value">00</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">Lib 3current rotations</div>
                        <div id="lib3-rotations" class="status-value">00</div>
                    </div>
                </div>
            </div>
            <div class="section">
                <h2>Decrypt</h2>
                <div class="input-group">
                    <label for="ciphertext">Text to decrypt:</label>
                    <textarea id="ciphertext" placeholder="Enter the text to decrypt..."></textarea>
                </div>
                <div class="input-group">
                    <label for="decrypt-cbc-key">CBC key (4 characters):</label>
                    <input type="text" id="decrypt-cbc-key" maxlength="4" value="XKEY" placeholder="CBC key used during encryption">
                    <div class="key-range">CBC key used during encryption</div>
                </div>
                <div class="input-group">
                    <label for="decrypt-sha-key">SHA key:</label>
                    <input type="text" id="decrypt-sha-key"${shaMax} value="sha256" placeholder="SHA key used during encryption">
                    <div class="key-range">SHA key used during encryption</div>
                </div>${matrixDecrypt}
                <div class="controls-grid" style="grid-template-columns: 1fr 1fr;">
                    <div class="control-group">
                        <label for="decrypt-phantom-n">Phantom interval N:</label>
                        <input type="number" id="decrypt-phantom-n" min="1" max="99" value="5" step="1">
                        <div class="key-range">Phantom interval N used during encryption</div>
                    </div>
                    <div class="control-group">
                        <label for="decrypt-phantom-m">Phantom length M:</label>
                        <input type="number" id="decrypt-phantom-m" min="0" max="99" value="3" step="1">
                        <div class="key-range">Phantom length M used during encryption</div>
                    </div>
                </div>
                <div class="controls-grid-4">
                    <div class="control-group">
                        <label for="decrypt-num-key">Numeric key(0-94):</label>
                        <input type="number" id="decrypt-num-key" min="0" max="94" value="1" step="1">
                        <div class="key-range">Numeric key used during encryption</div>
                    </div>
                    <div class="control-group">
                        <label for="decrypt-text-key">Text key (8 characters):</label>
                        <input type="text" id="decrypt-text-key" maxlength="8" value="abcdefgh" placeholder="8-character text key">
                        <div class="key-range">Text key used during encryption</div>
                    </div>
                    <div class="control-group">
                        <label for="decrypt-noise-key">Noise key (seed):</label>
                        <input type="text" id="decrypt-noise-key"${noiseMax} value="perlin99" placeholder="Noise seed">
                        <div class="key-range">Noise seed used during encryption</div>
                    </div>
                    <div class="control-group">
                        <label for="decrypt-state">Library state code (6 digits):</label>
                        <input type="text" id="decrypt-state" maxlength="6" value="" placeholder="State code from encryption output">
                        <div class="key-range">State code from encryption output</div>
                    </div>
                </div>
                <div class="btn-group">
                    <button id="decrypt-btn" class="encrypt-btn"> Decrypt Text</button>
                    <button id="clear-decrypt" class="clear-btn">Clear</button>
                </div>
                <div class="result-container">
                    <div class="result-label">Decryption Result:</div>
                    <div id="decrypted-result" class="result">Waiting to decrypt...</div>
                </div>
                <div class="status-info">
                    <div class="status-item">
                        <div class="status-label">Detected Lib 1 rotations</div>
                        <div id="detected-lib1" class="status-value">00</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">Detected Lib 2 rotations</div>
                        <div id="detected-lib2" class="status-value">00</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">Detected Lib 3 rotations</div>
                        <div id="detected-lib3" class="status-value">00</div>
                    </div>
                </div>
            </div>
        </div>
        <footer><p>${config.footerText}</p></footer>
    </div>`;

        const existing = document.getElementById('jiami-shared-layout-root');
        if (existing) existing.remove();

        const wrapper = document.createElement('div');
        wrapper.id = 'jiami-shared-layout-root';
        wrapper.innerHTML = layoutHtml;
        document.body.insertBefore(wrapper, document.body.firstChild);
    };
}());
