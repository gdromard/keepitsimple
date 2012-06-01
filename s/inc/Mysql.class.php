<?php
/**
 * Librairie PHP5 / MySQL
 *
 * CONNEXION / REQUETES MySQL
 *
 * Ces fonction permettent de se connecter à MySQL et de faire des
 * requetes SELECT / UPDATE / INSERT
 * @package phpincludes
 */


class Mysql
{

    static private $mysql=null;
    private $dbName=null;
    private $dbUser=null;
    private $dbPass=null;

    const SQL_VALUE=1;
    const SQL_ROW=2;
    const SQL_COLUMN=3;

    public function __construct($host, $user, $pass, $dbname)
    {
    	$this->dsn="mysql:dbname=".$dbname.";host=".$host;
        $this->dbName=$dbname;
        $this->dbUser=$user;
        $this->dbPass=$pass;
    }

    /**
     * Singleton connexion MySQL
     * @return PDO
     */
    public function getCnx()
    {
    	if (!self::$mysql) {
    		//self::$mysql=new PDO(MY_DSN, MY_USER, MY_PASS);
    		self::$mysql=new PDO($this->dsn, $this->dbUser, $this->dbPass);
    		//configuration du driver PDO
    		self::$mysql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    		self::$mysql->setAttribute(PDO::ATTR_CASE, PDO::CASE_UPPER);
    	}
    	return self::$mysql;
    }
    


    /**
    * deconnect: Deconnexion a une base MySQL
    *
    */
    public function deconnect()
    {
        if (self::$mysql) {
            mysql_close(self::$mysql);
            self::$mysql=null;
        }
    }

    
    /**
     * query: requetes SELECT
     *
     * execute toute requete SELECT, renvoie des resulats dans un tableau a 2
     * dimensions:
     * - 1e dimension indexée par numero de ligne, ou valeur du champ $key
     * - 2e dimension indexée par nom de champ (en majuscules)
     *
     * @param string $query Requete SQL
     * @param string $key champ utilisé pour indexer le resutat, ou SQL_SINGLE_VALUE
     * @param array $data valeurs utilisees dans les requetes avec placeholders
     * @param int $resultType flag determinant le type de resultat
     * @return mixed Resultat:
     *      si SQL_VALUE:ou une seule valeur
     *      si SQL_ROW : le premier enregistrement
     *      si SQL_COLUMN un tableau a 1 dimention contenant les valeurs de $key ou du 1er champ
     *      si null: tableau a 2 dimentions indexé par $key
     */
    public function sqlQuery($query, $resultKey=null, $data=null, $resType=null)
    {
    	$conn=self::getCnx();
    
    	$sth=$conn->prepare($query);
    	if ($data) foreach ($data as $key=>$val) {
    		if (substr_count($query, ':'.$key)) $sth->bindValue(':'.$key , $val);
    	}
    	$sth->execute();
    
    	$results = $sth->fetchAll(PDO::FETCH_ASSOC);
    	if (!$results) return null;
    
    	$out=array();
    	foreach ($results as $row) {
    		switch ($resType) {
    			case SQL_ROW:
    				return $row;
    				break; 
    			case SQL_VALUE:
	    			if ($resultKey) return $row[$resultKey];
	    			else return current($row);
    				break; 
    			case SQL_COLUMN:
	    			if ($resultKey) $out[]=$row[$resultKey];
	    			else $out[]=current($row);
    				break;
    			default:
		    		if ($resultKey) $out[$row[$resultKey]]=$row;
		    		else $out[]=$row;
    				break; 
    		}
    	}
    	return $out;
    }
    

    public function sqlInsert($query, $data=null)
    {
    	$conn=self::getCnx();
    
    	$sth=$conn->prepare($query);
    	if ($data) foreach ($data as $key=>$val) {
    		if (substr_count($query, ':'.$key)) $sth->bindValue(':'.$key , $val);
    	}
    	$stat=$sth->execute();
    
    	return $stat;
    }
}