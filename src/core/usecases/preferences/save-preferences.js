module.exports = class SavePreferences {

	constructor(repository) {
		this._repository = repository
	}

	execute(preferences) {
		this._repository.save(preferences)
	}
}