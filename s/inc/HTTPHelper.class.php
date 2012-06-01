<?php
function http_get_param($name) {
	return isset($_POST[$name])?$_POST[$name]:$_GET[$name];
}

function http_send_response($status = 200, $body = '', $content_type = 'application/json') {
	$status_header = 'HTTP/1.1 ' . $status . ' ' . getStatusCodeMessage($status);
	header($status_header);
	header('Content-type: ' . $content_type);
	header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
	header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
	Header('Pragma: no-cache');

	// pages with body are easy
	if($body != '') {
		// send the body
		echo $body;
		exit;
	}
	// we need to create the body if none is passed
	else {
		// create some body messages
		$message = '';

		// this is purely optional, but makes the pages a little nicer to read
		// for your users.  Since you won't likely send a lot of different status codes,
		// this also shouldn't be too ponderous to maintain
		switch($status) {
			case 401:
				$message = 'You must be authorized to view this page.';
				break;
			case 404:
				$message = 'The requested URL ' . $_SERVER['REQUEST_URI'] . ' was not found.';
				break;
			case 500:
				$message = 'The server encountered an error processing your request.';
				break;
			case 501:
				$message = 'The requested method is not implemented.';
				break;
		}

		// servers don't always have a signature turned on (this is an apache directive "ServerSignature On")
		$signature = ($_SERVER['SERVER_SIGNATURE'] == '') ? $_SERVER['SERVER_SOFTWARE'] . ' Server at ' . $_SERVER['SERVER_NAME'] . ' Port ' . $_SERVER['SERVER_PORT'] : $_SERVER['SERVER_SIGNATURE'];

		// this should be templatized in a real-world solution
		$statusCodeMsg = getStatusCodeMessage($status);
		$body = '<!DOCTYPE HTML>
		<html>
		<head>
		<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
		<title>' . $status . ' ' . $statusCodeMsg . '</title>
		</head>
		<body>
		<h1>' . $statusCodeMsg . '</h1>
		<p>' . $message . '</p>
		<hr />
		<address>' . $signature . '</address>
		</body>
		</html>';

		echo $body;
		exit;
	}
}

function getStatusCodeMessage($status) {
	// these could be stored in a .ini file and loaded
	// via parse_ini_file()... however, this will suffice
	// for an example
	$codes = Array(
			100 => 'Continue',
			101 => 'Switching Protocols',
			200 => 'OK',
			201 => 'Created',
			202 => 'Accepted',
			203 => 'Non-Authoritative Information',
			204 => 'No Content',
			205 => 'Reset Content',
			206 => 'Partial Content',
			300 => 'Multiple Choices',
			301 => 'Moved Permanently',
			302 => 'Found',
			303 => 'See Other',
			304 => 'Not Modified',
			305 => 'Use Proxy',
			306 => '(Unused)',
			307 => 'Temporary Redirect',
			400 => 'Bad Request',
			401 => 'Unauthorized',
			402 => 'Payment Required',
			403 => 'Forbidden',
			404 => 'Not Found',
			405 => 'Method Not Allowed',
			406 => 'Not Acceptable',
			407 => 'Proxy Authentication Required',
			408 => 'Request Timeout',
			409 => 'Conflict',
			410 => 'Gone',
			411 => 'Length Required',
			412 => 'Precondition Failed',
			413 => 'Request Entity Too Large',
			414 => 'Request-URI Too Long',
			415 => 'Unsupported Media Type',
			416 => 'Requested Range Not Satisfiable',
			417 => 'Expectation Failed',
			500 => 'Internal Server Error',
			501 => 'Not Implemented',
			502 => 'Bad Gateway',
			503 => 'Service Unavailable',
			504 => 'Gateway Timeout',
			505 => 'HTTP Version Not Supported'
	);

	return (isset($codes[$status])) ? $codes[$status] : '';
}


/**
 * @param String $str La chaine à tester
 * @param String $sub Le début de la chaine
 * @return TRUE si $str commence par $sub.
 */
function str_beginswith($str, $sub)
{
	return (substr($str, 0, strlen($sub)) === $sub);
}

/**
 * @param String $str La chaine à tester
 * @param String $sub La fin de la chaine
 * @return TRUE si $str se termine par $sub.
 */
function str_endswith($str, $sub)
{
	return (substr($str, strlen($str) - strlen($sub)) === $sub);
}

/**
 * Lookup a message in the current domain, and handle optional parameters.
 * @link http://www.php.net/manual/en/function.gettext.php
 * @param message string <p>The message being translated. </p>
 * @param param1 string <p>The first parameter of the message (the message has to contains the tag: {0}). </p>
 * @param param2 string <p>The second parameter of the message (the message has to contains the tag: {1}). </p>
 * @param param3 string <p>The third parameter of the message (the message has to contains the tag: {2}). </p>
 * @param paramx string <p>The Xth parameter of the message (the message has to contains the tag: {x-1} - where X is Nth parameter of the function). </p>
 * @return string a translated string if one is found in the translation table, or the submitted message if not found.
 */
function __($msgid) {
	$msg = $msgid;
	if (function_exists("_")) $msg = _($msgid);
	if (func_num_args() > 1) {
		$args = func_get_args();
		for ($i=0; $i<count($args); ++$i) {
			$msg = str_replace('{'.$i.'}', $args[$i+1], $msg);
		}
	}
	return $msg;
}