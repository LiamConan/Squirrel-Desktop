module.exports = class CreateTokenUsecase {

	constructor(repository) {
		this._repository = repository;
	}

	execute(token) {
		return this._repository.createToken(token);
	}
};
