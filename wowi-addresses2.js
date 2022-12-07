const http = require("http")
const url = require('url')


/** Werte, die sich je nach Umgebung ändern können, sollten in Variablen gespeichert werden. **/
const baseUrl = "https://openwowi-demo.wowiport.de"
const apiKey = "439ca4ac-5e65-4783-97cd-3d56492295ea"
const username = "hackathon"
const password = "5olMnBRzaUrC9oIZA4w6%3B"

/** Dein Request-Listener holt die Liste der Adressen einmalig beim Starten des Servers.
 * Da sich die Wowi-Werte öndern können, sollten die Adressen bei jedem Call an localhost:5000 neu geholt werden.
 * Auf diese Art und Weise ist ein Call auch Stateless, es werden zu keinem Zeitpunkt Daten vorgehalten, die Auswirkungen auf andere Calls haben */
const host = "localhost"
const port = 5000
const requestListener = function (req, res) {
    const pathname = url.parse(req.url).pathname;
    /** Der Browser versucht das Favicon vom Server zu holen. Bei deiner Variante liefert der Server wieder die Adressen zurück.*/
    if (req.method === 'GET' && pathname === '/favicon.ico') {
        res.setHeader('Content-Type', 'image/x-icon');
        res.end()
        return
    }
    /** Die Pagination-Parameter (s.u.) können über z.B. Queryparameter an der Server weitergegeben werden */
    const queryObject = url.parse(req.url, true).query;
    getAddresses(queryObject.limit, queryObject.offset).then(addresses => {
        res.writeHead(200, {"Content-Type": "application/json"})
        res.end(JSON.stringify(addresses))
    }).catch(err => {
        res.writeHead(500)
        res.end(err)
    })
}
const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`)
});

// getting authentication
async function getAccessToken() {
    const data = "grant_type=password&username=" + username + "&password=" + password + "&refresh_token=3600"
    const bodyLength = data.length
    const response = await fetch(baseUrl + "/oauth2/token", {
        method: "POST",
        headers: {
            "accept": "text/plain",
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": `${bodyLength}`,
        },
        body: data
    })
    return (await response.json()).access_token
}

async function getPage(headers, limit = 100, offset = 0) {
    console.log("limit: " + limit)
    console.log("offset: " + offset)
    const response = await fetch(
        baseUrl + "/openwowi/v1.0/CommercialInventory/UseUnits?apiKey=" + apiKey + "&limit=" + limit + "&offset=" + offset,
        {method: "GET", headers: headers}
    )
    const useUnits = await response.json()
    return useUnits.map(useUnit => mapAddress(useUnit.EstateAddress))
}

function mapAddress(address) {
    return address.StreetComplete + ", " + address.Zip + " " + address.Town
}

/** Meiner Meinung nach ist das async-await-pattern leichter lesbar
 * Wenn ich es richtig in Erinnerung habe, sollten die Adressen von Nutzungseinheiten und nciht von Personen herausgesucht werden.
 * Du hast auch nicht die Adressen aller Personen abgeholt, sondern nur die der ersten 100 Personen (limit=100).
 * Mit dem zweiten Queryparameter "offset" kannst du festlegen, ab welchem Wert die Liste, die der Wowi-Endpunkt zurückgibt, anfangen soll.
 * "Limit-Offset" ist eine Möglichkeit wie Pagination umgesetzt werden kann. Eine andere Möglichkeit ist "Page-Pagesize".
 * Alle Elemente innerhalb einer Struktur sollten dieselbe Struktur haben. Deine Liste beinhaltet Listen und einzelne Elemente.
 * Besser wäre es, die einzelnen Elemente auch in Listen zu verpacken.
 * Meine Implementierung gibt eine einfache Liste mit distinkten Adressen zurück */
async function getAddresses(limit, offset) {
    const accessToken = await getAccessToken()
    const headers = new Headers([["Authorization", `Bearer ${accessToken}`]])
    return (await getPage(headers, limit, offset)).filter((address, pos, self) => self.indexOf(address) === pos)
}
