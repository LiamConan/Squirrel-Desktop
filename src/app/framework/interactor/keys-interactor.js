const KeysRepository = require('../../../core/data/keys-repository')
const LocalFileDataSource = require('../gataway/local-file-data-source')
const Save = require('../../../core/usecases/keys/save')
const Load = require('../../../core/usecases/keys/load')
const ChangePassword = require('../../../core/usecases/keys/change-password')
const AddDirectory = require('../../../core/usecases/keys/add-directory')
const DeleteDirectory = require('../../../core/usecases/keys/delete-directory')
const RenameDirectory = require('../../../core/usecases/keys/rename-directory')
const OpenUrl = require('../../../core/usecases/keys/open-url')
const GetKey = require('../../../core/usecases/keys/get-key')
const EditKey = require('../../../core/usecases/keys/edit-key')
const GetSubkey = require('../../../core/usecases/keys/get-subkey')
const DeleteSubkey = require('../../../core/usecases/keys/delete-subkey')
const DeleteKey = require('../../../core/usecases/keys/delete-key')
const AddEmptyKey = require('../../../core/usecases/keys/add-empty-key')
const AddEmptySubkey = require('../../../core/usecases/keys/add-empty-subkey')
const CopyValue = require('../../../core/usecases/keys/copy-value')
const MoveKey = require('../../../core/usecases/keys/move-key')
const GeneratePassword = require('../../../core/usecases/keys/generate-password')

module.exports = class KeysInteractor {

	constructor() {
		const keysRepository = new KeysRepository(new LocalFileDataSource())

		this._save = new Save(keysRepository)
		this._load = new Load(keysRepository)
		this._changePassword = new ChangePassword(keysRepository)
		this._addDirectory = new AddDirectory()
		this._deleteDirectory = new DeleteDirectory()
		this._renameDirectory = new RenameDirectory()
		this._openUrl = new OpenUrl()
		this._getKey = new GetKey()
		this._editKey = new EditKey()
		this._getSubkey = new GetSubkey()
		this._deleteSubkey = new DeleteSubkey()
		this._deleteKey = new DeleteKey()
		this._addEmptyKey = new AddEmptyKey()
		this._addEmptySubkey = new AddEmptySubkey()
		this._copyValue = new CopyValue()
		this._moveKey = new MoveKey()
		this._generatePassword = new GeneratePassword()
	}

	save(file, data, password, callback = null) {
		this._save.execute(file, data, password, callback)
	}

	load(file, password, callback) {
		this._load.execute(file, password, callback)
	}

	changePassword(filePath, data, oldPassword, newPassword, callback) {
		this._changePassword.execute(filePath, data, oldPassword, newPassword, callback)
	}

	addDirectory(data, directoryName) {
		this._addDirectory.execute(data, directoryName)
	}

	deleteDirectory(data, position) {
		this._deleteDirectory.execute(data, position)
	}

	renameDirectory(data, position, name) {
		this._renameDirectory.execute(data, position, name)
	}

	openUrl(subkeys, onFailure) {
		this._openUrl.execute(subkeys, onFailure)
	}

	getKey(data, directoryPosition, keyPosition) {
		return this._getKey.execute(data, directoryPosition, keyPosition)
	}

	editKey(data, directoryPosition, keyPosition, subKeyPosition, key) {
		this._editKey.execute(data, directoryPosition, keyPosition, subKeyPosition, key)
	}

	getSubkey(data, directoryPosition, keyPosition, subkeyPosition) {
		return this._getSubkey.execute(data, directoryPosition, keyPosition, subkeyPosition)
	}

	deleteSubkey(data, directoryPosition, keyPosition, subkeyPosition, isKeyDeletedListener) {
		this._deleteSubkey.execute(data, directoryPosition, keyPosition, subkeyPosition, isKeyDeletedListener)
	}

	deleteKey(data, directoryPosition, keyPosition) {
		this._deleteKey.execute(data, directoryPosition, keyPosition)
	}

	addEmptyKey(data, directoryPosition, name) {
		return this._addEmptyKey.execute(data, directoryPosition, name)
	}

	addEmptySubkey(data, directoryPosition, keyPosition) {
		return this._addEmptySubkey.execute(data, directoryPosition, keyPosition)
	}

	copyValue(data, directoryPosition, keyPosition, subkeyPosition, type) {
		this._copyValue.execute(data, directoryPosition, keyPosition, subkeyPosition, type)
	}

	moveKey(data, directoryPosition, tabs) {
		this._moveKey.execute(data, directoryPosition, tabs)
	}

	generatePassword(specs) {
		return this._generatePassword.execute(specs)
	}
}