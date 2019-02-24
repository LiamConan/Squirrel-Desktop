$(function()
{
	const electron = require('electron');
	const ipc = electron.ipcRenderer;

	var app = electron.remote;
	var fs = require('fs');

	$('#buttonFile').click(function()
	{
		ipc.send('choose-file');
	});

	$('#buttonNewFile').click(function()
	{
		ipc.send('new-file');
	});

	$('#editTextFile').click(function()
	{
		ipc.send('choose-file');
	});

	$('#buttonSubmit').click(function() {
		ipc.send('login', $('#editTextPassword').val());

		app.getCurrentWindow().loadURL('../html/home.html');
	});

	$("#editTextPassword").on('keyup', function (e) {
		if (e.keyCode == 13)
		{
			ipc.send('login', $(this).val());

			app.getCurrentWindow().loadURL('../html/home.html');
		}
	});

	ipc.on('filename',  (event, arg) =>
	{
		console.log(arg);
		$('#editTextFile').val(arg);
	});

	ipc.on('error',  (event, arg) =>
	{
		if(arg == 'password')
			setErrorOnPassword();
	});

	ipc.send('get-filename');
});

function setErrorOnPassword()
{
	$('#editTextPassword').css('border', '2px solid #ce4540');
	setTimeout(function() {
		$('#editTextPassword').css('border', '1px solid #353B45');
	}, 2000);
}
