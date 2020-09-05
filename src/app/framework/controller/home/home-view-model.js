const KeysInteractor = require('../../interactor/keys-interactor');
const FileInteractor = require('../../interactor/file-interactor');

module.exports = class HomeViewModel {

	constructor(args) {
		this._fileInteractor = new FileInteractor();
		this._keysInteractor = new KeysInteractor();
		this._data = args.data;
		this._password = args.password;
		this._file = args.file;
	}

	get data() {
		return this._data;
	}

	save() {
		if ("localFile" in this._file)
			this._fileInteractor.save(this._file.localFile, JSON.stringify(this.data), this._password);
		else if ("_id" in this._file)
			this._fileInteractor.saveGoogleDriveFile(this._file._id, JSON.stringify(this.data), this._password);
	}

	changePassword(oldPassword, newPassword, callback) {
		if ("localFile" in this._file)
			this._fileInteractor.changePassword(this._file.filePath, this.data, oldPassword, newPassword, callback);
		else if ("_id" in this._file)
			this._fileInteractor.changeGoogleDrivePassword(this._file._id, this.data, oldPassword, newPassword, callback);
	}

	addDirectory(directoryName) {
		this._keysInteractor.addDirectory(this.data, directoryName);
	}

	deleteDirectory(position) {
		this._keysInteractor.deleteDirectory(this.data, position);
	}

	renameDirectory(position, name) {
		this._keysInteractor.renameDirectory(this.data, position, name);
	}

	openUrl(subkeys, onFailure) {
		this._keysInteractor.openUrl(subkeys, onFailure);
	}

	getKey(directoryPosition, keyPosition) {
		return this._keysInteractor.getKey(this.data, directoryPosition, keyPosition);
	}

	editKey(directoryPosition, keyPosition, subKeyPosition, key) {
		this._keysInteractor.editKey(this.data, directoryPosition, keyPosition, subKeyPosition, key);
	}

	getSubkey(directoryPosition, keyPosition, subkeyPosition) {
		return this._keysInteractor.getSubkey(this.data, directoryPosition, keyPosition, subkeyPosition);
	}

	deleteSubkey(directoryPosition, keyPosition, subkeyPosition, isKeyDeletedListener) {
		this._keysInteractor.deleteSubkey(this.data, directoryPosition, keyPosition, subkeyPosition, isKeyDeletedListener);
	}

	deleteKey(directoryPosition, keyPosition) {
		this._keysInteractor.deleteKey(this.data, directoryPosition, keyPosition);
	}

	addEmptyKey(directoryPosition, name) {
		return this._keysInteractor.addEmptyKey(this.data, directoryPosition, name);
	}

	addEmptySubkey(directoryPosition, keyPosition) {
		return this._keysInteractor.addEmptySubkey(this.data, directoryPosition, keyPosition);
	}

	copyValue(directoryPosition, keyPosition, subkeyPosition, type) {
		this._keysInteractor.copyValue(this.data, directoryPosition, keyPosition, subkeyPosition, type);
	}

	moveKey(directoryPosition, tabs) {
		this._keysInteractor.moveKey(this.data, directoryPosition, tabs);
	}

	generatePassword(specs) {
		return this._keysInteractor.generatePassword(specs);
	}
};
