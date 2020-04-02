$(function () {
	const electron = require('electron');
	const ipc = electron.ipcRenderer;

	$('#buttonFile').on('click', function () {
		ipc.send('choose-file');
	});

	$('#buttonNewFile').on('click', function () {
		ipc.send('new-file');
	});

	$('#editTextFile').on('click', function () {
		ipc.send('choose-file');
	});

	$('#buttonSubmit').on('click', function () {
		ipc.send('login', $('#editTextPassword').val())
	});

	$("#editTextPassword").on('keyup', function (e) {
		if (e.key === 'Enter') {
			ipc.send('login', $(this).val())
		}
	});

	ipc.on('filename', (event, arg) => {
		$('#editTextFile').val(arg);
	});

	ipc.on('error', (event, arg) => {
		if (arg === 'password')
			setErrorOnPassword();
	});

	ipc.send('get-filename');
});

function setErrorOnPassword() {
	const editTextPassword = $('#editTextPassword')

	editTextPassword.css('border', '2px solid #ce4540');
	setTimeout(function () {
		editTextPassword.css('border', '1px solid #353B45');
	}, 2000);
}
