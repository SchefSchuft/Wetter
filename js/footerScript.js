window.onload = main();

var time;
var browserName;

function main()
{
	uhrzeit();
	getBrwoserInfo();
	infoSammeln();
	setInterval('infoSammeln()',1000);
}

function infoSammeln()
{
	uhrzeit();
	document.getElementById('running_clock').innerHTML = "Aktuelle Uhrzeit: " + time + "<br>" + "Ihr Browser: " + browserName;
}

function uhrzeit()
{
	time = new Date();
	
}


function getBrwoserInfo()
{
	browserName = navigator.userAgent;
	
}
