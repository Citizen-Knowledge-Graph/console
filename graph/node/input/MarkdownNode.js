import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class MarkdownNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [], [ PORT.MARKDOWN ], TYPE.INPUT)
    }

    getMainHtml() {
        return `
            <div class="markdown-container" style="user-select: text; cursor: default; display: none"></div>
            <div class="codemirror-container"></div>
            <div class="bottom-menu">
                <span class="edit-btn">Edit</span> | <span class="view-btn">View</span>
            </div>`
    }

    switchToEditMode() {
        this.nodeDiv.querySelector(".markdown-container").style.display = "none"
        this.codemirrorContainer.style.display = "block"
    }

    switchToViewMode() {
        this.codemirrorContainer.style.display = "none"
        this.nodeDiv.querySelector(".markdown-container").innerHTML = marked.parse(this.getValue())
        this.nodeDiv.querySelector(".markdown-container").style.display = "block"
    }

    postConstructor() {
        super.postConstructor()
        this.nodeDiv.querySelector(".markdown-container").addEventListener("mousedown", event => event.stopPropagation())
        this.nodeDiv.querySelector(".edit-btn").addEventListener("click", () => this.switchToEditMode())
        this.nodeDiv.querySelector(".view-btn").addEventListener("click", () => this.switchToViewMode())
    }
}
