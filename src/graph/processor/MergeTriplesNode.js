import { CodeNode } from "../CodeNode.js"
import { PORT } from "../nodeFactory.js"
import { Store } from "../../assets/bundle.js"
import { addRdfStringToStore, serializeStoreToTurtle } from "../../utils.js"

export class MergeTriplesNode extends CodeNode {
    constructor(name, x, y, editor, nodesMap) {
        super(name, [ PORT.TURTLE, PORT.TURTLE ], [ PORT.TURTLE ], x, y, editor, nodesMap, true)
        super.initCodemirror("turtle")
    }

    async runProcessor() {
        let store = new Store()
        for (let port of this.incomingData) {
            await addRdfStringToStore(port.data, store)
        }
        let mergeTurtle = await serializeStoreToTurtle(store)
        this.setValue(mergeTurtle)
    }
}
