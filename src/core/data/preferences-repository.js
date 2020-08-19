module.exports = class PreferencesRepository {

	constructor(dataSource) {
		this._dataSource = dataSource;
	}

	save(preferences) {
		this._dataSource.save(preferences);
	}

	get() {
		return this._dataSource.get();
	}
};
