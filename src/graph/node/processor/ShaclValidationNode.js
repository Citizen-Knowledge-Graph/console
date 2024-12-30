import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { Store } from "../../../assets/bundle.js"
import { addRdfStringToStore, runValidationOnStore, serializeDatasetToTurtle } from "../../../utils.js"

export class ShaclValidationNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE, PORT.TURTLE ], [ PORT.TURTLE ], TYPE.PROCESSOR)
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
