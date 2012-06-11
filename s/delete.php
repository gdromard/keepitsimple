<?php
include_once 'inc/HTTPHelper.class.php';
include_once 'inc/Tasks.class.php';

$db = http_get_param('db');
$id = http_get_param('id');

$tasks = new Tasks(http_get_param('db'));
if (!$id) http_send_response(400, 'Bad Request: parameter ID is missing');
else {
	$message = null;
	if ($tasks->delete($id, $message)) http_send_response(200, '{"msg":"Deletion succeeded ('.$message.')"}');
	http_send_response(404, __('Deletion failed (due to: {0})', $message));
}
