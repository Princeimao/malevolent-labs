import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FAQ_DATA } from "@/constants";

export default function Faq() {
  return (
    <section className="py-11 md:py-20">
      <div className="max-w-3xl mx-auto px-4 md:px-6 flex flex-col gap-10">
        <div className="flex flex-col gap-4 items-center justify-center text-center">
          <Badge
            variant={"outline"}
            className="px-3 py-1 h-auto text-sm font-normal"
          >
            FAQ
          </Badge>
          <h2 className="md:text-5xl text-3xl font-medium mx-auto">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground text-base max-w-xl">
            Everything you need to know about practicing interviews on the
            platform.
          </p>
        </div>

        <Accordion className="border-border bg-background/60 backdrop-blur-sm">
          {FAQ_DATA.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
