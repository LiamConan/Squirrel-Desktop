module.exports = class EditKey {

	execute(data, directoryPosition, keyPosition, subKeyPosition, key) {
		data.dirs[directoryPosition].keys[keyPosition].subkeys[subKeyPosition] = key.subkey

		if (data.dirs[directoryPosition].keys[keyPosition].name !== key.name)
			data.dirs[directoryPosition].keys[keyPosition].name = key.name
	}
}