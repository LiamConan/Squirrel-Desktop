const Controller = require('../controller');
const DriveViewModel = require('./drive-view-model');
const fs = require('fs');

module.exports = class DriveController extends Controller {

	constructor(window, onResult) {
		super(window);
		this._viewModel = new DriveViewModel();
		this._authUrl = "";
		this._oAuth2Client = undefined;
		this._files = undefined;
		this._selected = undefined;
		this._onResult = onResult;
	}

	onLoad() {
		super.onLoad();
		this._viewModel.listFiles((files) => {
			this._files = files;
			this.loadView('drive/drive.html').then();
		}, (oAuth2Client) => {
			this._oAuth2Client = oAuth2Client;
			this.loadView('drive/auth-token.html').then();
		});
	}

	handleEvents() {
		super.handleEvents();

		this._ipc.on('get-authurl', (event, _) => {
			this._authUrl = this._oAuth2Client.generateAuthUrl({
				access_type: 'offline',
				scope: ['https://www.googleapis.com/auth/drive']
			});
			event.sender.send('authurl', this._authUrl);
		});

		this._ipc.on('validate-code', (event, arg) => this._authenticate(event, arg));

		this._ipc.on('list-files', (event, _) => this._getDriveFiles(event));

		this._ipc.on('file-selected', (event, arg) => this._selectFile(arg));

		this._ipc.on('select', (event, _) => this._select());
	}

	_getDriveFiles(event) {
		event.sender.send('drive-files', this._files);
	}

	_authenticate(event, code) {
		this._oAuth2Client.getToken(code, (err, token) => {
			if (err) {
				return console.error('Error retrieving access token', err);
			}
			this._oAuth2Client.setCredentials(token);
			fs.writeFileSync('token.json', JSON.stringify(token));
			this._viewModel.listFiles((files) => {
				this._files = files;
				this.loadView('drive/drive.html').then();
			}, (oAuth2Client) => {
				this._oAuth2Client = oAuth2Client;
				this.loadView('drive/auth-token.html').then();
			});
		});
	}

	_selectFile(index) {
		this._selected = index;
	}

	_select() {
		this._onResult(this._files[this._selected]);
		this._window.close();
	}
};
