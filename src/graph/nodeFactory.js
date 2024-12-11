import { TurtleInputNode } from "./input/TurtleInputNode.js"
import { SparqlInputNode } from "./input/SparqlInputNode.js"
import { SparqlConstructExecNode } from "./processor/SparqlConstructExecNode.js"
import { MergeTriplesNode } from "./processor/MergeTriplesNode.js"
import { ShaclValidationNode } from "./processor/ShaclValidationNode.js"

export const PORT = {
    ANY: 1,
    TURTLE: 2,
    SPARQL: 3,
    SPARQL_SELECT: 4,
    SPARQL_CONSTRUCT: 5,
    SHACL: 6
}

const nodeClasses = {
    "TurtleInputNode": TurtleInputNode,
    "SparqlInputNode": SparqlInputNode,
    "SparqlConstructExecNode": SparqlConstructExecNode,
    "MergeTriplesNode": MergeTriplesNode,
    "ShaclValidationNode": ShaclValidationNode
}

export function createNode(command, name, x, y, editor, nodesMap) {
    if (!nodeClasses[command]) {
        console.warn(`No node class found for: ${command}`)
        return null
    }
    return new nodeClasses[command](name, x, y, editor, nodesMap)
}
