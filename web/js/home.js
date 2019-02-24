$(function()
{
	const electron = require('electron');
	const ipc = electron.ipcRenderer;

	var app = electron.remote;
	var dialog = app.dialog;
	var fs = require('fs');

	var dirIDToRename = -1;
	var dirIDToDelete = -1;
	var keyIDToDelete = -1;
	var deleteSubKey = false;

	var ctrl = false;

	$(document).keydown(function(e) {
		if (e.keyCode == 17)
		{
			ctrl = true;
			$('#list #keys li:nth-child(2n+1)').css('background-color', '#3C6DA8');
		}
	});
	$(document).keyup(function(e) {
		if (e.keyCode == 17)
		{
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

	ipc.on('close-right-pan', (event, arg) => closeRightPan());

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

	function loadInterface(data)
	{
		showDirectories(data.dirs);

		if(data.dirs.length > 0)
			showKeys(data.dirs[0].keys);

		$('#add_dir').click(function() {
			onAddDirectory();
		});

		$("#editTextNewDir").on('keyup', function (e) {
			if (e.keyCode == 13)
				onAddDirectory();
		});

		$('#add_key').click(function() {
			onAddKey();
		});

		$('#editTextNewKey').on('keyup', function (e) {
			if (e.keyCode == 13)
				onAddKey();
		});

		$('#add-user').click(function() {
			onAddUser();
		});

		$('#del-user').click(function() {
			deleteSubKey = true;
			openDeleteKeyModal();
		});

		$('#key_save').click(function() {
			if ($('#key_title').val() == "")
				setErrorOn('key_title');
			else if ($('#user').val() == "")
				setErrorOn('user');
			else if ($('#password').val() == "")
				setErrorOn('password');
			else
			{
				var note = $('#note').val().replace(/(?:\r\n|\r|\n)/g, '<br/>');
				note = note.replace(/(?:")/g, '\\"');
				var json = {}
				json['name'] = $('#key_title').val()
				json['subkey'] = {}
				json['subkey']['user'] = $('#user').val()
				json['subkey']['mail'] = $('#mail').val()
				json['subkey']['password'] = $('#password').val()
				json['subkey']['date'] = $('#date').val()
				json['subkey']['url'] = $('#url').val()
				json['subkey']['note'] = note

				ipc.send('save-key', json)
			}
		});

		$('#key_close').click(function() {
			ipc.send('close-right-pan');
		});

		$('#copy_username').click(function() {
			ipc.send('copy', 'username');
			$('#copied').slideDown(500).delay(1000).slideUp(500)
		});

		$('#copy_mail').click(function() {
			ipc.send('copy', 'mail');
			$('#copied').slideDown(500).delay(1000).slideUp(500)
		});

		$('#copy_password').click(function() {
			ipc.send('copy', 'password');
			$('#copied').slideDown(500).delay(1000).slideUp(500)
		});

		$('#copy_url').click(function() {
			ipc.send('copy', 'url');
			$('#copied').slideDown(500).delay(1000).slideUp(500)
		});

		$('#generate-password').click(function() {
			var n = $('#nb-charac').val()
			var min = $('#check-min').is(':checked');
			var maj = $('#check-maj').is(':checked');
			var num = $('#check-num').is(':checked');
			var spa = $('#check-spa').is(':checked');
			var spe = $('#check-spe').is(':checked');

			if (n.length < 1)
				$('#fill_form').slideDown(500).delay(2000).slideUp(500);
			else if (n.length > 4)
				$('#too_long_number').slideDown(500).delay(2000).slideUp(500);
			else if (!min && !maj && !num && !spa && !spe)
				$('#check_one_at_least').slideDown(500).delay(2000).slideUp(500);
			else
				ipc.send('generate-password', '{"n":' + n + ', "min":' + min +
					', "maj":' + maj +', "num":' + num + ', "spa":' + spa +
					', "spe":' + spe + '}');
		});

		$('#validate-hash').click(function() {
			$('#password').val($('#edittext-generated-pass').val());
			closePasswordGeneratorModal();
		});

		$('#cancel-hash').click(closePasswordGeneratorModal());

		$("#keys").sortable({
			group: 'no-drop',
			handle: '.icon_drag',
			onDragStart: function ($item, container, _super) {
				if (!container.options.drop)
					$item.clone().insertAfter($item);
				_super($item, container);
			},
			stop: function(e, ui) {
				var tab = [];
				$('.key').each(function(index) {
					tab.push(parseInt($(this).attr('class').split(' ')[1]));
				});

				ipc.send('move-key', tab);
			}
		});

		$('#confirmRename').click(function() {
			$('#modalRename').modal('hide');
			onRenameDir($('#editTextreNewName').val());
		});

		$('#cancelRename').click(function() {
			$('#modalRename').modal('hide');
		});

		$('#confirmDelete').click(function() {
			if (dirIDToDelete != -1)
			{
				ipc.send('del-dir', dirIDToDelete);
				dirIDToDelete = -1;
			}
			else if (keyIDToDelete != -1)
			{
				ipc.send('del-key', keyIDToDelete);
				keyIDToDelete = -1;
			}
			else if (deleteSubKey)
			{
				ipc.send('del-user');
				subkeyIDToDelete = false;
			}
		});

		$('#cancelDelete').click(function() {
			dirIDToDelete = -1;
			keyIDToDelete = -1;
		});
	}

	function showDirectories(dirs)
	{
		$('#list_dirs').empty();

		for (var i=0 ; i<dirs.length ; i++)
			$('#list_dirs').append('<li><div class="dir_title ' + i + '">' + dirs[i].name + '</div></li>');

		$('.dir_title').click(function() {
			ipc.send('select-dir', $(this).attr('class').split(' ')[1]);
		});

		$('.dir_title').contextmenu(function() {
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

	function selectDirectory(dir)
	{
		var n = parseInt(dir) + 1
		$('#list_dirs li').css('background', 'none')
		$('#list_dirs li:nth-child(' + n + ')').css('background', '#3d414f')
	}

	function showKeys(keys)
	{
		$('#keys').empty();

		for (var i=0 ; i<keys.length ; i++)
		{
			var keyHTML = '';

			if (keys[i].length > 1)
				keyHTML += '<li><ol>';

			keyHTML += '<li class="key ' + i + '">' +
							'<img class="icon_drag" src="../../res/menu.svg"/>' +
							'<div class="keys_title">' + keys[i].name + '</div>' +
							'<div class="date">' + keys[i].date + '</div>' +
						'</li>';

			if (keys[i].length > 1)
				keyHTML += '</li></ol>';


			$('#keys').append(keyHTML);
		}

		$('.key').click(function() {
			if (ctrl)
			{
				ctrl = false;
				ipc.send('go-to-url', $(this).attr('class').split(' ')[1]);
			}
			else
				ipc.send('get-key', $(this).attr('class').split(' ')[1]);
		});

		$('.key').contextmenu(function() {
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

	function openRightPan(key)
	{
		fillRightPan(key)

		$('#key').css('display', 'block');
		$('#list_frame').css('width', '49%');
		$('#block-new_key').css('width', '95%');
	}

	function closeRightPan()
	{
		$('#key').css('display', 'none');
		$('#list_frame').css('width', '100%');
		$('#block-new_key').css('width', '97%');

		clearRightPan()
	}

	function fillRightPan(key)
	{
		var subkeys = key.subkeys;
		$('#dropdown-user').empty();
		for (var i=0 ; i<subkeys.length ; i++)
			$('#dropdown-user').append('<a class="dropdown-item ' + i + '" href="#">' + subkeys[i].user + '</a>');

		$('.dropdown-item').click(function() {
			ipc.send('get-subkey', $(this).attr('class').split(' ')[1]);
		});

		$('#key_title').val(key.name);
		showSubKey(subkeys[0])
	}

	function clearRightPan()
	{
		$('#key_title').val('');
		$('#user').val('');
		$('#mail').val('');
		$('#password').val('');
		$('#url').val('');
		$('#note').val('');
	}

	function showSubKey(arg)
	{
		$('#user').val(arg.user);
		$('#mail').val(arg.mail);
		$('#password').val(arg.password);
		$('#date').val(arg.date);
		$('#url').val(arg.url);
		$('#note').val(arg.note.replace(/(?:<br\/>)/g, '\n'));
	}

	function onAddDirectory()
	{
		if ($('#editTextNewDir').val() != "")
			ipc.send('add-dir', $('#editTextNewDir').val());

		$('#editTextNewDir').val('');
	}

	function onAddKey()
	{
		if ($('#editTextNewKey').val() != "")
			ipc.send('add-key', $('#editTextNewKey').val());

		$('#editTextNewKey').val('');
	}

	function onAddUser()
	{
		ipc.send('add-user');
	}

	function onRenameDir(name)
	{
		ipc.send('rename-dir', {"name": name, "dirID": dirIDToRename});
	}

	function setErrorOn(field)
	{
		$('#' + field + '').css('border', '2px solid #ce4540');
		setTimeout(function() {
			$('#' + field + '').css('border', '1px solid #353B45');
		}, 2000);
	}

	function closePasswordGeneratorModal()
	{
		$('#modalGenerateHash').modal('hide');
		$('#nb-charac').val('');
		$('#check-min').prop('checked', false);
		$('#check-maj').prop('checked', false);
		$('#check-num').prop('checked', false);
		$('#check-spa').prop('checked', false);
		$('#check-spe').prop('checked', false);
		$('#edittext-generated-pass').val('');
	}

	function openRenameDirModal(name)
	{
		$('#editTextreNewName').val(name);
		$("#modalRename").modal();
	}

	function openDeleteKeyModal()
	{
		$("#modalConfirmDelete").find('.modal-body p').text('Voulez-vous supprimer la clé ?');
		$("#modalConfirmDelete").modal();
	}

	function openDeleteDirModal()
	{
		$("#modalConfirmDelete").find('.modal-body p').text('Voulez-vous supprimer le dossier ?');
		$("#modalConfirmDelete").modal();
	}
});
