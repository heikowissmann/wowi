
/** API Call start*/

// getting authentication
async function postData(url, data) {
  const bodyLength = data.length
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "accept": "text/plain",
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": bodyLength,
    },
    body: data
  });
  return response.json();
}

postData("https://openwowi-demo.wowiport.de/oauth2/token", "grant_type=password&username=hackathon&password=5olMnBRzaUrC9oIZA4w6%3B&refresh_token=3600")
  .then((data) => {
    let myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${data.access_token}`)

    // Getting the json data
    fetch("https://openwowi-demo.wowiport.de/openwowi/v1.0/PersonsRead/Persons?apiKey=439ca4ac-5e65-4783-97cd-3d56492295ea&limit=100&includeCommunication=false&includeAddress=true&includeBankaccount=false",
      {
        method: "GET",
        headers: myHeaders
      })
      .then((response) => response.json())
      .then((wowiData) => {
        let addresses = wowiData.map((element) => {

          let addressCount = 0;
          if (element.Addresses[addressCount + 1]) {
            let count = addressCount + 1
            return [
              `${element.Addresses[addressCount].StreetComplete}, ${element.Addresses[addressCount].Zip} ${element.Addresses[addressCount].Town}`,
              `${element.Addresses[count].StreetComplete}, ${element.Addresses[count].Zip} ${element.Addresses[count].Town}`
            ]
          } else {
            return `${element.Addresses[addressCount].StreetComplete}, ${element.Addresses[addressCount].Zip} ${element.Addresses[addressCount].Town}`
          }

        })
        console.log(addresses)

        http.createServer(function (req, res) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(addresses));
        }).listen(5000);
      });
  });


/* API call end* */


var http = require("http");