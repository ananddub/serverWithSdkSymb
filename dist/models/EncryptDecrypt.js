import CryptoJS from 'crypto-js';
class CryptoEncryption {
    getKeyAndIv(password) {
        const key = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
        const iv = CryptoJS.MD5(password).toString(CryptoJS.enc.Hex).slice(0, 16);
        return { key, iv };
    }
    encrypt(text, password) {
        const { key, iv } = this.getKeyAndIv(password);
        const encrypted = CryptoJS.AES.encrypt(text, CryptoJS.enc.Hex.parse(key), {
            iv: CryptoJS.enc.Hex.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return encrypted.toString();
    }
    decrypt(encryptedText, password) {
        const { key, iv } = this.getKeyAndIv(password);
        const decrypted = CryptoJS.AES.decrypt(encryptedText, CryptoJS.enc.Hex.parse(key), {
            iv: CryptoJS.enc.Hex.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    }
    async jsondecrypt(encryptedText, password) {
        try {
            const data = this.decrypt(encryptedText, password);
            return await JSON.parse(data);
        }
        catch (e) {
            return null;
        }
    }
}
export default CryptoEncryption;
