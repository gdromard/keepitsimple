var STATUS = [
	{ id: 0, classname:'todo', desc: 'ToDo' },
	{ id: 1, classname:'inwork', desc: 'In Work' },
	{ id: 2, classname:'done', desc: 'Done' },
	{ id: 3, classname:'skipped', desc: 'Skipped' },
	{ id: 4, classname:'todiscuss', desc: 'To Discuss' },
	{ id: 0, classname:'todo', desc: 'ToDo' } // loop
];

$(function() {
	if (typeof console == "undefined") console = {
		log: function(message) {
			alert(message);
			$('body').taskCreateDebugAlert(message);
		}
	};
});

(function($){
	$.fn.extend({

		// ---------------------------- Task Events ---------------------------- 
		taskRecoveredEvent: function(taskId) {
			return this.each(function() {
				$(this).taskGenericEvent({serverUrl: 's/recover.php', id: taskId, eventName: 'Recover task Event'});
				return this;
			});
		},
		taskDeletedEvent: function(taskId) {
			return this.each(function() {
				$(this).taskGenericEvent({serverUrl: 's/delete.php', id: taskId, eventName: 'Delete task Event'});
				return this;
			});
		},
		taskStatusChangedEvent: function(taskId, newTaskStatus) {
			return this.each(function() {
				$(this).taskGenericEvent({serverUrl: 's/update.php', id: taskId, status: newTaskStatus, eventName: 'Update status Event'});
				return this;
			});
		},
		taskDescriptionChangedEvent: function(taskId, newDescription) {
			return this.each(function() {
				$(this).taskGenericEvent({serverUrl: 's/update.php', id: taskId, description: escape(newDescription), eventName: 'Update description Event'});
				return this;
			});
		},
		taskInfoChangedEvent: function(taskId, newInfo) {
			return this.each(function() {
				$(this).taskGenericEvent({serverUrl: 's/update.php', id: taskId, info: escape(newInfo), eventName: 'Update info Event'});
				return this;
			});
		},
		taskCreatedEvent: function(taskId, description) {
			return this.each(function() {
				$(this).taskGenericEvent({serverUrl: 's/create.php', id: taskId, description: escape(description), eventName: 'Create Event'});
				return this;
			});
		},

		taskGenericEvent: function(options) {
			var defaults = {serverUrl: 's/index.php', db: null, id: null, eventName: null };
			var options =  $.extend(defaults, options);
			options.db = this.attr('data-db');
			(this).find('li#'+options.id).attr('data-modified', ($.fn.currentTime()+""));
			
			if ($(this).attr('data-mode') == 'demo') {
				if (options.eventName != 'Delete task Event' && $('div.alert:visible').length == 0) {
					$('body').taskCreateInfoAlert('In demo mode the persistence is not available<br/><br/>'+
							'<div class="well"><u>Use keys</u><ul>'+
							'<li><b>INSERT</b> - So as create a task</li>'+
							'<li><b>TAB (while editing)</b> - To edit next task</li>'+
							'<li><b>MAJ+TAB (while editing)</b> - To edit prev task</li>'+
							'<li><b>ESC</b> - To cancel edition</li>'+
					'</ul></div>');
				}
				return this;
			}
			if (!options.db) $('body').taskCreateErrorAlert('['+options.eventName+'] Parameter data-db was not found');
			return this.each(function() {
				$.getJSON(options.serverUrl, options)
				.success(function(jsonData) {
					if (jsonData.task) $('body').taskRefreshed(jsonData.task);
					console.log('['+options.eventName+'] Event succeed');
				})
				.error(function(jqXHR, textStatus, errorThrown) {
					$('body').taskCreateErrorAlert('['+options.eventName+'] Event FAILED ('+options.id+')');
					console.log("textStatus: " + textStatus + ", errorThrown: " + errorThrown);
				});
				return this;
			});
		},

		// ---------------------------- Tasks Loading ---------------------------- 
		
		tasksLoad: function(options) {
			// Errors management
			if (this.nodeName == 'DIV') $('body').taskCreateErrorAlert("Unable to load task plugin on a non DIV element");
			if (!options.url || !options.db) $('body').taskCreateErrorAlert("Unable to load tasks (attributes 'url' and 'db' are mandatory");
			
			// Load tasks
			return this.each(function() {
				var div = $(this);
				if (options.demo) div.attr('data-mode', 'demo');
				div.children('ul').detach();
				div.addClass('tasks');
				div.attr('data-db', options.db);
				var jqxhr = $.getJSON(options.url, {db: options.db})
				.success(function(jsonData) {		
					div.tasksInit({data: jsonData });
				})
				.error(function(jqXHR, textStatus, errorThrown) {
					$('body').taskCreateErrorAlert('Tasks loading FAILED ('+errorThrown+')');
					console.log("textStatus: " + textStatus + ", errorThrown: " + errorThrown);
				});
				return this;
			});
		},

		// ---------------------------- Tasks UI Management ---------------------------- 

		tasksSearch: function(search) {
			// Load tasks
			return this.each(function() {
				var listitems = $(this).children('ul.tasks').first().children('li').get();
				$(listitems).each(function() {
					var li = $(this);
					if (li.text().toUpperCase().indexOf(search.toUpperCase()) > -1) {
						li.show();
					} else {
						li.hide();
					}
				});
				return this;
			})
		},

		tasksSortBy: function(field) {
			// Load tasks
			return this.each(function() {
				var ul = $(this).children('ul.tasks').first();
				var sortBy = ul.attr('data-sortBy');
				var sortType = ul.attr('data-sortType');
				if (field == sortBy) {
					order = (sortType=='asc'?1:-1) * -1;
					ul.attr('data-sortBy', field);
					ul.attr('data-sortType', (order==1?'asc':'desc'));
				} else {
					if (!field) field = sortBy;
					order = 1;
					ul.attr('data-sortBy', field);
					ul.attr('data-sortType', 'asc');
				}
				console.log("sort by: " + field + " " + (order==1?'ASC':'DESC'));
				var listitems = ul.children('li').get();
				listitems.sort(function(liA, liB) {
					if (field == 'description') {
						a = $(liA).text().toUpperCase();
						b = $(liB).text().toUpperCase();
						return (a < b ? -1 : (a > b ? 1 : 0)) * order;
					} else {
						a = $(liA).attr("data-"+field);
						b = $(liB).attr("data-"+field);
						if (!a) a='';
						if (!b) b='';
						if (field == 'info') {
							a = a.toUpperCase();
							b = b.toUpperCase();
						}
						var res = (a < b ? -1 : (a > b ? 1 : 0)) * order;
						if (res == 0) { // Second sort on description ASC
							a = $(liA).text().toUpperCase();
							b = $(liB).text().toUpperCase();
							return (a < b ? -0.5 : (a > b ? 0.5 : 0));
						}
						return res;
					} 
					//return $(a).text().toUpperCase().localeCompare($(b).text().toUpperCase()) * order;
				})
				$.each(listitems, function(idx, itm) { ul.append(itm); });
				return this;
			})
		},

		// ---------------------------- Task UI ---------------------------- 
		
		//pass the options variable to the function
		tasksInit: function(options) {
			if (this.nodeName == 'DIV') $('body').taskCreateErrorAlert("Unable to load task plugin on a non DIV element");

			// Set the default values, use comma to separate the settings, example:
			var defaults = { data: [] }
			var options =  $.extend(defaults, options);
			if (options.demo) $(this).attr('data-mode', 'demo');

			document.onkeydown = function(evt) {
				evt = evt || window.event;
				if (evt.keyCode == 27) {
					$(document.activeElement).escapepress(evt);
				} else if (evt.keyCode == 9) {
					$(document.activeElement).tabpress(evt);
				} else if (evt.keyCode == 45) {
					$('div.tasks:visible').insertpress(evt);
				}
			    
			};
			// Init tasks
			return this.each(function() {
				$(this).children('ul').detach();

				// Sort
				data = $(options.data);
				data = data.sort(function(obj1, obj2) { return (obj1.description < obj2.description ? -1 : (obj1.description > obj2.description ? 1 : 0)); });
				
				// Add task
				var addItems = $('<ul/>', {'class': 'add'});
				addItems.appendTo($(this));
				var addLi = $('<li class="add"/>').appendTo(addItems);
				var addDiv = $('<div class="clickable"/>').appendTo(addLi);
				addDiv.click(function() { $(this).taskShowCreationForm(); });
				$(this).insertpress(function() { addDiv.click(); });
				
				var items = $('<ul/>', {'class': 'tasks', 'data-sortBy': 'description', 'data-sortType': 'asc'});
				items.appendTo($(this));
				
				// Display task
				$.each(data, function(key, task) {
					if (!task.deleted) items.taskInsertTask(task);
				});
				return this;
			});
		},
		
		taskRefreshed: function(task) {
			return $('.tasks li#'+task.id).each(function() {
				var li = $(this);
				li.css('background-color', 'red');
				li.attr('class', STATUS[task.status].classname);
				li.attr('title', STATUS[task.status].desc);
				li.children('span.description').val(unescape(task.description));
				li.attr('data-deleted', task.deleted);
				li.attr('data-status', task.status);
				li.attr('data-modified', task.modified);
				li.attr('data-info', unescape(task.info));
				li.css('background-color', 'transparent');
			});
		},
		
		taskInsertTask: function(task) {
			// Set the default values, use comma to separate the settings, example:
			var defaults = { id: ($.fn.currentTime()+""), modified: ($.fn.currentTime()+""), status: 0, deleted: 0, description: "", info: "" };
			var task =  $.extend(defaults, task);
					
			return this.each(function() {
				if (this.nodeName == 'UL') {
					var ul = $(this);
					var status = (task.status?task.status:0);
					var classname = STATUS[status].classname;
					var title = STATUS[status].desc;
					var div = $('<div/>', {'class': 'clickable status', title: title});
					div.click(function(){ $(this).taskIncrementStatus(); });
					var span = $('<span/>', {'class': 'clickable description', html: unescape(task.description)});
					span.click(function(){ $(this).taskUpdateDescription(); });
					var info = $('<span/>', {'class': 'clickable info', html: unescape(task.info)});
					info.click(function(){ $(this).taskUpdateInfo(); });
					var btn = $('<button/>', {'class': 'btn del', title: 'Delete this task', html: '&times;'});
					btn.click(function(){ $(this).taskDelete(); });
					var li = $('<li/>', {id: task.id, 'class': classname, 'data-id': task.id, 'data-status': status, 'data-info': task.info, 'data-modified': task.modified, 'data-deleted': task.deleted});
					li.appendTo(ul);
					div.appendTo(li);
					span.appendTo(li);
					info.appendTo(li);
					btn.appendTo(li);
				}
			});
		},

		taskShowCreationForm: function() {
			return this.each(function() {
				var div = $(this);
				var ul = div.parents('div.tasks').first().children('ul.tasks');
				var li = div.parent('li');
				li.addClass('editing');
				var input = $('<input/>', {  type: "text", 'class': 'description', name: "description", value: '' });
				input.appendTo(li);
				input.focus();
				input.blur(function() {
					var input = $(this);
					var taskId = ($.fn.currentTime()+"");
					if (input.val() != '') {
						ul.taskInsertTask({id: taskId, description: input.val()});
						$(this).tasksRoot().tasksSortBy();
						$(this).tasksRoot().taskCreatedEvent(taskId, input.val());
					} 
					li.removeClass('editing');
					input.detach();
				});
				input.escapepress(function(event) {
					$(this).hide().detach();
					$(this).parent('li').removeClass('editing');
				});
				input.keypress(function(event) {
					if(event.keyCode==13) {
						this.blur();
					}
				});
				return this;
			});
		},

		taskUndoDelete: function(taskId) {
			return this.each(function() {
				$('li#'+taskId).slideDown('slow');
				$('li#'+taskId).tasksRoot().taskRecoveredEvent(taskId);
				return this;
			});
		},

		taskDelete: function() {
			return this.each(function() {
				$(this).parent().first().slideUp('slow', function() {
					var taskId = this.id;
					$(this).tasksRoot().taskDeletedEvent(taskId);
					var alert = $(this).taskCreateInfoAlert();
					alert.html("La tache '"+taskId+"' a &eacute;t&eacute; supprim&eacute;e. &nbsp; &nbsp; &nbsp;");
					var undo = $("<a/>", {'class':'btn btn-primary', html: 'Restaurer'})
					undo.appendTo(alert);
					undo.click(function() { alert.siblings('.close').click(); $(this).taskUndoDelete(taskId); });
					$('#alert-info').slideDown('slow');
				});
				return this;
			});
		},

		taskUpdateDescription: function() {
			return this.each(function() {
				var span = $(this);
				var li = span.parent('li');
				li.addClass('editing');
				var desc = span.html();
				var input = $('<input/>', {  type: "text", 'class': 'description', name: "description", value: desc });
				$(span.siblings('span.info')[0]).hide();
				span.hide();
				input.appendTo(li);
				input.focus();
				input.blur(function() {
					var input = $(this);
					var li = input.parent('li').removeClass('editing');
					var span = input.siblings('span.description').show();
					input.siblings('span.info').show();
					if (span.html() != input.val()) {
						var id = li.attr('id');
						span.html(input.val());
						input.tasksRoot().taskDescriptionChangedEvent(id, input.val());
					}
					input.hide().detach(); // Keep it at the end because the detach
				});
				input.escapepress(function(event) {
					var input = $(this);
					var li = input.parent('li').removeClass('editing');
					input.siblings('span.description').show();
					input.siblings('span.info').show();
					input.hide().detach();
				});
				input.tabpress(function(event) {
					if (event.shiftKey) {
						$(this).parents('li:visible').prev().children('span.description').click();
						event.preventDefault();
					} else {
						$(this).parents('li:visible').next().children('span.description').click();
						event.preventDefault();
					}
					return true;
				});
				input.keypress(function(event) {
					if (event.keyCode==13) this.blur(); // ENTER
				});
				return this;
			});
		},
		
		taskUpdateInfo: function() {
			return this.each(function() {
				var span = $(this);
				var li = span.parent('li');
				var info = span.html();
				var input = $('<input/>', { type: "text", 'class': 'info', name: "info", value: info});
				li.addClass('editing');
				span.hide();
				input.appendTo(li);
				input.focus();
				input.blur(function() {
					var input = $(this);
					var id = input.parent('li').removeClass('editing').attr('id');
					var span = $(input.siblings('span.info')[0]);
					input.hide();
					span.show();
					span.html(input.val());
					input.tasksRoot().taskInfoChangedEvent(id, input.val());
					input.detach();
				});
				input.keypress(function(event) {
					if(event.keyCode==13) {
						this.blur();
					}
				});
				return this;
			});
		},
		
		taskIncrementStatus: function() {
			return this.each(function() {
				var obj = $(this);
				if (!obj.attr('data-status')) obj = obj.parent('li');
				if (obj.attr('data-status')) {
					var status = parseInt(obj.attr('data-status'));
					obj.removeClass(STATUS[status].classname);
					status = STATUS[status + 1].id;
					obj.attr('data-status', status); 
					obj.addClass(STATUS[status].classname); 
					$(this).tasksRoot().taskStatusChangedEvent(obj.attr('id'), status);
				}
				return this;
			});
		},

		// ---------------------------- Alerts ---------------------------- 
		
		taskCreateDebugAlert: function(content) {
			var alert = $('<div class="alert alert-debug"><button class="close" data-dismiss="alert">&times;</button></div>');
			alert.appendTo($('body'));
			var div = $('<div/>').appendTo(alert);
			if (content) $(div).html(content);
			alert.delay(3000).fadeOut(1000);
			return div;
		},
		
		taskCreateInfoAlert: function(content) {
			var alert = $('<div class="alert alert-info"><button class="close" data-dismiss="alert">&times;</button></div>');
			alert.appendTo($('body'));
			var div = $('<div/>').appendTo(alert);
			if (content) $(div).html(content);
			alert.delay(5000).fadeOut(1000);
			return div;
		},
		
		taskCreateSuccessAlert: function(content) {
			var alert = $('<div class="alert alert-sucess"><button class="close" data-dismiss="alert">&times;</button><div/></div>').appendTo($('body'));
			alert.appendTo($('body'));
			var div = $('<div/>').appendTo(alert);
			if (content) $(div).html(content);
			alert.delay(5000).fadeOut(1000);
			return div;
		},
		
		taskCreateErrorAlert: function(content) {
			var alert = $('<div class="alert alert-error"><button class="close" data-dismiss="alert">&times;</button><div/></div>').appendTo($('body'));
			alert.appendTo($('body'));
			var div = $('<div/>').appendTo(alert);
			if (content) $(div).html(content);
			return div;
		},

		// ---------------------------- Task Tool functions ---------------------------- 

		tasksRoot: function() {
			var root = null;
			this.each(function() {
				root = $(this).parents('div.tasks');
				if (root.length == 0) {
					$('body').taskCreateErrorAlert('Fatal error occured (root node was not found)');
					throw "root not found !";
				}
			});
			return root;
		},
		
		currentTime: function() {
			return (new Date()).getTime();
		},

		// ---------------------------- Event functions ---------------------------- 

		escapepress: function(options) {
			return this.each(function() {
				if (typeof options == 'function') {
					this.escapepress = options;
				} else if (this.escapepress) {
					this.escapepress(options);
				}
				return this;
			});
		},
		insertpress: function(options) {
			return this.each(function() {
				if (typeof options == 'function') {
					this.insertpress = options;
				} else if (this.insertpress) {
					this.insertpress(options);
				}
				return this;
			});
		},
		tabpress: function(options) {
			return this.each(function() {
				if (typeof options == 'function') {
					this.tabpress = options;
				} else if (this.tabpress) {
					this.tabpress(options);
				}
				return this;
			});
		},

		// ---------------------------- Plugins ---------------------------- 

		tasksStatistics: function() {
			if (this.length==1 && this[0].nodeName != 'DIV') throw "This element is not a task container !"; 
			var totalItem = 0; doneItem = 0; doneWork = 0; totalWork = 0;
			$(this).find('ul.tasks li:visible').each(function() {
				var task = $(this);
				if (task.status() != 3) { // Do not take skipped items into account
					++totalItem;
					if (task.info()) {
						var info = parseFloat(task.info());
						if (info!=NaN) {
							totalWork += info;
							if (task.status() == 2) doneWork += info;
						}
					}
				}
				if (task.status() == 2) ++doneItem;
			});
			console.log('[' + $(this).attr('id') + '] Etat d\'avancement: ' + doneWork + '/' + totalWork + ', ce qui fait ' + doneItem + '/' + totalItem + ' taches');
		}
	});
})(jQuery);
