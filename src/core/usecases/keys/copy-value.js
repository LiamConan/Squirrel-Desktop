const {clipboard} = require('electron')

module.exports = class CopyValue {

	execute(data, directoryPosition, keyPosition, subkeyPosition, type) {
		let subkey = data.dirs[directoryPosition].keys[keyPosition].subkeys[subkeyPosition]

		if (type === 'username')
			clipboard.writeText(subkey.user)
		else if (type === 'mail')
			clipboard.writeText(subkey.mail)
		else if (type === 'password')
			clipboard.writeText(subkey.password)

		setTimeout(function () {
			clipboard.writeText("")
		}, 10000)
	}
}