<?php
// MySQL
define('MYSQL_ENV', 'DEV');

switch (MYSQL_ENV) {
	case 'DEV':
		$GLOBALS['MYSQL_CONFIG']=array(
			"HOST" => "",
			"USER" => "",
			"PASSWD" => "",
			"DB" => ""
		);
		break;
}


//librairie mysql
require_once ("Mysql.class.php");


/**
 * Classe de base pour gerer un enregistrement de base de donées
 * @abstract
 */
abstract class BaseDB {

	private static $db;

    /**
     * @var int identifiant unique de l'objet
     * @access public
     */
    public $id=null;

    /**
     * @var array champs de la table
     * @access protected
     */
    protected $fields=array();

    /**
     * @var string nom de la table
     * @access protected
     */
    protected $table=null;

    /**
     * @var string nom du champ identifiant (clef primaire)
     * @access protected
     */
    protected $idfield=null;



    /**
     * Constructeur, utilisé dans les classes filles
     *
     * si l'id est donné, les propriétés sont recuperees depuis la base et la propriété "id" est renseignée.
     * si l'objet n'existe pas en base, "id" reste ‡ null
     *
     * @param int $id identifiant de l'objet
     * @param array $values attributs de l'objet
     * (a utiliser pour instancier des objets dans des boucles: CET OBJET DOIT EXISTER EN BASE)
     */
    public function __construct($id=null,$values=null)
    {
    	if ($values) {
    		$this->setFrom($values);
    	}
    	if ($id != null) {
			$this->id = $id;
    		if (!$values) $values = $this->fetch($id);
		}
    }

    /**
     * Recuperation d'un enregistrement
     *
     * @access protected
     * @param int $id identifiant de l'enregistrement
     */
    protected function fetch($id)
    {
    	echo "[DEBUG] <base.class.php> fetch";
        $data=array('id'=>$id);
        $query = "select * from {$this->table} where {$this->idfield} = :id";
        $results = self::getDB()->sqlQuery($query, null, $data, Mysql::SQL_VALUE);
        if ($results) return $results[0];
        else return false;
    }


    /**
     * Enregistrement de l'objet en base
     * @access protected
     */
    public function update() {
    	$data=array();
    	$query="";
   		$query = "UPDATE {$this->table} SET ";
   		foreach ($this->fields as $key => $field) {
   			$query .= $field . "=:" . $field . ", ";
   			$data[$field] = (isset($this->$field) ? $this->$field : null);
   		}
   		$query = substr($query, 0, strlen($columns) - 2);
   		$data[$this->idfield] = $this->id;
   		$query .= " where {$this->idfield} = :".$this->idfield;
   		//echo $query;
    	$results = self::getDB()->sqlInsert($query, $data);
    }

    public function add() {
    	$data=array();
    	$query="";
   		$columns="";
   		$variables="";
   		foreach ($this->fields as $key => $field) {
   			$variables .= ":" . $field . ", ";
   			$columns .= $field . ", ";
   			$data[$field] = (isset($this->$field) ? $this->$field : null);
   		}
   		$columns = substr($columns, 0, strlen($columns) - 2);
   		$variables = substr($variables, 0, strlen($variables) - 2);

   		$query = "INSERT INTO {$this->table} ($columns) VALUES ($variables)";
    	$results = self::getDB()->sqlInsert($query, $data);
    }

    /**
     * modification des propriétés de l'objet
     *
     * les valeurs non données en entree ne sont pas remises a blanc
     * le propriétés doivent toujours etre modifiées avec cette methode.
     * il est possible de redefinir cette methode dans les classes filles pour
     * effectuer des traitements particuliers / verifications sur les valeurs
     *
     * @access public
     * @param array tableau associatif champ / valeur
     * @return array propriétés de l'objet
     */
    public function setFrom($values)
    {
        if ($values) foreach ($values as $field => $val) {
            if (in_array($field,$this->fields)) $this->$field = $val;
        }
        return $this;
    }


    /**
     * retourne les propriétés de l'objet dans un tableau
     *
     * seules les propriétés definies dans $fields sont retournées
     *
     * @access public
     * @return array propriétés de l'objet
     */
    public function toArray()
    {
        $out=array();
        foreach ($this->fields as $field) $out[$field] = (isset($this->$field) ? $this->$field : null) ;
        return $out;
    }

    /**
     * @return DB
     */
    public static function getDB()
    {
        if (!self::$db) {
            self::$db=new Mysql($GLOBALS['MYSQL_CONFIG']['HOST'], $GLOBALS['MYSQL_CONFIG']['USER'], $GLOBALS['MYSQL_CONFIG']['PASSWD'], $GLOBALS['MYSQL_CONFIG']['DB']);
        }
        return self::$db;
    }


}
