const FileInteractor = require('../../interactor/file-interactor');

module.exports = class DriveViewModel {

	constructor() {
		this._fileInteractor = new FileInteractor();
	}

	createToken(token) {
		this._fileInteractor.createToken(token);
	}

	listFiles(onSuccess, onFailure) {
		this._fileInteractor.listFiles(onSuccess, onFailure);
	}
};
