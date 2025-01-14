import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class MarkdownNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [], [ PORT.MARKDOWN ], TYPE.INPUT)
    }

    getMainHtml() {
        return `
            <div class="markdown-container"></div>
            <div class="codemirror-container"></div>
            <div class="bottom-menu">
                <span class="edit-btn">Edit</span> | <span class="view-btn">View</span>
            </div>`
    }

    postConstructor() {
        super.postConstructor()
        this.markdown = this.nodeDiv.querySelector(".markdown-container")
        this.markdown.style.display = "none"
        this.nodeDiv.querySelector(".edit-btn").addEventListener("click", () => {
            this.markdown.style.display = "none"
            this.codemirrorContainer.style.display = "block"
        })
        this.nodeDiv.querySelector(".view-btn").addEventListener("click", () => {
            this.markdown.innerHTML = marked.parse(this.getValue())
            this.markdown.style.display = "block"
            this.codemirrorContainer.style.display = "none"
        })
    }
}
