let financialData = {};
let mymap = {};
let allTransactions = {};
let markers = new Array();
let validAddresses = 0;
let uniqueAddresses = 0;


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
    //getCoordsFromAddress(input);
    console.log(mapPercentToBlueScale(input));
}

function loadCSV() {
    var file = document.getElementById("fileInput").files[0];

    var fr = new FileReader();
    fr.onload = function (e) {
        var text = e.target.result;
        var lines = text.split('\n');
        allTransactions = new Array();
        for (var i = 0; i < lines.length; i++) {
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

    for (var i = 0; i < data[0].length; i++) {
        if (data[0][i] == "Amount") {
            amountCol = i;
        } else if (data[0][i] == "Description") {
            addressCol = i;
        }
    }

    for (var i = 1; i < data.length; i++) {
        var row = {};
        var address = data[i][addressCol];
        var amount = parseFloat(data[i][amountCol]);
        address = address.split("  ")[0];
        if (amount < 0) {
            var wasDuplicate = false;
            for (var j = 0; j < formattedData.length; j++) {
                if (formattedData[j][0] == address) {
                    formattedData[j][1] += amount;
                    wasDuplicate = true;
                }
            }

            if (!wasDuplicate) {
                row.address = address;
                row.amount = amount;
                formattedData.push(row);
                uniqueAddresses++;
            }
        }
    }

    console.log(formattedData);
    return formattedData;
}

function applyGeoCodesForFinancialData() {
    var requests = new Array();
    for (let i = 0; i < financialData.length; i++) {
        var geoCode = getCoordsFromAddress(financialData[i].address);
        geoCode.then((json) => {
            if (json.results[0]) {
                financialData[i].prettyAddress = json.results[0].formatted_address;
                financialData[i].location = json.results[0].geometry.location;
            }
        }).catch((e) => {
            console.log(e);
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
    let amountTotal = 0;

    for (let i = 0; i < financialData.length; i++) {
        amountTotal += financialData[i].amount;
    }

    // Remove all existing markers if there are any
    for (let i = 0; i < markers.length; i++) {
        mymap.removeLayer(markers[i]);
    }

    for (let i = 0; i < financialData.length; i++) {
        if (financialData[i].location) {

            // Change custom color based on amount

            const myCustomColour = mapPercentToBlueScale(financialData[i].amount/amountTotal);

            const markerHtmlStyles = `
            background-color: ${myCustomColour};
            width: 2rem;
            height: 2rem;
            display: block;
            left: -1.5rem;
            top: -1.5rem;
            position: relative;
            border-radius: 3rem 3rem 0;
            transform: rotate(45deg);
            border: 1px solid #FFFFFF`;

            const icon = L.divIcon({
                className: "my-custom-pin",
                iconAnchor: [0, 24],
                labelAnchor: [-6, 0],
                popupAnchor: [0, -36],
                html: `<span style="${markerHtmlStyles}" />`
            });


            var marker = L.marker([financialData[i].location.lat, financialData[i].location.lng], {icon: icon});


            marker.addTo(mymap);
            markers.push(marker);
            validAddresses++;
        }
    }

    console.log("valid addresses: " + validAddresses);
    console.log("unique addresses: " + uniqueAddresses);
    console.log(financialData);
}

function setMapView(lat, lng) {
    mymap.setView([lat, lng], 10);
}

function mapPercentToBlueScale(percent) {
    let max = {red: 255, green: 51, blue: 51};
    let min = {red: 51, green: 51, blue: 255};
    let mid = {red: 51, green: 255, blue: 51};

    if (percent <= .25) {
        let sectionPercent = percentToRange(percent / .25, 51, 255);
        return rgbToHex({red: 51, green: sectionPercent, blue: 255});
    } else if (percent <= .5) {
        let sectionPercent = percentToRange(1 - ((percent - .25) / .25), 51, 255)
        return rgbToHex({red: 51, green: 255, blue: sectionPercent});
    } else if (percent <= .75) {
        let sectionPercent = percentToRange(((percent - .5) / .25), 51, 255)
        return rgbToHex({red: sectionPercent, green: 255, blue: 51});
    } else {
        let sectionPercent = percentToRange(1 - ((percent - .75) / .25), 51, 255)
        return rgbToHex({red: 255, green: sectionPercent, blue: 51});
    }

}

function percentToRange(percent, min, max) {
    return parseInt(((max - min) * percent) + min);
}

function componentToHex(c) {
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

// rgb = {red: ##, green: ##, blue: ##}
function rgbToHex(rgb) {
    console.log(rgb);
    return "#" + componentToHex(rgb.red) + componentToHex(rgb.green) + componentToHex(rgb.blue);
}



