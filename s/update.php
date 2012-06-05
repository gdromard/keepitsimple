<?php
include_once 'inc/HTTPHelper.class.php';
include_once 'inc/Tasks.class.php';

$db = http_get_param('db');
$id = http_get_param('id');
$desc = urldecode(http_get_param('description'));
$info = urldecode(http_get_param('info'));
$status = http_get_param('status');

$tasks = new Tasks(http_get_param('db'));
if (!$id) http_send_response(400, 'Bad Request: parameter ID is missing');
else {
	$task = json_decode(__('{ "id": "{0}"}', $id));
	if (!$task) http_send_response(404, __('Update failed (due to: {0})', "JSON Parse error in " . __FILE__ . " at line " . __LINE__));
	if ($desc!==NULL) $task->description = $desc;
	if ($info!==NULL) $task->info = $info;
	if ($status!==NULL) $task->status = $status;
	if ($tasks->update($id, $task, $errorMessage)) http_send_response(200, '{"msg":"update succeeded"}');
	http_send_response(404, __('Update failed (due to: {0})', $errorMessage));
}
