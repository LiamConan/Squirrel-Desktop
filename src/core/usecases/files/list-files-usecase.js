module.exports = class ListDriveFilesUsecase {

	constructor(repository) {
		this._repository = repository;
	}

	execute(onSuccess, onFailure) {
		return this._repository.listFiles(onSuccess, onFailure);
	}
};
