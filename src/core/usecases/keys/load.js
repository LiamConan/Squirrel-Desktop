module.exports = class Load {

	constructor(repository) {
		this._repository = repository
	}

	execute(file, password, callback) {
		this._repository.load(file, password, callback)
	}
}