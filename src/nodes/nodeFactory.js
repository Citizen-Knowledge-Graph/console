import { TurtleInputNode } from "./TurtleInputNode.js";
import { SparqlConstructExecNode } from "./SparqlConstructExecNode.js";

export const PORT = {
    ANY: 1,
    TURTLE: 2,
    SPARQL_SELECT: 3,
    SPARQL_CONSTRUCT: 4,
    SHACL: 5
}

const nodeClasses = {
    "TurtleInputNode": TurtleInputNode,
    "SparqlConstructExecNode": SparqlConstructExecNode,
}

export function createNode(command, name, x, y, editor, nodesMap) {
    if (!nodeClasses[command]) {
        console.warn(`No node class found for: ${command}`)
        return null
    }
    return new nodeClasses[command](name, x, y, editor, nodesMap)
}
