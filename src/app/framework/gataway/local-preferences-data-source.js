const fs = require('fs');
const homedir = require('os').homedir();
const PreferencesDataSource = require('../../../core/data/preferences-data-source');

module.exports = class LocalPreferencesDataSource extends PreferencesDataSource {

	constructor() {
		super();
		this._pathPrefsFile = '/.squirrel_prefs';
	}

	save(preferences) {
		fs.writeFile(homedir + this._pathPrefsFile, JSON.stringify(preferences), function (err) {
			if (err) {
				console.log(err);
			}
		});
	}

	get() {
		const data = fs.readFileSync(homedir + this._pathPrefsFile, 'utf8');
		return JSON.parse(data);
	}
};
