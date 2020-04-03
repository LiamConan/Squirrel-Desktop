module.exports = class Save {

	constructor(repository) {
		this._repository = repository
	}

	execute(file, data, password, callback = null) {
		this._repository.save(file, data, password, callback)
	}
}