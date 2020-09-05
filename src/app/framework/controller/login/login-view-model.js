const homedir = require('os').homedir();
const fs = require('fs');
const FileInteractor = require('../../interactor/file-interactor');
const PreferencesInteractor = require('../../interactor/preferences-interactor');
const {DEFAULT_DATA} = require('./login-controller');

module.exports = class LoginViewModel {

	constructor() {
		this._fileInteractor = new FileInteractor();
		this._preferencesInteractor = new PreferencesInteractor();
		this.isNewFile = false;
		this._password = "";
		this._preferences = this._preferencesInteractor.getPreferences();
		this._localFile = undefined;
		this._driveFile = undefined;

		if ("localFile" in this._preferences) {
			this._localFile = this._preferences.localFile;
		} else if ("_name" in this._preferences && "_id" in this._preferences) {
			this._driveFile = this._preferences;
		}
	}

	getDriveFile() {
		return this._driveFile;
	}

	setDriveFile(file) {
		this._driveFile = file;
		this._localFile = undefined;
	}

	getLocalFile() {
		return this._localFile;
	}

	setLocalFile(file) {
		this._localFile = file;
		this._driveFile = undefined;
	}

	getFile() {
		return this._localFile !== undefined ? {"localFile": this._localFile} : this._driveFile;
	}

	async login(event, password) {
		if (this.isNewFile) {
			return await this.createFile(password);
		} else if (this._localFile !== undefined && this._localFile !== null) {
			return await this.loadLocalFile(event, password);
		} else if (this._driveFile !== undefined) {
			return await this.loadDriveFile(event, password);
		} else {
			return null;
		}
	}

	async createFile(password) {
		this.isNewFile = false;
		this.save(this._localFile, DEFAULT_DATA, password);
		return await this._fileInteractor.load(this._localFile, password);
	}

	async loadLocalFile(event, password) {
		if (!fs.existsSync(homedir)) {
			fs.mkdirSync(homedir);
		}

		const content = await this._fileInteractor.load(this._localFile, password);
		if (content !== null) {
			this._preferencesInteractor.savePreferences({'localFile': this._localFile.toString()});
		}
		event.sender.send('error', content ? 'null' : 'password');
		return content;
	}

	async loadDriveFile(event, password) {
		const content = await this._fileInteractor.loadGoogleDriveFile(this._driveFile._id, password);
		event.sender.send('error', content ? 'null' : 'password');
		if (content !== null) {
			this._preferencesInteractor.savePreferences(this._driveFile);
		}
		return content;
	}

	save(file, data, password) {
		if (this._localFile !== null) {
			this._fileInteractor.save(file, data, password);
		} else if (this._driveFile !== null) {
			this._fileInteractor.saveGoogleDriveFile(file, data, password);
		}
	}
};
