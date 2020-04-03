module.exports = class DeleteDirectory {

	execute(data, position) {
		data.dirs.splice(position, 1)
	}
}