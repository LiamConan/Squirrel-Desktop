const {dialog} = require('electron');
const Controller = require('../controller');
const LoginViewModel = require('./login-view-model');
const HomeController = require('../home/home-controller');
const DriveController = require('../drive/drive-controller');

module.exports.DEFAULT_DATA = JSON.stringify({
	"creditCards": [],
	"dirs": []
});

module.exports = class LoginController extends Controller {

	constructor(window) {
		super(window);

		this._viewModel = new LoginViewModel();
	}

	onLoad() {
		super.onLoad();
		this.loadView('login/login.html', {userAgent: 'Chrome'}).then();
	}

	handleEvents() {
		super.handleEvents();

		this._ipc.on('get-filename', (event) => {
			if (this._viewModel.getLocalFile() !== undefined) {
				event.sender.send('filename', this._viewModel.getLocalFile().toString());
			} else if (this._viewModel.getDriveFile() !== undefined) {
				event.sender.send('filename', 'drive://' + this._viewModel.getDriveFile()._name);
			}
		});

		this._ipc.on('choose-file', (event) => {
			dialog.showOpenDialog(this._window).then((filename) => {
				if (filename !== undefined) {
					this._viewModel._filePath = filename.filePaths[0];
					this._viewModel._driveFile = undefined;
					event.sender.send('filename', this._viewModel.getLocalFile());
				}
			});
		});

		this._ipc.on('choose-drive-file', async (event, _) => {
			await this.openWindow({
				controller: new DriveController(this._window, (file) => {
					this._viewModel.setDriveFile(file);
					event.sender.send('filename', 'drive://' + file._name);
				}),
				width: 600,
				height: 600,
			});
		});

		this._ipc.on('new-file', (event, _d) => {
			dialog.showSaveDialog(this._window, {
				title: 'Nouveau registre de clés',
				filters: [{name: 'Fichiers squirrel', extensions: ['sq']}]
			}).then((filename) => {
				if (filename !== undefined) {
					this._viewModel.isNewFile = true;
					this._viewModel.setLocalFile(filename.filePath);
					event.sender.send('filename', filename.filePath);
				}
			});
		});

		this._ipc.on('login', async (event, arg) => {
			let content = await this._viewModel.login(event, arg);
			if (content !== null) {
				this.loadController(new HomeController(this._window), {
					data: content,
					password: arg,
					file: this._viewModel.getFile()
				});
			}
		});
	}
};
