import { PrefixesNode } from "./node/input/PrefixesNode.js"
import { TurtleInputNode } from "./node/input/TurtleInputNode.js"
import { SparqlInputNode } from "./node/input/SparqlInputNode.js"
import { SparqlSelectExecNode } from "./node/processor/SparqlSelectExecNode.js"
import { SparqlConstructExecNode } from "./node/processor/SparqlConstructExecNode.js"
import { MergeTriplesNode } from "./node/processor/MergeTriplesNode.js"
import { ShaclValidationNode } from "./node/processor/ShaclValidationNode.js"
import { OutputViewNode } from "./node/view/OutputViewNode.js"
import { SparqlInsertDeleteExecNode } from "./node/processor/SparqlInsertDeleteExecNode.js"
import { ShaclFormLibNode } from "./node/edit/ShaclFormLibNode.js"
import { ShaclFormNode } from "./node/edit/ShaclFormNode.js"
import { OutputViewLeafNode } from "./node/view/OutputViewLeafNode.js"
import { MultiplexerLogicNode } from "./node/logic/MultiplexerLogicNode.js"
import { OutputViewNodeWithInitialInput } from "./node/input/OutputViewNodeWithInitialInput.js"
import { TurtleInputNodeWithCopyPasteInPort } from "./node/input/TurtleInputNodeWithCopyPasteInPort.js"
import { ShaclWizardNode } from "./node/edit/ShaclWizardNode.js"
import { MarkdownNode } from "./node/input/MarkdownNode.js"
import { GraphVisuNode } from "./node/view/GraphVisuNode.js"
import { ShaclQuizFormNode } from "./node/edit/ShaclQuizFormNode.js"
import { OutputViewTableLeafNode } from "./node/view/OutputViewTableLeafNode.js"
import { ExternalTurtleFilesInputNode } from "./node/input/ExternalTurtleFilesInputNode.js"
import { ExternalSparqlEndpointInputNode } from "./node/input/ExternalSparqlEndpointInputNode.js"
import { JavaScriptInputNode } from "./node/input/JavaScriptInputNode.js"
import { JavaScriptExecNode } from "./node/processor/JavaScriptExecNode.js"
import { TurtleToJsonLdConverterNode } from "./node/converter/TurtleToJsonLdConverterNode.js"
import { JsonLdToTurtleConverterNode } from "./node/converter/JsonLdToTurtleConverterNode.js"
import { JsonLdInputNode } from "./node/input/JsonLdInputNode.js"

export const TYPE = {
    INPUT: 0,
    PROCESSOR: 1,
    CONVERTER: 2,
    VIEW: 3,
    VIEW_LEAF: 4,
    EDIT: 5,
    LOGIC: 6
}

export const PORT = {
    ANY: 0,
    TURTLE: 1,
    JSONLD: 2,
    SPARQL: 3,
    CSV: 4,
    MARKDOWN: 6,
    SPARQL_ENDPOINT: 7,
    JAVASCRIPT: 7,
}

export const VIEW_MODE = {
    DEFAULT: 0, // content directly displayed on node
    BUTTON: 1 // only a button that triggers a modal showing the content
}

const nodeClasses = {
    "PrefixesNode": PrefixesNode,
    "TurtleInputNode": TurtleInputNode,
    "SparqlInputNode": SparqlInputNode,
    "SparqlSelectExecNode": SparqlSelectExecNode,
    "SparqlConstructExecNode": SparqlConstructExecNode,
    "MergeTriplesNode": MergeTriplesNode,
    "ShaclValidationNode": ShaclValidationNode,
    "OutputViewNode": OutputViewNode,
    "SparqlInsertDeleteExecNode": SparqlInsertDeleteExecNode,
    "ShaclFormLibNode": ShaclFormLibNode,
    "ShaclFormNode": ShaclFormNode,
    "OutputViewLeafNode": OutputViewLeafNode,
    "MultiplexerLogicNode": MultiplexerLogicNode,
    "OutputViewNodeWithInitialInput": OutputViewNodeWithInitialInput,
    "TurtleInputNodeWithCopyPasteInPort": TurtleInputNodeWithCopyPasteInPort,
    "ShaclWizardNode": ShaclWizardNode,
    "MarkdownNode": MarkdownNode,
    "GraphVisuNode": GraphVisuNode,
    "ShaclQuizFormNode": ShaclQuizFormNode,
    "OutputViewTableLeafNode": OutputViewTableLeafNode,
    "ExternalTurtleFilesInputNode": ExternalTurtleFilesInputNode,
    "ExternalSparqlEndpointInputNode": ExternalSparqlEndpointInputNode,
    "JavaScriptExecNode": JavaScriptExecNode,
    "JavaScriptInputNode": JavaScriptInputNode,
    "TurtleToJsonLdConverterNode": TurtleToJsonLdConverterNode,
    "JsonLdToTurtleConverterNode": JsonLdToTurtleConverterNode,
    "JsonLdInputNode": JsonLdInputNode
}

export const exampleData = {
    "ex_PrefixesNode_ff": `rdf: http://www.w3.org/1999/02/22-rdf-syntax-ns#
xsd: http://www.w3.org/2001/XMLSchema#
ff:  https://foerderfunke.org/default#
sh:  http://www.w3.org/ns/shacl#`,
    "ex_TurtleInputNode_UP": `@prefix ff: <https://foerderfunke.org/default#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ff:mainPerson a ff:Citizen ;
    ff:hasBirthday "1990-01-02"^^xsd:date .`,
    "ex_TurtleInputNode_RP1": `@prefix ff: <https://foerderfunke.org/default#> .
@prefix sh: <http://www.w3.org/ns/shacl#> .

ff:SimpleBenefit1 a sh:NodeShape ;
    sh:targetClass ff:Citizen ;
    sh:property [
        sh:path ff:hasAge ;
        sh:minCount 1 ;
        sh:minInclusive 18 ;
    ] .`,
    "ex_TurtleInputNode_RP2": `@prefix ff: <https://foerderfunke.org/default#> .
@prefix sh: <http://www.w3.org/ns/shacl#> .

ff:SimpleBenefit2 a sh:NodeShape ;
    sh:targetClass ff:Citizen ;
    sh:property [
        sh:path ff:hasResidence ;
        sh:minCount 1 ;
        sh:in ("Berlin") ;
    ] .`,
    "ex_SparqlInputNode_MatRule": `PREFIX ff: <https://foerderfunke.org/default#>
CONSTRUCT {
    ?person ff:hasAge ?age .
} WHERE {
    ?person ff:hasBirthday ?bday .
    BIND(YEAR(NOW()) - YEAR(?bday) - IF(MONTH(NOW()) < MONTH(?bday) || (MONTH(NOW()) = MONTH(?bday) && DAY(NOW()) < DAY(?bday)), 1, 0) AS ?age) .
}`,
    "ex_SparqlInputNode_Select": `PREFIX ff: <https://foerderfunke.org/default#>
SELECT * WHERE {
    ?s ?p ?o.
}`,
    "ex_SparqlInputNode_InsertData": `PREFIX ff: <https://foerderfunke.org/default#>
INSERT DATA {
    ff:mainPerson ff:hasResidence "Berlin" .
}`,
    "ex_SparqlInputNode_DeleteInsert": `PREFIX ff: <https://foerderfunke.org/default#>
DELETE {
    ?user ff:hasBirthday ?bday .
} INSERT {
    ?user ff:hasResidence "Munich" .
} WHERE { 
    ?user a ff:Citizen ;
        ff:hasBirthday ?bday .
}`,
    "ex_JavaScriptInputNode_JsonArrToTripleStore": `let store = newStore()
const a = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
const ff = function(localName) { return "https://foerderfunke.org/default#" + localName }
let count = 0

for (let element of JSON.parse(input)) {
  let individual = ff("class" + (count ++))
  addTripleToStore(store, individual, a, ff("Class"))
  addTripleToStore(store, individual, ff("hasTitle"), element.Title)
  // ...
}

return storeToTurtle(store)`
}

export function factoryCreateNode(nodeClass, initialValues, graph) {
    if (!nodeClasses[nodeClass]) {
        console.warn(`No node class found for: ${nodeClass}`)
        return null
    }
    return new nodeClasses[nodeClass](initialValues, graph)
}
