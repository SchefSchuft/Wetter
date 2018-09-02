<?php 
	//Dieses Script wird per js aufgerufen um die SQLite DB auszulesen
	//Einlesen der übergebenen Filter-Parameter
	$defSatellite = $_POST["satellite"];
	$defSensor = $_POST["sensor"];
	$defStart = $_POST["start"];
	$defEnd = $_POST["end"];

	//Datenbank Zugriff
	//PHP-Pfad:			root/php/dbInterface.php
	//Datenbankpfad:	root/wetter/wetter.db
	$db = new SQLite3("../wetter/wetter.db");				//DB Objekt erstellen
	
	$collector = array();

	$res = $db->query( "SELECT DISTINCT timestamp, value
						FROM wetter
						WHERE satellite = $defSatellite
						AND sensor = $defSensor
					 	AND timestamp >= '$defStart'
						AND timestamp <= '$defEnd'");		//Tabelle auswählen SQL Query
	
	while($dsatz = $res->fetchArray(SQLITE3_ASSOC)){
		array_push($collector, $dsatz);						//Array aus Einträgen erstellen
	}

	//$collector Format; gefilterte Liste mit Datensätzen {timestamp, value}
	//[Datensatz]{timestamp: xy, value: xy}

	$return = $collector;
	echo json_encode($return);
	$db->close();
?>