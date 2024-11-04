// scripts/generate-keys.ts
import * as crypto from 'crypto';

function generateEncryptionKeys() {
  // Generate a random 32-byte (256-bit) key
  const key = crypto.randomBytes(32);
  // Generate a random 16-byte (128-bit) IV
  const iv = crypto.randomBytes(16);

  console.log('Add these to your .env file:');
  console.log(`ENCRYPTION_KEY=${key.toString('hex')}`);
  console.log(`ENCRYPTION_IV=${iv.toString('hex')}`);
}

generateEncryptionKeys();
