module.exports = class AddDirectory {

	execute(data, directoryName) {
		data.dirs.push({"name": directoryName, "keys": []})
	}
}