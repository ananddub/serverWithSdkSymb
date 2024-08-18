
import crypto from 'crypto';

function decrypt(text: string, key: Buffer): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift() as string, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function encrypt(text: string, key: Buffer): string {
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

const key: Buffer = crypto.randomBytes(32); // 256-bit key
const text: string = 'Hello, World!';
const encryptedText: string = encrypt(text, key);
console.log('Encrypted:', encryptedText);

const decryptedText: string = decrypt(encryptedText, key);
console.log('Decrypted:', decryptedText);

