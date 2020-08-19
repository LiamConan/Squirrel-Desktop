$(function () {
	const ipc = require('electron').ipcRenderer;
	let authurl = "";

	$('#link-container').on('click', (_) => {
		copyUrl(authurl);
		$('#copy-label').css('opacity', 1);
		setTimeout(() => {
			$('#copy-label').css('opacity', 0);
		}, 1000);
	});

	$('#validation').on('click', (_) => ipc.send('validate-code', $('#code-input').val()));

	ipc.on('authurl', (event, arg) => showAuth(arg));

	ipc.send('get-authurl');

	function copyUrl(url) {
		navigator.clipboard.writeText(url).then(function () {
			/* clipboard successfully set */
		}, function () {
			/* clipboard write failed */
		});
	}

	function showAuth(url) {
		authurl = url;
		$('#auth-link').html(url);
	}
})