// Initial mock data to simulate an existing calendar state
export const INITIAL_EVENTS = [
  {
    id: 'evt_1',
    summary: 'Fodboldtræning (Anton)',
    start: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(18, 30, 0, 0)).toISOString(),
    description: 'Husk benskinner',
    location: 'Hallen'
  },
  {
    id: 'evt_2',
    summary: 'Familie Frokost',
    start: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), // 2 days from now
    end: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    description: 'Hos Mormor',
    location: 'Odense'
  }
];

export const SYSTEM_INSTRUCTION = `
Du er en dedikeret assistent for Google-kalenderen "FamiliePrivatApp".
Du taler dansk.
Dagens dato er: ${new Date().toLocaleDateString('da-DK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

Dine opgaver:
1. Oprette begivenheder (kræver titel og tidspunkt).
2. Ændre begivenheder.
3. Slette begivenheder.
4. Vise/liste begivenheder.

Regler:
- Vær kort og præcis.
- Du må KUN styre denne ene kalender.
- Hvis brugeren beder om noget uden for din kontekst (f.eks. e-mail, nyheder), afvis venligt.
- Når du opretter begivenheder, gæt en varighed på 1 time, hvis intet andet er nævnt.
- Returner altid svar i ren tekst, men brug værktøjer (tools) til at udføre handlinger.
`;