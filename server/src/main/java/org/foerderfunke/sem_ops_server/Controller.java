package org.foerderfunke.sem_ops_server;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class Controller {

    @GetMapping("/sparqlToSpin")
    public String sparqlToSpin(@RequestParam(name = "sparql") String sparql) {

        Converter converter = new Converter();
        converter.sparqlToSpin();

        return "TODO";
    }
}
