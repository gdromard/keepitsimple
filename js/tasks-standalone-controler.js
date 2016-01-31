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
			$('body').alertInfo(message);
		}
	};
});




var demotask = {
	 "id" : 1333375510688,
	 "modified" : 1338370772480,
	 "description" : "Demo task",
	 "status" : 0,
	 "deleted" : 0,
	 "started" : 0,
	 "end" : 0,
	 "info" : ""
};

	

(function($){


	// ---------------------------- Util Methods ---------------------------- 

	/**
	 * Retrieve the current Task project DB.
	 * $(this)  not used
	 */
	$.KeepItSimple = function (projectName) {
		if (projectName != undefined) {
			this.project = projectName;
		} else {
			// Get project from URL
			var index = self.location.search.indexOf('project=');
			if (index>-1) this.project = self.location.search.substring(index+8).replace(/&.*/, "");
		}
		$('#project').val(this.project);
    };

	$.KeepItSimple.prototype = {
		project: '',
		serverType: 'php',
		urlGet: 's/get.php',
		urlSynchronize: 's/synchronize.php',
		tasklist: null,
		
		getDB: function() {
			return $.indexedDB(this.project).objectStore('tasks');
		},
		
		/**
		 * status: True: Green / False: Red
		 */
		setSaveStatus: function(status) {
			if (status) {
				$(".save-btn .glyphicon-floppy-remove").toggleClass('glyphicon-floppy-saved').toggleClass('glyphicon-floppy-remove');
				$(".save-btn .red").toggleClass('red').toggleClass('green');
				$(".save-btn.btn-danger").toggleClass('btn-success').toggleClass('btn-danger');
			} else {
				$(".save-btn .glyphicon-floppy-saved").toggleClass('glyphicon-floppy-saved').toggleClass('glyphicon-floppy-remove');
				$(".save-btn .green").toggleClass('red').toggleClass('green');
				$(".save-btn.btn-success").toggleClass('btn-success').toggleClass('btn-danger');
			}
		},
		
		init: function(element) {
			if (element == undefined) element = $('#tasklist');
			// stores the passed element as a property of the created instance.
			// This way we can access it later
			this.tasklist = (element instanceof $) ? element : $(element);
			// instanceof is an extremely simple method to handle passed jQuery objects, DOM elements and selector strings.
			// This one doesn't check if the passed element is valid nor if a passed selector string matches any elements.
			
			if (this.tasklist.length == 0 && this.tasklist[0].nodeName != 'DIV') $('body').alertError("Unable to load task plugin on a non DIV element");
			// Check element
			this.tasklist.html('');

			this.initDB();
			this.tasklist.loadTasks();
			return this;
		},
		
		initDB: function() {
			$.indexedDB(this.project, {
			    'schema': {
			        1: function (v) {
			            var objectStore = v.createObjectStore('tasks', {
			                'keyPath': 'id',
			                'autoIncrement': false
			            });
			            objectStore.createIndex('status');
			            console.info('Created new object store');
			        }
			    }
			}).then(
				// Create demo task
				function (e) {
					$.keepitsimple.getDB().get(demotask.id).then(function (item) {
						if (item == undefined) {
							$.keepitsimple.getDB().add(demotask).then(function (id) {
								console.info('Creating Demo Task !', demotask);
								$.keepitsimple.tasklist.updateTaskUI(demotask);
							}, function (err, e) {
								console.error(err, e);
							});
						} else {
							console.info('Task is already existing !', item);
						}
					}, function (err, e) { console.error(err, e); });
				}, 
				// Handle errors
				function (err, e) { console.error(err, e); }
			).done(function() {
				// When Indexed DB successfully connected:
				// --- Clearing tasks
				$.keepitsimple.tasklist.html("");
				// --- Loading tasks from local indexedDB
				$.keepitsimple.getDB().each(function(task) {
					$.keepitsimple.tasklist.updateTaskUI(task.value);
				}).then(function () {
					$.keepitsimple.loadFromServer();
				});

			});
		},
		
		/**
		 * Get all tasks from the cloud (on server side)
		 */
		loadFromServer: function() {
			// GET from server
			if (this.serverType == 'php') {
				console.log(this.urlGet, this.project);
				console.log("taskGenericEvent mode", this.tasklist.data('mode'));
				
				if (this.tasklist.data('mode') == 'quiet') return;
				else if (this.tasklist.data('mode') == 'demo') if ($('div.alert:visible').length == 0) $('body').alertInfo('In demo mode the persistence is not available');
				
				$.getJSON(this.urlGet, {db: this.project })
				.success(function(jsonData) {
					var ok = true;
					$(jsonData).each(function() { $('body').saveTaskLocally(this); });
					$.keepitsimple.setSaveStatus(true);
					$('body').alertInfo('Tasks successfully loaded from Server');
				})
				.error(function(jqXHR, textStatus, errorThrown) {
					$('body').alertError('[Get tasks event] Event FAILED');
					console.log("textStatus: " + textStatus + ", errorThrown: " + errorThrown);
				});
			} // end of server GET
		},
		

		/**
		 * Save all tasks into the cloud (on server side)
		 */
		saveToServer: function(event) {
			var tasks = [];
			$.keepitsimple.getDB().each(function(item) {
				tasks.push(item.value);
			}).done(function() {
				console.log(tasks);
				console.log($.keepitsimple.serverType);
				// PUSH to server
				
				if ($.keepitsimple.serverType == 'php') {
					console.log($.keepitsimple.urlSynchronize, $.keepitsimple.project);
					
					console.log("taskGenericEvent mode", $.keepitsimple.tasklist.data('mode'));
					if ($.keepitsimple.tasklist.attr('data-mode') == 'quiet') return;
					else if ($.keepitsimple.tasklist.attr('data-mode') == 'demo') if ($('div.alert:visible').length == 0) $('body').alertInfo('In demo mode the persistence is not available');
					var  data = {db: $.keepitsimple.project, tasks: JSON.stringify(tasks).replace(/\[/, "[\n\t").replace(/},{/g, "},\n\t{").replace(/}\]/g, "}\n]") };
				    // Send the request
				    $.ajax({
				    	type: 'POST',
				    	url: $.keepitsimple.urlSynchronize, 
				    	dataType: 'json',
				    	//async: false,
				    	data: data,
				    	success: function(response) {
				    		console.log(response);
				    		$.keepitsimple.setSaveStatus(true);
				    		if ($('div.alert:visible').length == 0) $('body').alertInfo('Task successfully saved to server'); 
				    	},
				    	error: function(jqXHR, textStatus, errorThrown) {
							$('body').alertError('[Get tasks event] Event FAILED');
							console.log("textStatus: " + textStatus + ", errorThrown: " + errorThrown);
						} 
				    });
				} // end of server PUSH
			});
		},
	};
	$.keepitsimple = new $.KeepItSimple();


	// Plugins:
	$.fn.extend({


		// ---------------------------- Tasks UI Management ---------------------------- 

		/**
		 * Increment current task status.
		 * $(this)  the DOM element corresponding to the status icon
		 */
		incrementTaskStatus: function() {
			return this.each(function() {
				var obj = $(this);
				var id = parseInt($(this).parent().parent().attr('id'));
				
				$.keepitsimple.getDB().get(id).then(function (task) {
					// Handling Recording
					if (parseInt(task.status) == 0) { task.start = new Date().getTime(); task.end = 0; } 	// Start recording   
					if (parseInt(task.status) == 1) { task.end   = new Date().getTime(); } 					// End   recording
					if (parseInt(task.status) == 4) { task.start = 0; task.end = 0; } 						// Reset recording
					
					// Incrementing status
					task.status = parseInt(task.status) + 1;
					if (task.status > 4) task.status = 0;
					task.modified = $.fn.currentTime();
					console.info('increment status on task:', task);
					
					// Updating object into indexedDB
					$('body').saveTaskLocally(task);
				}, function (err, e) {
				   console.error(err, e);
				});
				return this;
			});
		},
		
		/**
		 * Show the edit modal of a given task identified by its ID
		 * $(this)  the DOM element corresponding to the description label
		 */
		showEditTaskUI: function(id) {
			return this.each(function() {
				var id = parseInt($(this).parent().parent().attr('id'));
				console.log("Starting task edition", $('#'+id+' div.task'));
				$.keepitsimple.getDB().get(id).then(function (task) {
					$('#editTaskModal #taskId').val(task.id);
					$('#editTaskModal #description').val(task.description);
					$('#editTaskModal #info').val(task.info);
					$('#editTaskModal #status').val(task.status);
					$('#editTaskModal #spentTime').val('na');
				});
				$('#editTaskModal').modal();
				return this;
			});
		},

		/**
		 * Save Edited task (from modal screen).
		 * $(this)  not used
		 */
		saveEditedTaskUI: function() {
			return this.each(function() {
				var id = parseInt($('#editTaskModal #taskId').val());
				console.log("Saving task ", id);
				$.keepitsimple.getDB().get(id).then(function (task) {
					task.description = $('#editTaskModal #description').val();
					task.info = $('#editTaskModal #info').val();
					task.status = $('#editTaskModal #status').val();
					task.modified = $.fn.currentTime();
					var spent = $('#editTaskModal #spentTime').val();
					
					if (spent != 'na') {
						if (spent == 'clear') {
							task.start = 0;
							task.end = 0;
						} else if (spent == 'clear and start') { // clear and start
							task.start = $.fn.currentTime();
							task.end = 0;
						} else if (spent == 'start') {
							task.start = $.fn.currentTime() - (task.end - task.start);
							task.end = 0;
						} else if (spent == 'stop') {
							task.end = $.fn.currentTime();
						} else {
							spent = parseInt(spent);
							task.end = $.fn.currentTime();
							task.start = task.end - spent;
						}
					}
					$('body').saveTaskLocally(task);
					$('#editTaskModal').modal('hide');
				});
				return this;
			});
		},

		/**
		 * 
		 */
		updateTaskUI: function(task) {
			//console.info('updateTaskUI:', task);
			var uiTask = $('#' + task.id);
			if (task.deleted == 0) {
				if (uiTask.length == 0) {
					if (task.status < 0 || task > 4) tast.status = 0;
					if (task.status == 1)      // inwork    (orange)
						uiTask = $('<div class="row" id="'+task.id+'"><div class="task col-xs-12 text-warning"><span class="status glyphicon glyphicon-expand"        aria-hidden="true"></span>&nbsp;<label class="description" title="' + task.info + '">' + task.description + '</label><button class="remove-item btn btn-default btn-xs pull-right"><span class="glyphicon glyphicon-remove"></span></button> <label class="record pull-right text-muted" data-start="' + task.start + '" data-end="' + task.end + '"></div></div>');
					else if (task.status == 2) // done      (green)
						uiTask = $('<div class="row" id="'+task.id+'"><div class="task col-xs-12 text-success"><span class="status glyphicon glyphicon-check"         aria-hidden="true"></span>&nbsp;<label class="description" title="' + task.info + '">' + task.description + '</label><button class="remove-item btn btn-default btn-xs pull-right"><span class="glyphicon glyphicon-remove"></span></button> <label class="record pull-right text-muted" data-start="' + task.start + '" data-end="' + task.end + '"></div></div>');
					else if (task.status == 3) // skipped   (gray)
						uiTask = $('<div class="row" id="'+task.id+'"><div class="task col-xs-12 text-muted"  ><span class="status glyphicon glyphicon-question-sign" aria-hidden="true"></span>&nbsp;<label class="description" title="' + task.info + '">' + task.description + '</label><button class="remove-item btn btn-default btn-xs pull-right"><span class="glyphicon glyphicon-remove"></span></button> <label class="record pull-right text-muted" data-start="' + task.start + '" data-end="' + task.end + '"></div></div>');
					else if (task.status == 4) // todiscuss (yellow)
						uiTask = $('<div class="row" id="'+task.id+'"><div class="task col-xs-12 text-info"   ><span class="status glyphicon glyphicon-info-sign"     aria-hidden="true"></span>&nbsp;<label class="description" title="' + task.info + '">' + task.description + '</label><button class="remove-item btn btn-default btn-xs pull-right"><span class="glyphicon glyphicon-remove"></span></button> <label class="record pull-right text-muted" data-start="' + task.start + '" data-end="' + task.end + '"></div></div>');
					else if (task.status == 0) // todo      (red)
						uiTask = $('<div class="row" id="'+task.id+'"><div class="task col-xs-12 text-danger" ><span class="status glyphicon glyphicon-unchecked"     aria-hidden="true"></span>&nbsp;<label class="description" title="' + task.info + '">' + task.description + '</label><button class="remove-item btn btn-default btn-xs pull-right"><span class="glyphicon glyphicon-remove"></span></button> <label class="record pull-right text-muted" data-start="' + task.start + '" data-end="' + task.end + '"></div></div>');
					$('#tasklist').append(uiTask);
					
					// Register events
					uiTask.find('span.status'      ).on('click', function() { $(this).incrementTaskStatus(); });
					uiTask.find('button'           ).on('click', function() { $(this).deleteTask(parseInt($(this).parent().parent().attr('id'))); });
					uiTask.find('label.description').on('click', function() { $(this).showEditTaskUI(); });
				
				} else {
					// Get DOM element 
					var div  = uiTask.find('div.task');
					var span = uiTask.find('div.task span.status');
					var desc = uiTask.find('div.task label.description');
					var rec  = uiTask.find('div.task label.record');
				
					// Define classes
					if (task.status < 0 || task > 4) tast.status = 0;
					var textClassName = "text-danger";      // todo      (red)
					var iconClassName = "glyphicon-unchecked";
					if (task.status == 1) {     			// inwork    (orange)
						textClassName = "text-warning";      
						iconClassName = "glyphicon-expand";
					} else if (task.status == 2) {			// done      (green)
						textClassName = "text-success";      
						iconClassName = "glyphicon-check";
					} else if (task.status == 3) {			// skipped   (gray)
						textClassName = "text-muted";      
						iconClassName = "glyphicon-question-sign";
					} else if (task.status == 4) {			// todiscuss (yellow)
						textClassName = "text-info";      
						iconClassName = "glyphicon-info-sign";
					}
					// Refresh status text style
					$(div.attr('class').split(' ')).each(function(index, item) { if(item.indexOf('text-') == 0) { div.removeClass(item).addClass(textClassName); } });
					// Refresh status icon style
					$(span.attr('class').split(' ')).each(function(index, item) { if(item.indexOf('glyphicon-') == 0) { span.removeClass(item).addClass(iconClassName); } });
					// Refresh description
					desc.html(task.description);
					// Refresh info
					desc.attr('title', task.info);
					// Refresh record time
					rec.data('start', task.start);
					rec.data('end', task.end);
				}
				uiTask.data('task', task);
			} else {
				uiTask.hide();
			}
			return uiTask;
		},

		
		/**
		 * 
		 */
		createTask: function(task) {
			var newTask = {
				"id" : new Date().getTime(),
				"modified" : new Date().getTime(),
				"description" : "New Task",
				"status" : 0,
				"deleted" : 0,
				"started" : 0,
				"end" : 0,
				"info" : ""
			};
			task =  $.extend(newTask, task);
			
			$.keepitsimple.getDB().add(task).then(function (id) {
				console.info('Task Created: ', task);
				$('#tasklist').updateTaskUI(task);
		   }, function (err, e) {
			   console.error(err, e);
		   });
		   return this;
		},
		

		/**
		 * Save a task locally (into browser IndexedDB)
		 * @param taskToBeSaved  the task to be stored into local DB.
		 */
		saveTaskLocally: function(taskToBeSaved) {
			$.keepitsimple.setSaveStatus(false);
			$.keepitsimple.getDB().get(taskToBeSaved.id).then(function (task) {
				if (task == undefined) {
					taskToBeSaved.modified = $.fn.currentTime();
					// Création
					$.keepitsimple.getDB().add(taskToBeSaved).then(function (id) {
						$('#tasklist').updateTaskUI(taskToBeSaved);
					}, function (err, e) {
						console.error(err, e);
					});
				} else {
					if (taskToBeSaved.modified >= task.modified) {
						// Modification	
						task =  $.extend(taskToBeSaved, task.value);
						console.log("Saving locally task: ", task);
						// Updating object into indexedDB
						$.keepitsimple.getDB().put(task).then(function (id) {
							$('#tasklist').updateTaskUI(task);
						}, function (err, e) {
							console.error(err, e);
						});
					} else {
						$('body').alertWarning("Local task "+taskToBeSaved.id+" is newer than the one you're loading !!");
						console.warn("Local task "+taskToBeSaved.id+" is newer than the one you're loading !!", $("#"+taskToBeSaved.id), taskToBeSaved.modified, task.modified);
						$.keepitsimple.setSaveStatus(false);
					}
				}
			}, function (err, e) {// if error while getting task -> Create the default task
				console.error(err, e);
			});
		},

		

		/**
		 * Flag a task as deleted.
		 * @param id  The tesk ID to be flagged as deleted
		 */
		deleteTask: function(id) {
			$.keepitsimple.getDB().get(id).then(function (task) {
				task.deleted = 1;
				task.modified = $.fn.currentTime();
				console.info('deleting task:', task);
				$.keepitsimple.getDB().put(task).then(function (e) {
					$('#'+id).remove();
				}, function (err, e) {
					console.error(err, e);
				});
			}, function (err, e) {
			   console.error(err, e);
			});
		},
		

		/**
		 * Increment all recording times.
		 */
		incrementRecord: function() {
			this.each(function () {
				var now = new Date().getTime();
				if ($(this).data('start') > 0) {
					var elapse = Math.ceil((($(this).data('end') > 0 ? $(this).data('end') : now) - $(this).data('start')) / 1000);
					//$(this).html(elapse + 's');
					$(this).html((elapse < 4) ? "" : (elapse < 120) ? elapse + 's': moment.duration(elapse, 'seconds').humanize());
				} else if ($(this).data('start') == 0) {
					$(this).html('');
				}
			});
			return this;
		},
	
		
		// ---------------------------- Task Loading ---------------------------- 

		/**
		 * Main Load tasks function, that initialize the UI.
		 */
		loadTasks: function() {
			// Increment records every seconds ...
			setInterval(function() { $('div.task label.record').incrementRecord(); }, 1000);

			// Unbinding des evennements
			$('#search-form-field').unbind('keyup');
			$('#sort-by-description').unbind('click');
			$('#sort-by-info').unbind('click');
			$('#sort-by-id').unbind('click');
			$('#sort-by-modified').unbind('click');
			$('#sort-by-status').unbind('click');
			$('.save-btn').unbind('click');

			// Register createTask event
			$('#addtask-input').on('keypress', function (e) {
			    e.preventDefault;
			    if (e.which == 13) {
			        if ($(this).val() != '') {
				        $(this).createTask({ description: $(this).val() });
				        $(this).val("");
			        }
			    }
			});
								
			// Register buttons events :
			$('.save-btn').unbind('click').on('click', function() {
				$.keepitsimple.saveToServer(this);
			});
			$('#exporterModal .saveBtn').unbind('click').on('click', function() {
				var tasks = JSON.parse($('#exporterModal .modal-body textarea').val());
				$(tasks).each(function() {
					$('body').saveTaskLocally(this);
				});
			});
			$('#editTaskModal .saveBtn').unbind('click').on('click', function() {
				$('body').saveEditedTaskUI();
			});
			
			// Register modal events :
			$('#exporterModal').unbind('click').on('shown.bs.modal', function() {
				console.log("Starting extraction of tasks");
				$('#exporterModal .modal-body textarea').val("[");
				$.keepitsimple.getDB().each(function(task) {
					$('#exporterModal .modal-body textarea').val($('#exporterModal .modal-body textarea').val() + "\n\t" + JSON.stringify(task.value) + ",");
				}).done(function() {
					$('#exporterModal .modal-body textarea').val($('#exporterModal .modal-body textarea').val().replace(/,$/, "") + "\n]" );
				});
			});
			
			// Register sorting
			$('#sort-by-description').unbind('click').on('click', function() { $('#tasklist').tasksSortBy('description'); return false; });
			$('#sort-by-info'       ).unbind('click').on('click', function() { $('#tasklist').tasksSortBy('info');        return false; });
			$('#sort-by-id'         ).unbind('click').on('click', function() { $('#tasklist').tasksSortBy('id');          return false; });
			$('#sort-by-modified'   ).unbind('click').on('click', function() { $('#tasklist').tasksSortBy('modified');    return false; });
			$('#sort-by-status'     ).unbind('click').on('click', function() { $('#tasklist').tasksSortBy('status');      return false; });

			// Register filter field
			$('#search-form-field').unbind('keyup').on('keyup', function() {
				$('#tasklist div.row').each(function() {
					$(this).toggle($(this).text().toUpperCase().indexOf($('#search-form-field').val().toUpperCase()) > -1);
				});
				return this;
			});

			return true;
		},
	
		
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
		taskSynchronizeEvent: function(alltasks) {
			return this.each(function() {
				$(this).taskGenericEvent({serverUrl: 's/synchronize.php', tasks: alltasks, eventName: 'Synchronize Event'});
				return this;
			});
		},

		taskGenericEvent: function(options) {
			var options =  $.extend({serverUrl: null, db: $.keepitsimple.getDB(), id: null, eventName: null }, options);

			console.log("taskGenericEvent", options);
			console.log("taskGenericEvent mode", $(this).attr('data-mode'));
			
			if ($(this).attr('data-mode') == 'quiet') {
				return this;
			} else if ($(this).attr('data-mode') == 'demo') {
				if (options.eventName != 'Delete task Event' && $('div.alert:visible').length == 0) 
					$('body').alertInfo('In demo mode the persistence is not available');
				return this;
			}
			if (!options.db) $('body').alertError('['+options.eventName+'] Parameter data-db was not found');

			return this.each(function() {
				$.getJSON(options.serverUrl, options)
				.success(function(jsonData) {
					if (jsonData.task) $('body').taskRefreshed(jsonData.task);
					console.log('['+options.eventName+'] Event succeed');
				})
				.error(function(jqXHR, textStatus, errorThrown) {
					$('body').alertError('['+options.eventName+'] Event FAILED ('+options.id+')');
					console.log("textStatus: " + textStatus + ", errorThrown: " + errorThrown);
				});
				return this;
			});
		},

		/** OLD CODE */
		// ---------------------------- Tasks UI Management ---------------------------- 

		tasksSortBy: function(field) {
			// Load tasks
			return $('#tasklist').each(function() {
				var tasklist = $(this);
				var sortBy = tasklist.attr('data-sortBy');
				var sortType = tasklist.attr('data-sortType');
				if (field == sortBy) {
					order = (sortType=='asc'?1:-1) * -1;
					tasklist.attr('data-sortBy', field);
					tasklist.attr('data-sortType', (order==1?'asc':'desc'));
				} else {
					if (!field) field = sortBy;
					order = 1;
					tasklist.attr('data-sortBy', field);
					tasklist.attr('data-sortType', 'asc');
				}
				console.log("sort by: " + field + " " + (order==1?'ASC':'DESC'));
				var listitems = tasklist.children('div.row');
				listitems.sort(function(liA, liB) {
					a = $(liA).data('task')[field];
					b = $(liB).data('task')[field];
					if (!a) a='';
					if (!b) b='';
					if (field == 'info' || field == 'description') {
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
				});
				$.each(listitems, function(idx, itm) { tasklist.append(itm); });
				return this;
			});
		},

		// ---------------------------- Task UI ---------------------------- 
		
		/** OLD CODE
		//pass the options variable to the function
		tasksInit: function(options) {
			if (this.nodeName == 'DIV') $('body').alertError("Unable to load task plugin on a non DIV element");

			// Set the default values, use comma to separate the settings, example:
			var defaults = { data: [] }
			var options =  $.extend(defaults, options);

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
						$(this).getTasksContainer().tasksSortBy();
						$(this).getTasksContainer().taskCreatedEvent(taskId, input.val());
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
				$('li#'+taskId).getTasksContainer().taskRecoveredEvent(taskId);
				return this;
			});
		},

		taskDelete: function() {
			return this.each(function() {
				$(this).parent().first().slideUp('slow', function() {
					var taskId = this.id;
					$(this).getTasksContainer().taskDeletedEvent(taskId);
					var alert = $(this).alertInfo();
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
						input.getTasksContainer().taskDescriptionChangedEvent(id, input.val());
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
					input.getTasksContainer().taskInfoChangedEvent(id, input.val());
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
		/**/

		// ---------------------------- Task Tool functions ---------------------------- 

		getTasksContainer: function() {
			root = $('#tasklist');
			if (root.length == 0) {
				$('body').alertError('Fatal error occured (root node was not found)');
				throw "root not found !";
			}
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
		/**/
	});

})(jQuery);