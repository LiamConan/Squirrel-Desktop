const KeysDataSource = require('../../../core/data/keys-data-source');
const GoogleDriveFile = require('./google-drive-file');
const {google} = require('googleapis');
const CryptUtil = require('../utils/crypt-util');
const stream = require('stream');
const fs = require('fs');

module.exports = class GoogleDriveDataSource extends KeysDataSource {

	constructor() {
		super();
		const result = this._authenticate();
		if (result.success) {
			const auth = result.auth;
			this.drive = google.drive({version: 'v3', auth});
		}
	}

	listFiles(callback, onAuthorize) {
		const result = this._authenticate();
		if (result.success) {
			const auth = result.auth;
			const drive = google.drive({version: 'v3', auth});
			drive.files.list({
				pageSize: 10,
				fields: 'nextPageToken, files(id, name)',
			}, (err, res) => {
				if (err) {
					return console.error('The API returned an error: ' + err);
				}
				const files = res.data.files;
				if (files.length) {
					callback(files.map(
						file => new GoogleDriveFile(file.name, file.id)));
				}
			});
		} else {
			onAuthorize(result.auth);
		}
	}

	async load(id, password) {
		try {
			const file = await this.drive.files.get({fileId: id, alt: 'media'});
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
		const oAuth2Client = new google.auth.OAuth2(
			"XXXXXX",
			"XXXXXX",
			"XXXXXX"
		);

		try {
			const token = fs.readFileSync('token.json');
			oAuth2Client.setCredentials(JSON.parse(token.toString()));
			return {success: true, auth: oAuth2Client};
		} catch (e) {
			return {success: false, auth: oAuth2Client};
		}
	}
};
