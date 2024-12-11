import { TurtleInputNode } from "./TurtleInputNode.js"
import { SparqlConstructExecNode } from "./SparqlConstructExecNode.js"
import { SparqlInputNode } from "./SparqlInputNode.js"
import { MergeTriplesNode } from "./MergeTriplesNode.js"
import { ShaclValidationNode } from "./ShaclValidationNode.js"

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
    "MergeTriplesNode": MergeTriplesNode,
    "SparqlConstructExecNode": SparqlConstructExecNode,
    "ShaclValidationNode": ShaclValidationNode
}

export function createNode(command, name, x, y, editor, nodesMap) {
    if (!nodeClasses[command]) {
        console.warn(`No node class found for: ${command}`)
        return null
    }
    return new nodeClasses[command](name, x, y, editor, nodesMap)
}
