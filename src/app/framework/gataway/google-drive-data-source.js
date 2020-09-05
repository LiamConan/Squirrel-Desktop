const DriveDataSource = require('../../../core/data/drive-data-source');
const GoogleDriveFile = require('./google-drive-file');
const {google} = require('googleapis');
const CryptUtil = require('../utils/crypt-util');
const stream = require('stream');
const fs = require('fs');
const homedir = require('os').homedir();

module.exports = class GoogleDriveDataSource extends DriveDataSource {

	static get TOKEN_PATH() {
		return `${homedir}/.squirrel_token.json`;
	}

	static get AUTH() {
		return new google.auth.OAuth2(
			"730166257838-5epkr0f3kt2gn8tu3j95ao1frtdjdhcg.apps.googleusercontent.com",
			"SxgoUM0uqqhiiNQ1G4bwOJMI",
			"urn:ietf:wg:oauth:2.0:oob"
		);
	}

	constructor() {
		super();
		this._drive = null;
		this._authenticate();
	}

	createToken(token) {
		fs.writeFileSync(
			GoogleDriveDataSource.TOKEN_PATH, JSON.stringify(token));
	}

	listFiles(onSuccess, onFailure) {
		if (this._drive === null && !this._authenticate().success)
			onFailure(GoogleDriveDataSource.AUTH);
		else {
			this._drive.files.list({
				pageSize: 10,
				fields: 'nextPageToken, files(id, name)'
			}, (err, res) => {
				if (err) {
					console.error(err);
					onFailure(null);
				} else {
					onSuccess(res.data.files.map(
						file => new GoogleDriveFile(file.name, file.id)));
				}
			});
		}
	}

	async load(id, password) {
		if (this._drive === null && !this._authenticate().success)
			return null;

		try {
			const file = await this.drive.files.get(
				{fileId: id, alt: 'media'});
			const data = CryptUtil.decrypt(file.data, password);
			return JSON.parse(data);
		} catch (e) {
			console.error("GoogleDriveDataSource: " + e);
			return null;
		}
	}

	async save(id, data, password) {
		const content = CryptUtil.encrypt(data, password);
		const buffer = Uint8Array.from(new Buffer(content, 'binary'));
		const bufferStream = new stream.PassThrough();
		bufferStream.end(buffer);
		const media = {
			mimeType: 'application/json',
			body: bufferStream,
		};
		await this.drive.files.update({
			fileId: id,
			media: media
		}, (err, _) => {
			if (err) {
				return console.error(err);
			}
		});
	}

	_authenticate() {
		const oAuth2Client = GoogleDriveDataSource.AUTH;
		try {
			const token = fs.readFileSync(GoogleDriveDataSource.TOKEN_PATH);
			oAuth2Client.setCredentials(JSON.parse(token.toString()));
			this._drive = google.drive({version: 'v3', oAuth2Client});
			return {success: true, auth: oAuth2Client};
		} catch (e) {
			return {success: false};
		}
	}
};
