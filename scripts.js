var financialData = {};
var mymap = {};
var allTransactions = {};
var markers = new Array();
function mapInit() {

    mymap = L.map('mapid').setView([33.606197, -112.212950], 10);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiY3VydHNhcHAiLCJhIjoiY2pmOXd4aGh2MXJodTJ5bXp3MjRhNXJ1ciJ9._nJ-BmQ1K7O6sRLm20ct9Q', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'mapbox.streets'
    }).addTo(mymap);

    markers.push(L.marker([33.606197, -112.212950]).addTo(mymap));



}

function testButton() {
    var input = document.getElementById("addressInput").value;
    var output = document.getElementById("output");
    console.log(input);
    console.log("Getting coords from address");
    getCoordsFromAddress(input);
}

function loadCSV() {
    var file = document.getElementById("fileInput").files[0];

    var fr = new FileReader();
    fr.onload = function(e) {
        var text = e.target.result;
        var lines = text.split('\n');
        allTransactions = new Array();
        for(var i = 0; i < lines.length; i++) {
            allTransactions.push(lines[i].split(','));
        }

        financialData = formatFinancialData(allTransactions);
        applyGeoCodesForFinancialData();

    };

    fr.readAsText(file)
}

function formatFinancialData(data) {
    var formattedData = new Array();
    var amountCol;
    var addressCol;

    for(var i = 0; i < data[0].length; i++) {
        if(data[0][i] == "Amount") {
            amountCol = i;
        } else if(data[0][i] == "Description") {
            addressCol = i;
        }
    }

    for(var i = 1; i < data.length; i++) {
        var row = {};
        var address = data[i][addressCol];
        var amount = parseFloat(data[i][amountCol]);
        address = address.split("  ")[0];
        if(amount < 0) {
            var wasDuplicate = false;
            for(var j = 0; j < formattedData.length; j++) {
                if(formattedData[j][0] == address) {
                    formattedData[j][1] += amount;
                    wasDuplicate = true;
                }
            }

            if(!wasDuplicate) {
                row.address = address;
                row.amount = amount;
                formattedData.push(row);
            }
        }
    }

    console.log(formattedData);
    return formattedData;
}

function applyGeoCodesForFinancialData() {
    var requests = new Array();
    for(let i = 0; i < financialData.length; i++) {
        var geoCode = getCoordsFromAddress(financialData[i].address);
        geoCode.then((json) => {
            financialData[i].prettyAddress = json.results[0].formatted_address;
            financialData[i].location = json.results[0].geometry.location;
        });
        requests.push(geoCode);
    }
    Promise.all(requests).then(() => {
        // Change map view to look at the first item in list, this should put the map near the users data
        setMapView(financialData[0].location.lat, financialData[0].location.lng);
        markExpensesOnMap();
    });
}

function markExpensesOnMap() {

    // Remove all existing markers if there are any
    for (var i = 0; i < markers.length; i++) {
        mymap.removeLayer(markers[i]);
    }

    for(let i = 0;  i < financialData.length; i++) {
        console.log("adding marker");
        markers.push(L.marker([financialData[i].location.lat, financialData[i].location.lng]).addTo(mymap));
    }
}

function setMapView(lat, lng) {
    mymap.setView([lat, lng], 10);
}




