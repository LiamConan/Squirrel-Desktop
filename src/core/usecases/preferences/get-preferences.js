module.exports = class GetPreferences {

	constructor(repository) {
		this._repository = repository
	}

	execute(callback) {
		this._repository.get(callback)
	}
}