module.exports = class PreferencesDataSource {

	save(preferences) {
		throw new Error('You must implement this function');
	}

	get() {
		throw new Error('You must implement this function');
	}
};
