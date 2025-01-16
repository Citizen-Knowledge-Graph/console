# semOps: linked data operations flow tool

Right-click to add new nodes.

## Development

```shell
npm install
npm run build
```

Serve `index.html` with a local server. For instance via `npx http-server`, `python3 -m http.server` or a built-in server of your IDE. 


## Feature ideas:
- Backend can be switched out: in-browser session (default), remote triplestore, local java server, etc.
- Frontend can be switched out: e.g. use Miro or Mural
- Pull data in live from other sources
- Use standards for exported Turtle, maybe [RDF Connect](https://github.com/rdf-connect)
- Export an entire ready-to-execute implementation in different programming languages based on the flow graph
- Support RDF-star (e.g. for tagging and versioning)
- Group nodes together and optionally collapse them visually into one node
- Logical nodes: e.g. use this input if existent, otherwise that
- Loop and inference nodes: do this x many times or do this until these construct queries don't produce new triples anymore
- Layout algorithms for the flow graph
- Option to rerun single nodes or branches downwards
- Animated step by step run
- Dark mode
- Node executing JavaScript
- Copy-paste nodes
- Multi-select by dragging open a rectangle
- ... your idea?
