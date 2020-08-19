module.exports = class Load {

	constructor(repository) {
		this._repository = repository;
	}

	execute(file, password) {
		return this._repository.load(file, password);
	}
};
