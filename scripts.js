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
    var output = document.getElementById("output");

    var fr = new FileReader();
    fr.onload = function(e) {
        var text = e.target.result;
        console.log(text);
        console.log("-------------------");
        var lines = text.split('\n');
        console.log(lines);
        var cells = new Array();
        for(var i = 0; i < lines.length; i++) {
            cells.push(lines[i].split(','));
        }
        console.log("-----------------------");
        console.log(cells);

        financialData = formatFinancialData(cells);
    };

    fr.readAsText(file)
}

function formatFinancialData(data) {
    var amountCol;
    var nameCol;
    var addressCol;

    for(var i = 0; i < data[0].length; i++) {
        if(data[0][i] == "Amount") {
            amountCol = i;
        } else if(data[0][i])
    }

}


