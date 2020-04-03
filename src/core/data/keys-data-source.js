module.exports = class KeysDataSource {

	save(file, data, password, callback = null) {
		throw new Error('You must implement this function')
	}

	load(file, password, callback) {
		throw new Error('You must implement this function')
	}
}