var financialData;

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
        var cells = new Array();
        for(var i = 0; i < lines.length; i++) {
            cells.push(lines[i].split(','));
        }

        financialData = formatFinancialData(cells);
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

    for(let i = 0; i < financialData.length; i++) {
        var geoCode = getCoordsFromAddress(financialData[i].address);
        geoCode.then((json) => {
            financialData[i].prettyAddress = json.results[0].formatted_address;
            financialData[i].location = json.results[0].geometry.location;
            console.log(financialData);
        });
    }
}


