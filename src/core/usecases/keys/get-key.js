module.exports = class GetKey {

	execute(data, directoryPosition, keyPosition) {
		return data.dirs[directoryPosition].keys[keyPosition]
	}
}