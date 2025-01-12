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

export const TYPE = {
    INPUT: 0,
    PROCESSOR: 1,
    VIEW: 2,
    VIEW_LEAF: 3,
    EDIT: 4,
    LOGIC: 5
}

export const PORT = {
    ANY: 0,
    TURTLE: 1,
    SPARQL: 2,
    CSV: 3,
    MARKDOWN: 4
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
    "MarkdownNode": MarkdownNode
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

ff:SimpleBenefitShape1 a sh:NodeShape ;
    sh:targetClass ff:Citizen ;
    sh:property [
        sh:path ff:hasAge ;
        sh:minCount 1 ;
        sh:minInclusive 18 ;
    ] .`,
    "ex_TurtleInputNode_RP2": `@prefix ff: <https://foerderfunke.org/default#> .
@prefix sh: <http://www.w3.org/ns/shacl#> .

ff:SimpleBenefitShape2 a sh:NodeShape ;
    sh:targetClass ff:Citizen ;
    sh:property [
        sh:path ff:hasResidence ;
        sh:minCount 1 ;
        sh:hasValue "Berlin" ;
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
}`
}

export function factoryCreateNode(nodeClass, initialValues, graph) {
    if (!nodeClasses[nodeClass]) {
        console.warn(`No node class found for: ${nodeClass}`)
        return null
    }
    return new nodeClasses[nodeClass](initialValues, graph)
}
