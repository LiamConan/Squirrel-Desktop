module.exports = class AddDirectory {

	execute(directories, directoryName) {
		directories.push({"name": directoryName, "keys": []})
	}
}