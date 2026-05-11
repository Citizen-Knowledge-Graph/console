import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { Store } from "../../../assets/bundle.js"
import { addRdfStringToStore, serializeStoreToTurtle } from "../../../utils.js"

export class MergeTriplesNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.TURTLE ], [ PORT.TURTLE ], TYPE.PROCESSOR)
    }

    enoughIncomingDataAvailable() {
        return this.hasAsMuchIncomingDataAvailableAsIncomingEdges()
    }

    async processIncomingData() {
        try {
            let store = new Store()
            for (let port of this.incomingData) await addRdfStringToStore(port.data, store)
            return await serializeStoreToTurtle(store)
        } catch (err) {
            return this.handleError(err.message)
        }
    }

    addInputPort() {
        super.addInputPortOfType(PORT.TURTLE)
    }
}
