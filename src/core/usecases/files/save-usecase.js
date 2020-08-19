module.exports = class Save {

	constructor(repository) {
		this._repository = repository;
	}

	execute(file, data, password) {
		this._repository.save(file, data, password);
	}
};
