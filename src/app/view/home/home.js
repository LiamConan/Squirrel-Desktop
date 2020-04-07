$(function () {
	const electron = require('electron');
	const ipc = electron.ipcRenderer;

	let app = electron.remote;

	let dirIDToRename = -1;
	let dirIDToDelete = -1;
	let keyIDToDelete = -1;
	let deleteSubKey = false;

	let ctrl = false;

	$(document).on('keydown', function (e) {
		if (e.key === 'Control') {
			ctrl = true;
			$('#list #keys li:nth-child(2n+1)').css('background-color', '#3C6DA8');
		}
	});
	$(document).on('keyup', function (e) {
		if (e.key === 'Control') {
			ctrl = false;
			$('#list #keys li:nth-child(2n+1)').css('background-color', '#6E7180');
		}
	});

	ipc.on('send-data', (event, arg) => loadInterface(arg));

	ipc.on('send-dirs', (event, arg) => showDirectories(arg));

	ipc.on('select-dir', (event, arg) => selectDirectory(arg))

	ipc.on('send-keys', (event, arg) => showKeys(arg));

	ipc.on('send-key', (event, arg) => openRightPan(arg));

	ipc.on('send-subkey', (event, arg) => showSubKey(arg));

	ipc.on('close-right-pan', () => closeRightPan());

	ipc.on('key-saved', () => {
		$('#save_key').slideDown(500).delay(2000).slideUp(500);
	});

	ipc.on('no-url', () => {
		$('#no_url').slideDown(500).delay(2000).slideUp(500);
	});

	ipc.on('no-dir', () => {
		$('#no_dir').slideDown(500).delay(2000).slideUp(500);
	});

	ipc.on('send-hash', (event, arg) => {
		$('#edittext-generated-pass').val(arg);
	});

	ipc.send('get-data');

	function loadInterface(data) {
		showDirectories(data.dirs)

		if (data.dirs.length > 0)
			showKeys(data.dirs[0].keys)

		$('#validate-change-password').on('click', function () {
			if ($('#actual_password').val() === $('#new_password').val())
				$('#alert-old-new-passwords-equal').slideDown(500).delay(2000).slideUp(500)
			else if ($('#new_password').val() !== $('#confirmation_password').val()) {
				$('#alert-confirmation-not-match').slideDown(500).delay(2000).slideUp(500)
			} else {
				ipc.send('change-password', {
					'actual': $('#actual_password').val(),
					'new': $('#new_password').val()
				});
				closeChangePasswordModal()
			}
		});

		$('#cancel-change-password').on('click', closeChangePasswordModal);

		$('#add_dir').on('click', function () {
			onAddDirectory()
		});

		$("#editTextNewDir").on('keyup', function (e) {
			if (e.key === 'Enter')
				onAddDirectory()
		});

		$('#add_key').on('click', function () {
			onAddKey()
		});

		$('#editTextNewKey').on('keyup', function (e) {
			if (e.key === 'Enter')
				onAddKey()
		});

		$('#add-user').on('click', function () {
			onAddUser();
		});

		$('#del-user').on('click', function () {
			deleteSubKey = true;
			openDeleteKeyModal();
		});

		$('#key_save').on('click', function () {
			let title = $('#key_title').val()
			let user = $('#user').val()
			let email = $('#mail').val()
			let password = $('#password').val()
			let date = $('#date').val()
			let url = $('#url').val()
			let note = $('#note').val().replace(/(?:\r\n|\r|\n)/g, '<br/>').replace(/(?:")/g, '\\"')

			if (title === "")
				setErrorOn('key_title');
			else if (user === "")
				setErrorOn('user');
			else if (password === "")
				setErrorOn('password');
			else {
				ipc.send('save-key', {
					'name': title,
					'subkey': {
						'user': user,
						'mail': email,
						'password': password,
						'date': date,
						'url': url,
						'note': note
					},
				})
			}
		});

		$('#key_close').on('click', function () {
			ipc.send('close-right-pan');
		});

		$('#copy_username').on('click', function () {
			ipc.send('copy', 'username');
			$('#copied').slideDown(500).delay(1000).slideUp(500)
		});

		$('#copy_mail').on('click', function () {
			ipc.send('copy', 'mail');
			$('#copied').slideDown(500).delay(1000).slideUp(500)
		});

		$('#copy_password').on('click', function () {
			ipc.send('copy', 'password');
			$('#copied').slideDown(500).delay(1000).slideUp(500)
		});

		$('#copy_url').on('click', function () {
			ipc.send('go-to-url');
		});

		$('#generate-password').on('click', function () {
			let n = $('#nb-charac').val()
			let min = $('#check-min').is(':checked');
			let maj = $('#check-maj').is(':checked');
			let num = $('#check-num').is(':checked');
			let spa = $('#check-spa').is(':checked');
			let spe = $('#check-spe').is(':checked');

			if (n.length < 1)
				$('#fill_form').slideDown(500).delay(2000).slideUp(500);
			else if (n.length > 4)
				$('#too_long_number').slideDown(500).delay(2000).slideUp(500);
			else if (!min && !maj && !num && !spa && !spe)
				$('#check_one_at_least').slideDown(500).delay(2000).slideUp(500);
			else {
				ipc.send('generate-password', {
					'n': n,
					'min': min,
					'maj': maj,
					'num': num,
					'spa': spa,
					'spe': spe
				})
			}
		});

		$('#validate-hash').on('click', function () {
			$('#password').val($('#edittext-generated-pass').val());
			closePasswordGeneratorModal();
		});

		$('#cancel-hash').on('click', closePasswordGeneratorModal);

		$("#keys").sortable({
			group: 'no-drop',
			handle: '.icon_drag',
			onDragStart: function ($item, container, _super) {
				if (!container.options.drop)
					$item.clone().insertAfter($item);
				_super($item, container);
			},
			stop: function () {
				let tab = [];
				$('.key').each(function () {
					tab.push(parseInt($(this).attr('class').split(' ')[1]));
				});

				ipc.send('move-key', tab);
			}
		});

		$('#confirmRename').on('click', function () {
			$('#modalRename').modal('hide');
			onRenameDir($('#editTextreNewName').val());
		});

		$('#cancelRename').on('click', function () {
			$('#modalRename').modal('hide');
		});

		$('#confirmDelete').on('click', function () {
			if (dirIDToDelete !== -1) {
				ipc.send('del-dir', dirIDToDelete);
				dirIDToDelete = -1;
			} else if (keyIDToDelete !== -1) {
				ipc.send('del-key', keyIDToDelete);
				keyIDToDelete = -1;
			} else if (deleteSubKey) {
				ipc.send('del-user');
			}
		});

		$('#cancelDelete').on('click', function () {
			dirIDToDelete = -1;
			keyIDToDelete = -1;
		});

		$("#eye-toggle").on('click', () => {
			if ($("#password").attr('type') === 'password') {
				$("#password").prop('type', 'text')
				$("#eye-icon").prop('src', '../../../../assets/img/eye-off.svg')
			} else {
				$("#password").prop('type', 'password')
				$("#eye-icon").prop('src', '../../../../assets/img/eye.svg')
			}
		})
	}

	function showDirectories(dirs) {
		$('#list_dirs').empty();

		for (let i = 0; i < dirs.length; i++)
			$('#list_dirs').append('<li><div class="dir_title ' + i + '">' + dirs[i].name + '</div></li>');

		$('.dir_title').on('click', function () {
			ipc.send('select-dir', $(this).attr('class').split(' ')[1]);
		});

		$('.dir_title').contextmenu(function () {
			event.preventDefault();
			const template = [
				{
					label: 'renommer',
					click: () => {
						dirIDToRename = $(this).attr('class').split(' ')[1];
						openRenameDirModal($(this).text());
					}
				},
				{
					label: 'supprimer',
					click: () => {
						dirIDToDelete = $(this).attr('class').split(' ')[1];
						openDeleteDirModal();
					}
				}
			];
			app.Menu.buildFromTemplate(template).popup();
		});
	}

	function selectDirectory(dir) {
		let n = parseInt(dir) + 1
		$('#list_dirs li').css('background', 'none')
		$('#list_dirs li:nth-child(' + n + ')').css('background', '#3d414f')
	}

	function showKeys(keys) {
		$('#keys').empty();

		for (let i = 0; i < keys.length; i++) {
			let keyHTML = '';

			if (keys[i].length > 1)
				keyHTML += '<li><ol>';

			keyHTML += '<li class="key ' + i + '">' +
				'<img class="icon_drag" src="../../../../assets/img/menu.svg"/>' +
				'<div class="keys_title">' + keys[i].name + '</div>' +
				'<div class="date">' + keys[i].date + '</div>' +
				'</li>';

			if (keys[i].length > 1)
				keyHTML += '</li></ol>';


			$('#keys').append(keyHTML);
		}

		$('.key').on('click', function () {
			if (ctrl) {
				ctrl = false;
				ipc.send('go-to-url', $(this).attr('class').split(' ')[1]);
			} else
				ipc.send('get-key', $(this).attr('class').split(' ')[1]);
		})

		$('.key').contextmenu(function () {
			event.preventDefault();
			const template = [
				{
					label: 'supprimer',
					click: () => {
						keyIDToDelete = $(this).attr('class').split(' ')[1];
						openDeleteKeyModal();
					}
				}
			];
			app.Menu.buildFromTemplate(template).popup();
		});
	}

	function openRightPan(key) {
		fillRightPan(key)

		$('#key').css('display', 'block');
		$('#list_frame').css('width', '49%');
		$('#block-new_key').css('width', '95%');
	}

	function closeRightPan() {
		$('#key').css('display', 'none');
		$('#list_frame').css('width', '100%');
		$('#block-new_key').css('width', '97%');

		$('#key_title').val('');
		$('#user').val('');
		$('#mail').val('');
		$('#password').val('');
		$('#url').val('');
		$('#note').val('');
	}

	function fillRightPan(key) {
		let subkeys = key.subkeys;
		$('#dropdown-user').empty();
		for (let i = 0; i < subkeys.length; i++)
			$('#dropdown-user').append('<a class="dropdown-item ' + i + '" href="#">' + subkeys[i].user + '</a>');

		$('.dropdown-item').on('click', function () {
			ipc.send('get-subkey', $(this).attr('class').split(' ')[1]);
		});

		$('#key_title').val(key.name);
		showSubKey(subkeys[0])
	}

	function showSubKey(arg) {
		$('#user').val(arg.user);
		$('#mail').val(arg.mail);
		$('#password').val(arg.password);
		$('#date').val(arg.date);
		$('#url').val(arg.url);
		$('#note').val(arg.note.replace(/(?:<br\/>)/g, '\n'));
	}

	function onAddDirectory() {
		let editText = $('#editTextNewDir')
		if (editText.val() !== "")
			ipc.send('add-dir', editText.val());

		editText.val('');
	}

	function onAddKey() {
		if ($('#editTextNewKey').val() !== "")
			ipc.send('add-key', $('#editTextNewKey').val());

		$('#editTextNewKey').val('');
	}

	function onAddUser() {
		ipc.send('add-user');
	}

	function onRenameDir(name) {
		ipc.send('rename-dir', {"name": name, "position": dirIDToRename});
	}

	function setErrorOn(field) {
		$('#' + field + '').css('border', '2px solid #ce4540');
		setTimeout(function () {
			$('#' + field + '').css('border', '1px solid #353B45');
		}, 2000);
	}

	function closeChangePasswordModal() {
		$('#modalChangePassword').modal('hide');
		$('#actual_password').val('')
		$('#new_password').val('')
		$('#confirmation_password').val('')
	}

	function closePasswordGeneratorModal() {
		$('#modalGenerateHash').modal('hide');
		$('#nb-charac').val('');
		$('#check-min').prop('checked', false);
		$('#check-maj').prop('checked', false);
		$('#check-num').prop('checked', false);
		$('#check-spa').prop('checked', false);
		$('#check-spe').prop('checked', false);
		$('#edittext-generated-pass').val('');
	}

	function openRenameDirModal(name) {
		$('#editTextreNewName').val(name);
		$("#modalRename").modal();
	}

	function openDeleteKeyModal() {
		$("#modalConfirmDelete").find('.modal-body p').text('Voulez-vous supprimer la clé ?');
		$("#modalConfirmDelete").modal();
	}

	function openDeleteDirModal() {
		$("#modalConfirmDelete").find('.modal-body p').text('Voulez-vous supprimer le dossier ?');
		$("#modalConfirmDelete").modal();
	}
});
