const GeneratePassword = require('../../../core/usecases/password/generate-password')

module.exports = class PreferencesUseCases {

	constructor() {
		this._generatePassword = new GeneratePassword()
	}

	generatePassword(specs) {
		return this._generatePassword.execute(specs)
	}
}