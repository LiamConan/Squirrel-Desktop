module.exports = class ChangePassword {

	constructor(repository) {
		this._repository = repository
	}

	execute(filePath, data, oldPassword, newPassword, callback) {
		this._repository.load(filePath, oldPassword, function (_) {
			this._repository.save(filePath, JSON.stringify(data), newPassword, () => {
				callback()
			})
		})
	}
}