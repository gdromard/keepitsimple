// ---------------------------- Alerts ---------------------------- 

(function($){
	$.fn.extend({
		alertWarning: function(content) {
			var alert = $('<div class="alert alert-warning" role="alert"><button class="close" data-dismiss="alert">&times;</button></div>');
			alert.appendTo($('body'));
			var div = $('<div/>').appendTo(alert);
			if (content) $(div).html(content);
			alert.delay(3000).fadeOut(1000);
			return div;
		},
		
		alertInfo: function(content) {
			var alert = $('<div class="alert alert-info" role="alert"><button class="close" data-dismiss="alert">&times;</button></div>');
			alert.appendTo($('body'));
			var div = $('<div/>').appendTo(alert);
			if (content) $(div).html(content);
			alert.delay(5000).fadeOut(1000);
			return div;
		},
		
		alertSuccess: function(content) {
			var alert = $('<div class="alert alert-success" role="alert"><button class="close" data-dismiss="alert">&times;</button><div/></div>');
			alert.appendTo($('body'));
			var div = $('<div/>').appendTo(alert);
			if (content) $(div).html(content);
			alert.delay(5000).fadeOut(1000);
			return div;
		},
		
		alertError: function(content) {
			var alert = $('<div class="alert alert-danger" role="alert"><button class="close" data-dismiss="alert">&times;</button><div/></div>');
			alert.appendTo($('body'));
			var div = $('<div/>').appendTo(alert);
			if (content) $(div).html(content);
			alert.delay(5000).fadeOut(1000);
			return div;
		}
	});
})(jQuery);