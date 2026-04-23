// Utility functions for End-to-End Encryption using Web Crypto API

// Generate ECDH P-256 Key Pair
export async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );
}

// Export Public Key to base64 string
export async function exportPublicKey(key) {
  const exported = await window.crypto.subtle.exportKey('spki', key);
  const exportedAsString = String.fromCharCode.apply(null, new Uint8Array(exported));
  return window.btoa(exportedAsString);
}

// Import Public Key from base64 string
export async function importPublicKey(base64Str) {
  const binaryDerString = window.atob(base64Str);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  
  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

// Derive Shared AES-GCM Key
export async function deriveSharedKey(privateKey, publicKey) {
  return await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt Message
export async function encryptMessage(sharedKey, plaintext) {
  const enc = new TextEncoder();
  const encoded = enc.encode(plaintext);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    sharedKey,
    encoded
  );
  
  const ciphertextBase64 = window.btoa(String.fromCharCode.apply(null, new Uint8Array(ciphertextBuffer)));
  const ivBase64 = window.btoa(String.fromCharCode.apply(null, iv));
  
  return { iv: ivBase64, ciphertext: ciphertextBase64 };
}

// Decrypt Message
export async function decryptMessage(sharedKey, ivBase64, ciphertextBase64) {
  const ivStr = window.atob(ivBase64);
  const iv = new Uint8Array(ivStr.length);
  for (let i = 0; i < ivStr.length; i++) iv[i] = ivStr.charCodeAt(i);
  
  const cipherStr = window.atob(ciphertextBase64);
  const ciphertextBuffer = new Uint8Array(cipherStr.length);
  for (let i = 0; i < cipherStr.length; i++) ciphertextBuffer[i] = cipherStr.charCodeAt(i);
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    sharedKey,
    ciphertextBuffer
  );
  
  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

// Save Private Key to IndexedDB using a simple wrapper
export async function savePrivateKey(key) {
  const jwk = await window.crypto.subtle.exportKey('jwk', key);
  localStorage.setItem('study-tracker-private-key', JSON.stringify(jwk));
}

// Load Private Key
export async function loadPrivateKey() {
  const saved = localStorage.getItem('study-tracker-private-key');
  if (!saved) return null;
  
  try {
    const jwk = JSON.parse(saved);
    return await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits']
    );
  } catch (e) {
    console.error('Failed to load private key', e);
    return null;
  }
}

// Ensure keys exist locally and upload public key if newly generated
export async function ensureKeys(api) {
  try {
    let privKey = await loadPrivateKey();
    if (privKey) {
      // Key exists, but we should probably ensure the server has the public key just in case.
      // But to avoid an extra request every load, we assume if it's in localStorage, it's been uploaded.
      return privKey;
    }

    // Generate new pair
    const keyPair = await generateKeyPair();
    await savePrivateKey(keyPair.privateKey);
    const pubKeyBase64 = await exportPublicKey(keyPair.publicKey);

    // Upload to server
    await api.put('/auth/public-key', { publicKey: pubKeyBase64 });
    return keyPair.privateKey;
  } catch (err) {
    console.error('Failed to ensure keys:', err);
    return null;
  }
}
