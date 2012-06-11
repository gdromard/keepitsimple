<?php
include_once 'inc/Tasks.class.php';
include_once 'inc/HTTPHelper.class.php';

if (version_compare(PHP_VERSION, '5.0.0', '<')) http_send_response(500, "PHP Version must be at leat 5.0");

$tasks = new Tasks(http_get_param('db'));
$errorMessage = null;
$content = $tasks->getContent($errorMessage);
if ($content === FALSE) http_send_response(500, $errorMessage, 'html');
else http_send_response(200, $content);
