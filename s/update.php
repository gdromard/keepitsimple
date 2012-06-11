<?php
include_once 'inc/HTTPHelper.class.php';
include_once 'inc/Tasks.class.php';

$db = http_get_param('db');
$id = http_get_param('id');
$desc = http_get_param('description');
$info = http_get_param('info');
$status = http_get_param('status');

$tasks = new Tasks(http_get_param('db'));
if (!$id) http_send_response(400, 'Bad Request: parameter ID is missing');
else {
	$task = new EmptyJSONObject();
	$task->id = $id;
	if (!$task) http_send_response(404, __('Update failed (due to: {0})', "JSON Parse error in " . __FILE__ . " at line " . __LINE__));
	if ($desc!==NULL) $task->description = $desc;
	if ($info!==NULL) $task->info = $info;
	if ($status!==NULL) $task->status = $status;
	$errorMessage = null;
	$task = $tasks->update($id, $task, $errorMessage);
	if ($task) {
		$msg = new EmptyJSONObject();
		$msg->msg = "update succeeded";
		$msg->task = $task;
		http_send_response(200, $msg->toJSON());
	}
	http_send_response(404, __('Update failed (due to: {0})', $errorMessage));
}
