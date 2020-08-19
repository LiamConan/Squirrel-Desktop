$(function () {
	const ipc = require('electron').ipcRenderer;

	ipc.on('drive-files', (event, arg) => showFiles(arg));

	ipc.send('list-files');

	$('#select').on('click', () => {
		ipc.send('select');
	});

	function showFiles(files) {
		$('#list').empty();
		for (let i = 0; i < files.length; i++) {
			let row = $(`<li class="drive-file">
					<img src="../../../../assets/img/${getIcon(files[i]._name)}" alt="extension icon">
					<p>${files[i]._name}</p>
				</li>`);
			row.on('click', (event) => {
				$('.drive-file').removeClass('selected');
				$(event.target).addClass('selected');
				ipc.send('file-selected', i);
			});
			$('#list').append(row);
		}
	}

	function getIcon(name) {
		return name.split('.')[1] === 'sq' ? "squirrel.png" : "file.png";
	}
});
