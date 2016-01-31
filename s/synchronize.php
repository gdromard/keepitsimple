<?php
if (version_compare(PHP_VERSION, '5.0.0', '<')) { echo("PHP Version must be at leat 5.0"); exit; }

include_once 'inc/HTTPHelper.class.php';
include_once 'inc/Tasks.class.php';

$db = http_get_param('db');
$tasksAsJson = http_get_param('tasks');

if (!isset($tasksAsJson)) http_send_response(400, "Bad Request: parameter 'tasks' is missing");
else if (!isset($db)) http_send_response(400, "Bad Request: parameter 'db' is missing");
else {
	$tasks = new Tasks($db);
	if ($tasks->setContent($tasksAsJson, $errorMessage)) {
		$msg = new EmptyJSONObject();
		$msg->msg = "update succeeded";
		$msg->db = $db;
		$msg->tasks = json_decode($tasksAsJson);
		http_send_response(200, $msg->toJSON());
	} else {
		http_send_response(404, __('Update failed (due to: {0})', $errorMessage));
	}
}