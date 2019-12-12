	function uploadCoverPhoto(source) {
		source.form.submit();
	}
	$.fn.toggleClick=function(){
		var functions=arguments
		return this.click(function(){
			var iteration=$(this).data('iteration')||0
		//	console.log(iteration)
			functions[iteration].apply(this,arguments)
			iteration= (iteration+1) %functions.length
			$(this).data('iteration',iteration)
		})
	}

	$(function(){

		var delay = (function(){
		  var timer = 0;
		  return function(callback, ms){
		    clearTimeout (timer);
		    timer = setTimeout(callback, ms);
		  };
		})();

		function tocDetails() {
		    var sections = [],
		    tocDetails = {};
		    $('#toc-left.sidr #toc li').each(function(item, value) {
				sections.push(parseInt($(value).attr("data-section")));
			});

			tocDetails.max = Math.max.apply(null, sections);
			tocDetails.length = sections.length;

			return tocDetails;
	    }

		var kreateve = {
		    init: function(){
			    $('.cart').sidr({
					name: 'cart-right',
					side: 'right',
					source: '#cart',
					body: 'body',
					displace: true,
					renaming: false,
					onOpen: function(){
					  $('#cart-text').html('Close Cart');
					},
					onClose: function(){
					  $('#cart-text').html('View Cart');
					}
				});

				$('.navbar-header span').sidr({
					name: 'toc-left',
					side: 'left',
					source: '#sidebar',
					body: '.navbar-header',
					displace: true,
					renaming: false ,
					onOpen: function(){
					  //$('#cart-text').html('Close Cart');
					},
					onClose: function(){
					  //$('#cart-text').html('View Cart');
					}
				});

				$('#toc-left #toc').sortable({
					placeholder: "ui-state-highlight"
				});

				$('#toc').disableSelection();
				$('#editable-container').redactor({
					focus: true,
					source: false,
					syncCallback:function()
					{
						delay(function(){
					    	kreateve.editorsave();
					    }, 500);
					},
					plugins: ['imagemanager', 'table', 'fullscreen'],
					imageUpload: '/projects/uploadimage/' + $('[name="project_id"]').val(),
					imageManagerJson: '/projects/' + $('[name="project_id"]').val() + '/images'
				});

				$('.redactor-toolbar').append('<li class="pull-right message" style="display: none;"><p></p></li>');

				$.sidr('open', 'toc-left');

		    },
		    addsection: function(){
				var currentEvent = event.target,
				tocMax = parseInt(tocDetails().max) + 1;
				tocLength = parseInt(tocDetails().length) + 1;


				$.post('/ajax/sectionadd', {'project_id': $('[name="project_id"]').val(), 'section_id': tocMax, 'order': tocLength }).success(function(data){
					data = JSON.parse(data);
					$('.redactor-editor').html("");
					$(currentEvent).parent().parent().find("li").removeClass("active");
					$('#toc-left #toc').append('<li class="active"  data-section="'+ tocMax +'"><span class="glyphicon glyphicon-resize-vertical" aria-hidden="true"></span> <a href="" class="section">Chapter '+ tocMax +'</a> <span class="pull-right"><a href="" class="edit" title="Edit Title"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a> <a href="" class="delete" title="Delete Section"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></span></li>');
					$('#section_id').val(tocMax);
					$('.redactor-toolbar .message p').html(data.success);
					$('.redactor-toolbar .message').fadeIn();
					setTimeout(function(){ $('.redactor-toolbar .message').fadeOut() }, 3000);
				});
		    },
		    loadsection: function(){
			    var currentEvent = event.target;
			    event.preventDefault();
				var section_id = event.target.parentNode.attributes["data-section"].value,
				section = {};
				section.count = section_id;
				//console.log(section_id);
				$.get('/ajax/sectionload',
					{'project_id': $('[name="project_id"]').val(), 'section_id': section_id},
					function(data, status){
						data = JSON.parse(data);
						$.each(data.data, function(item, value) {
							$('#section_id').val(value.id);
							$('.redactor-editor').html(value.content);
							$('#editable-container').text(value.content);
						});

						$(currentEvent).parent().parent().find("li").removeClass("active");
						$(currentEvent).parent().addClass("active");
						//console.log($(currentEvent).parent());
				});
		    },
		    deletesection: function(){
			    event.preventDefault();
			    that = this;
			    that.event = event;
				var section_id = event.target.parentNode.parentNode.parentNode.attributes["data-section"].value,
				section = {};
				section.count = section_id;
				$.post('/ajax/editordelete',
					{'project_id': $('[name="project_id"]').val(), 'section_id': section_id},
					function(data, status){
						data = JSON.parse(data);
						section.data = data.data;
						$('.redactor-toolbar .message p').html(data.success);
						$('.redactor-toolbar .message').fadeIn();
						setTimeout(function(){ $('.redactor-toolbar .message').fadeOut() }, 3000);
						that.event.target.parentNode.parentNode.parentNode.remove();
				});
		    },
		    reorder: function(){
			    var sections = [];
				$('#toc-left #toc li').each(function(item, value) {
					var current = {},
					section = parseInt($(this).attr("data-section"));
					current.id = section;
					current.order = item;
					sections.push(current);
					//console.log(current);
				});
				$.post('/ajax/sectionorder', { 'project_id': $('[name="project_id"]').val(), 'order': sections }).success(function(data){});
		    },
		    editorsave: function(){
			    $.post('/ajax/editorsave', {'project_id': $('[name="project_id"]').val(), 'section_id': $('[name="section_id"]').val(), 'data': $('[name="editable-container"]').redactor('code.get')}).success(function(data){
					data = JSON.parse(data);
					$('.redactor-toolbar .message p').html(data.success);
					$('.redactor-toolbar .message').fadeIn();
					setTimeout(function(){ $('.redactor-toolbar .message').fadeOut() }, 3000);
				});
		    },
		    edittitle: function(){
			    event.preventDefault();
			    that = this;
			    that.event = event,
			    container = $(event.target.parentNode.parentNode.parentNode).find('a.section');

				console.log(event);

				$('#toc-left #toc').sortable( "disable" );
				$(container).prop('contenteditable',true).toggleClass('editable').focus();

				$(event.target.parentNode.parentNode.parentNode).find('a.edit').removeClass('edit').addClass('save').children('span').removeClass('glyphicon-pencil').addClass('glyphicon-ok');

		    },
		    savetitle: function(){
			    event.preventDefault();
			    that = this;
			    that.event = event,
			    section_id = event.target.parentNode.parentNode.parentNode.attributes["data-section"].value;

				var container = $(event.target.parentNode.parentNode.parentNode).find('a.section');

				$('#toc-left #toc').sortable( "enable" );
				$(container).prop('contenteditable', false).toggleClass('editable').blur();

				$(event.target.parentNode.parentNode.parentNode).find('a.save').removeClass('save').addClass('edit').children('span').removeClass('glyphicon-ok').addClass('glyphicon-pencil');

			    $.post('/ajax/titlesave', {'project_id': $('[name="project_id"]').val(), 'section_id': section_id, 'title': $(container).text()}).success(function(data){
					data = JSON.parse(data);
					$('.redactor-toolbar .message p').html(data.success);
					$('.redactor-toolbar .message').fadeIn();
					setTimeout(function(){ $('.redactor-toolbar .message').fadeOut() }, 3000);
				});
		    },
		    editname: function(){ //Edit book name
			    event.preventDefault();
			    /*that = this;
			    that.event = event,
			    container = $(event.target.parentNode);*/

				console.log(event);

				//$('#toc-left #toc').sortable( "disable" );
				$('#toc-left #bookname h2').prop('contenteditable',true).toggleClass('editable').focus();
				$('#toc-left #bookname h3').prop('contenteditable',true).toggleClass('editable').focus();

				$('#toc-left #bookname a.editname').removeClass('editname').addClass('savename').children('span').removeClass('glyphicon-pencil').addClass('glyphicon-ok');

		    },
		    savename: function(){ //Save book name
			    event.preventDefault();
			    /*that = this;
			    that.event = event,
			    section_id = event.target.parentNode.parentNode.parentNode.attributes["data-section"].value;

				var container = $(event.target.parentNode.parentNode.parentNode).find('a.section');

				$('#toc-left #toc').sortable( "enable" );*/
				$('#toc-left #bookname h2').prop('contenteditable', false).toggleClass('editable').blur();
				$('#toc-left #bookname h3').prop('contenteditable', false).toggleClass('editable').blur();
				
				var newname = $('#toc-left #bookname h2').text();
				var newauthor = $('#toc-left #bookname h3').text();

				$('#toc-left #bookname a.savename').removeClass('savename').addClass('editname').children('span').removeClass('glyphicon-ok').addClass('glyphicon-pencil');

			    $.post('/ajax/booknamesave', {'project_id': $('[name="project_id"]').val(), 'name': newname, 'author': newauthor}).success(function(data){
					data = JSON.parse(data);
					$('.redactor-toolbar .message p').html(data.success);
					$('.redactor-toolbar .message').fadeIn();
					setTimeout(function(){ $('.redactor-toolbar .message').fadeOut() }, 3000);
				});
		    },
		    generate: function(){
			    $.post('/ajax/generate', {'project_id': $('[name="project_id"]').val()}).success(function(data){
					data = JSON.parse(data);
					$('.redactor-toolbar .message p').html(data.success);
					$('.redactor-toolbar .message').fadeIn();
					setTimeout(function(){ $('.redactor-toolbar .message').fadeOut() }, 3000);
					$('#toc-left #files').fadeOut().html("");

					$.each(data.files, function(item, value) {
						$('#toc-left #files').append('<li><a target="_blank" href=//'+window.location.host+'/'+value.location+'>'+ value.type +'</a></li>');
					});

					$('#toc-left #files, #toc-left #files-header').fadeIn();
				});
		    }

	    }

	    kreateve.init();

		$('#toc-left #toc').on('sortstop', function(event, ui) {
			kreateve.reorder();
		});

		/*$('[name="editable-container"]').on('change', function(){
			console.log('save init');

		    delay(function(){
		    	kreateve.editorsave();
		    }, 500);

	    });*/

		$('[name="add-section"]').click(function(){
			kreateve.addsection();
		});

		$(document).on('click', '#toc-left #toc li a.section', {}, function (event) {
            kreateve.loadsection();
        });

        $(document).on('click', '#toc-left #toc li a.edit', {}, function (event) {
            kreateve.edittitle();
        });

        $(document).on('click', '#toc-left #toc li a.save', {}, function (event) {
            kreateve.savetitle();
        });
        
        $(document).on('click', '#toc-left #bookname a.editname', {}, function (event) {
            kreateve.editname();
        });

        $(document).on('click', '#toc-left #bookname a.savename', {}, function (event) {
            kreateve.savename();
        });

        $(document).on('click', '#toc-left #toc li a.delete', {}, function (event) {
	        if (tocDetails().length > 1) {
	            kreateve.deletesection();
	        } else {
		        event.preventDefault();
	        }
        });

		$('[name="generate"]').click(function(){
			kreateve.generate();
		});
	});