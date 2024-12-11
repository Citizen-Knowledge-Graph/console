// Adapted from ChatGPT

/*const menuItems = [
    { text: "Item A", action: "foo" },
    {
        text: "Item B",
        submenu: [
            { text: "Subitem 1", action: "foo" },
            {
                text: "Subitem 2",
                submenu: [
                    { text: "Sub-subitem A", action: "bar" },
                    {
                        text: "Sub-subitem B",
                        submenu: [
                            { text: "Level 4 Item 1", action: "bar" },
                            { text: "Level 4 Item 2", action: "bar" }
                        ]
                    }
                ]
            }
        ]
    },
    { text: "Item C" }
]*/

const menuItems = [
    {
        text: "Input",
        submenu: [
            {
                text: "Turtle", action: "TurtleInputNode",
                submenu: [
                    { text: "Example: User profile", action: "ex_TurtleInputNode_User profile" },
                    { text: "Example: Requirement profile", action: "ex_TurtleInputNode_Requirement profile" },
                ]
            },
            { text: "SPARQL", action: "SparqlInputNode",
                submenu: [
                    { text: "Example: Materialization rule", action: "ex_SparqlInputNode_Materialization rule" },

                ]
            },
        ]
    },
    {
        text: "Processors",
        submenu: [
            { text: "SPARQL CONSTRUCT", action: "SparqlConstructExecNode" },
            { text: "Merge triples", action: "MergeTriplesNode" },
            { text: "SHACL validation", action: "ShaclValidationNode" },
        ]
    }
]

function buildMenu(items) {
    return items.map(item => {
        let hasSub = item.submenu && item.submenu.length > 0
        let actionAttr = item.action ? ' data-action="' + item.action + '"' : ''
        if (hasSub) {
            return '<div class="sub"' + actionAttr + '>' +
                item.text + ' >' +
                '<div class="submenu">' + buildMenu(item.submenu) + '</div>' +
                '</div>'
        } else {
            return '<div' + actionAttr + '>' + item.text + '</div>'
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
            const action = e.target.getAttribute('data-action')
            if (action) callback(action, menu.pos.x, menu.pos.y)
            menu.style.display = 'none'
        })
        document.addEventListener('click', () => menu.style.display = 'none')
    }
    console.log(event)
    menu.pos = { x: event.pageX, y: event.pageY }
    menu.style.left = event.pageX + 'px'
    menu.style.top = event.pageY + 'px'
    menu.style.display = 'block'
}
