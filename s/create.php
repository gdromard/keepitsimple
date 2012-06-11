<?php
include_once 'inc/HTTPHelper.class.php';
include_once 'inc/Tasks.class.php';

$db = http_get_param('db');
$id = http_get_param('id');
$description = http_get_param('description');

$tasks = new Tasks(http_get_param('db'));
if (!$id) http_send_response(400, 'Bad Request: parameter ID is missing');
else {
	$message = null;
	if ($tasks->create($id, $description, $errorMessage)) {
		$msg = new EmptyJSONObject();
		$msg->msg = "Creation succeeded";
		$msg->createMsg = $errorMessage;
		http_send_response(200, $msg->toJSON());
	}
	http_send_response(404, __('Creation failed (due to: {0})', $errorMessage));
}
