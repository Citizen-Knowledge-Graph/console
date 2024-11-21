import { Parser, Store, Writer } from "n3"
import { QueryEngine } from "@comunica/query-sparql-rdfjs"

export function newParser() {
    return new Parser()
}

export function newWriter(params) {
    return new Writer(params)
}

export function newStore() {
    return new Store()
}

export function newQueryEngine() {
    return new QueryEngine()
}

window.bundle = { newParser, newWriter, newStore, newQueryEngine }
