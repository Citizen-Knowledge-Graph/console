import { Parser, QueryEngine, rdf, Store, Validator, Writer } from "./assets/bundle.js"

export async function fetchAsset(relPath) {
    const response = await fetch("assets/" + relPath, {
        method: "GET",
        cache: "reload"
    })
    return await response.text()
}

// type: "text/turtle"
export async function download(content, type, filename) {
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
    return await bindingsStream.toArray()
}

export async function runSparqlConstructQueryOnRdfString(query, rdfStr) {
    let store = new Store()
    await addRdfStringToStore(rdfStr, store)
    const queryEngine = new QueryEngine()
    let quadsStream = await queryEngine.queryQuads(query, { sources: [ store ] })
    return await quadsStream.toArray()
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
                ff: "https://foerderfunke.org/default#"
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
