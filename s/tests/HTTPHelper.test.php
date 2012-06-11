<?php
function unittest_assertEquals($p1, $p2, $message) {
	if ($message) echo $message;
	if ($p1 === $p2) {
		echo " OK\n";
		return true;
	}
	echo "($p1 <> $p2) FAILED\n";
	return false;
}

function unittest__fct() {
	unittest_assertEquals(__('{0} {1} {2}', 1, 2, 3), '1 2 3', "[TEST] <__()>");
	unittest_assertEquals(__('Test {0} du {1}', 'avec', 'contenu'), 'Test avec du contenu', "[TEST] <__()>");
	unittest_assertEquals(__('{0}{1}{2}{3}{4}{5}{6}{7}{8}{9}', 0,1,2,3,4,5,6,7,8,9), '0123456789', "[TEST] <__()>");
	$variable = "variable";
	unittest_assertEquals(__('valueur de la variable: {0}', $variable), 'valueur de la variable: variable', "[TEST] <__()>");
}