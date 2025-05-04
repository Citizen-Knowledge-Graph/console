package org.foerderfunke.sem_ops_server;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class Controller {

    Converter converter = new Converter();

    @GetMapping("/sparqlToSpin")
    public String sparqlToSpin(@RequestParam(name = "sparql") String sparql) {
        return converter.sparqlToSpin(sparql);
    }
}
