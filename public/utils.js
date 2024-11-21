async function fetchAsset(relPath) {
    const response = await fetch("assets/" + relPath, {
        method: "GET",
        cache: "reload"
    })
    return await response.text()
}

// type: "text/turtle"
async function download(content, type, filename) {
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

async function runSparqlSelectQueryOnRdfString(query, rdfStr) {
    let store = window.bundle.newStore()
    await addRdfStringToStore(rdfStr, store)
    const queryEngine = window.bundle.newQueryEngine()
    let bindingsStream = await queryEngine.queryBindings(query, { sources: [ store ] })
    return await bindingsStream.toArray()
}

function addRdfStringToStore(rdfStr, store) {
    return new Promise((resolve, reject) => {
        const parser = window.bundle.newParser()
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

function serializeStoreToTurtle(store) {
    return new Promise((resolve, reject) => {
        let writer = window.bundle.newWriter({
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
