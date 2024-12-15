const crypto = require('crypto');
require('dotenv').config();

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPT_KEY, 'utf-8');
const iv = Buffer.from(process.env.IV, 'utf-8');

// Función para cifrar
const encrypt = (data) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    //console.log("Encrypted Data:", encrypted);
    return encrypted;
};

// Función para descifrar
const decrypt = (encryptedData) => {
    //console.log("Encrypted Data to Decrypt:", encryptedData); 
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return JSON.parse(decrypted);
};

module.exports = { encrypt, decrypt };
