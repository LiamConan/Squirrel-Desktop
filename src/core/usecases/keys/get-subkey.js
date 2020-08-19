module.exports = class GetSubkey {

	execute(data, directoryPosition, keyPosition, subkeyPosition) {
		return data.dirs[directoryPosition].keys[keyPosition].subkeys[subkeyPosition];
	}
};
