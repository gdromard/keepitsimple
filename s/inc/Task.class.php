<?php

include_once 'BaseDB.class.php';

class Task extends BaseDB {
	public $id;
	public $modified;
	public $description;
	public $status;
	public $deleted;

	public function __construct($id=null,$values=null)
	{
		$this->fields=array(
			'ID' => 'id',
			'MODIFIED' => 'modified',
			'DESCRIPTION' => 'description',
			'STATUS' => 'status',
			'DELETED' => 'deleted'
		);
		$this->table='TASKS';
		$this->idfield='id';
		parent::__construct($id, $values);
		if ($id == null) $this->id = time();
	}

	public function getTasks()
	{
		try {
	        $query = "select * from {$this->table}";
	        $results = self::getDB()->sqlQuery($query);
	        if (count($results) > 0) {
	        	$tasks = array();
				foreach ($results as $row => $values) {
					$data = array();
					foreach ($values as $col => $value) {
						$data[$this->fields[$col]] = $value;
					}
					$tasks[$row] = new Task($data['id'], $data);
				}
				return $tasks;
	        } else {
	        	return array();
	        }
		} catch (PDOException $e) {
			if ($e->getCode() === '42S02') {
				$query = "CREATE TABLE {$this->table} ( id varchar(15), modified varchar(15), description varchar(2000), status int, deleted int )";
				$results = self::getDB()->sqlInsert($query);
				echo "RESULT OF INSERT: " . $results;
				//throw $e;
			} else {
				throw $e;
			}
		}
	}

	public function save()
	{
		$this->update();
	}


	/**
	 * Recuperation d'un enregistrement
	 *
	 * @access protected
	 * @param int $id identifiant de l'enregistrement
	 */
	protected function fetch($id)
	{
		$data=array('id'=>$id);
		$query = "select * from {$this->table} where {$this->idfield} = :id";
		$results = $this->db->sqlQuery($query, null, $data, Mysql::SQL_VALUE);
		if ($results) return $results[0];
		else return false;
	}

}