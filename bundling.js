import { Parser, Store, Writer, DataFactory } from "n3"
import { QueryEngine } from "@comunica/query-sparql-rdfjs"
import Validator from "shacl-engine/Validator.js"
import { validations as sparqlValidations } from "shacl-engine/sparql.js"
import rdf from "rdf-ext"
import formatsPretty from "@rdfjs/formats/pretty.js"
import { Parser as SparqlParser } from "sparqljs"
import Drawflow from "drawflow"
import CodeMirror from "codemirror"
import "codemirror/mode/turtle/turtle.js"
import "codemirror/mode/sparql/sparql.js"
import "codemirror/mode/markdown/markdown.js"
import "codemirror/mode/javascript/javascript.js"
import slugify from "slugify"
import JSZip from "jszip"
import { datasetToTurtle, jsonLdObjToDataset, datasetToJsonLdObj, turtleToDataset, addTriple, newStore, storeToTurtle } from "@foerderfunke/sem-ops-utils"

export {
    Parser, Store, Writer, DataFactory,
    QueryEngine,
    Validator,
    sparqlValidations,
    rdf,
    formatsPretty,
    SparqlParser,
    Drawflow,
    CodeMirror,
    slugify,
    JSZip,
    datasetToTurtle,
    jsonLdObjToDataset,
    datasetToJsonLdObj,
    turtleToDataset,
    addTriple,
    newStore,
    storeToTurtle
}
