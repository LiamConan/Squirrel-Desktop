const {clipboard} = require('electron');

module.exports.EXPIRY = 10000;
module.exports.USERNAME = "username";
module.exports.MAIL = "mail";
module.exports.PASSWORD = "password";
module.exports = class CopyValue {

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
