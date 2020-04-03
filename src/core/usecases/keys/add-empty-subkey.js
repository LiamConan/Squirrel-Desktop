module.exports = class AddEmptySubkey {

	execute(data, directoryPosition, keyPosition) {
		let subkey = {"user": "", "mail": "", "password": "", "url": "", "note": ""}
		data.dirs[directoryPosition].keys[keyPosition].subkeys.push(subkey)
		return subkey
	}
}