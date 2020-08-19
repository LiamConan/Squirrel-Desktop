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
		this.loadView('drive/drive.html').then();
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

		this._ipc.on('validate-code', (event, arg) => this._authorize(event, arg));

		this._ipc.on('list-files', (event, _) => this._requestFiles(event));

		this._ipc.on('file-selected', (event, arg) => this._selectFile(arg));

		this._ipc.on('select', (event, _) => this._select());
	}

	_requestFiles(event) {
		this._viewModel.listFiles((files) => {
			this._files = files;
			event.sender.send('drive-files', files);
		}, (oAuth2Client) => {
			this._oAuth2Client = oAuth2Client;
			this.loadView('drive/auth-token.html').then();
		});
	}

	_authorize(event, code) {
		this._oAuth2Client.getToken(code, (err, token) => {
			if (err) {
				return console.error('Error retrieving access token', err);
			}
			this._oAuth2Client.setCredentials(token);
			// Store the token to disk for later program executions
			fs.writeFile('token.json', JSON.stringify(token), (err) => {
				if (err) {
					return console.error(err);
				}
			});
			this._requestFiles();
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
