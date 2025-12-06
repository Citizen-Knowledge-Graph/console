import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { datasetToJsonLdObj, turtleToDataset } from "../../../assets/bundle.js"

export class TurtleToJsonLdConverterNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.JSONLD ], TYPE.CONVERTER)
    }

    async processIncomingData() {
        let dataset = await turtleToDataset(this.incomingData[0].data)
        let jsonLdObj = await datasetToJsonLdObj(dataset)
        return JSON.stringify(jsonLdObj, null, 2)
    }
}
