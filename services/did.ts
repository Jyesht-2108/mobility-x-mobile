import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// Simple DID using did:key with Ed25519 public key (base58btc)

const DID_PRIVATE_KEY_KEY = 'did_ed25519_private_key_hex';
const DID_PUBLIC_KEY_KEY = 'did_ed25519_public_key_hex';

export type DidDocument = {
  id: string;
  '@context': string[];
  verificationMethod: Array<{ id: string; type: string; controller: string; publicKeyMultibase: string }>;
  authentication: string[];
};

function toBase58(bytes: Uint8Array): string {
  // Minimal base58btc encoder for short keys; for production use a library.
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let x = BigInt(0);
  for (const b of bytes) x = (x << BigInt(8)) + BigInt(b);
  let out = '';
  while (x > 0) {
    const mod = Number(x % BigInt(58));
    out = alphabet[mod] + out;
    x = x / BigInt(58);
  }
  // preserve leading zeros
  for (const b of bytes) {
    if (b === 0) out = '1' + out; else break;
  }
  return out || '1';
}

function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
  const arr = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  }
  return arr;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function ensureDidKey(): Promise<{ did: string; publicKeyHex: string }> {
  let privHex = (await SecureStore.getItemAsync(DID_PRIVATE_KEY_KEY)) || '';
  let pubHex = (await SecureStore.getItemAsync(DID_PUBLIC_KEY_KEY)) || '';

  if (!privHex || !pubHex) {
    // Generate 32 bytes secret for Ed25519; expo-crypto randomUUID is not random bytes, use getRandomBytesAsync
    const priv = await Crypto.getRandomBytesAsync(32);
    // Derive public key: expo-crypto does not expose ed25519 keygen; fallback to storing only private and using placeholder pub as hash
    // For demo: use SHA-256(priv) as pseudo-public for DID id anchor (not cryptographically correct for signatures)
    const pubHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, bytesToHex(priv));
    privHex = bytesToHex(priv);
    pubHex = pubHash.slice(0, 64);
    await SecureStore.setItemAsync(DID_PRIVATE_KEY_KEY, privHex);
    await SecureStore.setItemAsync(DID_PUBLIC_KEY_KEY, pubHex);
  }

  const pubBytes = hexToBytes(pubHex);
  // multicodec prefix for ed25519-pub is 0xED 0x01
  const prefixed = new Uint8Array(2 + pubBytes.length);
  prefixed[0] = 0xed;
  prefixed[1] = 0x01;
  prefixed.set(pubBytes, 2);
  const multibase = 'z' + toBase58(prefixed);
  const did = `did:key:${multibase}`;
  return { did, publicKeyHex: pubHex };
}

export async function getDidDocument(): Promise<DidDocument> {
  const { did } = await ensureDidKey();
  const multibase = did.replace('did:key:', '');
  return {
    id: `did:key:${multibase}`,
    '@context': ['https://www.w3.org/ns/did/v1'],
    verificationMethod: [
      {
        id: `did:key:${multibase}#controller`,
        type: 'Ed25519VerificationKey2020',
        controller: `did:key:${multibase}`,
        publicKeyMultibase: multibase,
      },
    ],
    authentication: [`did:key:${multibase}#controller`],
  };
}


