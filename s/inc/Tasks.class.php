<?php
include_once('Logger.class.php');
include_once('Task.class.php');

class Tasks {
	private $mode = 'file'; // Possible values are: db OR file
	private static $JSON_TASK_TEMPLATE = '{ "id": "{0}", "description": "{1}", "info": "{2}", "modified": "{3}", "status": {4}, "deleted": 0}';

	public $filename = null;
	private $content = null;
	private $tasks = null;

	public static function getCurrentTimestamp() {
		return microtime(true)*1000;
	}
	
	public function __construct($db = 'tasks', $mode = 'file') {
		if ($mode === 'db') $this->mode = 'db';
		if ($db != null) $this->filename = $db;
	}

	public function getTasks() {
		if (!$this->tasks) $this->tasks = json_decode($this->getContent());
		return $this->tasks;
	}

	public function getContent() {
		if (!$this->content) {
			switch($this->mode) {
				case 'file':
					$handle = fopen($this->filename, "r+");
					if ($handle !== FALSE) {
						$this->content = fread($handle, filesize($this->filename));
						fclose($handle);
			            if (strlen(trim($this->content)) == 0) $this->content = "[]";
					}
					break;
				case 'db':
					$task = new Task();
					$tasks = $task->getTasks();
					$this->content = @json_encode($tasks);
					break;
				default:
					$this->content = "[]";
					break;
			}
		}
		return $this->content;
	}

	function setContent($content, &$errorMessage) {
		switch($this->mode) {
			case 'file':
				$handle = fopen($this->filename, 'w+');
				if ($handle !== FALSE) {
					if (fwrite($handle, $content) !== FALSE) {
						Logger::debug("Sauvegarde realise avec succes");
						if (fclose($handle) === FALSE) {
							$errorMessage = __("ERROR: Enable to close file {0} ({1})", realpath($logfile), $p_sMessage);
						} else {
							return true;
						}
					} else {
						$errorMessage = __("ERROR: file {0} is not writable ({1})", realpath($logfile), $p_sMessage);
					}
				} else {
					$errorMessage = __("ERROR: file {0} can not be open ({1})", realpath($logfile), $p_sMessage);
				}
				break;
			case 'db':
				break;
		}
		return false;
	}
	
	private function save(&$errorMessage) {
		if ($this->tasks) return $this->setContent(json_encode($this->tasks), $errorMessage);
		$errorMessage = "Ooops its seams that the tasks have never been loaded";
		return false;
	}

	private function get($id) {
		$tasks = $this->getTasks();
		foreach ($tasks as $task) {
			if ($task->id == $id) return $task;
		}
		return null;
	}

	public function delete($id, &$errorMessage) {
		$task = $this->get($id);
		if ($task) {
			$task->deleted = 1;
			return $this->save($errorMessage);
		}
		return false;
	}

	public function recover($id, &$errorMessage) {
		$task = $this->get($id);
		if ($task) {
			$task->deleted = 0;
			return $this->save($errorMessage);
		}
		return false;
	}
	
	public function create($id, $description, &$errorMessage) {
		$task = $this->get($id);
		if (!$task) {
			$task = json_decode(__(self::$JSON_TASK_TEMPLATE, $id, $description, "", $id, 0));
			$this->tasks[] = $task;
			return $this->save($errorMessage);
		}
		$errorMessage = "The task $id already exists";
		return false;
	}

	public function update($id, $new, &$errorMessage) {
		$task = $this->get($id);
		if ($task) {
			$updated = false;
			if (property_exists($new, 'description') && $task->description != $new->description) {
				$task->description = $new->description;
				$updated = true;
			}
			if (property_exists($new, 'info') && $task->info != $new->info) {
				$task->info = $new->info;
				$updated = true;
			}
			if (property_exists($new, 'status') && $task->status != $new->status) {
				$task->status = $new->status;
				$updated = true;
			}
			if ($updated) {
				$task->modified = self::getCurrentTimestamp();
				return $this->save($errorMessage);
			}
			//$errorMessage .= "Nothing changed !";
			return true;
		}
		$errorMessage = "The task $id has not been found";
		return false;
	}
	
	function merge($new) {
		if ($this->mode === 'db') {
			$task = new Task();
			$actual = $task->getTasks();
		} else {
			$actual = @json_decode($this->getContent());
			@$this->jsonError();
		}
		//echo "\nold: ";
		//var_dump($new);
		$new = json_decode($new);
		//echo "\nNEW: ";
		//var_dump($new);
		@$this->jsonError();
		for ($n=0; $n<count($new); ++$n) {
			$found = false;
			for ($a=0; $a<count($actual); ++$a) {
				if ($new[$n]->id == $actual[$a]->id) {
					$found = true;
					if (floatval($new[$n]->modified) > floatval($actual[$a]->modified)) {
						$actual[$a] = $new[$n];
						if ($this->mode === 'db') {
							$task = new Task($actual[$a]->id, $actual[$a]);
							$task->update();
						}
						//$actual[$a]->debug ="La sauvegarde de l'objet ".$new[$n]->id." a ete effectuee";
						Logger::debug("La sauvegarde de l'objet ".$new[$n]->id." a ete effectuee");
					} else if (floatval($new[$n]->modified) <= floatval($actual[$a]->modified)) {
						//$actual[$a]->info = "La sauvegarde de l'objet ".$new[$n]->id." est obsolette, SKIP ==> " . json_encode($new[$n]);
						Logger::info("La sauvegarde de l'objet ".$new[$n]->id." est obsolette, SKIP ==> " . json_encode($new[$n]));
					}
					break;
				}
			}
			if (!$found) {
				$a = count($actual);
				$actual[$a] = $new[$n];
				if ($this->mode === 'db') {
/*
echo "<b>DEBUG</b><br/>";
print_r($new);
echo "<br/>";
print_r($actual);
echo "<br/>$a";
echo "<br/>";
*/
					$task = new Task($actual[$a]->id, $actual[$a]);
					$task->add();
				}
				//$actual[$a]->info = "L'ajout de l'objet [$a] ".$actual[$a]->id." a ete effectue";
				Logger::info("L'ajout de l'objet [$a] ".$actual[$a]->id." a ete effectue");
			}
		}
		$content = json_encode($actual);
		if ($this->mode !== 'db') $this->setContent($content);
		return $content;
	}

	function jsonError() {
		if (function_exists('json_last_error')) {
			switch(json_last_error()) {
			    case JSON_ERROR_DEPTH:
			        Logger::error('Error in ' . __FILE__ . ' at line ' . __LINE__ . ' JSON - Maximum stack depth exceeded');
			    break;
			    case JSON_ERROR_CTRL_CHAR:
			        Logger::error('Error in ' . __FILE__ . ' at line ' . __LINE__ . ' JSON - Unexpected control character found');
			    break;
			    case JSON_ERROR_SYNTAX:
			        Logger::error('Error in ' . __FILE__ . ' at line ' . __LINE__ . ' JSON - Syntax error, malformed JSON');
			    break;
			    case JSON_ERROR_NONE:
			    break;
			}
		}
	}
}
