// Simple polyfill for crypto.getRandomValues on older Node versions/environments
// This file is required before Vite runs to ensure code that expects
// Web Crypto's getRandomValues works during the build.

if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.getRandomValues !== 'function') {
  // Use Node's crypto.randomFillSync
  const nodeCrypto = require('crypto');
  globalThis.crypto = {
    getRandomValues: (arr) => {
      if (!Buffer.isBuffer(arr) && !(arr instanceof Uint8Array)) {
        throw new TypeError('Expected Uint8Array or Buffer');
      }
      const buffer = Buffer.from(arr.buffer ? arr.buffer : arr);
      nodeCrypto.randomFillSync(buffer);
      // copy back into provided array view
      if (arr.set) {
        arr.set(new Uint8Array(buffer));
      }
      return arr;
    }
  };
}
