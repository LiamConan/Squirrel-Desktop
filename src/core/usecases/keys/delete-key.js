module.exports = class DeleteKey {

	execute(data, directoryPosition, keyPosition) {
		data.dirs[directoryPosition].keys.splice(keyPosition, 1)
	}
}