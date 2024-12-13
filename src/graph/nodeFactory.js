import { PrefixesNode } from "./input/PrefixesNode.js"
import { TurtleInputNode } from "./input/TurtleInputNode.js"
import { SparqlInputNode } from "./input/SparqlInputNode.js"
import { SparqlSelectExecNode } from "./processor/SparqlSelectExecNode.js"
import { SparqlConstructExecNode } from "./processor/SparqlConstructExecNode.js"
import { MergeTriplesNode } from "./processor/MergeTriplesNode.js"
import { ShaclValidationNode } from "./processor/ShaclValidationNode.js"
import { TextViewNode } from "./view/TextViewNode.js"

export const TYPE = {
    INPUT: 0,
    PROCESSOR: 1,
    VIEW: 2
}

export const PORT = {
    ANY: 0,
    TURTLE: 1,
    SPARQL: 2,
    CSV: 3
}

const nodeClasses = {
    "PrefixesNode": PrefixesNode,
    "TurtleInputNode": TurtleInputNode,
    "SparqlInputNode": SparqlInputNode,
    "SparqlSelectExecNode": SparqlSelectExecNode,
    "SparqlConstructExecNode": SparqlConstructExecNode,
    "MergeTriplesNode": MergeTriplesNode,
    "ShaclValidationNode": ShaclValidationNode,
    "TextViewNode": TextViewNode
}

const exampleValues = {
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
}`
}

export function createNode(command, name, x, y, editor, nodesMap, originalCommand) {
    if (!nodeClasses[command]) {
        console.warn(`No node class found for: ${command}`)
        return null
    }
    let node = new nodeClasses[command](name, x, y, editor, nodesMap)
    if (originalCommand) node.setValue(exampleValues[originalCommand])
    return node
}
