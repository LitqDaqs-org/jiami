var lib1Original = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;':\\\",./<>?`~ ";
var lib2Original = "1029384756qpwoeirutyalskdjfhgzmxncbvQPWOEIRUTYALSKDJFHGZMXNCBV!)@(#*$&%^_+-={|}[]\\:\";'<?>,/.~` ";
var lib3Original = "0192837465pqowieurytlaksjdhfgmznxbcvPQOWIEURYTLAKSJDHFGMZNXBCV)!(@*#&$^%+_=-|{}\\][\":';?<>/,.~` ";
var libSize = lib1Original.length;

document.getElementById('lib1-preview').textContent = lib1Original;
document.getElementById('lib2-preview').textContent = lib2Original;
document.getElementById('lib3-preview').textContent = lib3Original;

function fmt(r) { return r.toString().padStart(2, '0'); }

function parseState(code) {
 if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) return { lib1Rot: 0, lib2Rot: 0, lib3Rot: 0 };
 return { lib1Rot: parseInt(code.substring(0,2)), lib2Rot: parseInt(code.substring(2,4)), lib3Rot: parseInt(code.substring(4,6)) };
}

function genState(a, b, c) { return fmt(a % libSize) + fmt(b % libSize) + fmt(c % libSize); }

function rotateLib(lib, rot) {
 rot = rot % lib.length;
 return rot === 0 ? lib : lib.substring(rot) + lib.substring(0, rot);
}

// ===== v5 position shufflelayer =====
function shufflePositions(text) {
 var chars = text.split('');
 var sg = [];
 for (var i = 0; i < chars.length; i += 3) sg.push(chars.slice(i, Math.min(i + 3, chars.length)));
 var fsc = 0;
 for (var j = 0; j < sg.length; j++) { if (sg[j].length === 3) fsc++; else break; }
 var fbc = Math.floor(fsc / 3);
 var bg = [];
 for (var i = 0; i < fbc; i++) bg.push([sg[i*3].slice(), sg[i*3+1].slice(), sg[i*3+2].slice()]);
 var rem = [];
 for (var i = fbc * 3; i < sg.length; i++) rem.push(sg[i].slice());
 for (var i = 0; i < bg.length; i++) {
  var g = bg[i];
  var first = g[1][0]; g[1] = [g[1][1], g[1][2], first];
  var last = g[2][2]; g[2] = [last, g[2][0], g[2][1]];
 }
 bg.reverse();
 var result = [];
 for (var i = 0; i < bg.length; i++) for (var j = 0; j < 3; j++) result = result.concat(bg[i][j]);
 for (var i = 0; i < rem.length; i++) result = result.concat(rem[i]);
 return result.join('');
}

function unshufflePositions(text) {
 var chars = text.split('');
 var sg = [];
 for (var i = 0; i < chars.length; i += 3) sg.push(chars.slice(i, Math.min(i + 3, chars.length)));
 var fsc = 0;
 for (var j = 0; j < sg.length; j++) { if (sg[j].length === 3) fsc++; else break; }
 var fbc = Math.floor(fsc / 3);
 var bg = [];
 for (var i = 0; i < fbc; i++) bg.push([sg[i*3].slice(), sg[i*3+1].slice(), sg[i*3+2].slice()]);
 var rem = [];
 for (var i = fbc * 3; i < sg.length; i++) rem.push(sg[i].slice());
 bg.reverse();
 for (var i = 0; i < bg.length; i++) {
  var g = bg[i];
  var last = g[1][2]; g[1] = [last, g[1][0], g[1][1]];
  var first = g[2][0]; g[2] = [g[2][1], g[2][2], first];
 }
 var result = [];
 for (var i = 0; i < bg.length; i++) for (var j = 0; j < 3; j++) result = result.concat(bg[i][j]);
 for (var i = 0; i < rem.length; i++) result = result.concat(rem[i]);
 return result.join('');
}

// implementation note
function encrypt(text, key, initialStateCode) {
 var s = parseState(initialStateCode);
 var lib1 = rotateLib(lib1Original, s.lib1Rot);
 var lib2 = rotateLib(lib2Original, s.lib2Rot);
 var lib3 = rotateLib(lib3Original, s.lib3Rot);
 var r1 = s.lib1Rot, r2 = s.lib2Rot, r3 = s.lib3Rot;
 var c1 = 0, c2 = 0;
 var keyNum = parseInt(key) % libSize;
 var result = "";
 for (var i = 0; i < text.length; i++) {
  var ch = text[i], pos = i + 1;
  var idx1 = lib1.indexOf(ch);
  if (idx1 === -1) { result += ch; }
  else {
   var n1 = (idx1 + pos + keyNum) % libSize;
   var ch1 = lib1[n1];
   var idx2 = lib2.indexOf(ch1);
   var n2 = (idx2 + pos + keyNum) % libSize;
   var ch2 = lib2[n2];
   var idx3 = lib3.indexOf(ch2);
   var n3 = (idx3 + pos + keyNum) % libSize;
   result += lib3[n3];
  }
  lib1 = rotateLib(lib1, 1); r1 = (r1 + 1) % libSize; c1++;
  if (c1 >= 12) { c1 = 0; lib2 = rotateLib(lib2, 1); r2 = (r2 + 1) % libSize; c2++;
   if (c2 >= 12) { c2 = 0; lib3 = rotateLib(lib3, 1); r3 = (r3 + 1) % libSize; }
  }
 }
 var shuffled = shufflePositions(result);
 var reversed = shuffled.split('').reverse().join('');
 var finalCode = genState(r1, r2, r3);
 return { ciphertext: reversed, stateCode: finalCode, key: key };
}

// implementation note
function decrypt(ciphertext, key, stateCode) {
 if (!ciphertext || ciphertext.length === 0) return { success: false, result: "Ciphertext is empty" };
 var fs = parseState(stateCode);
 var reversed = ciphertext.split('').reverse().join('');
 var unshuffled = unshufflePositions(reversed);
 var len = unshuffled.length;
 var ir1 = (fs.lib1Rot - len) % libSize;
 var ir2 = (fs.lib2Rot - Math.floor(len / 12)) % libSize;
 var ir3 = (fs.lib3Rot - Math.floor(len / 144)) % libSize;
 if (ir1 < 0) ir1 += libSize;
 if (ir2 < 0) ir2 += libSize;
 if (ir3 < 0) ir3 += libSize;
 var lib1 = rotateLib(lib1Original, ir1);
 var lib2 = rotateLib(lib2Original, ir2);
 var lib3 = rotateLib(lib3Original, ir3);
 var c1 = 0, c2 = 0;
 var keyNum = parseInt(key) % libSize;
 var result = "";
 for (var i = 0; i < unshuffled.length; i++) {
  var ch = unshuffled[i], pos = i + 1;
  var idx3 = lib3.indexOf(ch);
  if (idx3 === -1) { result += ch; }
  else {
   var o3 = (idx3 - pos - keyNum) % libSize; if (o3 < 0) o3 += libSize;
   var ch2 = lib3[o3];
   var idx2 = lib2.indexOf(ch2);
   var o2 = (idx2 - pos - keyNum) % libSize; if (o2 < 0) o2 += libSize;
   var ch1 = lib2[o2];
   var idx1 = lib1.indexOf(ch1);
   var o1 = (idx1 - pos - keyNum) % libSize; if (o1 < 0) o1 += libSize;
   result += lib1[o1];
  }
  lib1 = rotateLib(lib1, 1); c1++;
  if (c1 >= 12) { c1 = 0; lib2 = rotateLib(lib2, 1); c2++;
   if (c2 >= 12) { c2 = 0; lib3 = rotateLib(lib3, 1); }
  }
 }
 return { success: true, result: result };
}

// ===== UI =====
var plaintextEl = document.getElementById('plaintext');
var ciphertextEl = document.getElementById('ciphertext');
var keyEl = document.getElementById('key');
var libStatusEl = document.getElementById('lib-status');
var encResultEl = document.getElementById('encrypted-result');
var keyInfoEl = document.getElementById('key-info-result');
var decResultEl = document.getElementById('decrypted-result');
var r1El = document.getElementById('lib1-rotations');
var r2El = document.getElementById('lib2-rotations');
var r3El = document.getElementById('lib3-rotations');
var dkEl = document.getElementById('decrypt-key');
var dsEl = document.getElementById('decrypt-state');

function clampKey(el) {
 var v = parseInt(el.value) || 0;
 if (v < 0) v = 0; if (v > 94) v = 94;
 el.value = v;
}

function clampState(el) {
 var v = el.value.replace(/\D/g, '');
 if (v.length > 6) v = v.substring(0, 6);
 el.value = v;
}

function doEncrypt() {
 var text = plaintextEl.value;
 if (!text.trim()) { encResultEl.textContent = "Please enter text to encrypt"; keyInfoEl.textContent = "-"; return; }
 var key = parseInt(keyEl.value) || 0;
 var state = libStatusEl.value.padEnd(6, '0').substring(0, 6);
 var r = encrypt(text, key, state);
 encResultEl.textContent = r.ciphertext;
 keyInfoEl.textContent = "Key: " + r.key + " | State code: " + r.stateCode;
 var ps = parseState(r.stateCode);
 r1El.textContent = fmt(ps.lib1Rot);
 r2El.textContent = fmt(ps.lib2Rot);
 r3El.textContent = fmt(ps.lib3Rot);
 // Auto-fill decryption area
 ciphertextEl.value = r.ciphertext;
 dkEl.value = r.key;
 dsEl.value = r.stateCode;
}

function doDecrypt() {
 var ct = ciphertextEl.value;
 if (!ct.trim()) { decResultEl.textContent = "Please enter ciphertext"; decResultEl.style.color = "#ff4444"; return; }
 var key = parseInt(dkEl.value) || 0;
 var state = dsEl.value.padEnd(6, '0').substring(0, 6);
 if (!dsEl.value || dsEl.value.length !== 6) {
  decResultEl.textContent = "Please enter a 6-digit state code"; decResultEl.style.color = "#ff4444"; return;
 }
 var r = decrypt(ct, key, state);
 if (r.success) {
  decResultEl.textContent = r.result;
  decResultEl.style.color = "#ffd166";
 } else {
  decResultEl.textContent = "Decryption failed: " + r.result;
  decResultEl.style.color = "#ff4444";
 }
}

document.getElementById('encrypt-btn').addEventListener('click', doEncrypt);
document.getElementById('decrypt-btn').addEventListener('click', doDecrypt);
document.getElementById('clear-encrypt').addEventListener('click', function() {
 plaintextEl.value = ""; encResultEl.textContent = "Waiting to encrypt..."; keyInfoEl.textContent = "Waiting to encrypt...";
});
document.getElementById('clear-decrypt').addEventListener('click', function() {
 ciphertextEl.value = ""; decResultEl.textContent = "Waiting to decrypt..."; decResultEl.style.color = "#ffd166";
});
keyEl.addEventListener('input', function() { clampKey(keyEl); });
keyEl.addEventListener('change', function() { clampKey(keyEl); });
dkEl.addEventListener('input', function() { clampKey(dkEl); });
dkEl.addEventListener('change', function() { clampKey(dkEl); });
libStatusEl.addEventListener('input', function() { clampState(libStatusEl); });
dsEl.addEventListener('input', function() { clampState(dsEl); });

window.addEventListener('load', function() {
 plaintextEl.value = "Made by Litaiqi_Daquavis";
 keyEl.value = 1;
 libStatusEl.value = "000000";
 doEncrypt();
});
