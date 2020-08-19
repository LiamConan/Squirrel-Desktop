$(function () {
	const electron = require('electron');
	const ipc = electron.ipcRenderer;

	$('#buttonFile').on('click', function () {
		ipc.send('choose-file');
	});

	$('#buttonDriveFile').on('click', function () {
		ipc.send('choose-drive-file');
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

	$("#eye-toggle").on('click', () => {
		if ($("#editTextPassword").attr('type') === 'password') {
			$("#editTextPassword").prop('type', 'text')
			$("#eye-icon").prop('src', '../../../../assets/img/eye-off.svg')
		} else {
			$("#editTextPassword").prop('type', 'password')
			$("#eye-icon").prop('src', '../../../../assets/img/eye.svg')
		}
	})

	ipc.on('filename', (event, arg) => {
		$('#editTextFile').val(arg);
	});

	ipc.on('error', (event, arg) => {
		if (arg === 'password')
			$('#editTextPassword').addClass('is-invalid');
		else if (arg === 'null')
			$('#editTextPassword').addClass('is-valid');
	});

	ipc.send('get-filename');

});
