const GoogleDriveDataSource = require('../gataway/google-drive-data-source');
const LocalFileDataSource = require('../gataway/local-file-data-source');
const KeysRepository = require('../../../core/data/keys-repository');
const DriveRepository = require('../../../core/data/drive-repository');
const CreateTokenUsecase = require('../../../core/usecases/files/create-token-usecase');
const ListDriveFilesUsecase = require('../../../core/usecases/files/list-files-usecase');
const Save = require('../../../core/usecases/files/save-usecase');
const Load = require('../../../core/usecases/files/load-usecase');
const ChangePassword = require('../../../core/usecases/files/change-password-usecase');

module.exports = class FileInteractor {

	constructor() {
		const localRepository = new KeysRepository(new LocalFileDataSource());
		const driveRepository = new DriveRepository(new GoogleDriveDataSource());

		this._save = new Save(localRepository);
		this._load = new Load(localRepository);
		this._changePassword = new ChangePassword(localRepository);

		this._createToken = new CreateTokenUsecase(driveRepository);
		this._listFiles = new ListDriveFilesUsecase(driveRepository);
		this._saveGoogleDriveFile = new Save(driveRepository);
		this._loadGoogleDriveFile = new Load(driveRepository);
		this._changeGoogleDrivePassword = new ChangePassword(driveRepository);
	}

	createToken(token) {
		this._createToken.execute(token);
	}

	listFiles(onSuccess, onFailure) {
		this._listFiles.execute(onSuccess, onFailure);
	}

	save(file, data, password) {
		this._save.execute(file, data, password);
	}

	saveGoogleDriveFile(file, data, password) {
		this._saveGoogleDriveFile.execute(file, data, password);
	}

	load(file, password) {
		return this._load.execute(file, password);
	}

	loadGoogleDriveFile(id, password) {
		return this._loadGoogleDriveFile.execute(id, password);
	}

	changePassword(filePath, data, oldPassword, newPassword, callback) {
		this._changePassword.execute(filePath, data, oldPassword, newPassword, callback);
	}

	changeGoogleDrivePassword(filePath, data, oldPassword, newPassword, callback) {
		this._changeGoogleDrivePassword.execute(filePath, data, oldPassword, newPassword, callback);
	}
};
