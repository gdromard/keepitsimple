<?php
include_once 'inc/HTTPHelper.class.php';
include_once 'inc/Tasks.class.php';

$db = http_get_param('db');
$id = http_get_param('id');

$tasks = new Tasks(http_get_param('db'));
if (!$id) http_send_response(400, 'Bad Request: parameter ID is missing');
else {
	if ($tasks->recover($id, $errorMessage)) http_send_response(200, '{"msg":"Recovering succeeded"}');
	http_send_response(404, __('Recovering failed (due to: {0})', $errorMessage));
}
