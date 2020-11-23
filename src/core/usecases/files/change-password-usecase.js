module.exports = class ChangePassword {

	constructor(repository) {
		this._repository = repository;
	}

	async execute(filePath, data, oldPassword, newPassword) {
		const result = await this._repository.load(filePath, oldPassword);
		if (result !== null) await this._repository.save(filePath, JSON.stringify(data), newPassword);
		return result !== null;
	}
};
