module.exports = class KeysDataSource {

	createToken() {
		throw new Error('You must implement this function');
	}

	listFiles() {
		throw new Error('You must implement this function');
	}

	save() {
		throw new Error('You must implement this function');
	}

	load() {
		throw new Error('You must implement this function');
	}
};
