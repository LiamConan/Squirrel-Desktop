const PreferencesRepository = require('../../../core/data/preferences-repository');
const LocalPreferencesDataSource = require('../gataway/local-preferences-data-source');
const GetPreferences = require('../../../core/usecases/preferences/get-preferences');
const SavePreferences = require('../../../core/usecases/preferences/save-preferences');

module.exports = class PreferencesInteractor {

	constructor() {
		const preferencesRepository = new PreferencesRepository(new LocalPreferencesDataSource());

		this._getPreferences = new GetPreferences(preferencesRepository);
		this._savePreferences = new SavePreferences(preferencesRepository);
	}

	getPreferences() {
		return this._getPreferences.execute();
	}

	savePreferences(preferences) {
		this._savePreferences.execute(preferences);
	}
};
