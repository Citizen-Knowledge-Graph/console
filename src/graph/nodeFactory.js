import { TurtleInputNode } from "./input/TurtleInputNode.js"
import { SparqlInputNode } from "./input/SparqlInputNode.js"
import { SparqlConstructExecNode } from "./processor/SparqlConstructExecNode.js"
import { MergeTriplesNode } from "./processor/MergeTriplesNode.js"
import { ShaclValidationNode } from "./processor/ShaclValidationNode.js"

export const TYPE = {
    INPUT: 1,
    PROCESSOR: 2
}

export const PORT = {
    TURTLE: 1,
    SPARQL: 2
}

const nodeClasses = {
    "TurtleInputNode": TurtleInputNode,
    "SparqlInputNode": SparqlInputNode,
    "SparqlConstructExecNode": SparqlConstructExecNode,
    "MergeTriplesNode": MergeTriplesNode,
    "ShaclValidationNode": ShaclValidationNode
}

const exampleValues = {
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
