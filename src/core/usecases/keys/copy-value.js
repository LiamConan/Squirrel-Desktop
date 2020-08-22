const {clipboard} = require('electron');

module.exports = class CopyValue {

	static get EXPIRY() {
		return 10000;
	}

	static get USERNAME() {
		return "username";
	}

	static get MAIL() {
		return "mail";
	}

	static get PASSWORD() {
		return "password";
	}

	execute(data, directoryPosition, keyPosition, subkeyPosition, type) {
		let subkey = data.dirs[directoryPosition].keys[keyPosition].subkeys[subkeyPosition];

		if (type === CopyValue.USERNAME)
			clipboard.writeText(subkey.user);
		else if (type === CopyValue.MAIL)
			clipboard.writeText(subkey.mail);
		else if (type === CopyValue.PASSWORD)
			clipboard.writeText(subkey.password);

		setTimeout(function () {
			clipboard.writeText("");
		}, CopyValue.EXPIRY);
	}
};
