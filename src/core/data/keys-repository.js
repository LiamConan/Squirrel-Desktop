module.exports = class KeysRepository {

	constructor(dataSource) {
		this._dataSource = dataSource;
	}

	listFiles(callback, onAuthorize) {
		return this._dataSource.listFiles(callback, onAuthorize);
	}

	save(file, data, password) {
		this._dataSource.save(file, data, password);
	}

	load(file, password) {
		return this._dataSource.load(file, password);
	}
};
