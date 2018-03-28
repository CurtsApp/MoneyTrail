function getCoordsFromAddress(address) {
    //Google GeoCoding API Key
    var key = "AIzaSyA4DbWdZGYBZW1zPe98k8SYYuhdYUfyIyQ";
    var url = "https://maps.googleapis.com/maps/api/geocode/json";
    var formattedAddress = address;
    //https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=YOUR_API_KEY
    console.log("Request= ");
    console.log(url + "?address=" + formattedAddress + "&key=" + key);

    return fetch(url + "?address=" + formattedAddress + "&key=" + key)
        .then(function (res) {
            return res.json();
        });
}





