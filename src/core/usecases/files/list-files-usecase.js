module.exports = class ListDriveFilesUsecase {

	constructor(repository) {
		this._repository = repository;
	}

	execute(callback, onAuthorize) {
		return this._repository.listFiles(callback, onAuthorize);
	}
};
