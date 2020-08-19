const crypto = require('crypto');

module.exports = class CryptUtil {

	static encrypt(data, password) {
		let hashedPassword = crypto.createHash('md5').update(new Buffer(password)).digest("hex").substring(0, 16);
		let iv = crypto.createHash('sha1').update(hashedPassword).digest("hex").substring(0, 16);

		let cipher = crypto.createCipheriv('aes-128-cbc', hashedPassword, iv);
		let crypted = cipher.update(data, 'utf8', 'base64');
		crypted += cipher.final('base64');
		return crypted;
	}

	static decrypt(data, password) {
		let hashedPassword = crypto.createHash('md5').update(new Buffer(password)).digest("hex").substring(0, 16);
		let iv = crypto.createHash('sha1').update(hashedPassword).digest("hex").substring(0, 16);

		let decipher = crypto.createDecipheriv('aes-128-cbc', hashedPassword, iv);
		let decrypted = decipher.update(data, 'base64', 'utf8');
		decrypted += decipher.final('utf8');
		return decrypted;
	}
};
