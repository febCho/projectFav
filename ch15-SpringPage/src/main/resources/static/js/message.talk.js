$(function(){
	let message_socket; //웹소켓 식별자
	
	/*-------------------
	 * 채팅 회원 저장
	 *-------------------*/
	let member_list = []; //채팅 회원을 저장하는 배열
	//채팅방 멤버를 저장하는 배열
	//채팅방 또는 채팅 페이지를 인식해서 채팅방 멤버를 초기 세팅함
	if($('#talkWrite').length > 0){//채팅방 생성 페이지
		member_list = [$('#user').attr('data-id')];
	}else if($('#talkDetail').length > 0){//채팅 페이지
		//웹소켓 연결 후 코드 입력
		connectWebSocket();//웹소켓 생성
		member_list = $('#chat_member').text().split(',');
	}
	/*-------------------
	 * 웹소켓 연결
	 *-------------------*/
	function connectWebSocket(){
		message_socket = new WebSocket("ws://localhost:8000/message-ws");
		message_socket.onopen=function(evt){
										//0이면 페이지에 안 들어간 것, 1이면 들어간 것
			console.log("채탕 페이지 접속 : " + $('#talkDetail').length);
			if($('#talkDetail').length == 1){
				message_socket.send("msg:");//입장했다는 표시 메시지(초기 데이터 호출 가능케 함)
			}
		};
		//서버로부터 메시지를 받으면 호출되는 함수 지정(DB에서 데이터를 읽어옴)
		message_socket.onmessage=function(evt){
			let data = evt.data;	//DB 저장을 하지 않았다면 채팅 메시지라는 msg: 식별자 뒤에 채팅 메시지를 명시하지만
									//우리는 DB에서 메시지를 읽어 오니까 채팅 메시지라는 식별자만 넘겨줌
			if($('#talkDetail').length == 1 && data.substring(0,4) == 'msg:'){
				selectMsg();
			}
		};
		message_socket.onclose=function(evt){
			//소켓이 종료된 후 부가적인 작업이 있을 경우 명시
			console.log('chat close');
		}
	}

	/*-------------------
	 * 채팅방 생성하기
	 *-------------------*/
	//회원 정보 검색
	$('#member_search').keyup(function(){
		if($('#member_search').val().trim()==''){
			$('#search_area').empty();
			return;
		}
		//서버와 통신
		$.ajax({
			url:'memberSearchAjax',
			type:'post',
			data:{id:$('#member_search').val()},
			dataType:'json',
			success:function(param){
				if(param.result == 'logout'){
					$('#member_search').attr('disabled',true);
					$('#member_search').val('로그인해야 회원 검색이 가능합니다.');
				}else if(param.result == 'success'){
					$('#search_area').empty();
					$(param.member).each(function(index,item){
						//채팅방 개설자의 아이디와 동일한 아이디 체크
						//이미 member_list에 저장된 아이디는 제거
						if(!member_list.includes(item.id)){
							//채팅방 개설자의 아이디와 같지 않은 아이디만 표시
							//이미 등록된 아이디는 제외
							let output = '';
							output += '<li data-num="'+item.mem_num+'">';
							output += item.id;
							output += '</li>';
							$('#search_area').append(output);
						}
					});
				}else{
					alert('회원 검색 오류 발생');
				}
			},
			error:function(){
				alert('네트워크 오류 발생');
			}
		});
	});
	
	//검색된 회원 선택하기
	$(document).on('click','#search_area li',function(){
		let id = $(this).text();//선택한 li에 명시된 id
		let mem_num = $(this).attr('data-num');//선택한 회원번호
		member_list.push(id);
		//선택한 id를 화면에 표시
		let choice_id = '<span class="member-span" data-id="'+id+'">';
			choice_id += '<input type="hidden" name="members" value="'+mem_num+'">';
			choice_id += id + '<sup>&times;</sup>';
		
		$('#talk_member').append(choice_id);
		$('#member_search').val('');
		$('#search_area').empty();//ul 태그 초기화	
		
		if($('#name_checked').is(':checked')){//채팅방 이름 자동 설정
			makeRoom_name();	
		}
	});
	
	//선택한 채팅방 멤버 삭제하기
	$(document).on('click','.member-span',function(){
		let id = $(this).attr('data-id');
		//채팅 멤버가 저장된 배열에서 삭제할 멤버의 id를 제거
		member_list.splice(member_list.indexOf(id),1);
		$(this).remove();
		
		if($('#name_checked').is(':checked')){//채팅방 이름 자동 설정
			makeRoom_name();
		}
		
		if($('#talk_member span').length == 0){
			$('#name_span').text('');
			$('#basic_name').val('');
		}
	});
	
	//채팅방 이름 생성 방식 정하기(자동/수동)
	$('#name_checked').click(function(){
		if($('#name_checked').is(':checked')){//채팅방 이름 자동 생성
			$('#basic_name').attr('type','hidden');
			if(member_list.length>1){//자기 자신만 들어가 있을 때 = 1
				makeRoom_name();
			}
		}else{//채팅방 이름 수동 생성
			$('#basic_name').attr('type','text');
			$('#name_span').text('');//채팅방 이름 표시 텍스트 초기화
		}
	});	
	//채팅방 이름 생성
	function makeRoom_name(){
		let name = '';
		$.each(member_list,function(index,item){
			if(index > 0) name += ',';
			name += item;
		});
		if(name.length>55){
			name = name.substring(0,55) + '...'
		}
		$('#basic_name').val(name);
		$('#name_span').text(name);
	}
	//채팅방 생성 전송
	$('#talk_form').submit(function(){
		if(member_list.length<=1){
			//배열에는 채팅방 개설자가 기본 등록되어 있기에
			//로그인한 유저 포함 최소 2명이 되어야 채팅 가능
			alert('채팅에 참여할 회원을 검색하세요');
			$('#member_search').focus();
			return false;
		}
	});
	
	/*-------------------
	 * 채팅하기
	 *-------------------*/
	//채팅 데이터 읽기
	function selectMsg(){
		//서버와 통신
		$.ajax({
			url:'../talk/talkDetailAjax',
			type:'post',
			data:{talkroom_num:$('#talkroom_num').val()},
			dataType:'json',
			success:function(param){
				if(param.result == 'logout'){
					alert('로그인 후 사용하세요!');
					message_socket.close();
				}else if(param.result == 'success'){
					//메시지 표시 UI 초기화
					$('#chatting_message').empty();
					
					let chat_date = '';
						$(param.list).each(function(index,item){			
						let output = '';
						//날짜 추출
						if(chat_date != item.chat_date.split(' ')[0]){
							chat_date = item.chat_date.split(' ')[0];
							output += '<div class="date-position"><span>'+chat_date+'</span></div>';
						}
						
						if(item.message.indexOf('@{member}@')>=0){//멤버등록 메시지 처리
							//신규 회원 메시지
							output += '<div class="member-message">';
							output += item.message.substring(0,item.message.indexOf('@{member}@'));
							output += '</div>';
						}else{
							//멤버 등록 메시지가 아닌 일반 메시지
							if(item.mem_num == param.user_num){
								output += '<div class="from-position">'+item.id;
								output += '<div>';
							}else{
								output += '<div class="to-position">';
								output += '<div class="space-photo">';
								output += '<img src="../member/viewProfile?mem_num='+item.mem_num+'" width="40" height="40" class="my-photo">';
								output += '</div><div class="space-message">';
								output += item.id;
							}
							output += '<div class="item">';
							output += item.read_count + '<span>' + item.message.replace(/\r\n/g,'<br>').replace(/\r/g,'<br>').replace(/\n/g,'<br>') + '</span>';
							//시간 추출
							output += '<div class="align-right">'+item.chat_date.split(' ')[1]+'</div>';
							output += '</div>';
							output += '</div><div class="space-clear"></div>';
							output += '</div>';
						}
						
						//문서 객체에 추가
						$('#chatting_message').append(output);
						//스크롤을 하단에 위치시킴
						$('#chatting_message').scrollTop($('#chatting_message')[0].scrollHeight);
					});					
				}else{
					alert('채팅 메시지 읽기 오류 발생');
					message_socket.close();
				}
			},
			error:function(){
				alert('네트워크 오류 발생');
				message_socket.close();
			}
		});
	}
	
	//메시지 입력 후 enter 이벤트 처리
	$('#message').keydown(function(event){
		if(event.keyCode == 13 && !event.shiftKey){
			$('#detail_form').trigger('submit');
		}
	});
	
	//채팅 메시지 등록
	$('#detail_form').submit(function(event){
		if($('#message').val().trim()==''){
			alert('메시지를 입력하세요');
			$('#message').val('').focus();
			return false;
		}
		
		if($('#message').val().length > 1333){
			alert('메시지를 1333자까지만 입력 가능합니다.');
			return false;
		}
		
		//form 이하의 태그에 입력한 데이터를 모두 읽어옴
		let form_data = $(this).serialize();
		
		//서버와 통신
		$.ajax({
			url:'../talk/writeTalk',
			type:'post',
			data:form_data,
			dataType:'json',
			success:function(param){
				if(param.result == 'logout'){
					alert('로그인해야 작성할 수 있습니다.');
					message_socket.close();
				}else if(param.result == 'success'){
					//폼 초기화
					$('#message').val('').focus();
					//메시지가 저장되었다고 소켓에 신호를 보냄
					message_socket.send('msg:');
				}else{
					alert('채팅 메시지 등록 오류');
					message_socket.close();
				}
			},
			error:function(){
				alert('네트워크 오류');
				message_socket.close();
			}
		});
		
		//기본 이벤트 제거
		event.preventDefault();
	});
	
	/*-------------------
	 * 채팅방 이름 변경하기
	 *-------------------*/
	//채팅방 이름 변경 UI 표시
	$('#change_name').click(function(){
		$(this).hide();
		let output = '<div id="space_name">';
			output += '<input type="text" name="room_name" id="room_name">';
			output += '<input type="button" value="전송" id="submit_name">';
			output += '<input type="button" value="취소" id="result_name">';
			output += '</div>';
		$('#chatroom_title').append(output);
	});
	
	//채팅방 이름 변경 UI 숨기기
	$(document).on('click','#result_name',function(){
		initForm();
	});
	
	//채팅방 이름 변경 UI 초기화
	function initForm(){
		$('#change_name').show();
		$('#space_name').remove();
	}
	
	//채팅방 이름 변경하기
	$(document).on('click','#submit_name',function(){
		if($('#room_name').val().trim()==''){
			alert('채팅방 이름을 입력하세요');
			$('#room_name').val('').focus();
			return;
		}
		//서버와 통신
		$.ajax({
			url:'../talk/changeName',
			type:'post',
			data:{talkroom_num:$('#talkroom_num').val(),room_name:$('#room_name').val()},
			dataType:'json',
			success:function(param){
				if(param.result == 'logout'){
					alert('로그인해야 작성할 수 있습니다.');
					message_socket.close();
				}else if(param.result == 'success'){
					$('#chatroom_name').text($('#room_name').val());
					//입력창 초기화
					initForm();
				}else{
					alert('채팅방 이름 변경 오류 발생');
					message_socket.close();
				}
			},
			error:function(){
				alert('네트워크 오류');
				message_socket.close();
			}
		});
	});
});