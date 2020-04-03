module.exports = class KeysRepository {

	constructor(dataSource) {
		this._dataSource = dataSource
	}

	save(file, data, password, callback = null) {
		this._dataSource.save(file, data, password, callback)
	}

	load(file, password, callback) {
		this._dataSource.load(file, password, callback)
	}
}