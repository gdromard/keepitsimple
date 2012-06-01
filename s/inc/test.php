<?php

include_once 'task.class.php';
$task = new Task();

/*
$task = new Task("1317056974", array('modified'=>time(), 'description'=>'Ma premiere tache MOD3', 'status'=>2, 'deleted'=>0));
$task->update();
*/

$tasks = $task->getTasks();


echo "<html><body><table border='1'><tr><th>Creation Date</th><th>Modified Date</th><th>Description</th><th>Status</th><th>Deleted ?</th></tr>";
foreach($tasks as $task) {
	echo time() . " - " . $task->id . " - " . $task->modified . "<br/>";
	echo "<tr><td>" . date('d-m-Y H:i:s', $task->id) . "</td><td>" . date('d-m-Y H:i:s', $task->modified) . "</td><td>" . $task->description . "</td><td>" . $task->status . "</td><td>" . $task->deleted . "</td></tr>";
}
echo "</table></body></html>";

/*
 echo "TASK: ";
print_r($tasks);
//echo time();
*/
