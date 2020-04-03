module.exports = class DeleteSubkey {

	execute(data, directoryPosition, keyPosition, subkeyPosition, isKeyDeletedListener) {
		data.dirs[directoryPosition].keys[keyPosition].subkeys.splice(subkeyPosition, 1)

		if (data.dirs[directoryPosition].keys[keyPosition].subkeys.length <= 0) {
			data.dirs[directoryPosition].keys.splice(keyPosition, 1)

			isKeyDeletedListener(true)
		} else
			isKeyDeletedListener(false)
	}
}