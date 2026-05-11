import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { datasetToTurtle, jsonLdObjToDataset } from "../../../assets/bundle.js"

export class JsonLdToTurtleConverterNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.JSONLD ], [ PORT.TURTLE ], TYPE.CONVERTER)
    }

    async processIncomingData() {
        let jsonLdObj = JSON.parse(this.incomingData[0].data)
        let dataset = await jsonLdObjToDataset(jsonLdObj)
        return await datasetToTurtle(dataset)
    }
}
