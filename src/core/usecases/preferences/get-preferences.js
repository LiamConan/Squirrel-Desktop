module.exports = class GetPreferences {

	constructor(repository) {
		this._repository = repository;
	}

	execute() {
		return this._repository.get();
	}
};
