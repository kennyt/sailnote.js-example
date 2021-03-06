//Place all the behaviors and hooks related to the matching controller here.
//All this logic will automatically be available in application.js.
//You can use CoffeeScript in this file: http://jashkenas.github.com/coffee-script/

function autoSetEditorHeight(){
	var beforeScrollTop = $(document).scrollTop();
	var lastChild = $($('iframe').contents().find('body').children()[$('iframe').contents().find('body').children().length - 1])
	if ($('iframe').contents().find('body').children().length > 0){
		var newHeight = lastChild[0].getBoundingClientRect().bottom;
		$('iframe').height(newHeight)
	} else {
		var newHeight = $('iframe').contents().height();
		$('iframe').height(newHeight);
	}

	setTimeout(function(){
		$(document).scrollTop(beforeScrollTop)
	},0)
}

function showTopSection(){
	var iframeTop;
	var sections;
	if ($('iframe').length > 0){
		iframeTop = $('iframe').offset().top
	  sections = $('iframe').contents().find('section');
	} else {
		iframeTop = 0;
		sections = $('section');
	}
	var scrollTop = $(document).scrollTop();

	$.each(sections, function(i, section){
		if ($(section).css('opacity') == '0'){
			var sectionTop = $(section).offset().top + iframeTop - (screen.height/3.5)
			if (scrollTop > sectionTop){
				$(section).css('opacity','1');
			}
		}
	})
	if ($(window).scrollTop() + $(window).height() >= $(document).height() - 50){
  	$(sections).css('opacity','1');
  }
}

function bindScroll(element, user){
  var scrollDirection;
	element.on('DOMMouseScroll wheel',function(e){
		if ($('iframe').contents().find('.editing-note').length){ return true }

  	var theEvent = e.originalEvent.wheelDelta || e.originalEvent.detail*-1
  	if (theEvent != 0){
	  	if( theEvent /120 > 0) {
		    scrollDirection = 'up';
		  } else {
		    scrollDirection = 'down';
		  }
	  	var scrollTop = $(document).scrollTop();
	  	snapScroll(scrollTop, scrollDirection, user);
	  	return false;
  	}
  })

	var lastY = 0,
    	timer,
    	ts;

	element.on('touchstart', function (e){
  	var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0]
	  ts = touch.pageY || e.pageY;
	});

  element.on('touchmove', function (e){
  	e.preventDefault();
  	var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0]
    var currentY = touch.pageY || e.pageY
    if (currentY < ts) {
        scrollDirection = 'down';
    } else {
        scrollDirection = 'up';
    }

  	var scrollTop = $(document).scrollTop();
  	snapScroll(scrollTop, scrollDirection, user);
  })

  $('html,body').on('keydown', function(e){
		if ($('iframe').contents().find('.editing-note').length){ return true }
  	var UP = 38;
		var DOWN = 40;
  	var scrollTop = $(document).scrollTop();

		var getKey = function(e) {
		  if(window.event) { return e.keyCode; }  // IE
		  else if(e.which) { return e.which; }    // Netscape/Firefox/Opera
		};

		var keynum = getKey(e);
		if(keynum === UP) {
  		snapScroll(scrollTop, 'up', user);
			return false;
		}

		if(keynum === DOWN) {
  		snapScroll(scrollTop, 'down', user);
			return false;
		}
  })
}

var sectionNumber = -1;
var lastScroll = 0;

function snapScroll(top, direction, user){
	var conditional;
	if (user == 'guest'){
		conditional = $('.post_text').attr('scrollz') == '0' || $('.post_text').attr('scrollz') == undefined
	}
	else {
		conditional = ($('iframe').attr('scrollz') == '0' || $('iframe').attr('scrollz') == undefined) && $('iframe').contents().find('.editing-note').length == 0
	}
	if (conditional){
		var sections;
		var textBody;
		if (user == 'guest'){
			textBody = $('.post_text')
			sections = $('section');
		}
		else {
			textBody = $('iframe');
			sections = $('iframe').contents().find('section');
			$.each(sections, function(i, section){
				if ($(section).hasClass('undo-on')){
					sections.splice(i, 1);
				}
			})
		}

		var previousSection = sectionNumber
		if (direction == 'down'){
			sectionNumber += 1;
			if (sectionNumber > sections.length - 1){
				sectionNumber = sections.length
			}
		} else {
			sectionNumber -= 1;
			if (sectionNumber < -1){
				sectionNumber = -1;
			}
		}

		textBody.attr('scrollz','1');

		var section;
		var sectionTop;
		if (sectionNumber == -1){
			section = false;
			sectionTop = 0;
		} else {
			if (sectionNumber > sections.length - 1){
				// sectionNumber = sections.length - 1
				section = false;
				sectionTop = $(document).height() - $(window).height();
			} else {
				section = sections[sectionNumber];
				if (user == 'guest'){
					sectionTop = $(section).offset().top
				} else {
					sectionTop = $(section).offset().top + textBody.offset().top
				}
			}
		}
		var startingTop = $(document).scrollTop();
		var ratio = (sectionNumber + 1) / (sections.length + 1)
		var beforeRatio = (previousSection + 1) / (sections.length + 1)
		$('html,body').animate({ scrollTop: sectionTop}, {duration: 450, easing: 'easeInOutCubic', step: function(){
			stepMoveProgressBar(startingTop, sectionTop, ratio, beforeRatio);
		}})


		//hide prev section
		var beforeSection = sections[previousSection];
		if (beforeSection != undefined){
			$($(beforeSection).children()).animate({ opacity: 0}, 160)
		}

		//make image light to have the focus transition effect
		if (section && $(section).hasClass('color_image')){
			$(section).css('opacity','.35');
		}
		hideChildren(section);

		//moving progress bar logic
		if (sections.length > 2 && $('.page_identifier').attr('id') == 'guest_view_post' && ($(section).hasClass('color_white') || !section) ){
			opacityProgressBar()
		}

		$(section).animate({'padding-top': parseInt($(section).css('padding-top')) + 20 + 'px'}, 160)
		setTimeout(function(){
			if (section != false){
				var paddingTop = parseInt($(section).css('padding-top')) - 20
				$($(section).children()).animate({ opacity: 1}, 400)
				$(section).animate({'padding-top': paddingTop+'px', opacity: 1}, 500)
			}
		}, 400);
		setTimeout(function(){
			lastScroll = $(document).scrollTop();
			textBody.attr('scrollz','0');
		}, 750)
	}
}

function stepMoveProgressBar(startingTop, futureTop, ratio, beforeRatio){
	if (startingTop == futureTop){
		$('.progress_bar').val(100).trigger('change')
	} else {
		var futureNumber = ratio * 100;
		var currentNumber = beforeRatio * 100;
		var currentTop = $(document).scrollTop() ;
		var progress = currentTop - startingTop
		var progressPercent = progress / (futureTop - startingTop)
		var numberDifference = futureNumber - currentNumber
		var value = (numberDifference * progressPercent) + currentNumber

		$('.progress_bar').val(value).trigger('change')
	}
}

function opacityProgressBar(){
	$('#radial-progress').css('z-index','1000000000000');
	$('#radial-progress').animate({ opacity: '.55'}, 150)
	setTimeout(function(){
		$('#radial-progress').animate({ opacity: 0}, 300)
		setTimeout(function(){
			$('#radial-progress').css('z-index','-1000')
		}, 300)
	}, 350)
}

function activateKnob(){
	var canvas = $('.progress_bar').knob({'bgColor':'#ecf0f1','fgColor':'#2c3e50', 'readOnly':'true', 'thickness':'.2'}).find('canvas');
	var left = ($(document).width() - 240) / 2
	var top = ($(window).height() - 240) / 2
	canvas.css({'position':'fixed', 'top': top,'left':left,'opacity':'0', 'z-index':'-1000000'})
	canvas.attr('id','radial-progress');
}

function activateDownArrow(){
	$('.down_arrow').css('top', $(window).height() - 40);
}

function getBodyTextColor(section){
	if (!section){
		return '#2c3e50';
	}
	var palette = $(section).find('p');
	if (!(palette.length)){
		palette = $(section).find('h1');
	}
	if (!(palette.length)){
		palette = $(section).find('div');
	}
	if (!(palette.length)){
		palette = $(section).find('blockquote');
	}
	return $(palette).css('color');
}

function verticalAlignSections(user){
	var sections;
	if (user == 'guest'){
		sections = $('section');
	}
	else {
		sections = $('iframe').contents().find('section');
	}
	$.each(sections, function(i, section){
		var height = $(section).height();
		var children = $(section).children()
		var lastChildDim = children[children.length-1].getBoundingClientRect()
		var firstChildDim = children[0].getBoundingClientRect()
		var lastChildBottom = lastChildDim.bottom - firstChildDim.top
		$(section).css({'padding-top': (height - lastChildBottom)/2 +'px', 'box-sizing': 'border-box'});
	})
}

function verticalAlignHeader(user){
	var title;
	var extra = 0;
	if (user == 'guest'){
		extra = 50;
		title = $('.post_title');
	} else {
		title = $('.edit-title');
	}

	var height = title.height() + $('.author_link_wrapper').height();
	var windowHeight = $(window).height();
	var marginTop = (windowHeight-height)/2
	$('.hero_header').css({'height':windowHeight, 'padding-top':marginTop - 60})
	var titleBottom = title.offset().top + title.height();
	$('.author_link_wrapper').css('top', titleBottom + extra);
}

function invisibleChildren(section){
	$.each($(section).children(), function(i, child){
		if (!($(child).hasClass('confirm_delete_section'))){
			$(child).fadeOut(300);
		}
	})
}

function visibleChildren(){
	sections = $('iframe').contents().find('section')
	$.each(sections, function(i, section){
		if (!($(section).hasClass('undo-on'))) {
			$(section).children().css('opacity','1');
		}
	})
}

function hideChildren(section){
	$(section).children().css('opacity','0');
}

function setBlockquoteTop (ele, beforeTop){
	var parent = ele.parentNode
	if (($(parent).attr('class').indexOf('text_left_panel')) || ($(parent).attr('class').indexOf('text_right_panel'))){
		$(ele).css({'top':beforeTop});
		var catchSafe = 0
		while(checkOverlap(ele, parent)){
			$(ele).css({'top': $(ele).css('top') + 10})
			catchSafe += 1
			if (catchSafe == 400) {
				break
			}
		}
	}
}

function checkOverlap (ele, parent){
	var overlap;
	$.each($(parent).find('blockquote'), function(i, block){
		if (!(block ==  ele)){
			var eleDim = ele.getBoundingClientRect();
			var blockDim = block.getBoundingClientRect();
			overlap = !(eleDim.bottom < blockDim.top || 
	                eleDim.top > blockDim.bottom)
			if (overlap){
				return false;
			}
		}
	})
	return overlap;
}

function getSectionParent(selection){
	var parent = selection.anchorNode || selection
	var catchSafe = 0;
	while(!($(parent).is('section'))){
		if (parent == null){
			break
		} else {
			parent = parent.parentNode;
			if (catchSafe > 5){
				break;
			}
			catchSafe += 1
		}
	}
	return parent;
}

// function resetSectionHovering(){
// 	var sections = $('iframe').contents().find('section')
// 	$.each(sections, function(i, section){
// 		$(section).attr('hovering', 0);
// 	})
// }

function getElementFromSelection(elType){
	var selection = $('iframe').contents()[0].getSelection()
	var element = selection.anchorNode || selection;
	var catchSafe = 0;
	while (!(element.nodeName == elType)){
		if (element == null){
			break
		} else {
			element = element.parentNode
			if (catchSafe > 5){
				break;
			}
			catchSafe += 1
		}
	}
	return element
}

function getTopElement(){
	var selection = $('iframe').contents()[0].getSelection();
	var prevEl;
	var ele = selection.anchorNode || selection;
	var catchSafe = 0;
	while (!($(ele).is('section'))){
		prevEl = ele;
		ele = ele.parentNode
		if (catchSafe > 5){
			break;
		}
		catchSafe += 1
	}
	return prevEl;
}
	
function boldChoiceButtons(section){
	var classes = $(section).attr('class').split(' ')
	$.each($('.outlined'), function(i, ele){
		$(ele).removeClass('outlined');
	})
	$.each(classes, function(i, elClass){
		if (elClass == 'text_left_panel'){
			$('#left_panel').addClass('outlined');
		}
		if (elClass == 'text_center_panel'){
			$('#center_panel').addClass('outlined');
		}
		if (elClass == 'text_right_panel'){
			$('#right_panel').addClass('outlined');
		}
		if (elClass == 'classic_font'){
			$('#classic_font').addClass('outlined');
		}
		if (elClass == 'graceful_font'){
			$('#graceful_font').addClass('outlined');
		}
	})
}

function flattenChildNodes(){
	var sections = $('iframe').contents().find('section');
	$.each(sections, function(i, section){
		var children = $(section).children()
		$.each(children, function(i, child){
			var onlyBr = ($(child).children().length == 1) && $(child).children().is('br') && !($(child).is('figure'))
			if ( ($(child).children().length > 0) || onlyBr ){
				// var replacer = []
				// $.each($(child).children(), function(i, lowerChild){
				// 	if (lowerChild.nodeName == '#text'){
				// 		var newDiv = $('<div>').html(lowerChild)
				// 		replacer.push(newDiv)
				// 	} else {
				// 		replacer.push(lowerChild)
				// 	}
				// })
				$(child).replaceWith($(child).html())
				$.each($(section).contents(), function(i, lowerChild){
					if ((lowerChild.nodeName == '#text')) {
						$(lowerChild).replaceWith('<div>'+lowerChild+'</div>');
					}
				})
			}
		})
	})
}

function resetStyles(body, mode){
	var sections = body.find('section');
	$.each(sections, function(i, section){
		if (mode != 'editing'){
			$(section).removeClass('editing-note')
		}
		if (!($(section).attr('class').indexOf('color_image') > -1)){
			$(section).attr('style','');
		} else {
			$(section).css({'opacity':'1', 'box-shadow':'none'});
		}
		var children = $(section).children()
		$.each(children, function(i, child){
			if (!($(child).is('blockquote') || $(child).is('figure'))){
				$(child).attr('style','');
			}
		})
	})
}

function getHoveringSection(index){
	var sections = $('iframe').contents().find('section');
	var section = sections[parseInt(index)];
	return section;
}

function createImage(that){
	var prevTop = $($('iframe').contents()[0].getSelection().anchorNode.parentNode).offset().top
	var newImg = $('<img>').attr('src', $(that).data("argument"))
	var newFigure = $('<figure>').html(newImg)
	var section = getSectionParent($('iframe').contents()[0].getSelection());

	if (!($(section).attr('class').indexOf('text_center_panel') > -1)){
		$(section).prepend(newFigure[0])
	} else {
		$($('iframe').contents()[0].getSelection().anchorNode).replaceWith(newFigure);
	}

	newFigure = newFigure[0]
	var s = $('iframe')[0].contentWindow.getSelection(),
	    r = $('iframe').contents()[0].createRange();
	r.setStart(newFigure, 0);
	r.setEnd(newFigure, 0);
	r.collapse();
	s.removeAllRanges();
	s.addRange(r);
}

function getSectionIndex(section){
	var sections = $('iframe').contents().find('section');
	var index = 0;
	$.each(sections, function(i, checkSection){
		if (checkSection == section){
			index = i;
		}
	})
	return index;
}

function enlargeForMobile(){
	if(window.mobilecheck()) {
		$('.text_center_panel p').css({'font-size':'46px', 'width':'95%'});
		$('.text_center_panel div').css({'font-size':'46px', 'width':'95%'});
		$('.text_center_panel .pullquote').css({'font-size':'68px'})
		$('.text_center_panel h1').css({'font-size':'4.5em'})
	}
}

function turnOnEditing(){
	var sections = $('iframe').contents().find('section');
	sections.addClass('editing-note');
	$.each(sections, function(i, section){
		if (!($(section).hasClass('undo-on'))){
			$(section).css({'padding-top':'', 'padding-bottom':'30px', 'min-height':'90px'})
		}
	})
	$('.url_input').after($('.view_mode_button'))
	$('.sfooter').hide();
	showSideTooltips();
	insertDeleteSection();
	visibleChildren()
	checkLastSectionForEmpty()
	autoSetEditorHeight();
}

function turnOnPreview(){
	sectionNumber = -1;
	$('html,body').animate({scrollTop : 0}, 500);
	$('iframe').contents()[0].designMode = 'off';
	$('.batman_toolbelt').attr('class','batman_toolbelt view_mode')
	$('.view_mode_button').html('x')
	$('.view_mode_button').attr('class','edit_mode_button control_button');
	$('.batman_toolbelt').after($('.edit_mode_button'))
	$('.save_success').attr('style','display:block;background:#34495e;');
	$('.save_success').html('preview mode on')
	$('.blank_note').fadeOut(200);
	$('.sfooter').show();
	$('.sfooter').height($(window).height());

	if (checkLastSectionForEmpty()){
		$(checkLastSectionForEmpty()).remove();
	}
	var sections = $('iframe').contents().find('section');
	$(sections).find('.confirm_delete_section').remove();
	$(sections).removeClass('editing-note');
	sections.css({'min-height': $(window).height()})
	bindScroll($('html,body'))
  bindScroll($('iframe').contents().find('body'))
	verticalAlignSections();
	activateKnob();
	hideSideTooltips();
	autoSetEditorHeight();
}

function checkLastSectionForEmpty(){
	if ($('iframe').contents().find('.editing-note').length == 0) { return false }
	var lastSection = $('iframe').contents().find('section')[$('iframe').contents().find('section').length - 1]
	var lastSectionClone = $(lastSection).clone();
	$(lastSectionClone).find('.confirm_delete_section').remove();
	if ($(lastSectionClone).text().length > 0){
		$('.blank_note').fadeOut(200);
		$('iframe').contents().find('body').append('<section class="text_center_panel classic_font color_white editing-note"><p><br></p><p><br></p></section>')
		var blankSection = $('iframe').contents().find('section')[$('iframe').contents().find('section').length - 1]
		var top = $(blankSection).offset().top + $('iframe').offset().top + 60
		insertDeleteSection();
		return false
	} else {
		return lastSection;
	}
}

function flashRed(element){
	element.css('color','red');
	setTimeout(function(){
		element.css('color','');
		setTimeout(function(){
			element.css('color','red');
			setTimeout(function(){
				element.css('color','');
			},25)
		}, 25)
	}, 25)
}

function enforceTextLimit(section, ev){
	// var previousHTML = $(section).html();
	console.log(ev)

	var textLength = $(section).text().length
	if (textLength >= 400 && isCharacterKeyPress(ev)){
		ev.preventDefault();
		// $(section).html(previousHTML)
		flashRed($('.slide_identifier'))

		// var sectionChild = $('iframe')[0].contentWindow.getSelection().anchorNode
		// this.setSelectionRange(len, len)
		// var sectionChildLength = sectionChild.length
		// var s = $('iframe')[0].contentWindow.getSelection(),
		//     r = $('iframe').contents()[0].createRange();
		// r.setStart(sectionChild, 2);
		// r.setEnd(sectionChild, 2);
		// r.collapse();
		// s.removeAllRanges();
		// s.addRange(r);
	}
	// setTimeout(function(){
		
	// },0)

}

function isCharacterKeyPress(evt) {
  if (typeof evt.which == "undefined") {
    // This is IE, which only fires keypress events for printable keys
    return true;
  } else if (typeof evt.which == "number" && evt.which > 0) {
    // In other browsers except old versions of WebKit, evt.which is
    // only greater than zero if the keypress is a printable key.
    // We need to filter out backspace and ctrl/alt/meta key combinations
    return !evt.ctrlKey && !evt.metaKey && !evt.altKey && evt.which != 8;
  }
  return false;
}

function showSlideIdentifier(section){
	if ($(section).hasClass('editing-note')){
		var top = $(section).offset().top + $('iframe').offset().top + 20
		var left = $(section).offset().left - 100
		var index = getSectionIndex(section)
		var textLength = $(section).text().length
		var sections = $('iframe').contents().find('section');
		$('.edit_section_btn').css({'top':top,'left':left})
		$('.edit_section_btn').attr('data-section-index', index);

		$('.move_section_up').show();
		$('.move_section_down').show();
		$('.move_section_up').attr('data-section-index',index).css({'top':top, 'left':left + 55, 'opacity':'.3'})
		$('.move_section_down').attr('data-section-index',index).css({'top':top + 30, 'left':left + 55, 'opacity':'.3'})
		if (index == sections.length - 1){
			$('.move_section_down').hide();
		} else if (index == 0){
			$('.move_section_up').hide();
		}

		if (index == $('iframe').contents().find('section').length - 1 && $('iframe').contents().find('.editing-note').length > 0){
			$('.blank_note').css({'top': top})
			$('.blank_note').fadeIn(50);
		}else {
			$('.slide_identifier').html('Slide ' + (index + 1) + ': ' + (400 - textLength) + ' characters left')
			$('.slide_identifier').css({'top':top})
		}
	} else {
		$('.slide_identifier').css({'top': '-100px'})
	}
}

function insertDeleteSection(){
	$('iframe').contents().find('.confirm_delete_section').remove();
	var sections = $('iframe').contents().find('section')
	sections.append('<span class="confirm_delete_section" title="delete">x</span>')
}

function showSideTooltips(){
	$('.move_section_down').show();
	$('.move_section_up').show();
	$('.edit_section_btn').show();
	$('.slide_identifier').show();
}

function hideSideTooltips(){
	$('.move_section_down').hide();
	$('.move_section_up').hide();
	$('.edit_section_btn').hide();
	$('.slide_identifier').hide();
}

function moveCaret(win, charCount) {
  var sel, range;
  if (win.getSelection) {
    sel = win.getSelection();
    if (sel.rangeCount > 0) {
      var textNode = sel.focusNode;
      var newOffset = sel.focusOffset + charCount;
      sel.collapse(textNode, Math.min(textNode.length, newOffset));
    }
} else if ( (sel = win.document.selection) ) {
    if (sel.type != "Control") {
      range = sel.createRange();
      range.move("character", charCount);
      range.select();
    }
  }
}


//text_editor code. runs on every page with the class .edit-box
$(document).ready(function(){
	if ($('.page_identifier').attr('id') == 'logged_in_post'){

		$('body').on('click','.edit-submit',function(ev){
			if ($(this).attr('datasubmit').length){
				ev.preventDefault();
				ev.stopPropagation();
				$('iframe').contents().find('.undo-on').remove();
				var user = $('.edit-title').attr('data-author');
				var title = encodeURIComponent($('.edit-title').attr('datatitle').toLowerCase());
				var clone = $('iframe').contents().find('body').clone();
				resetStyles($(clone));
				var lastSection = $(clone).find('section')[$(clone).find('section').length - 1]
				if ($(lastSection).text().length == 0){
					$(lastSection).remove();
				}
				var cloneHtml = $(clone).html()

				$('.edit-box').val(cloneHtml);
				$('.save_success').attr('style','display:block;background:#c0392b;');
				$('.save_success').html('saving..')

				$.post('/'+user+'/'+title+'/update_post_json',{post:
				{	id: $('.edit-submit').attr('data_id'),
					title: $('.edit-title').val(),
					text: $('.edit-box').val(),
					url: $('.url_input').val()
				}}, function(response){
					if (response['yes'] == '1'){
						$('.save_success').attr('style','display:block;')
						$('.save_success').html('saved!')
						$('#post_error').hide();
						var title = encodeURIComponent($('.edit-title').val().replace(/ /g, '-').toLowerCase());
						$('.edit-title').attr('datatitle', title)

						var user = $('.page_identifier').attr('data-username')
						if (document.URL.split('/'+user+'/')[1] != response['url']){
							location.href = '/'+user+'/'+response['url']
						}
						setTimeout(function(){
							$('.save_success').hide();
						}, 300)
					} else {
						$('.save_success').html(response['no'])
					}
				})
		}
		})

		$.fn.myTextEditor = function(options){
		    // extend the option with the default ones
		    var settings = $.extend({
		        width : "770px"
		    },options);
		    return this.each(function(){
		       var $this = $(this).hide();
				   // create a container div on the fly
				   var containerDiv = $("<div/>").attr('class','txt_editor');
				   $this.after(containerDiv); 
				   var editor = $("<iframe/>",{
				       frameborder : "0",
				       id : "the_editor",
				       css : {
				           width : '100%',
				           'margin-left': 'auto',
				           'margin-right': 'auto',
				           '-webkit-transition': 'all 100ms ease-in-out',
									 '-moz-transition': 'all 100ms ease-in-out',
									 '-o-transition': 'all 100ms ease-in-out',
									 '-ms-transition': 'all 100ms ease-in-out',
									 'transition': 'all 100ms ease-in-out'
				       }
				   }).appendTo(containerDiv).get(0);
				   // opening and closing the editor is a workaround to solve issue in Firefox
				   editor.contentWindow.document.open();
				   editor.contentWindow.document.close();
				   editor.contentWindow.document.designMode="on";
				   editor.scrolling="no";
				   // stylings
				   // var importFont = '@import url(http://fonts.googleapis.com/css?family=Source+Sans+Pro:400italic,700italic,400,700);';
				   var bodyStyle = 'body {background: #404040;}'
				   var textLinkStyle = '.text_link{text-decoration:none; border-bottom:1px solid #2980b9;color:#202020;} .text_link:link {color:#202020;border-bottom: 1px solid #202020;}.text_link:visited {color:#202020;border-bottom: 1px solid #202020;}.text_link:active {color:red;}'
				   var selectionStyle = '::selection {background: #D8D8D8; color:black;} ::-moz-selection {background: #D8D8D8;color:black;}'
				   var sectionStyle = 'section{width: 100%;position:relative; padding-bottom: 30px; min-height: 90px;}'
				   var moverStyle = '.mover{position: absolute;top: 0px;right: 0px;height: 20px;width: 20px !important;background: blue; cursor:pointer;}'
				   var stretcherStyle = '.stretcher{position: absolute;bottom: 50%;left: 0px;height: 20px;margin:0px !important;width: 20px !important;background: red; cursor:pointer;}'
				   var pStyle = 'p{margin-top: 0px; margin-bottom: 33px;}'
				   var maxWidth = 'p, blockquote, h1, div {max-width: 95%;} figure{max-width: 100%; margin:0px; overflow:hidden;}'
				   var editingNote = '.editing-note{width:60%%; margin-left: auto; margin-right:auto; height: auto; display: block; margin-top: 25px; padding-top: 20px; box-shadow: 0px 0px 8px 0px black;} .editing-note .pullquote{width: 100% !important; font-size: 40px !important;} .editing-note h1{font-size: 2.8em !important;} .editing-note div, .editing-note p {font-size: 24px !important;}'
				   var sectionTransition = 'section{ -webkit-transition: box-shadow 180ms ease-in-out, width 180ms ease-in-out;-moz-transition: box-shadow 180ms ease-in-out;-o-transition: box-shadow 180ms ease-in-out;-ms-transition: box-shadow 180ms ease-in-out;transition: box-shadow 180ms ease-in-out;}'
				   var confirmDeleteSection = '.confirm_delete_section {display:block;right: -8px;position: absolute;cursor: pointer;top: -8px;border:2px solid #383838;background: white;width: 16px; height: 16px; border-radius:50%; font-size: 10px; text-align: center; font-family: tahoma; font-weight: bold; color: #383838;-moz-user-select: none; -khtml-user-select: none; -webkit-user-select: none; -o-user-select: none; } .confirm_delete_section:hover{color: #e74c3c; border:2px solid #e74c3c;}'
				   var undoOnStyle = '.undo-on{opacity: .3;min-height: 6px !important; height: 6px !important; background:#bdc3c7; padding:0px !important;-webkit-transition: height 200ms ease-out;-moz-transition: height 200ms ease-out;-o-transition: height 200ms ease-out;-ms-transition: height 200ms ease-out;transition: height 200ms ease-out;} .undo-on:hover{opacity: 1;}'



				   var text_left_panelStyle = '.text_left_panel div, .text_left_panel p, .text_left_panel h1{ margin-left:9%; max-width:40%; width: 675px;} .text_left_panel blockquote, .text_left_panel .pullquote{right:7%; max-width:30%; width: 535px; float:right; padding-left: 20px; padding-right:20px; position: absolute; margin: 0px;} .text_left_panel h1{text-align:center;margin-bottom:25px; margin-top: 0px;} .text_left_panel figure {right:7%; max-width:50%; float:right; padding:0px; position: absolute; margin: 0px;} .text_left_panel img {width: 100%;} .text_left_panel blockquote{line-height:1.4; padding:20px;} .text_left_panel .pullquote{border:0px; text-align:center;}'
				   var text_center_panelStyle = '.text_center_panel div, .text_center_panel p {width: 675px;margin-left:auto;margin-right:auto;} .text_center_panel figure{text-align: center;} .text_center_panel h1{ width: 750px;margin-left:auto;margin-right:auto;text-align:left; margin-bottom:25px; margin-top: 0px;} .text_center_panel blockquote{position: relative;top:0px !important;margin:30px; margin-left: auto;margin-right: auto;padding:20px; font-size: 24px; line-height: 1.4;  width:625px;} .text_center_panel .pullquote{width: 70%;margin-left: auto;margin-right:auto; border-top: 0px solid black; border-bottom: 0px solid black;padding-right: 40px;padding-left:40px; text-align: center; margin-bottom: 5px; margin-top: 0px;}'
				   var text_right_panelStyle= '.text_right_panel div, .text_right_panel p, .text_right_panel h1{ margin-left:51%; max-width:40%; width: 675px;} .text_right_panel blockquote, .text_right_panel .pullquote{right:63%; max-width:30%; width: 535px; float:left; padding-left: 20px; padding-right:20px; position: absolute; margin: 0px;color:#95a5a6;} .text_right_panel h1{text-align:center;margin-bottom:25px; margin-top: 0px;} .text_right_panel figure {right:50%; max-width:50%; float:left; padding:0px; position: absolute; margin: 0px;} .text_right_panel img {width: 100%;} .text_right_panel blockquote{line-height:1.4; padding:20px;} .text_right_panel .pullquote{border:0px; text-align: center;}'


				   var graceful_fontStyle = '.graceful_font div, .graceful_font p{font-family:helvetica, tahoma, sans-serif; font-size: 26px;} .graceful_font blockquote{font-family: georgia,times new roman, times, serif; font-size: 20px;} .graceful_font h1 {font-family:georgia,times new roman, times, serif; font-size: 3em;line-height:1.1;} .graceful_font .pullquote{font-family: georgia,times new roman, times, serif; font-size: 40px;}'
				   var classic_fontStyle = '.classic_font div, .classic_font p {font-family:times new roman,times, serif; font-size: 26px; } .classic_font blockquote{font-family:helvetica, tahoma; font-size:18px;} .classic_font h1{font-family:helvetica, tahoma; font-size:4.5em;line-height:1.0;letter-spacing:-1.5px;}.classic_font .pullquote{font-family:helvetica, tahoma; font-size: 45px; line-height: 1.1;}'

				   var color_whiteStyle = '.color_white {background: white;} .color_white div, .color_white p, .color_white h1{ color: #383838; } .color_white blockquote{color: #484848; border-top: 8px solid #bdc3c7;border-bottom: 8px solid #bdc3c7;} .color_white .pullquote{border: 0px;} .color_white .text_link{text-decoration:none; border-bottom:1px solid #2980b9;color:#202020;} .color_white .text_link:link {color:#202020;border-bottom: 1px solid #202020;} .color_white .text_link:visited {color:#202020;border-bottom: 1px solid #202020;} .color_white .text_link:active {color:red;}'

				   var color_lightgreyStyle = '.color_lightgrey {background: #f1f1f1; color: black} .color_lightgrey div, .color_lightgrey p, .color_lightgrey h1 { color: black; } .color_lightgrey blockquote {color:#7f8c8d; border-top: 8px solid #7f8c8d;border-bottom: 8px solid #7f8c8d;} .color_lightgrey .text_link{text-decoration:none; border-bottom:1px solid #2980b9;color:#202020;} .color_lightgrey .text_link:link {color:#202020;border-bottom: 1px solid #202020;} .color_lightgrey .text_link:visited {color:#202020;border-bottom: 1px solid #202020;} .color_lightgrey .text_link:active {color:red;}' 

				   var color_lightblueStyle = '.color_lightblue {background: #ecf0f1; color: black} .color_lightblue div, .color_lightblue p, .color_lightblue h1 { color: black; } .color_lightblue blockquote {color:#7f8c8d; border-top: 8px solid #7f8c8d;border-bottom: 8px solid #7f8c8d;} .color_lightblue .text_link{text-decoration:none; border-bottom:1px solid #2980b9;color:#202020;} .color_lightblue .text_link:link {color:#202020;border-bottom: 1px solid #202020;} .color_lightblue .text_link:visited {color:#202020;border-bottom: 1px solid #202020;} .color_lightblue .text_link:active {color:red;}'

				   var color_slategreyStyle = '.color_slategrey {background: #2c3e50;} .color_slategrey div, .color_slategrey p {color: white} .color_slategrey h1 { color: white; } .color_slategrey blockquote {color:#bdc3c7; border-top: 8px solid #A0A0A0;border-bottom: 8px solid #A0A0A0;} .color_slategrey .text_link{text-decoration:none; border-bottom:1px solid white;color:white;} .color_slategrey .text_link:link {color:white;border-bottom: 1px solid white;} .color_slategrey .text_link:visited {color:white;border-bottom: 1px solid white;} .color_slategrey .text_link:active {color:red;}'

				   var color_blackStyle = '.color_black {background: #181818;} .color_black div, .color_black p {color: white} .color_black h1 { color: white; } .color_black blockquote {color:#909090; border-top: 8px solid #A0A0A0;border-bottom: 8px solid #A0A0A0;} .color_black .text_link{text-decoration:none; border-bottom:1px solid white;color:white;} .color_black .text_link:link {color:white;border-bottom: 1px solid white;} .color_black .text_link:visited {color:white;border-bottom: 1px solid white;} .color_black .text_link:active {color:red;}'

				   var color_darkblueStyle = '.color_darkblue {background: #2980b9;} .color_darkblue div, .color_darkblue p {color: white} .color_darkblue h1 { color: white; } .color_darkblue blockquote {color:#ADD8E6; border-top: 8px solid #87CEFA;border-bottom: 8px solid #87CEFA;} .color_darkblue .text_link{text-decoration:none; border-bottom:1px solid white;color:white;} .color_darkblue .text_link:link {color:white;border-bottom: 1px solid white;} .color_darkblue .text_link:visited {opacity: .5;} .color_darkblue .text_link:active {color:red;}'

				   var color_darkredStyle = '.color_darkred {background: #c0392b;} .color_darkred div, .color_darkred p {color: white} .color_darkred h1 { color: white; } .color_darkred blockquote {color:#FFA07A; border-top: 8px solid #E9967A;border-bottom: 8px solid #E9967A;} .color_darkred .text_link{text-decoration:none; border-bottom:1px solid white;color:white;} .color_darkred .text_link:link {color:white;border-bottom: 1px solid white;} .color_darkred .text_link:visited {opacity: .5;} .color_darkred .text_link:active {color:red;}'

				   var color_darkpurpleStyle = '.color_darkpurple {background: #8e44ad;} .color_darkpurple div, .color_darkpurple p {color: white} .color_darkpurple h1 { color: white; } .color_darkpurple blockquote {color:#D8BFD8; border-top: 8px solid #DDA0DD;border-bottom: 8px solid #DDA0DD;} .color_darkpurple .text_link{text-decoration:none; border-bottom:1px solid white;color:white;} .color_darkpurple .text_link:link {color:white;border-bottom: 1px solid white;} .color_darkpurple .text_link:visited {opacity: .5;} .color_darkpurple .text_link:active {color:red;}'

				   var color_darktealStyle = '.color_darkteal {background: #003333;} .color_darkteal div, .color_darkteal p {color: white} .color_darkteal h1 { color: white; } .color_darkteal blockquote {color:#B0E0E6; border-top: 8px solid #87CEEB;border-bottom: 8px solid #87CEEB;} .color_darkteal .text_link{text-decoration:none; border-bottom:1px solid white;color:white;} .color_darkteal .text_link:link {color:white;border-bottom: 1px solid white;} .color_darkteal .text_link:visited {opacity: .5;} .color_darkteal .text_link:active {color:red;}'

				   var color_imageStyle = '.color_image {background: white; background-repeat:no-repeat; background-size: cover;} .color_image div, .color_image p {color: inherit} .color_image h1 { color: inherit; } .color_image blockquote {color:grey; border-top: 8px solid grey;border-bottom: 8px solid grey;} .color_image .text_link{text-decoration:none; border-bottom:1px solid inherit;color:inherit;} .color_image .text_link:link {color:inherit;border-bottom: 1px solid inherit;} .color_image .text_link:visited {opacity: .5;} .color_image .text_link:active {color:red;}'


				   $('iframe').contents().find('body').attr('spellcheck','false')
					 $('iframe').contents().find('head').append($('<style>').html(bodyStyle+sectionTransition+editingNote+maxWidth+pStyle+textLinkStyle+selectionStyle+sectionStyle+classic_fontStyle+graceful_fontStyle+text_center_panelStyle+text_left_panelStyle+text_right_panelStyle+color_whiteStyle+color_lightgreyStyle+color_lightblueStyle+color_blackStyle+color_slategreyStyle+color_darkblueStyle+color_darkredStyle+color_darkpurpleStyle+color_darktealStyle+color_imageStyle+moverStyle+stretcherStyle+confirmDeleteSection+undoOnStyle))
					var buttonPane = $("<div/>",{
					    "class" : "editor-btns"
					}).prependTo($('body'));

					var btnBold = $("<a/>",{
							"class": "bold-btn",
					    href : "javascript:void(0)",
					    text : "B",
					    data : {
					        commandName : "bold"
					    },
					    click : execCommand 
					}).appendTo(buttonPane);

					var btnItalics = $("<a/>",{
						"class": "italic-btn",
					    href : "#",
					    text : "I",
					    data : {
					        commandName : "italic"
					    },
					    click : execCommand 
					}).appendTo(buttonPane);

					var btnImage = $("<a/>",{
						"class": "image-btn",
					    href : "#",
					    text : "",
					    data : {
					        commandName : "insertImage",
					        argument : ""
					    },
					    title : 'add image',
					    click : getImageLink 
					}).appendTo($('body'));

					var btnLink = $("<a/>",{
						"class": "link-btn",
					    href : "#",
					    text : "link",
					    data : {
					        commandName : "createLink",
					        argument: ""
					    },
					    click : getLink 
					}).appendTo(buttonPane);

					var btnH1 = $("<a/>",{
						"class": "h1-btn",
					    href : "#",
					    text : "h1",
					    data : {
					        commandName : "formatBlock",
					        argument: "<H1>"
					    },
					    click : execCommand
					}).appendTo(buttonPane);

					var btnQuote = $("<a/>",{
						"class": "quote-btn",
					    href : "#",
					    text : "\'\'",
					    data : {
					        commandName : "formatBlock",
					        argument: "<BLOCKQUOTE>",
					        type: ""
					    },
					    click : execCommand
					}).appendTo(buttonPane);

					var btnQuote = $("<a/>",{
						"class": "quote-btn",
					    href : "#",
					    text : "!",
					    data : {
					        commandName : "formatBlock",
					        argument: "<BLOCKQUOTE>",
					        type: "pullquote"
					    },
					    click : execCommand
					}).appendTo(buttonPane);


					// $('iframe').contents().find('body').css(css($('.post_text')))
					$('iframe').contents().find('body').css({'border':'0px', 'padding':'0px', 'margin':'0px', 'width':'100%', 'font-size': '21px','line-height': '1.5','word-wrap':'break-word'})
					$('.editor-btns').css({left: $('iframe').offset().left - 30})

					editor.contentWindow.document.execCommand("insertBrOnReturn", false, false)
					editor.contentWindow.document.execCommand('defaultParagraphSeparator', false, 'p')


					function execCommand (e) {
						if (e){
							e.preventDefault()
						}

						var beforeFormat;
						var beforeTop;
						var changed = false;

					  var contentWindow = editor.contentWindow;
						$('iframe').contents().find('.mover').remove();
						$('iframe').contents().find('.stretcher').remove();

						if ($(this).data("commandName") == "formatBlock"){
				    	beforeFormat = $($('iframe').contents()[0].getSelection().anchorNode.parentNode)
				    	if ($(beforeFormat).is('section')){
				    		beforeFormat = $($('iframe').contents()[0].getSelection().anchorNode)
				    	}
				    	beforeClass = $(beforeFormat).attr('class')
				    	beforeTop =  $($('iframe').contents()[0].getSelection().anchorNode.parentNode).offset().top - $(getSectionParent($('iframe').contents()[0].getSelection())).offset().top
				    }

				    if ($(this).data("commandName") == "insertImage"){
				    	createImage(this);
				    } else {
				    	if ($(this).data("commandName") == "formatBlock"){

				    		if ($(this).data("argument") == "<BLOCKQUOTE>"){

					    		if ($(beforeFormat)[0].nodeName == 'BLOCKQUOTE' || $(beforeFormat)[0].nodeName == 'H1'){

					    			if ($(beforeFormat).attr('class') == undefined){
					    				$(beforeFormat).attr('class','');
					    			}

					    			if ($(beforeFormat).attr('class') == $(this).data("type") && !($(beforeFormat)[0].nodeName == 'H1')){
						    			$(beforeFormat).attr('style','');
						    			var newP = $('<p>').html($(beforeFormat).html())
							    		$(beforeFormat).replaceWith(newP)
							    		beforeFormat = newP
					    			} else {
						    			var newBlock = $('<blockquote>').html($(beforeFormat).html())
						    			$(newBlock).attr('class', $(this).data("type"))
					    				$(beforeFormat).replaceWith(newBlock)
					    				beforeFormat = newBlock
					    			}
					    		} else {
								    contentWindow.focus();
								    contentWindow.document.execCommand($(this).data("commandName"), false, $(this).data("argument") || "");
								    contentWindow.focus();
								    beforeFormat = getElementFromSelection('BLOCKQUOTE')
						    		$(beforeFormat).attr('class', $(this).data("type"))
						    		// console.log(beforeFormat)
					    			changed = true;
						    	}
				    		
				    		} else {
				    			if ($(beforeFormat)[0].nodeName == "H1"){
								    contentWindow.focus();
				    				contentWindow.document.execCommand('formatBlock', false, 'p')
								    contentWindow.focus();
								    beforeFormat = getElementFromSelection('P')
				    			} else {
				    				if ($(beforeFormat)[0].nodeName == "BLOCKQUOTE"){
				    					var newH1 = $('<h1>').html($(beforeFormat).html())
					    				$(beforeFormat).replaceWith(newH1)
					    				beforeFormat = newH1
				    				} else {
									    contentWindow.focus();
									    contentWindow.document.execCommand($(this).data("commandName"), false, $(this).data("argument") || "");
									    contentWindow.focus();
									    beforeFormat = getElementFromSelection('H1')
				    				}
				    			}
				    		}
				    	} else {
						    contentWindow.focus();
						    contentWindow.document.execCommand($(this).data("commandName"), false, $(this).data("argument") || "");
						    contentWindow.focus();
				    	}

				    }

				    if ($(this).data("commandName") == "insertImage"){
				    	setTimeout(function(){
				    		$('iframe').contents().find('img').load(function(){
				    			autoSetEditorHeight();
				    		})
				    	} , 0)
				    }

				    if ($(this).data("commandName") == "formatBlock"){
				    	var ele = $('iframe').contents()[0].getSelection().anchorNode.parentNode
				    	if ($(ele).is('section') || $(ele).is('body')){
				    		ele = $('iframe').contents()[0].getSelection().anchorNode
				    	}


				    	if ($(this).data("argument") == "<BLOCKQUOTE>" && changed && document.queryCommandSupported('insertBrOnReturn')){
				    		console.log(beforeFormat.parentNode)
				    		var newFormat = beforeFormat.parentNode
				    		console.log(newFormat)
				    		// console.log(newFormat)
				    		if (!($(newFormat).is('section'))){
					    		$(newFormat).html($(beforeFormat).html())
					    		beforeFormat = newFormat
				    		} else {
				    			$.each($(beforeFormat).find('p'), function(i, childP){
				    				$(childP).replaceWith($(childP).html())
				    			})
				    		}

				    		if ($(this).data("type") == "pullquote"){
				    			$(ele).attr('class','pullquote')
				    		} else {
				    			$(ele).attr('class','')
				    		}
				    	}

				    	// var afterFormat = ele
				    	// var afterClass = $(afterFormat).attr('class')
				    	// if (afterClass == undefined){
				    	// 	afterClass = ''
				    	// }
				    	// if (beforeClass == undefined){
				    	// 	beforeClass = ''
				    	// }
				    	// // console.log(beforeFormat)
				    	// // console.log(afterFormat)

				    	// console.log(beforeFormat);
				    	if (beforeFormat.length == 1){
				    		beforeFormat = beforeFormat[0]
				    	}
			    		var selection = contentWindow.getSelection();        
			        var range = $('iframe').contents()[0].createRange();
			        range.selectNodeContents(beforeFormat);
			        selection.removeAllRanges();
			        selection.addRange(range);
				    	// if ((beforeFormat.nodeName == afterFormat.nodeName) && (beforeClass == afterClass)){

				    	// 	console.log('hi')
				    	// 	$(ele).attr('style','');
				    	// 	var newP = $('<p>').html($(afterFormat).html())
				    	// 	$(afterFormat).replaceWith(newP)
				    	// 	// contentWindow.document.execCommand('formatBlock', false, 'p')
				    	// }

				    	if ($(ele).css('position') == 'absolute'){
				    		setBlockquoteTop(ele, beforeTop);
				    	}
				    }
				    autoSetEditorHeight();
				    return false;
					}

					function getImageLink(){
						var that = this;
						$('.image_getter').fadeIn(200);
						$('.post_image_getter').keyup(function(){
							var input = $(this).val()
							if (input.length > 6){
								$(that).data("argument", input)
								var boundExec = execCommand.bind(that)
								boundExec();
								$('.post_image_getter').remove();
							}
						})
						$('iframe').contents().find('body').on('click',function(){
							$('.image_getter').fadeOut(200);
						})
						return false;
					}

					function getLink(){
						var that = this;
						$('.editor-btns').append('<input class="text_link_getter" placeholder="link here. press enter when done"></input>');
						$('.text_link_getter').focus()
						$('.text_link_getter').keydown(function(ev){
							if (ev.keyCode == 13){
								ev.preventDefault();
								var link = $('.text_link_getter').val()
								if ((link.indexOf('http://')) > -1 || (link.indexOf('https://') > -1)) {
									link = link
								} else {
									link = 'http://' + link
								}
								$(that).data('argument', link)
								execCommand.bind(that)();
								$('.text_link_getter').remove();
								$('iframe').contents().find('a').attr('class','text_link')
							}
						})
						return false;
					}

					$('.cloudinary-fileupload').bind('cloudinarydone', function(e, data) {
				  	$('.hidden_image_holder').html(
				    	$.cloudinary.image(data.result.public_id, 
				      { format: data.result.format, version: data.result.version})
				    );
				    var link = $('.hidden_image_holder img').attr('src');
				    if ($('.image_getter').attr('data-color-background') == '1'){
				    	var dummy = $('iframe').contents().find('#dummy')
							if ($(dummy).length == 0){
								dummy = $('iframe').contents().find('#being_edited')
							}
				    	$(dummy).css({'background-image':'url('+link+')'})
				    	$('.font-color-chooser').fadeIn(100);
							$('.image_getter').fadeOut(100);
				    } else {
					    $('.image-btn').data('argument',link);
					    var boundExec = execCommand.bind($('.image-btn')[0])
							boundExec();
				    }
					  // return true;
					});




		    });
		}




		$('.edit-box').myTextEditor();
		var textBody = $('iframe').contents().find('body')
		textBody.html($('.edit-box').val())
		textBody.find('img').attr('onload', function(){ this.setAttribute('loaded','1') })
		textBody.find('a').attr('class','text_link')
		// textBody.height($('iframe').contents().height())
		autoSetEditorHeight();
		textBody.on('mouseup', function(ev){
			setTimeout(function(){
				if ($('iframe').contents()[0].getSelection().toString().length > 0){
					$('.editor-btns').show();
					$('.editor-btns').css({top: $(document).scrollTop() +ev.screenY - 170})
					$('.editor-btns').css({left: ev.screenX - $('.editor-btns').width()/2})
					if ($('.editor-btns').offset().left < 0){
						$('.editor-btns').css({'left':'0px'})
					}
					$('.editor-btns').hide().fadeIn(100);
				} else {
					$('.editor-btns').fadeOut(100);
					$('.text_link_getter').remove();
				}
			}, 0)
		})
		var isCtrl = false;
		setTimeout(function(){
			autoSetEditorHeight();
		},500);
		textBody.find('img').load(function(){
			autoSetEditorHeight();
		})

		textBody.on('keydown',function(ev){
			$('.editor-btns').hide();
			if(ev.keyCode == 17) isCtrl=true;
	    if(ev.keyCode == 83 && isCtrl == true) {
	      $('.edit-submit').trigger('click')
	      ev.preventDefault();
	    }
	    if(ev.keyCode == 8){
    		var parent = getSectionParent($('iframe').contents()[0].getSelection())
    		var empty_child;
    		if (parent.children.length == 1){
    			if ($(parent.children[0]).html() == '<br>'){
    				empty_child = true;
    			}
    		}
    		if ($(parent).html() == '' || (empty_child) || ($(parent).html() == '<br>')){
    			ev.preventDefault();
    			var newP = $('<p>').html('<br>')[0]
    			$(parent).html(newP)
    			$(parent).append('<p><br></p>');
	    			var s = $('iframe')[0].contentWindow.getSelection(),
					    	r = $('iframe')[0].contentWindow.document.createRange();
					r.setStart(newP, 0);
					r.setEnd(newP, 0);
					s.removeAllRanges();
					s.addRange(r);
    		}
    		setTimeout(function(){
    			var parent = getSectionParent($('iframe').contents()[0].getSelection())
	    		if (parent.children.length == 1){
	    			$(parent).append('<p><br></p>');
	    		}
    		},10)
	    }

	    if(ev.keyCode == 13){
	    	var beforeBlock = $('iframe').contents()[0].getSelection().anchorNode.parentNode
	    	if (document.queryCommandSupported('insertBrOnReturn')){
	    		ev.preventDefault()
			    var newP = $('<p>').html('<br>');
			    $(getTopElement()).after(newP);
			    var s = $('iframe')[0].contentWindow.getSelection(),
					    r = $('iframe')[0].contentWindow.document.createRange();
					r.setStart(newP[0], 0);
					r.setEnd(newP[0], 0);
					s.removeAllRanges();
					s.addRange(r);
	    	}
	    	setTimeout(function(){
		  		// random spans showing up. replacing them with text.
	  			$.each($('iframe').contents().find('span'), function(i, span){
	  				if ($(span).attr('style') != 'font-weight: normal;' && !($(span).hasClass('confirm_delete_section'))) {
		  				var span_html = $(span).html()
		  				$(span).replaceWith(span_html)
	  				}
	  			})
	  			if ($('iframe').contents().find('.editing-note').length == 0){
	  				verticalAlignSections();
	  			}

    			if (!document.queryCommandSupported('insertBrOnReturn')){
		    		//won't duplicate blockquote if pressing enter
		    		$('iframe').contents().find('.mover').remove()
			    	var block = $('iframe').contents()[0].getSelection().anchorNode
			    	console.log(block)
		  			var newP = $('<p>').html('<br>')[0];
		  			if ($(block).html() == "<br>"){
				    	block.parentNode.replaceChild(newP, block)
		    			var s = window.getSelection(),
							    r = document.createRange();
							r.setStart(newP, 0);
							r.setEnd(newP, 0);
							s.removeAllRanges();
							s.addRange(r);
		  			}
		  		}
	    	}, 0)
		  }

		  var section = getSectionParent($('iframe').contents()[0].getSelection());

		  setTimeout(function(){
		  	showSlideIdentifier(section);
		  },0)
		  enforceTextLimit(section, ev);
		  checkLastSectionForEmpty();
		})

		textBody.on('paste', function(e){
			setTimeout(function(){
				autoSetEditorHeight();
				// flattenChildNodes();
				resetStyles($('iframe').contents().find('body'), 'editing');
			},0)
			e.preventDefault();
			var text = (e.originalEvent || e).clipboardData.getData('text/plain') || prompt('Paste something..');
			if (text.length + $(getSectionParent($('iframe').contents()[0].getSelection())).text().length < 401 ){
  			$('iframe')[0].contentWindow.document.execCommand('insertText', false, text);
			} else {
				flashRed($('.slide_identifier'))
			}
		})

		textBody.on('keyup',function(e){
		  if(e.keyCode == 17) isCtrl=false;
		  setTimeout(function(){
		    autoSetEditorHeight();
		  },0)
		})

		$('.edit_section_btn').hover(function(){
			if (!($('.details_panel').attr('opened') =='1')){
				var section = getHoveringSection($(this).attr('data-section-index'))
				$(section).css({'box-shadow': '0px 0px 50px 10px black'})
				$(this).attr('hovered','1');
			}
		}, function(){
			if (!($('.details_panel').attr('opened') =='1')){
				var section = getHoveringSection($(this).attr('data-section-index'))
				// console.log(section);
				$(section).css({'box-shadow':''})
				$(this).attr('hovered','0');
			}
		})
		

		textBody.on('mouseenter','blockquote, figure', function(e){
			if ($(this).css('position') == 'absolute'){
				if ($(textBody).find('.mover').length == 0){
					$(this).append('<div class="mover" contenteditable="false" moving="0"></div>')
				}
				if ($(this).is('figure')){
					if ($(textBody).find('.stretcher').length == 0){
						$(this).append('<div class="stretcher" contenteditable="false" stretching="0"></div>')
					}
				}
			}
		}).on('mouseleave', 'blockquote, figure', function(e){
				if ($(textBody).find('.mover').attr('moving') == '0'){
					$(textBody).find('.mover').remove()
				}
				if ($(textBody).find('.stretcher').attr('stretching') == '0'){
					$(textBody).find('.stretcher').remove()
				}
		})

		textBody.on('click','.mover', function(e){
			var that = this;
			if ($(this).attr('moving') == '1'){
				$(this).attr('moving','0');
				$(this).css({'background':'blue', 'cursor':'pointer'})
			} else {
				$(this).css({'background':'green', 'cursor':'n-resize'})
				$(this).attr('moving','1');

				var mouseHandler = function(ev){
					if ($(that).attr('moving') == '1'){
						var parent = $($(that)[0].parentNode)
						var sectionTop = $(getSectionParent(that)).offset().top;
						if ((parent.attr('class') == 'pullquote') || (parent.is('figure'))){
							var newTop = (ev.clientY - 10) - sectionTop
						} else {
							var newTop = (ev.clientY - 20) - sectionTop
						}
						if (parent.is('figure')){
							var newRight = (($(document).width() - ev.clientX - 10) / $(document).width())*100
							parent.css({'right': newRight+'%'})
						}
						parent.css({'top':newTop})
					} else {
						textBody[0].removeEventListener('mousemove', mouseHandler);
					}
				}
				textBody.on('mousemove', mouseHandler);
			}
		})

		textBody.on('click','.stretcher', function(e){
			var that = this;
			if ($(this).attr('stretching') == '1'){
				$(this).attr('stretching','0');
				$(this).css({'background':'red', 'cursor':'pointer'})
			} else {
				$(this).css({'background':'green', 'cursor':'n-resize'})
				$(this).attr('stretching','1');


				var mouseHandler = function(ev){
					var parent = that.parentNode
					if ($(that).attr('stretching') == '1'){
						var right = $(parent)[0].getBoundingClientRect().right
						var newWidth = (right - ev.clientX + 10)/$(document).width()
						$(parent).width(newWidth*100 + '%')
					} else {
						textBody[0].removeEventListener('mousemove',mouseHandler)
					}
				}
				textBody.on('mousemove', mouseHandler)
			}
		})

		setTimeout(function(){
			textBody.on('mouseenter','section',function(){
				$('.edit_section_btn').css({'opacity':'1'})
				$(this).css({'box-shadow':''})
				if (!($(this).attr('id') == 'dummy') && !($(this).hasClass('undo-on'))){
					showSlideIdentifier(this);
				}
			}).on('mouseleave','section', function(){
				var that = this;
				setTimeout(function(){
					if (!($('.edit_section_btn').attr('hovered') == '1')){
						$(that).css('box-shadow','');
						if (getSectionIndex(that) == $('iframe').contents().find('section').length - 1){
							$('.blank_note').fadeOut(50);
						}
					}
					// $('.edit_section_btn').css({'opacity':'0'})
				},20)
			})	
		}, 600)

		$('body').on('click', '.edit_section_btn', function(){
			if (!($('.details_panel').attr('opened') =='1')) {
				var section = getHoveringSection($(this).attr('data-section-index'));
				boldChoiceButtons(section);
				$(section).css('box-shadow','none');
				$('.details_title').html('editing section');

				$('.details_panel').attr('opened','1');
				$(section).attr('data-beforeclass', $(section).attr('class'))
				$(section).attr('id','being_edited');
				$('.details_panel').append('<div class="cancel_edit_section">cancel</div>');
				$('.details_panel').append('<div class="confirm_edit_section">save</div>');
				$('.details_panel').height(200);
				$('iframe').css({'border-bottom':'200px solid white'})

				// $(this).css({'width':'100%', 'height':'200px', 'background':'#7f8c8d','color':'white','bottom':'0px','top':'auto','border':'5px','padding-left':'15px','cursor':'default'})
				// $('#edit_section_text').html('editing section');
			} else {
				$('.cancel_edit_section').trigger('click');
			}
		})

		$('body').on('click','.add_section', function(){
			if (!($('.details_panel').attr('opened') == '1' )) {
				$('iframe').css({'border-bottom':'200px solid white'})
				$('.details_title').html('creating new section');
				$('.details_panel').append('<div class="cancel_add_section">cancel</div>');
				$('.details_panel').append('<div class="confirm_add_section">add</div>');
				$('.details_panel').height(200);
		
				var dummySection = $('<section>').html('<h1>This is an Example Header</h1><p>This is example body text</p>')[0]
				$(dummySection).attr('id','dummy');
				$(dummySection).attr('style','height:'+$(window).height()+'px');
				$(dummySection).attr('class','text_center_panel classic_font color_white');
				boldChoiceButtons(dummySection);
				$('iframe').contents().find('body').append(dummySection)
				var s = $('iframe')[0].contentWindow.getSelection(),
				    r = $('iframe').contents()[0].createRange();
				r.setStart(dummySection, 0);
				r.setEnd(dummySection, 0);
				s.removeAllRanges();
				s.addRange(r);
				autoSetEditorHeight();

				setTimeout(function(){
					$('html,body').animate({ scrollTop: $(document).height() }, 500)
				},300)
			}

		})
		$('body').on('click','.cancel_add_section',function(){
			// resetSectionHovering();
			setTimeout(function(){
				$('.cancel_add_section').remove();
				$('.confirm_add_section').remove();
				$('iframe').contents().find('#dummy').remove();
				$('.image_getter').fadeOut(100);
				$('.font-color-chooser').fadeOut(100);
				$('.details_panel').attr('opened','0');
				$('.details_panel').height(0);
				autoSetEditorHeight();
				$('iframe').css({'border-bottom':'0px solid white'})
			},0)
		})
		$('body').on('click','.confirm_add_section', function(){
			// resetSectionHovering();
			var classes = $('iframe').contents().find('#dummy').attr('class')
			var style = $('iframe').contents().find('#dummy').attr('style')
			$('.cancel_add_section').trigger('click');
			var newSection = $('<section>').html('<p><br></p><p><br></p>')[0];
			$(newSection).attr('class', classes);
			$(newSection).attr('style', style);
			$('iframe').contents().find('body').append(newSection);
			$('.image_getter').fadeOut(100);
			$('.font-color-chooser').fadeOut(100);
			$('.cancel_add_section').remove();
			$('.confirm_add_section').remove();
			$('.details_panel').attr('opened','0');
			$('.details_panel').height(0);
			$('iframe').css({'border-bottom':'0px solid white'})
			autoSetEditorHeight();
		})
		$('body').on('click','.cancel_edit_section',function(){
			var beingEdited = $('iframe').contents().find('#being_edited')
			// resetSectionHovering();
			setTimeout(function(){
				$('.cancel_edit_section').remove();
				$('.confirm_edit_section').remove();
				var beforeClass = beingEdited.attr('data-beforeclass');
				beingEdited.attr('data-beforeclass','');
				beingEdited.attr('class', beforeClass);
				beingEdited.attr('id','');
				$('.image_getter').fadeOut(100);
				$('.font-color-chooser').fadeOut(100);
				$('.details_panel').height(0);
				$('.details_panel').attr('opened','0');
				$('iframe').css({'border-bottom':'0px solid white'})
				autoSetEditorHeight();
			},100)
		})
		$('body').on('click','.confirm_edit_section', function(){
			// resetSectionHovering();
			$('#edit_section_text').html('edit section');
			var beingEdited = $('iframe').contents().find('#being_edited')
			beingEdited.attr('id','');
			beingEdited.attr('data-beforeclass','');
			$('.confirm_edit_section').remove();
			$('.cancel_edit_section').remove();
			$('.cancel_delete_section').remove();
			$('.image_getter').fadeOut(100);
			$('.font-color-chooser').fadeOut(100);
			$('.details_panel').height(0);
			$('.details_panel').attr('opened','0');
			$('iframe').css({'border-bottom':'0px solid white'})
			autoSetEditorHeight();
		})
		textBody.on('click','.confirm_delete_section', function(){
			var that = this;
			var clone = $(this).clone();
			var beingDeleted = $(this).parent();
			var index = getSectionIndex($(this).parent()[0])

			if ($(beingDeleted).hasClass('undo-on')){
				$(beingDeleted).removeClass('undo-on');
				$(beingDeleted).children().fadeIn(160);
				$(beingDeleted).animate({'height':'auto', 'min-height':'90px', 'padding':'inherit'}, 300);
				$(that).remove();
				setTimeout(function(){
					$(beingDeleted).prepend(clone.html('x').attr('title','delete'));
				},300);
				autoSetEditorHeight();
				index -= 1;
			} else {
				invisibleChildren(beingDeleted);
				$(beingDeleted).animate({ height: 10, 'min-height':10, padding:0}, 300)
				$(that).remove();
				setTimeout(function(){
					$(beingDeleted).addClass('undo-on');
					$(beingDeleted).prepend(clone.html('u').attr('title','undo'));
					autoSetEditorHeight();
				},300);
			}
			var nextSection = $('iframe').contents().find('section')[index+1]
			var s = $('iframe')[0].contentWindow.getSelection(),
			    r = $('iframe').contents()[0].createRange();
			r.setStart(nextSection, 0);
			r.setEnd(nextSection, 0);
			r.collapse();
			s.removeAllRanges();
			s.addRange(r);
		})

		textBody.on('click','section', function(){
			setTimeout(function(){
				if ($('.edit_section_btn').height() == 200){

					var section = getSectionParent($('iframe').contents()[0].getSelection())
					if (section == null){
						section = $('iframe').contents().find('section')[0]
					}

					if (!($(section).attr('id') == 'being_edited')){
						$('.cancel_edit_section').trigger('click')
						setTimeout(function(){
							$('.edit_section_btn').trigger('click')
						},200)
					}
				}
			},0)
		})

		$('body').on('click','.chooser_choice',function(){
			var choice;
			var anti_choice;
			var dummy = $('iframe').contents().find('#dummy')
			if ($(dummy).length == 0){
				dummy = $('iframe').contents().find('#being_edited')
			}
			dummy.fadeOut(100);
			var that = this;

			setTimeout(function(){
				//if they chose font
				if ($(that).attr('data-choice') == 'font'){
					choice = $(that).attr('data-font')+'_font'
					dummy.removeClass('classic_font')
					dummy.removeClass('graceful_font')
					dummy.addClass(choice);
				}

				//if they chose a panel
				if ($(that).attr('data-choice') == 'panel'){
					choice = 'text_'+$(that).attr('data-panel')+'_panel'
					dummy.removeClass('text_left_panel')
					dummy.removeClass('text_center_panel')
					dummy.removeClass('text_right_panel')
					dummy.addClass(choice);
				}

				//if they chose a color
				if ($(that).attr('data-choice') == 'color'){
					choice = 'color_'+$(that).attr('data-color');
					$.each(dummy.attr('class').split(' '), function(i, checkClass){
						if (checkClass.indexOf('color_') > -1){
							anti_choice = checkClass
						}
					})
					dummy.attr('class', dummy.attr('class').replace(anti_choice, choice))

					if (choice == 'color_image'){
						$('.image_getter').attr('data-color-background','1');
						$('.image_getter').fadeIn(200);
						$('.image_getter').css({'bottom':'30px','left':'46%','top':'auto','z-index':'599'})
						$('.post_image_getter').keyup(function(){
							var input = $(this).val()
							if (input.length > 6){
								$(dummy).css({'background-image':'url('+input+')'})
								$('font-color-chooser').fadeIn(200);
								$('.post_image_getter').remove();
							}
						})
					} else {
						$(dummy).css({'background-image':'', 'color':'', 'background-size':''})
					}
				}
				dummy.fadeIn(100);
				boldChoiceButtons(dummy);
			},101)
		})
		$('iframe').contents().find('body').focus(function(){
			$('.image_getter').fadeOut(200);
		})

		$('body').on('click','.font-color-choice', function(){
    	var dummy = $('iframe').contents().find('#dummy')
			if ($(dummy).length == 0){
				dummy = $('iframe').contents().find('#being_edited')
			}
			var color = $(this).attr('data-color')
			$(dummy).css({'color':color})
		})

		$('body').on('click','.view_mode_button',function(){
			turnOnPreview();

			setTimeout(function(){
				$('.save_success').attr('style','display:none')
			}, 2000)
		})

		$('body').on('click','.edit_mode_button',function(){
			$('iframe').contents()[0].designMode = 'on';
			$('.batman_toolbelt').attr('class','batman_toolbelt')
			$(this).attr('class','view_mode_button control_button');
			$(this).html('preview post')
			$('.save_success').attr('style','display:block;background:#34495e;')
			$('.save_success').html('now editing')

			turnOnEditing();
			setTimeout(function(){
				$('.save_success').attr('style','display:none')
			}, 2000)
		})

		$('body').on('click','.move_section_up', function(){
			var index = parseInt($(this).attr('data-section-index'));
			var sections = $('iframe').contents().find('section')
			var movingSection = sections[index]
			var sectionSwitching = sections[index - 1]
			$(sectionSwitching).before(movingSection);
			var sectionTop = $(movingSection).offset().top + $('iframe').offset().top - 40
			$('html,body').animate({ scrollTop: sectionTop}, {duration: 250, easing: 'easeInOutCubic'})
			showSlideIdentifier(movingSection);
		})

		$('body').on('click','.move_section_down', function(){
			var index = parseInt($(this).attr('data-section-index'));
			var sections = $('iframe').contents().find('section')
			var movingSection = sections[index]
			var sectionSwitching = sections[index + 1]
			$(sectionSwitching).after(movingSection);
			var sectionTop = $(movingSection).offset().top + $('iframe').offset().top - 40
			$('html,body').animate({ scrollTop: sectionTop}, {duration: 250, easing: 'easeInOutCubic'})
			showSlideIdentifier(movingSection);
		})

		$('.edit-title').keypress(function(ev){
	    if (ev.keyCode == 10 || ev.keyCode == 13) 
	        ev.preventDefault();
	  });

	  // $('.batman_toolbelt').hover(function(){
	  // 	$(this).height($('.hidden_toolbelt').height())
	  // }, function(){
	  // 	$(this).height(100)
	  // })

		document.onkeyup=function(e){
		    if(e.keyCode == 17) isCtrl=false;
		}

		document.onkeydown=function(e){
	    if(e.keyCode == 17) isCtrl=true;
	    if(e.keyCode == 83 && isCtrl == true) {
	      $('.edit-submit').trigger('click')
	      e.preventDefault();
	    }
		}

		$.cloudinary.config({"api_key":"579372528537872","cloud_name":"sailnote"});
	  


		// $('.cover-box').css({'width': $(document).width()})
		// $('.cover-box img').css({'width': screen.width})
		if ($('#the_editor').length > 0){
			$('.post_text').hide();
		}


		autoSetEditorHeight();

		//focus on txt_editor
		// setTimeout(function(){
		// 	$('iframe')[0].contentWindow.document.body.focus()
		// }, 200)

		//snapscroll functionality
		// bindScroll($('html,body'))
	 //  bindScroll(textBody)
		// $('iframe').contents().find('section').css({'min-height': $(window).height()})
		$('.edit-title').autosize();
		enlargeForMobile();
		verticalAlignHeader();
		setTimeout(function(){
			turnOnEditing();
			// checkLastSectionForEmpty();
		},100)
		// setTimeout(function(){
	 //  	verticalAlignSections();
		// },300)

		//transition effects
		$('.edit-title').css({'opacity':'1'})
		$('.author_link_clone').css({'opacity':'.6'})
		$('.author_link_wrapper').css({'opacity':'.6'})
		$('.post-date-left').css({'opacity':'.48'})
		$('.post-date-left').html($('.post-date-left').html().split(' ').join('').toLowerCase())
		activateKnob();
		activateDownArrow();

		// resetSectionHovering();
	}
})

//runs if viewing post and not logged in
function centerImage(img_index){
	var img = $('.post_text img')[img_index]
	$(img).css({'margin-left': (550 - $(img).width())/2})
}


function goToSource(img_index){
	var src = $($('.post_text img')[img_index]).attr('src');
	window.location.href = src;
}
$(document).ready(function(){
	if ($('.page_identifier').attr('id') == 'guest_view_post'){
		// $('.twitter_share').attr('href', 'https://twitter.com/intent/tweet?url='+encodeURIComponent(document.URL)+'&text="'+$('.post_title').html()+'"')
		// $('.facebook_share').attr('href','http://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(document.URL))

		setTimeout(function(){
			var user = $('.page_identifier').attr('data-username');
			var title = document.URL.split('/'+user+'/')[1]
			$.post('/'+user+'/'+title+'/increment_viewcount')
		}, 1000)
		// $('.cover-box').css({'width': $(document).width()})
		// $('.cover-box img').css({'width': screen.width})

		// $.each($('.post_text img'), function(i, img){
		// 	$(img).attr('onClick','goToSource('+i+')')
		// 	$(img).css({'max-width': $(document).width()/1.6})
		// 	$(img).attr('onload','centerImage('+i+')');
		// 	$(img).css({'opacity':'1'})
		// 	centerImage(i);
		// })

	  // $(window).bind('scroll', function(){
	  // 	showTopSection();
	  // })

		$('.post_text a').attr('class','text_link')
		// var lastSectionColor = $($('.post_text').find('section').find('p').slice(-1)[0]).css('color')
		// $('.sfooter').css({'background': $($('.post_text').find('section').slice(-1)[0]).css('background')})
		// $('.footer_name').css({'color': lastSectionColor, 'border':'3px solid '+lastSectionColor })
		// $('.call_to_signup').css({'color': lastSectionColor})

		//snapscroll functionality
		bindScroll($('html,body'), 'guest')
		$('section').css({'min-height': $(window).height() + 20})
		verticalAlignHeader('guest');
		// invisibleChildren('guest');
		$('.sfooter').height($(window).height())
		enlargeForMobile();
		setTimeout(function(){
	  	verticalAlignSections('guest');
		},300)

		activateKnob();
		activateDownArrow();

		//transition effects
		$('.post_title').css({'opacity':'1'})
		$('.author_link_clone').css({'opacity':'.6'})
		$('.author_link_wrapper').css({'opacity':'.6'})
		$('.post-date-left').css({'opacity':'.48'})
		$('.post-date-left').html($('.post-date-left').html().split(' ').join('').toLowerCase())
		// $($('section')[0]).css('opacity','1');
	}
})