import { Parser as N3Parser, Store } from "n3"
import { QueryEngine } from "@comunica/query-sparql-rdfjs"

export async function runSparqlSelectQueryOnRdfString(query, rdfStr) {
    let store = new Store()
    await addRdfStringToStore(rdfStr, store)
    const queryEngine = new QueryEngine()
    let bindingsStream = await queryEngine.queryBindings(query, { sources: [ store ] })
     return await bindingsStream.toArray()
}

function addRdfStringToStore(rdfStr, store) {
    return new Promise((resolve, reject) => {
        const parser = new N3Parser()
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
