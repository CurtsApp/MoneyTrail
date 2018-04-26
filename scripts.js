let financialData = {};
let mymap = {};
let allTransactions = {};
let markers = new Array();
let validAddresses = 0;
let uniqueAddresses = 0;
let relationships = {};


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

    let legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

        let div = L.DomUtil.create('div', 'info legend');


        div.innerHTML = "<img src=colorLegend.png class=legend>";

        return div;
    };

    legend.addTo(mymap);

}

function testGeoCode() {
    var input = document.getElementById("addressInput").value;
    console.log(input);
    console.log("Getting coords from address");
    //getCoordsFromAddress(input);
    console.log("This test no longer works, this feature has been fully implmented");
}

function testBlueScale() {
    var input = document.getElementById("blueScaleInput").value;
    console.log(mapPercentToBlueScale(input));
}


function loadCSV() {
    var file = document.getElementById("fileInput").files[0];

    var fr = new FileReader();
    fr.onload = function (e) {
        var text = e.target.result;
        var lines = text.split('\n');
        let csvTransactions = new Array();
        for (var i = 0; i < lines.length; i++) {
            csvTransactions.push(lines[i].split(','));
        }

        financialData = formatFinancialData(csvTransactions);
        allTransactions = formatAllTransactions(csvTransactions);

        relationships = getTransactionRelationships(allTransactions);
        updateRelationshipOutput();
        updateSpendingAnalysis();

        applyGeoCodesForFinancialData();

    };

    fr.readAsText(file)
}

// Sums all the total amounts for transactions at the same address
function formatFinancialData(data) {
    let formattedData = new Array();
    let amountCol = getAmountColumnFromCSV(data);
    let addressCol = getAddressColumnFromCSV(data);

    let id = 0;
    // Aggregate transactions with the same address into lump amounts
    for (let i = 1; i < data.length; i++) {
        let row = {};
        let address = data[i][addressCol];
        console.log(address);
        if (address != null) {
            let amount = parseFloat(data[i][amountCol]);
            address = address.split("  ")[0];
            if (amount < 0) {
                let wasDuplicate = false;
                for (let j = 0; j < formattedData.length; j++) {
                    if (formattedData[j].address == address) {
                        formattedData[j].amount += amount;
                        formattedData[j].totalVisits++;
                        wasDuplicate = true;
                    }
                }

                if (!wasDuplicate) {
                    row.address = address;
                    row.amount = amount;
                    row.id = id;
                    row.totalVisits = 1;
                    id++;
                    formattedData.push(row);
                    uniqueAddresses++;
                }
            }

        } else {
            console.log("Address was null: " + i);
        }
    }

    console.log("Formatted data: ");
    console.log(formattedData);
    return formattedData;
}

function formatAllTransactions(data) {
    let allTransactions = new Array();
    let amountCol = getAmountColumnFromCSV(data);
    let addressCol = getAddressColumnFromCSV(data);
    let dateCol = getDateColumnFromCSV(data);
    let id = 0;

    // Start at 1 to skip header row
    for (let i = 1; i < data.length; i++) {
        let row = {};
        let address = data[i][addressCol];
        if(address != null) {
            row.address = address.split("  ")[0];
            row.amount = data[i][amountCol];
            row.date = data[i][dateCol];
            row.id = id;
            id++;
            allTransactions.push(row);
        }

    }

    console.log("All transcations");
    console.log(allTransactions);
    return allTransactions;


}

// Pass in CSV array String[][]
function getAddressColumnFromCSV(data) {
    for (let i = 0; i < data[0].length; i++) {
        if (data[0][i] == "Description") {
            return i;
        }
    }
    console.log("Address Column could not be identified check CSV heading is 'Description' ");
    return 0;
}

// Pass in CSV array String[][]
function getAmountColumnFromCSV(data) {
    for (let i = 0; i < data[0].length; i++) {
        if (data[0][i] == "Amount") {
            return i;
        }
    }
    console.log("Amount Column could not be identified check CSV heading is 'Amount' ");
    return 0;
}

// Pass in CSV array String[][]
function getDateColumnFromCSV(data) {
    for (let i = 0; i < data[0].length; i++) {
        if (data[0][i] == "Posting Date") {
            return i;
        }
    }
    console.log("Date Column could not be identified check CSV heading is 'Posting Date' ");
    return 0;
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

            const myCustomColour = mapPercentToBlueScale(financialData[i].amount / -100);
            console.log("color: " + myCustomColour);
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


            let marker = L.marker([financialData[i].location.lat, financialData[i].location.lng], {icon: icon});

            marker.on('mouseover', function (e) {
                //open popup;
                let popup = L.popup()
                    .setLatLng(e.latlng)
                    .setContent('Address: ' + financialData[i].address + '\n' + 'Amount: ' + financialData[i].amount)
                    .openOn(mymap);
            });

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
        let sectionPercent = percentToRange(1 - ((percent - .25) / .25), 51, 255);
        return rgbToHex({red: 51, green: 255, blue: sectionPercent});
    } else if (percent <= .75) {
        let sectionPercent = percentToRange(((percent - .5) / .25), 51, 255);
        return rgbToHex({red: sectionPercent, green: 255, blue: 51});
    } else if (percent <= 1) {
        let sectionPercent = percentToRange(1 - ((percent - .75) / .25), 51, 255);
        return rgbToHex({red: 255, green: sectionPercent, blue: 51});
    } else {
        return rgbToHex({red: 255, green: 51, blue: 51});
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
    return "#" + componentToHex(rgb.red) + componentToHex(rgb.green) + componentToHex(rgb.blue);
}


// Return a list with the probiblity with locations that have an increased chance to happen at the same time
// List format {primary: {address:String}, secondary: {address: String}, probility: double}[]
// Assumes that transactions are ordered by date!!!!
function getTransactionRelationships(allTransactions) {

    let graph = newGraph(allTransactions.length);
    let allTransactionsByDay = new Array();

    let lastDate = "";
    for (let i = 0; i < allTransactions.length; i++) {
        if (-1 != getIdFromAddress(financialData, allTransactions[i].address)) {
            if (allTransactions[i].date == lastDate) {
                // If still on the same day as the last transaction push this transaction onto the same day
                allTransactionsByDay[allTransactionsByDay.length - 1].push(allTransactions[i]);
            } else {
                // If this is a new day push this transaction onto a new list of transactions
                allTransactionsByDay.push(new Array());
                allTransactionsByDay[allTransactionsByDay.length - 1].push(allTransactions[i]);
                lastDate = allTransactions[i].date;
            }
        }

    }

    for (let i = 0; i < allTransactionsByDay.length; i++) {
        for (let j = 0; j < allTransactionsByDay[i].length; j++) {
            for (let k = 0; k < allTransactionsByDay[i].length; k++) {
                if (k != j) {
                    addEdgeTransaction(graph, allTransactionsByDay[i][j], allTransactionsByDay[i][k]);
                }
            }
        }
    }

    console.log("All Transaction By Day: ")
    console.log(allTransactionsByDay);
    console.log("Graph: ");
    console.log(graph);

    // We now have a graph that has all the individaul transactions with edges between the ones that happen on the same day
    // We can now getOtherTransactionsFor item A that happened on day D.
    // So we must get

    // Now we make another graph. this graph will only have one node per address
    // Then we increment the weight of edge for each connection between each place


    let addressGraph = newGraph(financialData.length);

    for (let i = 0; i < graph.length; i++) {
        let edges = getAdj(graph, i);
        let fromTransactionId = i;
        let fromAddressId = getIdFromAddress(financialData, getNodeFromId(allTransactions, fromTransactionId).address);

        for (let j = 0; j < edges.length; j++) {
            let toTransactionId = edges[j].to;
            let toAddressId = getIdFromAddress(financialData, getNodeFromId(allTransactions, toTransactionId).address);
            incrementEdge(addressGraph, fromAddressId, toAddressId);
        }
    }

    console.log("AddressGraph: ");
    console.log(addressGraph);

    // Now I have a graph that shows the number of times a purchase is made between location A and location B on the same day
    // Get probility that if I go to A I will go to B
    // The number of times that I went to A && B / times I went to A

    // Return a list with the probiblity with locations that have an increased chance to happen at the same time
    // List format {primary: {address:String}, secondary: {address: String}, probility: double}[]
    let relationships = new Array();

    // Loop through each location
    for (let i = 0; i < addressGraph.length; i++) {
        let edges = getAdj(addressGraph, i);
        for (let j = 0; j < edges.length; j++) {
            let row = {};
            row.primary = {};
            row.secondary = {};
            let toNode = getNodeFromId(financialData, i);
            row.primary.address = toNode.address;
            let fromNode =getNodeFromId(financialData, edges[j].to);
            row.secondary.address = fromNode.address;
            row.probiblitiy = edges[j].edgeVal / toNode.totalVisits;
            row.sampleSize = toNode.totalVisits;
            row.primary.amount = toNode.amount;
            row.secondary.amount = fromNode.amount;

            // Ignore self loops
            if (row.primary.address != row.secondary.address) {
                relationships.push(row);
            }

        }
    }

    console.log("Relationships:");
    console.log(relationships)
    return relationships;
}

function getNodeFromId(list, id) {
    for (let i = 0; i < list.length; i++) {
        if (list[i].id == id) {
            return list[i];
        }
    }
    console.log("Attempting to get Node from id that doesn't exist");
    return -1;
}

function getIdFromAddress(list, address) {
    for (let i = 0; i < list.length; i++) {
        if (list[i].address == address) {
            return list[i].id;
        }
    }
    console.log("Attempting to get Id from address that doesn't exist");
    return -1;
}

function printRelationships(minProbibility, minSampleSize, relationships) {
    let relationshipText = "";
    for (let i = 0; i < relationships.length; i++) {
        if (relationships[i].probiblitiy > minProbibility && relationships[i].sampleSize > minSampleSize) {
            let probibility = (relationships[i].probiblitiy * 100).toFixed(2);

            let line =
                `When going to "${relationships[i].primary.address}" you have a ${probibility} % chance to also go to ${relationships[i].secondary.address}.<br>`;
            relationshipText += line;
        }
    }
    return relationshipText;
}

function updateRelationshipOutput() {
    let probibilityInput = document.getElementById("probibilityInput").value;
    let sampleSizeInput = document.getElementById("sampleSizeInput").value;
    let minProbibility;
    let minSampleSize;

    if (probibilityInput == "") {
        minProbibility = 0;
    } else {
        minProbibility = parseFloat(probibilityInput);
    }

    if (sampleSizeInput == "") {
        minSampleSize = 0;
    } else {
        minSampleSize = parseInt(sampleSizeInput);
    }


    if (relationships != {}) {
        let outputText = printRelationships(minProbibility, minSampleSize, relationships);
        document.getElementById("output").innerHTML = outputText;
    }
}

function updateSpendingAnalysis() {
    let sampleSizeWeight = 1;
    let percentageWeight = 2;
    let amountWieght = 0.00001;

    if(relationships != {}) {
        let maxWeight = 0;
        let greatestWeightedIndex = null;
        for(let i = 0; i < relationships.length; i++) {
            let weight = relationships[i].probiblitiy * percentageWeight + relationships[i].sampleSize * sampleSizeWeight + (relationships[i].secondary.amount * amountWieght * -1);
            if(weight > maxWeight) {
                if(relationships[i].sampleSize > 1 && relationships[i].probiblitiy > .5) {
                    greatestWeightedIndex = i;
                    maxWeight = weight;
                }
            }
        }

        let outputArea = document.getElementById("analysisOutput");
        if(greatestWeightedIndex != null) {
            let primaryLocation = relationships[greatestWeightedIndex].primary.address;
            let secondaryLocation = relationships[greatestWeightedIndex].secondary.address;
            let amountSaved = relationships[greatestWeightedIndex].secondary.amount;

            // Format the amount
            amountSaved = -1 * amountSaved.toFixed(2);
            amountSaved = "$" + amountSaved;


            outputArea.innerHTML = "You should avoid going to " + primaryLocation + ". This will save you " + amountSaved + " at " + secondaryLocation + ".";
        } else {
            outputArea.innerText = "There were no meaningful relationships identified in your transaction history."
        }
    }
}


