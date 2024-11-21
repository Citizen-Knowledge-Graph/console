import { Parser, Store, Writer } from "n3"
import { QueryEngine } from "@comunica/query-sparql-rdfjs"
import Validator from "shacl-engine/Validator.js"
import rdf from "rdf-ext"

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

export function getRdfFactory() {
    return rdf
}

export function newValidator(dataset, options) {
    return new Validator(dataset, options)
}

window.bundle = { newParser, newWriter, newStore, newQueryEngine, getRdfFactory, newValidator }
