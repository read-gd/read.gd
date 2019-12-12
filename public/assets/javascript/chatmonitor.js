// This file is executed in the browser, when people visit /chat/<random id>

$(function(){

	var recipientId = userId;
	var chatUrl = "";

	// connect to the socket
	var socket = io();

	// variables which hold the data for each person
	var name = userName,
			email = userEmail;

	// on connection to server get the id of person's room
	socket.on('connect', function(){
		console.log("onConnectMonitor");
		socket.emit('monitorInvite', {recipientId:recipientId, senderId:'', name: name, email: email} );
	});

	// receive the names and avatars of all people in the chat room
	socket.on('requestChat', function(data){

		console.log("requestChat "+ data.recipientId + " - " + data.number  );

		if(data.number === 0){

			name = data.name;
			email = data.email;
			socket.emit('connectChat', {
				user: data.name,
				avatar: data.email,
				recipientId: data.recipientId,
				senderId: data.senderId,
				name: data.name, email: data.email});
		}

		else if(data.number === 1) {

			name = data.name;
			email = data.email;
			socket.emit('connectChat', {
				user: data.name,
				avatar: data.email,
				recipientId: data.recipientId,
				senderId: data.senderId,
				name: data.name, email: data.email});
		}

		else {
			console.log("Too Many People");
			//showMessage("tooManyPeople");
		}
	});

	// Other useful
	socket.on('alertChat', function(data){
		console.log("onNotifyChatRequest " + data.recipientId);
		var chatNotification = $(".chat-invite");
		chatNotification.fadeIn();
		chatUrl = "/message/chat/" + data.senderId + "/" + data.recipientId;
	});

	$('#chatIcon').click(function(){
		popupChat();
	})

	function popupChat() {
		popupWindow(chatUrl, "Chat", 900, 600);
	}

	function popupWindow(url, title, w, h) {
		var y = window.top.outerHeight / 2 + window.top.screenY - ( h / 2)
		var x = window.top.outerWidth / 2 + window.top.screenX - ( w / 2)
		return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + y + ', left=' + x);
	}


});




