const FileInteractor = require('../../interactor/file-interactor');

module.exports = class DriveViewModel {

	constructor() {
		this._fileInteractor = new FileInteractor();
	}

	listFiles(callback, onAuthorize) {
		this._fileInteractor.listFiles(callback, onAuthorize);
	}
};
