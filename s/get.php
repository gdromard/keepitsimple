<?php
if (version_compare(PHP_VERSION, '5.0.0', '<')) { echo("PHP Version must be at leat 5.0"); exit; }

include_once 'inc/HTTPHelper.class.php';
include_once 'inc/Tasks.class.php';

$db = http_get_param('db');

if (isset($db)) {
	$tasks = new Tasks($db);
	http_send_response(200, $tasks->getContent());
} else {
	http_send_response(400, "Bad Request: parameter 'db' is missing");
}
