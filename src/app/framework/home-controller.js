const randomstring = require("randomstring")
const Controller = require('./controller')
const KeysUseCases = require('./keys-use-cases')
const PasswordUseCases = require('./usecases/password-use-cases')

class HomeController extends Controller {

	_keysUseCases = new KeysUseCases()
	_passwordUseCases = new PasswordUseCases()
	_displayState = {
		directory: 0,
		isKeyBeingCreated: false,
		creatingKey: -1,
		creatingSubKey: -1,
		selectedDir: -1,
		selectedKey: -1,
		selectedSubKey: -1
	}

	onLoad() {
		this.loadView('home/home.html')
		this._window.resizable = true
		this._window.maximize()

		this._data = this._args.data
		this._password = this._args.password
		this._filePath = this._args.filePath

		randomstring.generate() // First call to initialize the randomstring lib
	}

	handleEvents() {
		super.handleEvents()

		this._ipc.on('get-data', (event, _) => {
			event.sender.send('send-data', this._data)
			event.sender.send('select-dir', this._displayState.directory)
		})

		this._ipc.on('change-password', (event, arg) => {
			let self = this

			this._keysUseCases.changePassword(this._filePath, this._data, arg.actual, arg.new, function () {
				self._password = arg.new
			})
		})

		this._ipc.on('add-dir', (event, arg) => {
			this._keysUseCases.addDirectory(this._data, arg)
			event.sender.send('send-dirs', this._data.dirs)

			this._keysUseCases.save(this._filePath, JSON.stringify(this._data), this._password)
		})

		this._ipc.on('del-dir', (event, arg) => {
			this._keysUseCases.deleteDirectory(this._data, arg)

			event.sender.send('send-dirs', this._data.dirs)
			if (this._displayState.directory === arg && this._data.dirs.length > 0) {
				this._displayState.directory = 0
				event.sender.send('send-keys', this._data.dirs[arg].keys)
			}
			event.sender.send('select-dir', this._displayState.directory)

			this._keysUseCases.save(this._filePath, JSON.stringify(this._data), this._password)
		})

		this._ipc.on('rename-dir', (event, arg) => {
			this._keysUseCases.renameDirectory(this._data, arg.position, arg.name)

			event.sender.send('send-dirs', this._data.dirs)

			this._keysUseCases.save(this._filePath, JSON.stringify(this._data), this._password)
		})

		this._ipc.on('select-dir', (event, arg) => {
			if (this._displayState.creatingKey === -1) {
				event.sender.send('select-dir', arg)
				event.sender.send('send-keys', this._data.dirs[arg].keys)
				if (this._displayState.directory !== arg) {
					event.sender.send('close-right-pan')
					this._displayState.directory = arg
				}
			} else
				event.sender.send('key-saved')
		})

		this._ipc.on('get-key', (event, arg) => {
			if (this._displayState.creatingKey === -1 && this._displayState.creatingSubKey === -1) {
				let key = this._keysUseCases.getKey(this._data, this._displayState.directory, arg)
				event.sender.send('send-key', key)

				this._displayState.selectedDir = this._displayState.directory
				this._displayState.selectedKey = arg
				this._displayState.selectedSubKey = 0
			} else
				event.sender.send('key-saved')
		})

		this._ipc.on('go-to-url', (event, arg) => {
			let subkeys
			if (arg === undefined)
				subkeys = this._data.dirs[this._displayState.directory].keys[this._displayState.selectedKey].subkeys
			else
				subkeys = this._data.dirs[this._displayState.directory].keys[arg].subkeys
			this._keysUseCases.openUrl(subkeys, () => {
				event.sender.send('no-url')
			})
		})

		this._ipc.on('save-key', (event, arg) => {
			this._keysUseCases.editKey(
				this._data,
				this._displayState.directory,
				this._displayState.selectedKey,
				this._displayState.selectedSubKey,
				arg
			)

			event.sender.send('send-keys', this._data.dirs[this._displayState.directory].keys)

			this._displayState.creatingKey = -1
			this._displayState.creatingSubKey = -1

			this._keysUseCases.save(this._filePath, JSON.stringify(this._data), this._password)
		})

		this._ipc.on('get-subkey', (event, arg) => {
			if (this._displayState.creatingKey === -1 && this._displayState.creatingSubKey === -1) {
				let subkey = this._keysUseCases.getSubkey(
					this._data,
					this._displayState.selectedDir,
					this._displayState.selectedKey,
					arg
				)
				event.sender.send('send-subkey', subkey)
				this._displayState.selectedSubKey = arg
			} else
				event.sender.send('key-saved')
		})

		this._ipc.on('close-right-pan', (event) => {
			if (this._displayState.creatingSubKey !== -1)
				this.deleteSubKey()
			event.sender.send('close-right-pan', this._data.dirs)
		})

		this._ipc.on('del-key', (event, arg) => {
			if (arg >= 0) {
				this._keysUseCases.deleteKey(this._data, this._displayState.directory, arg)
				event.sender.send('send-keys', this._data.dirs[this._displayState.directory].keys)

				if (this._displayState.selectedDir === this._displayState.directory && this._displayState.selectedKey === arg) {
					event.sender.send('close-right-pan')

					this._displayState.selectedKey = -1
					this._displayState.selectedSubKey = -1

					this._displayState.creatingKey = -1
					this._displayState.creatingSubKey = -1
				}

				this._keysUseCases.save(this._filePath, JSON.stringify(this._data), this._password)
			}
		})

		this._ipc.on('add-key', (event, arg) => {
			if (this._data.dirs.length <= this._displayState.directory) {
				event.sender.send('no-dir')
				return
			}

			let key = this._keysUseCases.addEmptyKey(this._data, this._displayState.directory, arg)

			event.sender.send('send-keys', this._data.dirs[this._displayState.directory].keys)
			event.sender.send('send-key', key)

			this._displayState.selectedDir = this._displayState.directory
			this._displayState.selectedKey = this._data.dirs[this._displayState.directory].keys.length - 1
			this._displayState.selectedSubKey = 0
			this._displayState.creatingKey = this._displayState.selectedKey
			this._displayState.creatingSubKey = this._displayState.selectedSubKey

			this._keysUseCases.save(this._filePath, JSON.stringify(this._data), this._password)
		})

		this._ipc.on('add-user', (event, _) => {
			let subkey = this._keysUseCases.addEmptySubkey(this._data, this._displayState.selectedDir, this._displayState.selectedKey)

			event.sender.send('send-key', this._data.dirs[this._displayState.selectedDir].keys[this._displayState.selectedKey])
			event.sender.send('send-subkey', subkey)

			this._displayState.selectedSubKey = this._data.dirs[this._displayState.selectedDir].keys[this._displayState.selectedKey].subkeys.length - 1
			this._displayState.creatingSubKey = this._displayState.selectedSubKey

			this._keysUseCases.save(this._filePath, JSON.stringify(this._data), this._password)
		})

		this._ipc.on('del-user', (event, _) => {
			this.deleteSubKey()
		})

		this._ipc.on('copy', (event, arg) => {
			this._keysUseCases.copyValue(
				this._data,
				this._displayState.selectedDir,
				this._displayState.selectedKey,
				this._displayState.selectedSubKey,
				arg
			)
		})

		this._ipc.on('generate-password', (event, arg) => {
			event.sender.send('send-hash', this._passwordUseCases.generatePassword(arg))
		})

		this._ipc.on('move-key', (event, arg) => {
			this._keysUseCases.moveKey(this._data, this._displayState.directory, arg)
			this._keysUseCases.save(this._filePath, JSON.stringify(this._data), this._password)

			event.sender.send('send-keys', this._data.dirs[this._displayState.directory].keys)
		})
	}

	onClose() {
		super.onClose();

		if (this._displayState.creatingKey !== -1) {
			this._data.dirs[this._displayState.directory].keys.splice(this._displayState.creatingKey, 1)
			this._keysUseCases.save(this._filePath, JSON.stringify(this._data), this._password)
		}
	}

	deleteSubKey(event) {
		this._keysUseCases.deleteSubkey(
			this._data,
			this._displayState.directory,
			this._displayState.selectedKey,
			this._displayState.selectedSubKey, (isKeyDeleted) => {
				if (isKeyDeleted) {
					event.sender.send('close-right-pan')
					event.sender.send('send-keys', this._data.dirs[this._displayState.directory].keys)

					this._displayState.selectedKey = -1
					this._displayState.selectedSubKey = -1
				} else {
					event.sender.send('send-key', this._data.dirs[this._displayState.selectedDir].keys[this._displayState.selectedKey])
					event.sender.send('send-subkey', this._data.dirs[this._displayState.selectedDir].keys[this._displayState.selectedKey].subkeys[0])

					this._displayState.selectedSubKey = 0
				}
				this._displayState.creatingKey = -1
				this._displayState.creatingSubKey = -1
				this._keysUseCases.save(self._filePath, JSON.stringify(self._data), self._password)
			})
	}
}

module.exports.HomeController = HomeController