const fs = require('fs')
const homedir = require('os').homedir()
const PreferencesDataSource = require('../../../core/data/preferences-data-source')

module.exports = class LocalPreferencesDataSource extends PreferencesDataSource{

	_pathPrefsFile = '/.squirrel_prefs'

	save(preferences) {
		fs.writeFile(homedir + this._pathPrefsFile, JSON.stringify(preferences), function (err) {
			if (err)
				console.log(err)
		})
	}

	get(callback) {
		fs.readFile(homedir + this._pathPrefsFile, 'utf8', function (err, data) {
			if (!err)
				callback(JSON.parse(data))
		})
	}
}