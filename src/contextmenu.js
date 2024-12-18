// Adapted from ChatGPT

const menuItems = [
    {
        label: "Input",
        submenu: [
            {
                label: "Prefixes", action: "PrefixesNode",
                submenu: [
                    { label: "Example: Prefixes", action: "ex_PrefixesNode_ff" }
                ]
            },
            {
                label: "Turtle Input", action: "TurtleInputNode",
                submenu: [
                    { label: "Example: User profile", action: "ex_TurtleInputNode_UP" },
                    { label: "Example: Requirement profile 1", action: "ex_TurtleInputNode_RP1" },
                    { label: "Example: Requirement profile 2", action: "ex_TurtleInputNode_RP2" },
                ]
            },
            { label: "SPARQL Input", action: "SparqlInputNode",
                submenu: [
                    { label: "Example: Materialization rule", action: "ex_SparqlInputNode_MatRule" },
                    { label: "Example: Select", action: "ex_SparqlInputNode_Select" },
                ]
            },
        ]
    },
    {
        label: "Processors",
        submenu: [
            { label: "Merge triples", action: "MergeTriplesNode" },
            { label: "Run SPARQL SELECT", action: "SparqlSelectExecNode" },
            { label: "Run SPARQL CONSTRUCT", action: "SparqlConstructExecNode" },
            { label: "Run SHACL validation", action: "ShaclValidationNode" },
        ]
    }
]

function buildMenu(items) {
    return items.map(item => {
        let hasSub = item.submenu && item.submenu.length > 0
        let actionAttr = item.action ? ' data-action="' + item.action + '" ' : ''
        let labelAttr = ' data-label="' + item.label + '" '
        if (hasSub) {
            return '<div class="sub"' + actionAttr + labelAttr + '>' +
                item.label + ' &#8250;' +
                '<div class="submenu">' + buildMenu(item.submenu) + '</div>' +
                '</div>'
        } else {
            return '<div' + actionAttr + labelAttr + '>' + item.label + '</div>'
        }
    }).join('')
}

export function setupContextMenu(event, callback) {
    event.preventDefault()
    let menu = document.getElementById('ctx-menu')
    if(!menu) {
        menu = document.createElement('div')
        menu.id = 'ctx-menu'
        menu.innerHTML = buildMenu(menuItems)
        document.body.appendChild(menu)
        menu.addEventListener('click', (e) => {
            let action = e.target.getAttribute('data-action')
            let label = e.target.getAttribute('data-label')
            if (action) callback(action, label, menu.pos.x, menu.pos.y)
            menu.style.display = 'none'
        })
        document.addEventListener('click', () => menu.style.display = 'none')
    }
    menu.pos = { x: event.pageX, y: event.pageY }
    menu.style.left = event.pageX + 'px'
    menu.style.top = event.pageY + 'px'
    menu.style.display = 'block'
}
