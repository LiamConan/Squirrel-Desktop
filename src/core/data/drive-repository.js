module.exports = class DriveRepository {

	constructor(dataSource) {
		this._dataSource = dataSource;
	}

	createToken(token) {
		return this._dataSource.createToken(token);
	}

	listFiles(onSuccess, onFailure) {
		return this._dataSource.listFiles(onSuccess, onFailure);
	}

	save(file, data, password) {
		this._dataSource.save(file, data, password);
	}

	load(file, password) {
		return this._dataSource.load(file, password);
	}
};
