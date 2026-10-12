# Flowly

## 1. Projekto aprašymas

Flowly – lietuviška įpročių stebėjimo aplikacija su React ir Vite. Autentifikavimas ir duomenų saugojimas naudoja Supabase. Išlaikyta esama tamsi sąsaja, violetiniai akcentai, kortelės ir responsive išdėstymas.

Aplikacija jungiasi prie jau sukurtų `public.habits` ir `public.habit_logs` lentelių. Lentelių ar RLS taisyklių ji nekuria.

## 2. Dabartinis funkcionalumas

- Registracija el. paštu ir slaptažodžiu, prisijungimas, sesijos atkūrimas, atsijungimas ir autentifikavimo pokyčių stebėjimas.
- Jei registracija negrąžina sesijos, rodomas prašymas patvirtinti el. paštą; įpročiai dar neprieinami.
- Savo aktyvių ir archyvuotų įpročių sąrašai, kūrimas, redagavimas, archyvavimas, atkūrimas ir galutinis šalinimas su patvirtinimu.
- Žymimi įpročiai (`boolean`) ir faktinio kiekio įpročiai (`quantity`), pastabos, dienos įrašo ištrynimas.
- Pasirinktos dienos žymėjimas, laikotarpio istorija, apskaičiuotas bendras ir kiekvieno įpročio progresas bei atlikimo serija.
- Įkėlimo, tuščio sąrašo, saugojimo ir klaidų būsenos. Klaidos atveju formos neuždaromos, o operacijos sėkmė nerodoma.

Pavadinimas po `trim` turi būti nuo 1 iki 200 simbolių; būtina bent viena unikali savaitės diena nuo 1 iki 7; tikslas turi būti baigtinis teigiamas skaičius, o žymimam įpročiui – 1. Pabaiga negali būti ankstesnė už pradžią.

Įpročiui su bent vienu atlikimo įrašu leidžiama keisti tik pavadinimą ir aprašymą. Sekimo tipas, tikslas, vienetas, savaitės dienos ir laikotarpis užrakinami. Norint kitų nustatymų, reikia archyvuoti įprotį ir sukurti naują. API modulis šį apribojimą papildomai patikrina prieš atnaujinimą.

## 3. Technologijos

- React, React DOM, JavaScript ir JSX.
- Vite ir React papildinys.
- `@supabase/supabase-js`.
- Paprastas CSS, atskiri komponentų `.jsx` ir `.css` failai.
- React `useState`, `useEffect`, `useRef`, `useCallback`.
- ESLint; datos ir progreso testams – integruotas Node.js testų vykdiklis.

TypeScript, Tailwind CSS, CSS Modules ir maršrutizavimo biblioteka nenaudojami. Priklausomybių versijos pateiktos `package.json`, užfiksuotos – `package-lock.json`.

## 4. Diegimas, konfigūracija ir paleidimas

Reikalingi Node.js ir npm. Projekto `package.json` konkrečios Node.js versijos per `engines` nenustato.

```sh
npm install
npm run dev
```

Prieš paleisdami nukopijuokite `.env.example` į `.env.local` ir įrašykite savo projekto reikšmes:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`VITE_SUPABASE_ANON_KEY` laukui naudokite tik viešą Supabase publishable arba anon raktą. Frontend nenaudokite `service_role` ar slapto rakto. `VITE_` reikšmės įtraukiamos į naršyklės paketą, todėl prieigos apsaugą užtikrina RLS. Tikros reikšmės į šį projektą neįrašytos; `.env` ir `.env.*` ignoruojami Git, išskyrus tuščią `.env.example`.

Pakeitę konfigūraciją paleiskite Vite iš naujo ir atidarykite terminale parodytą adresą. Jei konfigūracijos nėra arba ji netinkama, rodomas aiškus pranešimas. `vite.config.js` neturi pasirinktinio API proxy ar prievado.

Kitos `package.json` komandos:

```sh
npm run build
npm run lint
npm run preview
```

`preview` naudokite po `build`. Datos, validacijos, progreso ir serijos testai:

```sh
node --test src/habitLogic.test.mjs
```

Supabase projekte turi veikti el. pašto autentifikavimas, nurodytos lentelės ir jų RLS taisyklės `habits_manage_own`, `habit_logs_manage_own`. Jei naudojamas el. pašto patvirtinimas, Supabase Auth URL nustatymai turi leisti jūsų aplikacijos adresą. Konkrečių projekto adresų ar nuotolinių nustatymų šioje saugykloje nėra.

## 5. Projekto struktūra ir komponentai

Pagrindiniai aktyvūs failai:

- `src/main.jsx` – React įėjimas su `StrictMode`.
- `src/App.jsx` / `App.css` – sesija, naudotojo pokyčiai, navigacija ir atsijungimas.
- `src/Navbar.jsx` / `Navbar.css` – Flowly logotipas ir veikiantys navigacijos mygtukai.
- `src/AuthForm.jsx` / `AuthForm.css` – el. pašto registracija ir prisijungimas.
- `src/HabitTracker.jsx` / `HabitTracker.css` – duomenų įkėlimas, sąrašai, operacijų valdymas ir laikotarpiai.
- `src/HabitForm.jsx` / `HabitForm.css` – kūrimo ir redagavimo forma.
- `src/HabitCard.jsx` / `HabitCard.css` – įpročio informacija, serija ir valdymo veiksmai.
- `src/LogForm.jsx` / `LogForm.css` – dienos reikšmė ir pastaba.
- `src/HabitHistory.jsx` / `HabitHistory.css` – laikotarpio istorija.
- `src/ProgressBar.jsx` / `ProgressBar.css` – apskaičiuoto progreso rodinys.
- `src/supabaseClient.js` – vienas bendras klientas ir konfigūracijos patikra.
- `src/authApi.js` – Supabase Auth operacijos.
- `src/habitsApi.js` – esamų lentelių užklausos.
- `src/habitLogic.js`, `src/habitLogic.test.mjs` – kalendoriaus, validacijos ir skaičiavimo logika bei jos testai.
- `src/index.css`, `src/assets/`, `public/` – bendri stiliai ir esami vizualiniai failai.
- `.env.example`, `.gitignore`, `index.html`, `package.json`, `package-lock.json`, `vite.config.js`, `eslint.config.js` – konfigūracija ir įėjimo dokumentas.

Ankstesni `TaskList`, `TaskCard`, `TaskActions`, `AddTaskForm`, `Profile`, `WeatherWidget`, `tasksApi.js`, `alert.jsx` ir `login.js` palikti saugykloje, tačiau dabartinis `App` jų nenaudoja. TestAPI ir orų užklausos aktyvioje įpročių aplikacijoje nevykdomos. `FLOWLY_PROJECT_CONTEXT.md` išliko senas ir jo kodo kopijomis dabartiniam veikimui aprašyti remtis negalima.

## 6. API, autentifikavimas ir duomenų saugojimas

Supabase klientas kuriamas tik vieną kartą. Auth sesijos saugojimą, atkūrimą ir žetonų atnaujinimą valdo Supabase biblioteka. Seni `flowly.session` duomenys nenaudojami. `onAuthStateChange` stebi naudotojo pokyčius; atstatymo užklausa negali perrašyti naujesnio autentifikavimo įvykio.

Įpročiai rodomi tik esant sesijai. Pasikeitus naudotojui ar atsijungus senas rodinys išmontuojamas, o naujas kuriamas su atskira sesijos karta. Užklausų atsakymai tikrinami pagal naudotoją, sesijos kartą ir rodinio aktyvumą. Duomenų įkėlimo atsakymams taip pat tikrinama užklausos eilė.

`habits` užklausos filtruojamos pagal `user_id`; `habit_logs` gaunami per ryšį su savininko įpročiais. RLS tikrina tikrą serverio prieigą. Duomenys įkeliami puslapiais, kad istorija nesibaigtų ties pirmu API atsakymo puslapiu.

- Įpročiai: `select`, `insert`, `update`, `delete`.
- Archyvavimas: `archived_at` įrašomas laiko momentas; atkuriant nustatoma `null`.
- Dienos įrašas: `upsert` su `onConflict: "habit_id,local_date"`.
- Žymimam įpročiui saugoma 1 arba 0, kiekio įpročiui – faktinis neneigiamas baigtinis skaičius.
- Ištrintas dienos įrašas reiškia „Nepažymėta“, o ne 0.
- Būsimos, nesuplanuotos, už įpročio laikotarpio ribų esančios ir archyvuotų įpročių dienos negali būti žymimos ar keičiamos.

Naujiems įpročiams ir atlikimo įrašams UUID sukuriamas per naršyklės crypto.randomUUID(); taip nereikia spėti lentelės ID numatytosios reikšmės. Naudokite HTTPS arba localhost saugų kontekstą.

Duomenys saugomi Supabase, o perkrovus puslapį įkeliami iš naujo po sesijos atkūrimo. Vietinės įpročių kopijos ar veikimo be tinklo režimo nėra.

Galutinis šalinimas pirmiausia ištrina atlikimo įrašus, tada įprotį. Taip nereikia remtis nepateikta FK `ON DELETE CASCADE` konfigūracija. Tai dvi atskiros užklausos: antrai nepavykus atlikimo įrašai jau gali būti ištrinti. Klaida rodoma, duomenys perkraunami ir šalinimą galima pakartoti.

## 7. Progreso skaičiavimas ir navigacija

Vietinė diena sudaroma iš `getFullYear()`, `getMonth()` ir `getDate()`. `toISOString().slice(0, 10)` nenaudojamas dienai nustatyti, nes tai būtų UTC data. Modelyje nėra naudotojo laiko zonos lauko, todėl naudojama naršyklės vietinė kalendoriaus diena; pakeitus įrenginio laiko zoną gali pasikeisti ir „šiandien“. Kalendoriaus dienos iteruojamos vietiniu laiku, ne pridedant fiksuotas 24 valandas.

Diena atlikta, kai `value >= target_value`. Pasirinkto laikotarpio progresas:

```text
atliktos suplanuotos dienos / visos suplanuotos dienos × 100
```

Įtraukiamos tik pasirinkto laikotarpio savaitės dienos tarp įpročio pradžios ir pabaigos, iki šiandienos imtinai. Būsimos dienos neskaičiuojamos. Jei suplanuotų dienų nėra, rodoma „Netaikoma“. Procentas apvalinamas iki sveiko skaičiaus. Bendras progresas skaičiuojamas sumuojant įpročių atliktas ir suplanuotas dienas, o ne vidurkinant jų procentus. Archyvo rodinyje skaičiuojamas pasirinktų archyvuotų įpročių išsaugotas tvarkaraštis.

Serija skaičiuojama atgal tik per suplanuotas dienas. Šiandienos dar neatlikta diena praleidžiama ir ankstesnės serijos nenutraukia. Praėjusi suplanuota neatlikta arba nepažymėta diena seriją nutraukia. Serija nepriklauso nuo pasirinkto istorijos laikotarpio.

Navigacija naudoja esamą React būsenos architektūrą:

- „Įpročiai“ – aktyvūs arba archyvuoti įpročiai, kūrimas, redagavimas ir pasirinktos dienos žymėjimas.
- „Istorija“ – pasirinkto laikotarpio suplanuotos dienos, reikšmės ir pastabos.
- „Progresas“ – laikotarpio bendras ir atskirų įpročių progresas.

Neprisijungus šie mygtukai nerodomi. Atskirų URL maršrutų nėra.

## 8. Žinomi apribojimai ir patikra

- Nuotolinis Supabase projektas, RLS taisyklės ir tikri Auth / CRUD veiksmai be konfigūracijos bei paskyros nepatikrinti. Frontend lentelių ar taisyklių nekeičia.
- Istorinių tikslų ir tvarkaraščio versijų nėra; todėl nustatymai užrakinami įpročiams su įrašais. Kelių klientų vienalaikiams pakeitimams griežtą invariantą reikėtų užtikrinti ir duomenų bazėje.
- Galutinis šalinimas nėra viena serverio transakcija, kaip aprašyta aukščiau.
- Duomenų pokyčiai iš kito įrenginio automatiškai nestebimi per Realtime; perkraukite puslapį.
- `FLOWLY_PROJECT_CONTEXT.md` aprašo ankstesnę užduočių aplikaciją ir nėra automatiškai sinchronizuojamas.

Patikrinkite `build`, `lint` ir logikos testus. Su savo Supabase konfigūracija naršyklėje patikrinkite registraciją su el. pašto patvirtinimu, prisijungimą, perkrovimą ir atsijungimą; abiejų tipų įpročius; pastabų pakeitimą; 0 ir nepažymėtos dienos skirtumą; tvarkaraščio užrakinimą; archyvavimą, atkūrimą ir šalinimą. Dviem skirtingomis paskyromis patikrinkite RLS ir tai, kad greitai pasikeitus sesijai ankstesni duomenys nepasirodo. Patikrinkite ir tinklo klaidas bei siaurą ekraną.

### Atlikta vietinė patikra

Po suderinamo `source-map-js` pataisymo sėkmingai paleisti `npm run build`, `npm run lint` ir `node --test src/habitLogic.test.mjs` (10 testų). Testai tikrina vietinės datos sudarymą, tikras kalendoriaus datas, įpročio validaciją, tvarkaraščio ribas, būsimų dienų atmetimą, progresą ir seriją.

Priklausomybių grandinė buvo `vite@8.3.1 → postcss@8.5.28 → source-map-js@1.2.1`. Pagal [GHSA-68fv-2mgg-jv7q / CVE-2026-93749](https://github.com/advisories/GHSA-68fv-2mgg-jv7q), indeksuotų source-map sekcijų eilučių poslinkiai buvo netinkamai tikrinami; labai didelės reikšmės gali ilgam užblokuoti JavaScript vykdymo ciklą. Pažeidžiamos versijos yra `>=1.0.0 <1.2.2`, pataisyta versija – `1.2.2`.

Per `npm update source-map-js` lock faile atnaujintas tik šis paketas į `1.2.2`; versija atitinka PostCSS reikalaujamą `^1.2.1` intervalą. `package.json` dėl šio pataisymo nekeistas, `--force` nenaudotas. Pakartotinis `npm audit` šios patikros metu nerado pažeidžiamumų.

Prieinamoje Vite kūrimo konfigūracijoje nėra užpildytų `VITE_SUPABASE_URL` ir `VITE_SUPABASE_ANON_KEY`. Todėl registracija, prisijungimas, įpročio kūrimas ir redagavimas, dienos žymėjimas, išsaugojimas po perkrovimo, atsijungimas ir RLS prieigos kontrolė nuotoliniame Supabase projekte nepatikrinti. Vietiniai build, lint ir skaičiavimo testai šio veikimo nepatvirtina.
