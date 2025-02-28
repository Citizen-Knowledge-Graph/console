import { Parser, QueryEngine, rdf, Store, Validator, sparqlValidations, slugify, formatsPretty } from "./assets/bundle.js"

export async function fetchAsset(relPath) {
    const response = await fetch("assets/" + relPath, {
        method: "GET",
        cache: "reload"
    })
    return await response.text()
}

// type: "text/turtle"
export function download(content, type, filename) {
    let blob = new Blob([content], {type: type})
    let url = URL.createObjectURL(blob)
    let a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
}

export function downloadGraph(name, turtle) {
    let namePart = name ? `${slugify(name, {lower: true})}_` : ""
    download(turtle, "text/turtle", `semOps_export_${namePart}${getTimestamp()}.ttl`)
}

/*
let rpsDir = await fetchAsset("rps-dir.txt")

<input type="file" id="fileUpload" />
<div onclick="download('foo', 'text/plain', 'file.txt')">dev</div>-
<div onclick="func()">dev</div>

document.getElementById("fileUpload").addEventListener("change", function() {
    const reader = new FileReader()
    reader.onload = function(event) {
        const content = event.target.result
        console.log("File content:", content)
    }
    const file = this.files[0]
    reader.readAsText(file)
})
*/

export async function runSparqlSelectQueryOnStore(query, store) {
    const queryEngine = new QueryEngine()
    let bindingsStream = await queryEngine.queryBindings(query, { sources: [ store ] })
    let bindings = await bindingsStream.toArray()
    let results = []
    bindings.forEach(binding => {
        const variables = Array.from(binding.keys()).map(({ value }) => value)
        let row = {}
        variables.forEach(variable => {
            row[variable] = binding.get(variable).value
        })
        results.push(row)
    })
    return results
}

export async function runSparqlSelectQueryOnRdfString(query, rdfStr) {
    let store = new Store()
    await addRdfStringToStore(rdfStr, store)
    return await runSparqlSelectQueryOnStore(query, store)
}

export async function runSparqlConstructQueryOnStore(query, store) {
    const queryEngine = new QueryEngine()
    let quadsStream = await queryEngine.queryQuads(query, { sources: [ store ] })
    return await quadsStream.toArray()
}

export async function runSparqlConstructQueryOnRdfString(query, rdfStr) {
    let store = new Store()
    await addRdfStringToStore(rdfStr, store)
    return await runSparqlConstructQueryOnStore(query, store)
}

export async function runSparqlInsertDeleteQueryOnStore(query, store) {
    const queryEngine = new QueryEngine()
    await queryEngine.queryVoid(query, { sources: [store] })
}

export function addRdfStringToStore(rdfStr, store) {
    return new Promise((resolve, reject) => {
        const parser = new Parser()
        parser.parse(rdfStr, (err, quad) => {
            if (err) {
                console.error(err)
                reject(err)
            }
            if (quad) {
                store.add(quad)
            } else {
                resolve(store)
            }
        })
    })
}

export function datasetToStore(dataset) {
    let store = new Store()
    dataset.forEach(quad => store.add(quad))
    return store
}

export const prefixes = {
    ff: "https://foerderfunke.org/default#",
    sh: "http://www.w3.org/ns/shacl#",
    xsd: "http://www.w3.org/2001/XMLSchema#",
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    foaf: "http://xmlns.com/foaf/0.1/",
    m8g: "http://data.europa.eu/m8g/",
    // wdt: "http://www.wikidata.org/prop/direct/",
    // wd: "http://www.wikidata.org/entity/",
    // rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    // schema: "http://schema.org/"
}

export async function serializeStoreToTurtle(store) {
    let ds = rdf.dataset(store.getQuads())
    return await serializeDatasetToTurtle(ds)
}

export async function serializeDatasetToTurtle(dataset) {
    // do both of the next steps once initially? TODO
    rdf.formats.import(formatsPretty)
    const prefixesArr = Object.entries(prefixes).map(
        ([prefix, iri]) => [prefix, rdf.namedNode(iri)]
    )
    return await rdf.io.dataset.toText("text/turtle", dataset, { prefixes: prefixesArr })
}

export async function runValidationOnStore(store, debug = false, details = false) {
    let dataset = rdf.dataset(store.getQuads())
    let validator = new Validator(dataset, { factory: rdf, debug: debug, details: details, validations: sparqlValidations })
    return await validator.validate({ dataset: dataset })
}

export function buildEdgeId(conn) {
    let outId = conn.output_id
    let outPortId = conn.output_class
    let inId = conn.input_id
    let inPortId = conn.input_class
    return `${outId}-${outPortId}-${inId}-${inPortId}`
}

export function getTimestamp() {
    const now = new Date()
    const pad = n => n.toString().padStart(2, "0")
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
}

export async function getDetailsFromGraphTurtle(turtle) {
    let query = `
        PREFIX ff: <https://foerderfunke.org/default#>
        SELECT * WHERE {
            ff:graph ff:hasName ?name
        }`
    let rows = await runSparqlSelectQueryOnRdfString(query, turtle)
    let details = {}
    if (rows.length > 0 && rows[0].name) details.name = rows[0].name
    return details
}

export function ensureUniqueId(name, map) {
    let id = slugify(name, { lower: true })
    if (!map.hasOwnProperty(id)) return id
    let i = 1
    while (map.hasOwnProperty(id + "_" + i)) i ++
    return id + "_" + i
}

export function expand(prefix, localName) {
    return prefixes[prefix] + localName
}

export function shrink(uri) {
    for (let prefix in prefixes) {
        if (uri.startsWith(prefixes[prefix])) {
            return `${prefix}:${uri.replace(prefixes[prefix], "")}`
        }
    }
    return uri
}

export function localName(uri) {
    return uri.split("#").pop().split("/").pop()
}

export function formatObject(val) {
    if (!val) return
    if (val.startsWith("http")) return `<${val}>`
    return isNumber(val) ? val : `"${val}"`
}

export function isNumber(val) {
    val += ""
    return !isNaN(val) && !isNaN(parseFloat(val))
}

export function randStr(length = 4) {
    return Math.random().toString(36).substring(2, 2 + length)
}

export function stripQuotes(str) {
    return str.replace(/^["']|["']$/g, '')
}
