const fs = require('fs');
const CryptUtil = require('../utils/crypt-util');
const KeysDataSource = require('../../../core/data/keys-data-source');

module.exports = class LocalFileDataSource extends KeysDataSource {

	async listFiles() {
		return [];
	}

	save(file, data, password) {
		data = CryptUtil.encrypt(data, password);
		fs.writeFileSync(file.toString(), data);
	}

	load(file, password) {
		const content = fs.readFileSync(file.toString(), "utf8");
		try {
			let data = CryptUtil.decrypt(content, password);
			return JSON.parse(data);
		} catch (e) {
			console.log("load error" + e);
			return null;
		}
	}
};
