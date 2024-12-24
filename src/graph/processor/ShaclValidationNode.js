import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../nodeFactory.js"
import { Store } from "../../assets/bundle.js"
import { addRdfStringToStore, runValidationOnStore, serializeDatasetToTurtle } from "../../utils.js"

export class ShaclValidationNode extends CodeNode {
    constructor(name, x, y, graph) {
        super(name, [ PORT.TURTLE, PORT.TURTLE ], [ PORT.TURTLE ], x, y, graph, TYPE.PROCESSOR)
    }

    async processIncomingData() {
        let store = new Store()
        for (let port of this.incomingData) {
            await addRdfStringToStore(port.data, store)
        }
        let result = await runValidationOnStore(store)
        return await serializeDatasetToTurtle(result.dataset)
    }
}
