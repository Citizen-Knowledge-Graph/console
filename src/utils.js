import { Parser, QueryEngine, rdf, Store, Validator, Writer } from "./assets/bundle.js"

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

export async function runSparqlSelectQueryOnRdfString(query, rdfStr) {
    let store = new Store()
    await addRdfStringToStore(rdfStr, store)
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

export async function runSparqlConstructQueryOnRdfString(query, rdfStr) {
    let store = new Store()
    await addRdfStringToStore(rdfStr, store)
    const queryEngine = new QueryEngine()
    let quadsStream = await queryEngine.queryQuads(query, { sources: [ store ] })
    return await quadsStream.toArray()
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

export function serializeStoreToTurtle(store) {
    return new Promise((resolve, reject) => {
        let writer = new Writer({
            prefixes: {
                rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                ff: "https://foerderfunke.org/default#",
                sh: "http://www.w3.org/ns/shacl#",
            }
        })
        store.getQuads().forEach(quad => writer.addQuad(quad))
        writer.end((error, result) => {
            if (error) {
                reject(error)
            } else {
                resolve(result)
            }
        })
    })
}

export function serializeDatasetToTurtle(dataset) {
    return new Promise((resolve, reject) => {
        let writer = new Writer({
            prefixes: {
                ff: "https://foerderfunke.org/default#",
                sh: "http://www.w3.org/ns/shacl#",
            }
        })
        dataset.forEach(quad => writer.addQuad(quad))
        writer.end((error, result) => {
            if (error) {
                reject(error)
            } else {
                resolve(result)
            }
        })
    })
}

export async function runValidationOnStore(store) {
    let dataset = rdf.dataset(store.getQuads())
    let validator = new Validator(dataset, { factory: rdf, debug: false })
    return await validator.validate({ dataset: dataset })
}

export function buildEdgeId(editorConnectionObj) {
    let outId = editorConnectionObj.output_id
    let outPortId = editorConnectionObj.output_class
    let inId = editorConnectionObj.input_id
    let inPortId = editorConnectionObj.input_class
    return `${outId}-${outPortId}-${inId}-${inPortId}`
}

export function getTimestamp() {
    const now = new Date()
    const pad = n => n.toString().padStart(2, "0")
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
}
