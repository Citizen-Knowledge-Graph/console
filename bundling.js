import { Parser, Store } from "n3"
import { QueryEngine } from "@comunica/query-sparql-rdfjs"

export function newParser() {
    return new Parser()
}

export function newStore() {
    return new Store()
}

export function newQueryEngine() {
    return new QueryEngine()
}

window.bundle = { newParser, newStore, newQueryEngine }
