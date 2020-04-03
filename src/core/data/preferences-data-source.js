module.exports = class PreferencesDataSource {

	save(preferences) {
		throw new Error('You must implement this function')
	}

	get(callback) {
		throw new Error('You must implement this function')
	}
}