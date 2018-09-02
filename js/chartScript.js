// Info //////////////////////////////////////////////////////////////////////////////////////////
/*
Dieses Script händelt das Diagramm inkl. den SensorButtons und Zeiteingaben auf der Front-Seite.

Funktion:
Das ChartInterface als Kernobjekt beinhaltet alle Daten um das Chart dynamisch zu verwalten.

1.
Das ChartInterface wird instanziert und generiert direkt eine X-Achse abhängig vom aktuellen Datum. Es wird ein standard Sensor bestimmt, gemäss diesem später die Y-Werte folgen. Die aktuellen Y-Werte sind zu dem Zeitpunkt noch default-Attrappen.

Erstmals in der Initialisierung wird die refreshChart-Funktion aufgerufen.

Darin erfolgt ein Datenbankrequest an das php-Script Serverseitig, auf Basis der Daten im ChartInterface (für welchen Sensor angefragt werden soll). Die dabei aufgerufene Ajax-Funktion schreibt die erhaltenen Datensätze wiederum in das ChartInterface.

Nun werden die Daten aus dem ChartInterface in das Chart geschrieben. Dadurch werden die GET-Methoden im ChartInterface aufgerufen. Diese geben dann je nach Zustand der Objekt-Variablen Daten heraus(zB wie die X/Y-Achse aussieht). Diese Daten werden in das Chart projiziert. Die Graphik auf der HTML-Seite wird damit angezeigt.

2.
Nun wird die Dynamik beibehalten...
Jetzt kann das chartInterface-Objekt dynamisch bearbeitet werden. Durch Änderung in der Datumbox wird zB. die X-Achse nachgerechnet. Durch Änderung auf "Druck", der Sensor ec.

Bei solchen Events und im automatischen Intervall wird dann wieder die refreshChart-Funktion aufgerufen. Request gemäss angepasstem chartInterface-Objekt senden. Werte in chartInterface-Objekt schreiben. ChartInteface auf Chart projizieren. Chart aktualisieren. Fertig!

Der automatische Intervall erfüllt dabei den Zweck, das neu angelegte Datensätze automatisch in der Website sichtbar werden ohne manuelles refreshen der Seite.

*/
// Funktions- und Klassenbibliothek ///////////////////////////////////////////////////////////

//Datum und Zeiten Übersetzer
function dateObjectToSchedulerString(defaultDate){
	//YYYY-MM-DDThh:mm:ss.ms
	var minute = defaultDate.getMinutes();
	var hour = defaultDate.getHours();
	var day = defaultDate.getDate();
	var month = defaultDate.getMonth() + 1;
	var year = defaultDate.getFullYear();
	
	if (month < 10){month = "0" + month;}
	if (day < 10){day = "0" + day;}
	if (hour < 10){hour = "0" + hour;}
	if (minute < 10){minute = "0" + minute;}
	
	var schedulerString = year + "-" + month + "-" + day + "T" + hour + ":" + minute;
	return schedulerString;
}
function schedulerStringToDateObject(defaultString){
	//YYYY-MM-DDThh:mm:ss.ms
	var seperateT = defaultString.split("T");
	var time = seperateT[1].split(":");
	var date = seperateT[0].split("-");
	var minute = parseInt(time[1]);
	var hour = parseInt(time[0]);
	var day = parseInt(date[2]);
	var month = parseInt(date[1])-1;
	var year = parseInt(date[0]);
	
	var dateObject = new Date(year, month, day, hour, minute);
	return dateObject;
}
function dateObjectToChartString(defaultDate){
	//DD.MM.YYYY  hh:mm
	var minute = defaultDate.getMinutes();
	var hour = defaultDate.getHours();
	var day = defaultDate.getDate();
	var month = defaultDate.getMonth() + 1;
	var year = defaultDate.getFullYear();
	
	if (month < 10){month = "0" + month;}
	if (day < 10){day = "0" + day;}
	if (hour < 10){hour = "0" + hour;}
	if (minute < 10){minute = "0" + minute;}
	
	var chartString = day + "." + month + "." + year + "  " + hour + ":" + minute;
	return chartString;
}
function dbStringToDateObject(defaultString){
	//YYYY-MM-DD hh:mm:ss
	var seperate = defaultString.split(" ");
	var time = seperate[1].split(":");
	var date = seperate[0].split("-");
	var dateObject = new Date(parseInt(date[0]),		//Jahr
						  	  parseInt(date[1])-1,		//Monat
						  	  parseInt(date[2]),		//Tag
						  	  parseInt(time[0]),		//Stunde
						  	  parseInt(time[1]));		//Minute
							  //parseInt(time[2]));		//Sekunde
	return dateObject;
}
function dateObjectToDbString(defaultDate){
	//YYYY-MM-DD hh:mm:ss
	var second = defaultDate.getSeconds();
	var minute = defaultDate.getMinutes();
	var hour = defaultDate.getHours();
	var day = defaultDate.getDate();
	var month = defaultDate.getMonth() + 1;
	var year = defaultDate.getFullYear();
	
	if (month < 10){month = "0" + month;}
	if (day < 10){day = "0" + day;}
	if (hour < 10){hour = "0" + hour;}
	if (minute < 10){minute = "0" + minute;}
	
	var dbString = year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
	return dbString;
}

//Festlegen der Y-Achsengrösse abhängig vom Sensor
function yRange(sensor){
	var i;
	switch(sensor){
		case 1:	i = {min: -20, max:  50}; break;	//Temperatur
		case 2:	i = {min:   0, max: 100}; break;	//Feuchte
		case 3:	i = {min: 700, max:1200}; break;	//Druck
		case 4:	i = {min:   0, max:1000}; break;	//Licht
	}
	return i;
}

//ChartInterface-Instanzen managen die Werte für ein Chart
class ChartInterface{
		//Erstellt die X-Achse ab "date", für die dauer "range"
	//Wichtige Methode: xAxis = ein Array aus Date-Objekten
	//Wichtige Methode: xAxisFormat = ein Array aus Datumstrings für die Grafikanzeige
		//Hält Datenpunkte für die "xAxis" aus dem AjaxRequest fest
		//Legt die Datenpunkte in die xAxis
	//Wichtige Methode: yValues = ein Array aus Ganzzahl Werten
	//Wichtige Methode: yStamps = ein Array aus Datumstrings für die eingepassten Werte
	
	/*
	Konstruktor des Objekts. Das Objekt wird initialisiert durch:
	1. zu verwaltendes Chart,
	2. Start Datum,
	3. länge der xAchse,
	4+5. Sensor und Satellit für den Graphen,
	6. Datenbankwerte
	*/
	constructor( chart,
				 startDate = new Date(new Date().getTime() - 1000*60*60*20),
				 timeRange = "day",
				 sensorNumber = 1,
				 satelliteNumber = 1,
				 dbReceivement = [{timestamp: "2000-01-01 01:01:01", value: 10},
								  {timestamp: "2000-01-01 01:01:02", value: 10}])
	{
		this.chart = chart;
		this.startDate = startDate;				
		this.timeRange = timeRange;				
		this.sensorNumber = sensorNumber;		
		this.satelliteNumber = satelliteNumber;
		this.dbReceivement = dbReceivement;
	}
	
	//Intervall (x-Punkte) abhängig von Range
	get intervall(){
		var i;
		switch(this.timeRange){
			case "hour":	i = 1000*60*2; break;
			case "day":		i = 1000*60*60; break;
			case "week":	i = 1000*60*60*24; break;
			case "month":	i = 1000*60*60*24; break;
		}
		return i;
	}
	
	//range String in milis umrechnen
	get rangeMilis(){
		var i;
		switch(this.timeRange){
			case "hour":	i = 1000*60*60; break;
			case "day":		i = 1000*60*60*24; break;
			case "week":	i = 1000*60*60*24*7; break;
			case "month":	i = 1000*60*60*24*7*4; break;
		}
		return i;
	}
	
	//letztes Datum auf xAchse
	get endDate(){
		var endDate = this.xAxis[this.xAxis.length-1];
		return endDate;
	}
	
	//xAchse erstellen: ein Array aus Date-Objekten
	get xAxis(){
		var timeAxis = [];
		var step = this.intervall;
		for(var offset=0; offset <= this.rangeMilis; offset += step){
			timeAxis.push(new Date(this.startDate.getTime() + offset));
		}
		return timeAxis;
	}
	
	//xAchse erstellen: ein Array aus formatierten Datumstrings für die Grafikanzeige
	get xAxisFormat(){
		var timeAxis = [];
		var step = this.intervall;
		for(var offset=0; offset <= this.rangeMilis; offset += step){
			timeAxis.push(dateObjectToChartString(new Date(this.startDate.getTime() + offset)));
		}
		return timeAxis;
	}

	//Tick = xAchsen Schrittweite -> Intervall der x-Abschnitte
	get deltaTicks(){
		var delta = this.xAxis[2].getTime()-this.xAxis[1].getTime();
		return delta;
	}
	
	//ein Array aus Ganzzahl Werten von den Datenbank Timestamps in die Graphen-Inkremente gelegt werden
	get yValues(){
		var yValues = [];
		for(var tick=0; tick<this.xAxis.length; tick++){
			var graphDate0 = this.xAxis[tick].getTime();
			var graphDate1 = this.xAxis[tick].getTime() + this.deltaTicks;
			
			for(var stamp=0; stamp<this.dbReceivement.length; stamp++){
				var dbDate = dbStringToDateObject(this.dbReceivement[stamp].timestamp).getTime();
				
				if(dbDate >= graphDate0 && dbDate <= graphDate1){
					yValues[tick] = this.dbReceivement[stamp].value;
				}
			}
		}
		return yValues;
	}
	
	//ein Array aus den Datenbank Timestamps die in die Graphen-Inkremente gelegt wurden
	get yStamps(){
		var yStamps = [];
		for(var tick=0; tick<this.xAxis.length; tick++){
			var graphDate0 = this.xAxis[tick].getTime();
			var graphDate1 = this.xAxis[tick].getTime() + this.deltaTicks;
			
			for(var stamp=0; stamp<this.dbReceivement.length; stamp++){
				var dbDate = dbStringToDateObject(this.dbReceivement[stamp].timestamp).getTime();
				
				if(dbDate >= graphDate0 && dbDate <= graphDate1){
					yStamps[tick] = this.dbReceivement[stamp].timestamp;
				}
			}
		}
		return yStamps;
	}
	//dimensionierung yAchse
	get minValue(){
		var min = yRange(this.sensorNumber).min;
		return min;
	}
	//dimensionierung yAchse
	get maxValue(){
		var max = yRange(this.sensorNumber).max;
		return max;
	}
}

//Funktion nach Actionhandling
//1. DB Request
//2. Chart aktualisieren
function refreshChart(chartInterface){
	//dem Server-PHP diese Parameter mitgeben
	//Filtervariablen für SQL-DB
	var jsPost = {"satellite": chartInterface.satelliteNumber,
				  "sensor": chartInterface.sensorNumber,
				  "start": dateObjectToDbString(chartInterface.startDate),
				  "end": dateObjectToDbString(chartInterface.endDate)};
	//Ziel-php Pfad
	var url = location.origin + "/php/dbInterface.php";
	//Ajax Request
	$.ajax({
		type: "POST",							//Art des Requests
		dataType: "json",						//JavaScriptObjectNotation
		url: url,								//Ablage des php-Scritps
		data: jsPost,							//jsPost-Parameter an php posten
		success: function(jsReceive){			//Ausgabe von php in jsReceive erhalten
			chartInterface.dbReceivement = jsReceive;
			console.log("Request erfolgreich");
			requestFailures = 0;
			interfaceingChart(chartInterface);	//Chartaktualisierungen durchführen
		},
		error: function(){						//Im Fehlverhalten loggen
			console.log(url + " nicht Erreichbar.\nAjax Request fehlgeschlagen");
			if(requestException){
				requestFailures += 1;
				if(requestFailures >= 5){
					requestException = confirm(url + " ist nicht Erreichbar.\nDie Datenbankabfrage ist  mehrfach fehlgeschlagen\n OK: Weiter versuchen\nAbbrechen: Ignorieren");
					requestFailures = 0;
				}
			}
		}
	});
}

//1. Werte von ChartInterface in Chart schreiben
//2. Chart aktualisieren
function interfaceingChart(chartInterface){
	chartInterface.chart.data.labels = chartInterface.xAxisFormat;
	chartInterface.chart.data.datasets[0].data = chartInterface.yValues;
	chartInterface.chart.options.scales.yAxes[0].ticks.min = chartInterface.minValue;
	chartInterface.chart.options.scales.yAxes[0].ticks.max = chartInterface.maxValue;
	chartInterface.chart.update();
}



// Initialisierung ///////////////////////////////////////////////////////////////////

//Globale Optionen für Charts festlegen
Chart.defaults.global.animation.duration = 500;

//chart0 anlegen
const CHART0 = document.getElementById("LineChart0");
var lineChart0 = new Chart(CHART0, {
	type:"line",
	data:{
        labels: [],
        datasets: [{
            label: 'label',
            data: [],
			lineTension: 0,
			fill: true,
        }]	
	},
	options:{
		spanGaps: true,
		scales:{
			yAxes:[{
				ticks:{
					min:-20,	//Skala der Y-Achse
					max: 100,
				}
			}],
			xAxes:[{
				ticks:{
					//maxTicksLimit: 10,
					minRotation: 90,
					maxRotation: 90,
					autoSkip: true
				}
			}]
		}
	}
});

//Instanz von ChartInterface0 für lineChart0 anlegen
var chartInterface0 = new ChartInterface(lineChart0);

//Default Datum in Datumbox schreiben
document.getElementById("scheduler").value = dateObjectToSchedulerString(chartInterface0.startDate);

//Erstmaliges manuelles refreshen des Charts
refreshChart(chartInterface0);


// Intervall Refreshing ///////////////////////////////////////////////////////////////

//Automatischer Refresher in Intervall
setInterval(refreshChart, 5000, chartInterface0);



// Actionhandling ////////////////////////////////////////////////////////////////////

//actionHandler Sensorwechsel
function setSensor(sensorNumber){
	chartInterface0.sensorNumber = sensorNumber;
	refreshChart(chartInterface0);
}

//actionHandler Datumbox
function setDate(){
	chartInterface0.startDate = schedulerStringToDateObject(document.getElementById("scheduler").value);
	refreshChart(chartInterface0);
}

//actionHandler Zeitrange
function setDateRange(range){
	chartInterface0.timeRange = range;
	refreshChart(chartInterface0);
}



// Debug Logger ///////////////////////////////////////////////////////////////////////

//Intervall logger für Debuging Zwecke
function debugLogger(){
	console.log(chartInterface0.dbReceivement);
}
//setInterval(debugLogger, 2000);



// Error Handling /////////////////////////////////////////////////////////////////////

//Fehlerzähler Datenbank Request
var requestException = true;
var requestFailures = 0;

