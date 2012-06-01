<?php 

class Logger {
	public static $DEBUG = 0;
	public static $INFO = 1;
	public static $WARNING = 2;
	public static $ERROR = 3;
	public static $STOP = 4;
	public static $FATAL = 5;
	private static $ERROR_TYPE = array('DEBUG', 'INFO', 'WARNING', 'ERROR', 'STOP', 'FATAL ERROR');
	
	private static function appendIntoLogFile($p_iNiveau, $p_sMessage) {
		if ($p_iNiveau >= Logger::$ERROR) {
			$logfile = '_errors.log';
		} else {
			$logfile = '.log';
		}
		$logfile = dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR . @date('Ymd') . $logfile;
		$handle = @fopen($logfile, 'a+');
		if ($handle !== FALSE) {
			$sTime = @date(DATE_ISO8601);
			if (isset($_SERVER['REMOTE_ADDR'])) {
				$sTime .= ' - from ' . $_SERVER['REMOTE_ADDR'];
				if (isset($_SERVER['REMOTE_PORT'])) {
					$sTime .= ':' . $_SERVER['REMOTE_PORT'];
				}
			}
			$sTime .= ' - ' . session_id();
			if (fwrite($handle, $sTime . ' : ' . $p_sMessage . "\n\n") !== FALSE) {
				if (fclose($handle) === FALSE) {
					if($p_iNiveau >= Logger::$ERROR) echo '<p class="error">ERROR: Enable to close file ' . realpath($logfile) . '<br/>'. $p_sMessage . '</p>';
				}
			} else {
				if($p_iNiveau >= Logger::$ERROR) echo '<p class="error">ERROR: file ' . realpath($logfile) . ' is not writable<br/>'. $p_sMessage . '</p>';
			}
		} else {
			if($p_iNiveau >= Logger::$ERROR) echo '<p class="error">ERROR: file ' . realpath($logfile) . ' can not be open<br/>'. $p_sMessage . '</p>';
		}
	}

	public static function debug($p_sMess, $p_bDisplayContext = false) {
		Logger::log(Logger::$DEBUG, $p_sMess, $p_bDisplayContext);
	}
	
	public static function info($p_sMess, $p_bDisplayContext = false) {
		Logger::log(Logger::$INFO, $p_sMess, $p_bDisplayContext);
	}

	public static function warn($p_sMess, $p_bDisplayContext = false) {
		Logger::log(Logger::$WARNING, $p_sMess, $p_bDisplayContext);
	}
	
	public static function error($p_sMess, $p_bDisplayContext = false) {
		Logger::log(Logger::$ERROR, $p_sMess, $p_bDisplayContext);
	}
	
	public static function fatalError($p_sMess, $p_bDisplayContext = false) {
		Logger::log(Logger::$FATAL, $p_sMess, $p_bDisplayContext);
	}
	
	public static function log($p_iNiveau, $p_sMess, $p_bDisplayContext = false) {
		// Check if $p_sMess is an array
		if (is_array($p_sMess)) {
			$p_sMess = ArrayFormatter::stringifyArray($p_sMess);
		}
		$p_sMess = Logger::$ERROR_TYPE[$p_iNiveau] . ' - '. $p_sMess;
		
		if ($p_iNiveau >= Logger::$DEBUG) {
			if ($p_bDisplayContext) {
				$aContext = debug_backtrace();
				$p_sMess .= "\n" . 'Context:';
				$bFirst = true;
				foreach($aContext as $aLine) {
					if (!isset($aLine['file'])) {
						continue;
					}
					if ($bFirst) {
						$bFirst = false;
						continue;
					}
					$p_sMess .= "\n" . 'File ' . $aLine['file'];
					$p_sMess .= ' - Line ' . $aLine['line'];
					$p_sMess .= ' - Function called: ' . $aLine['function'];
					$p_sMess .= '(';
					$bFirst = true;
					foreach($aLine['args'] as $uParam) {
						if ($bFirst) {
							$bFirst = false;
						} else {
							$p_sMess .= ', ';
						}
						if (is_bool($uParam)) {
							if ($uParam) {
								$p_sMess .= 'true';
							} else {
								$p_sMess .= 'false';
							}
						} elseif (is_int($uParam) || is_float($uParam)) {
							$p_sMess .= $uParam;
						} elseif (is_string($uParam)) {
							$p_sMess .= '\'' . $uParam . '\'';
						} elseif (is_array($uParam)) {
							$p_sMess .= '(Array)';
						} elseif (is_object($uParam)) {
							$p_sMess .= '(Object)';
						} else {
							$p_sMess .= '(type?)' . $uParam;
						}
					}
					$p_sMess .= ')';
				}
			}
			Logger::appendIntoLogFile($p_iNiveau, $p_sMess);
		}
		if ($p_iNiveau >= Logger::$STOP) {
			echo $p_sMess;
			die();
		}
	}
}
?>
