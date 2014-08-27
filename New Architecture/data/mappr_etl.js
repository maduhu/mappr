var pg = require('/Users/D/Documents/githubclones/PGRestAPI/node_modules/pg');
var express = require("/Users/D/Documents/githubclones/PGRestAPI/node_modules/express");
var conString = "postgres://D:''@localhost/World Spatial";
var fs = require('fs');

var prefix = 'gha_';

//var SSACenter = [-5.222246513227375, 27.773437499999996];
//var SSAZoom = 4;
//var SSAMaxZoom = 6;

main();

function main() {
	
//	processLayerMenuObject();
//	createIndicatorLegendJSONFiles();
	createIndicatorMetaDataJSONFiles();
}

function createIndicatorMetaDataJSONFiles() {
	
    var client = new pg.Client(conString);
    client.connect();
   	  
    client.query("SELECT varcode, vardesc, sources FROM indicator_metadata", function(error, result) {
    	result.rows.forEach(function(obj, idx) {
    		var res = {
               	'source':obj['sources'],
               	'description':obj['vardesc']
            };
            writeResultFileToDisk(obj['varcode'] + "_metadata", res);
    	});
    	client.end();
    });
}

function createIndicatorLegendJSONFiles() {
	
    var client = new pg.Client(conString);
    client.connect();
   	  
    client.query("SELECT varcode, classcolors, classbreaks, classlabels FROM indicator_metadata", function(error, result) {
    	result.rows.forEach(function(obj, idx) {
	    	var result = {
		   		'lgdcl':obj['classbreaks'],
		   		'lgdcr':obj['classcolors'],
		   		'lgdlb':obj['classlabels']
		   	};
	    	writeResultFileToDisk(obj['varcode'] + "_legend", result);
    	});
    	client.end();
    });
}

function writeResultFileToDisk(fileName, data, callback) {
	console.log("creating cached result for ", fileName);
	fs.writeFileSync('/Users/D/Sites/mappr/web/data/'+fileName+'.json', JSON.stringify(data));
}

function processLayerMenuObject() {
	
    var client = new pg.Client(conString);
    client.connect();
                
	getASAppConfig(client, function(rows) {
		
		var layerMenuJSON = getFormattedLayersObject(rows);
		layerMenuJSON['category1ToFontIcon'] = {
	    	'Administrative':'',
	    	'Agroecology':'',
	   		'Demographics':'',
	  		'Farming System':'',
	  		'Markets':'',
	    };

		var configObj = {};
		configObj['title'] = 'Ghana MAPPR';
		configObj['layerMenuConfig'] = layerMenuJSON;
		configObj['mapConfig'] = {'center':[8.032034155598001, 0.791015625],'zoom':7,'maxZoom':8};
		
		writeResultFileToDisk('gha', configObj);
		client.end();
	});	
}

function getASAppConfig(client, callback) {
	
    var query_string = "SELECT vi_id AS i, varlabel AS ll, varcode AS ln, cat1, cat2, cat3 FROM indicator_metadata WHERE published = 'True' AND isDomain = 'False'";
    client.query(query_string, function(error, result) {
    	result = result ? result.rows:[];
    	callback(result);
    });
}

function getFormattedLayersObject(rows) {
	
	var updatedRows = [];
	rows.forEach(function(obj) {
		var rowObj = {};
		rowObj['isTimeConstant'] = true;
		rowObj['MBTilesEndPoint'] = prefix + obj['ln'];
		rowObj['id'] = obj['ln'];
		rowObj['label'] = obj['ll'];
		rowObj['g1'] = obj['cat1'];
		rowObj['g2'] = obj['cat2'];
		rowObj['g3'] = obj['cat3'];
		updatedRows.push(rowObj)
	});
	
	return createLayerMenuObject(updatedRows);
}

function createLayerMenuObject(indicatorObjs) {
	
	var obj = {};
	indicatorObjs.forEach(function(rowObj) {
					
		var groupLayer = rowObj['g1'] ? rowObj['g1'].trim() : null;
		if(!groupLayer) {
			return;
		}
		var groupLayer2 = rowObj['g2'] ? rowObj['g2'].trim() : null;
		var groupLayer3 = rowObj['g3'] ? rowObj['g3'].trim() : null;
		var groupLayer4 = null;
			
		if(groupLayer && !obj[groupLayer]) {
			obj[groupLayer] = {};
			obj[groupLayer]['name'] = groupLayer;
			obj[groupLayer]['level'] = 1;
			obj[groupLayer]['layers'] = [];
			if(!obj['groupLayers']) {
				obj['groupLayers'] = [];
			}
			obj['groupLayers'].push(groupLayer);
		}
		if(groupLayer && groupLayer2 && !obj[groupLayer][groupLayer2]) {
			obj[groupLayer][groupLayer2] = {};
			obj[groupLayer][groupLayer2]['name'] = groupLayer2;
			obj[groupLayer][groupLayer2]['level'] = 2;
			obj[groupLayer][groupLayer2]['layers'] = [];
			if(!obj[groupLayer]['groupLayers']) {
				obj[groupLayer]['groupLayers'] = [];
			}
			obj[groupLayer]['groupLayers'].push(groupLayer2);
		}
		if(groupLayer && groupLayer2 && groupLayer3 && !obj[groupLayer][groupLayer2][groupLayer3]) {
			obj[groupLayer][groupLayer2][groupLayer3] = {};
			obj[groupLayer][groupLayer2][groupLayer3]['name'] = groupLayer3;
			obj[groupLayer][groupLayer2][groupLayer3]['level'] = 3;
			obj[groupLayer][groupLayer2][groupLayer3]['layers'] = [];
			if(!obj[groupLayer][groupLayer2]['groupLayers']) {
				obj[groupLayer][groupLayer2]['groupLayers'] = [];
			}
			obj[groupLayer][groupLayer2]['groupLayers'].push(groupLayer3);
		}
				
		if(groupLayer && !groupLayer2) {
			obj[groupLayer]['layers'].push(rowObj);
		}
		else if(groupLayer && groupLayer2 && !groupLayer3) {
			obj[groupLayer][groupLayer2]['layers'].push(rowObj);
		}
		else if(groupLayer && groupLayer2 && groupLayer3 && !groupLayer4) {
			obj[groupLayer][groupLayer2][groupLayer3]['layers'].push(rowObj);
		}
	});

	return obj;
}
