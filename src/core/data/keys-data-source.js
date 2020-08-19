module.exports = class KeysDataSource {

	listFiles(callback, onAuthorize) {
		throw new Error('You must implement this function')
	}

	save(file, data, password) {
		throw new Error('You must implement this function')
	}

	load(file, password) {
		throw new Error('You must implement this function')
	}
}