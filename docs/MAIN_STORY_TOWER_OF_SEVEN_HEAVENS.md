# Main Story: Tower Of Seven Heavens

Status: Canon story direction selected.

Use this file as the narrative source of truth for main-story implementation (Floors 1-50), NPC arcs, side quests, and branching endings.

## Premise

The world is layered into Seven Heavens, each bound by one ancient seal.  
At the center stands the Axis Tower, a divine engine and prison that holds Azharel, a fallen star-god.

Every millennium the seals weaken. This cycle is worse: the tower is rewriting reality.  
Lost cities phase in and out, dead heroes return as echoes, and constellations fall as monsters.

The player bears the Star Wound, a mark that allows safe ascent.  
The climb is not only combat; each floor asks for a moral choice that reshapes the world.

Ancient records also speak of the Veilfall: heavenly watchers who descended, broke divine law, and fathered bloodlines within humanity.
Their descendants are not giants in this world; they are the **Nephari**: exceptionally beautiful, human-appearing beings with subtle angelic and supernatural traits (luminous irises, halo-scars, feather-shadow marks, voice resonance).
Many major Tower mysteries, faction leaders, and hidden NPC lineages tie back to the Nephari.

## Main Story Goal

- Main story ends at Floor 50 (Astral Crown confrontation).
- Floors 51+ continue as post-main-story Ascendant content with higher difficulty and expanded systems.

## Documented Tower Reach

- In current world records, adventurers have documented routes and reports through `Floor 55`.
- `Floor 55` is the highest confirmed ascent in the long history of the Tower.
- Only `two` climbers are recorded to have reached `Floor 55`, and neither account fully agrees on what waits beyond it.
- Most `S` and `SS` adventurers peak between `Floors 40-50`, where attrition, faction pressure, and floor variance overwhelm all but the rarest elites.
- Guild-published floor intelligence, trade notes, and sanctioned dossiers can therefore exist up to `Floor 55`, even though the playable main-story spine still ends at `Floor 50`.

## Story Review Snapshot (Current Canon Check)

Current direction is coherent and strong in four layers:
- `Core spine`: climb to Floor 50 with moral pressure and branching outcomes.
- `World conflict`: Aureate vs Ashen ideology around the Tower.
- `Mythic layer`: Higher Beings and Nephari lineage tied to Tower truth.
- `System hooks`: faction standing + favor/wrath + NPC relationship consequences.

Key strengths:
- Strong convergence of gameplay and narrative decisions.
- Good long-form escalation from guild survival to cosmic judgment.
- Clear space for recurring NPC arcs and interference systems.

Current design risk to watch:
- Choice systems can become too diffuse if too many values move at once.
- Mitigation:
  - keep each major quest to 1 primary axis + 1 secondary axis,
  - log explicit consequence summaries in results screens.

## Branching Endings (3)

Story values are hidden and driven by quest decisions + NPC interactions:

- `Grace`: mercy, rescue, redemption
- `Dominion`: order, law, sacrifice-for-stability
- `Ruin`: forbidden power, freedom through destruction

Endings:

1. Radiant Rebirth (`Grace` dominant)
2. Crown of Chains (`Dominion` dominant)
3. Starfall Sovereign (`Ruin` dominant)

## Great Power Groups (new canon)

Three apex groups now define late-world conflict around the Tower:

### 1) The Aureate Spire
- Doctrine: the Tower is a living god and must be worshiped, fed, and defended.
- Behavior:
  - recruits through charismatic adventurer NPC cells,
  - rewards obedience with relics and patron access,
  - sabotages climbers who reject Tower divinity.
- Player interaction:
  - support can unlock divine boons and insider routes,
  - betrayal can trigger holy sanctions and hostile interventions.

### 2) The Ashen Oathbreak
- Doctrine: the Tower is a cosmic prison-engine and must be destroyed.
- Behavior:
  - embeds strike operatives among guild adventurers,
  - offers anti-tower tools and forbidden demolition rites,
  - interferes with climbers seen as Tower collaborators.
- Player interaction:
  - support can unlock anti-tower counters and rupture quests,
  - betrayal can trigger retaliatory ambushes and social isolation.

### 3) The Apostolic Veil
- Doctrine: the Tower is neither god nor mere prison, but a providential catastrophe that must be studied, contained, and governed before the world is remade by lesser hands.
- Public face:
  - charitable cathedrals,
  - hospitals, orphanages, burial orders, relic processions,
  - confessors and scholars attached to courts and ports.
- Hidden face:
  - a curial intelligence structure,
  - sealed doctrinal archives on prior Tower cycles,
  - clandestine tribunals that investigate heresy, relic misuse, Nephari bloodlines, and unauthorized ascent research,
  - quiet influence over crowns, trade guilds, and adventurer appointments.
- Player interaction:
  - support can unlock forbidden archives, sanctuary routes, exorcist-grade relics, and politically protected travel,
  - opposition can trigger surveillance, doctrinal pressure, confiscation orders, engineered defamation, or sanctioned hunters.

### Historical design basis for the Apostolic Veil

The Apostolic Veil is intentionally shaped by real Catholic historical patterns, adapted into the game's fantasy setting:

- `Curial governance`
  - Inspired by the Roman Curia: a central administrative body of councils, courts, legates, and secretaries.
  - In-world result:
    - the Veil governs through dicasteries, sealed bureaus, canon advocates, and apostolic envoys rather than one loud army.
- `Temporal power`
  - Inspired by the Papal States and the Church's long history as both spiritual authority and political ruler.
  - In-world result:
    - the Veil controls enclaves, archives, fortified abbeys, port sanctuaries, and treaty-cities through concordats instead of conquest alone.
- `Orders and vows`
  - Inspired by monastic, mendicant, military, and scholarly Catholic orders.
  - In-world result:
    - multiple internal Church orders exist:
      - hospitaler sisters who genuinely save lives,
      - archivist monks who preserve dangerous Tower memory,
      - black-clad investigators who track relic abuse,
      - knightly penitents who hunt forbidden climbers.
- `Tribunals and inquiry`
  - Inspired by inquisitorial procedure and ecclesiastical courts.
  - In-world result:
    - the Veil conducts doctrinal hearings, relic audits, witness examinations, and secret trials over heresy, Tower cults, bloodline anomalies, and unlawful ascent.
- `Mission and diplomacy`
  - Inspired by missionary networks, confession, diplomacy, and Church influence across kingdoms.
  - In-world result:
    - the Veil knows the world through priests, abbots, confessors, scribes, and pilgrim houses long before armies arrive.

### Internal tension rule

The Apostolic Veil must never be written as a single evil bloc.

- Reformers:
  - want truth, mercy, and careful stewardship,
  - may become uneasy allies against Tower cult extremism and Ashen nihilism.
- Preservationists:
  - believe secrecy and hierarchy are necessary to keep civilization intact,
  - often justify manipulation, coverups, and selective sacrifice.
- Hardline inquisitors:
  - see the Tower as a contamination vector,
  - may become major antagonists if the player traffics with forbidden relics, Nyxara-aligned powers, or exposed Nephari secrets.

Not all Church NPCs are antagonists. Some of the most trustworthy healers, librarians, and confessors in the world come from this institution. The danger is not simple evil; it is the belief that only they are fit to decide what the world is allowed to know.

### Faction contact rule
- Players do not meet these groups first through banners; they meet them through adventurer NPC members.
- Repeated choices shape faction stance:
  - neutral,
  - favorable aid,
  - targeted interference.
- Faction stance can stack with Higher Being favor/wrath and create compound consequences.
- The Apostolic Veil enters the story differently from Aureate and Ashen cells:
  - first through chaplains, archivists, healers, confessors, relic appraisers, or inquisitorial observers,
  - later through sealed orders, political sanctions, and archive access.

## Higher Beings System (World Canon)

At upper layers of the Tower, ancient Higher Beings observe climbers and selectively intervene.
They are not fully benevolent or hostile; they respond to conduct, alliances, and broken pacts.

Core narrative rule:
- Favor from one Higher Being can create hostility from another.
- NPC relationships can amplify or dampen those reactions.

### Core Concepts

- `Favor`: trust/recognition from a Higher Being.
- `Disfavor`: warning state caused by betrayal, corruption, or rival alignment.
- `Wrath`: active punitive state that modifies quests/floors and NPC behavior.

### Acquisition Paths

Players can gain Favor through:
- tower event decisions,
- special covenant quests,
- high-risk rescue or sacrifice outcomes,
- protecting or sparing key NPCs tied to that Being.

Players can lose Favor / gain Wrath through:
- antagonizing favored NPCs,
- breaking covenant quest outcomes,
- choosing rival divine alignments,
- taking forbidden power routes repeatedly.

### Gameplay Implications (planned)

- Favor unlocks:
  - unique quest lines,
  - one-time interventions in tower mechanics,
  - divine relic rewards or route shortcuts.
- Wrath causes:
  - harsher floor modifiers,
  - reduced support from certain NPCs,
  - targeted punitive encounters.
- Major NPCs can be politically tied to specific Beings:
  - helping one NPC may increase one Favor track but anger another Being.
- Major NPCs may also be tied to **Aureate Spire** or **Ashen Oathbreak** cells:
  - helping one side may trigger interference from the other.

### Endgame Integration

Higher Being alignment must influence Floors 41-50 and ending checks:
- modifies available final routes,
- alters final-boss phase behavior,
- changes post-ending world state narration.

## First Three Higher Beings (Canon Set A)

These are the first active Higher Beings for implementation.

### 1) Seraphel, The Lantern of Oaths
- Domain: mercy, vows, protection under burden.
- Presence motif: warm auric halos, bell-tone whispers, gold-white sigils.
- Personality: compassionate but uncompromising about oath-breaking.
- Favors:
  - rescuing NPCs at personal cost,
  - honoring promised deals,
  - sparing defeated rivals when risk is high.
- Wrath triggers:
  - betraying allied NPCs,
  - abandoning rescue pledges after accepting,
  - using civilians as expendable leverage.
- Faction tilt:
  - suspicious of `Ashen Oathbreak` extremism,
  - tolerates moderate `Aureate Spire` devotion if non-coercive.
- Gameplay identity (future):
  - defensive intervention boons,
  - catastrophe mitigation once per floor chain.

### 2) Vael-Tor, The Crown in Glass
- Domain: order, dominion, hierarchy, lawful victory.
- Presence motif: mirrored crowns, geometric blue-violet light, command resonance.
- Personality: regal, strategic, rewards discipline and efficiency.
- Favors:
  - clean tactical clears,
  - enforcing contracts and hierarchy,
  - stabilizing chaos through firm control.
- Wrath triggers:
  - repeated disorder and impulsive sabotage,
  - rejecting formal trials while demanding authority,
  - destroying strategic assets out of spite.
- Faction tilt:
  - aligns with `Aureate Spire` governance structures,
  - hostile to `Ashen Oathbreak` demolition doctrine.
- Gameplay identity (future):
  - success-rate boosts tied to preparation and rank discipline,
  - stronger returns for structured loadouts.

### 3) Nyxara, The Wing of the Last Dusk
- Domain: ruin, severance, forbidden freedom, transformative collapse.
- Presence motif: obsidian feather-shadow, amethyst edge-light, silent pressure.
- Personality: seductive, honest about cost, despises stagnation.
- Favors:
  - breaking corrupt systems,
  - choosing dangerous truths over comforting lies,
  - high-risk routes that reject false sanctity.
- Wrath triggers:
  - submitting to oppressive pacts for comfort,
  - preserving known corruption for personal gain,
  - condemning others for using forbidden means while doing same.
- Faction tilt:
  - often empowers `Ashen Oathbreak` operations,
  - targets zealot cells of `Aureate Spire`.
- Gameplay identity (future):
  - high-risk power spikes,
  - stronger upside with heavier backlash conditions.

### Triad Conflict Rule

Favor is not zero-sum but naturally antagonistic:
- High Seraphel favor tends to reduce Nyxara trust.
- High Nyxara favor tends to provoke Vael-Tor sanctions.
- High Vael-Tor favor can strain Seraphel if mercy obligations are ignored.

## Arc Map (Floor Bands)

### Arc I - Heaven Of Embers (Floors 1-10)

- Theme: survival, guild trust, first alliances.
- Story beat:
  - Tower awakening becomes undeniable.
  - First covert faction pressure appears through adventurer NPC members.
  - Floor 10 introduces an almost-lethal boss mechanic and ally dependency.

Early-floor chapter beats:
- `Floor 1: Ashen Threshold`
  - the player proves they are more than a fresh guild license
  - Lyra Ashstep becomes the first true tower-side story contact
- `Floor 2: Thorn Corridor`
  - the first post-F-rank climb
  - the Tower shifts from threshold danger to deliberate control, bind pressure, and attrition
  - the player is expected to climb with earned discipline, not novice momentum

### Arc II - Heaven Of Mirrors (Floors 11-20)

- Theme: truth vs illusion.
- Story beat:
  - NPC motives become uncertain.
  - Tower records reveal conflicting origin myths.
  - early Apostolic Veil archivists appear and begin testing whether the player can be trusted with sealed history.
  - Nephari lineage clues surface in guild and tower logs.
  - Player choices begin locking major relationship routes.

### Arc III - Heaven Of Ruin (Floors 21-30)

- Theme: fallen kingdoms, war relics, class identity pressure.
- Story beat:
  - Class-path ideology (Knight/Berserker etc.) influences major quest outcomes.
  - Open faction operations begin (Aureate worship routes vs Ashen destruction routes).
  - Companion loyalty checks begin.

### Arc IV - Heaven Of Thrones (Floors 31-40)

- Theme: power blocs and system control.
- Story beat:
  - Macro conflict escalates between:
    - The Aureate Spire
    - The Ashen Oathbreak
    - The Apostolic Veil
    - Nephari bloodline houses with hidden agendas
  - Higher Being patron conflicts become explicit; covenant choices can trigger divine favor or wrath.
  - Key side-quest outcomes begin changing Floor 41-50 scenes.

### Arc V - Heaven Of Judgment (Floors 41-50)

- Theme: final cosmological choice.
- Story beat:
  - Origin truth of Azharel revealed.
  - True role of the Nephari in the Tower's cycle is exposed.
  - Final Higher Being adjudication occurs based on favor/wrath history.
  - Player decides whether to heal, seal, or claim the system.
  - Ending decided by value totals + critical NPC outcomes + faction standing (Aureate/Ashen).

## Floor Progression Blueprint (1-50)

Use this as implementation pacing guidance. Each row represents one 5-floor block.

1. Floors 1-5: tutorial ascent, guild grounding, basic faction hints.
2. Floors 6-10: ally dependency introduced, first major boss trial.
3. Floors 11-15: mirror quests, identity/loyalty tension starts.
4. Floors 16-20: first major betrayal branch and trust consequence.
5. Floors 21-25: ruin-war content, relic economy starts mattering.
6. Floors 26-30: class-path conflict escalates, companion outcomes diverge.
7. Floors 31-35: throne politics, faction contracts and sanctions.
8. Floors 36-40: high-stakes civic choices, pre-ending alignment lock-in.
9. Floors 41-45: crown ascent, irreversible route commitments.
10. Floors 46-50: final judgment chain and one of 3 endings.

## Questline Canon Index

- [NPC_QUESTLINE_TRACKER.md](/Users/kin/web-rpg/docs/NPC_QUESTLINE_TRACKER.md)
- [ALDRIC_VALE_QUESTLINE.md](/Users/kin/web-rpg/docs/ALDRIC_VALE_QUESTLINE.md)
- [TAMSIN_VALE_QUESTLINE.md](/Users/kin/web-rpg/docs/TAMSIN_VALE_QUESTLINE.md)

Use these dedicated questline docs as the canon source for recurring NPC side-story arcs.

## Core NPC Story Threads

### Aldric Vale (priority existing thread)

- Dedicated questline doc:
  - [ALDRIC_VALE_QUESTLINE.md](/Users/kin/web-rpg/docs/ALDRIC_VALE_QUESTLINE.md)
- Role: early emotionally grounded questline with long-range consequence weight.
- Trigger: early NPC rescue chain already started in-game.
- Current canon status:
  - refusal -> hostile dark-path sabotage route
  - accepted but expired -> tragic mixed route with occasional help
  - saved daughter -> loyal follower route
- Floor 30 is the major Aldric confrontation point for the hostile route.
- Aldric's final outcome is affinity-sensitive and affects the ending.

## First Three Named NPC Adventurers (Canon Set A)

These are the first non-core NPC adventurer anchors for broad story implementation.
Players meet them organically in guild/tower encounters and choices around them drive faction and higher-being reactions.

### 1) Lys Marrowind, "The Ember Witness"
- Role: field scout and event forecaster.
- Appearance: elegant human silhouette, silver-black hair, faint feather-shadow across shoulders, amber-luminous eyes.
- Public stance: independent guild climber.
- Hidden tie: latent Nephari lineage.
- Personality: observant, empathetic, quietly intense.
- Favors from player:
  - protecting civilians/NPCs during tower incidents,
  - listening before forcing combat outcomes,
  - returning with proof rather than rumors.
- Antagonized by player:
  - reckless sacrifice of bystanders,
  - lying about encounter outcomes,
  - repeated refusal of aid while blaming others.
- Story function:
  - introduces soft-contact with Higher Being signals,
  - can route player toward Seraphel-leaning covenant quests.

### 2) Cael Vorn, "The Goldlit Inheritor"
- Role: charismatic commander of an adventurer cell.
- Appearance: flawless human form with subtle geometric halo fractures near temples, cobalt-gold eyes, ceremonial bearing.
- Public stance: devout guardian of tower order.
- Faction tie: `Aureate Spire` member-recruiter.
- Personality: noble, persuasive, paternal, authoritarian beneath courtesy.
- Favors from player:
  - disciplined trial completion,
  - honoring formal oaths and command structures,
  - preserving tower systems when unstable.
- Antagonized by player:
  - public defiance of order protocols,
  - aid to Ashen-aligned sabotage,
  - refusal to submit to rank authority in critical events.
- Story function:
  - primary doorway into Aureate faction arc,
  - influences Vael-Tor favor/wrath swings.

### 3) Mireth Ashvale, "The Quiet Rupture"
- Role: demolition tactician and forbidden-route guide.
- Appearance: striking human beauty with dusk-violet iris bloom, subtle wing-mark burns at collarbone, low resonance voice.
- Public stance: disillusioned veteran.
- Faction tie: `Ashen Oathbreak` operative.
- Personality: calm, sardonic, morally severe, brutally honest.
- Favors from player:
  - exposing corruption even at personal cost,
  - dismantling abusive tower mechanisms,
  - choosing dangerous truth over comfortable lies.
- Antagonized by player:
  - preserving known cruelty for status gain,
  - condemning forbidden methods while using them privately,
  - betraying anti-tower allies for convenience.
- Story function:
  - primary doorway into Ashen faction arc,
  - influences Nyxara favor/wrath swings.

## Future Biblical Great Figures (Planned Canon Track)

These are not ordinary NPCs and should not be introduced too early.
They are meant to carry the same sense of weight, renown, danger, and legend that major biblical figures do, while being redesigned to fit the Tower's world and tone.

Design rule:
- use recognizable biblical roots without lifting names directly
- preserve grandeur, mythic consequence, and moral pressure
- make them feel like figures whose choices shaped ages, not side-quest vendors

### Naming direction

Use fantasy-tilted plays on biblical names, for example:
- `Mosachar` from Moses
- `Eliyan Voss` from Elijah
- `Davrael` from David
- `Solom Veyr` from Solomon
- `Mikhaelor` from Michael
- `Raphiel Vane` from Raphael

### Intended story role

These figures should enter as:
- ancient sealed names in records,
- hidden lineage anchors,
- higher being champions,
- church archives subjects,
- or endgame-level historical presences whose influence still shapes factions and floor doctrine.

### Implementation rule

Do not place them into early playable floors casually.
They should arrive only when one of these is true:
- the main story has entered a mythic or judgment phase,
- the Apostolic Veil archive route is active,
- a Higher Being covenant path is mature enough to support them,
- or the player is deep enough in the climb that legendary-scale names feel earned.

### Planned future set

1. `Mosachar, Bearer Of The Split Path`
- inspiration:
  - Moses
- role:
  - lawgiver, path-opener, impossible passage figure
- likely usage:
  - sealed route lore, tower passage miracle, covenant trial

2. `Eliyan Voss, Flamebound Witness`
- inspiration:
  - Elijah
- role:
  - prophetic challenger, storm/fire witness, anti-idolatry pressure
- likely usage:
  - Higher Being conflict, Tower judgment scenes, apostate faction confrontations

3. `Davrael, The Crown Before The Throne`
- inspiration:
  - David
- role:
  - king-maker, warrior-poet, flawed chosen ruler
- likely usage:
  - rulership, faction legitimacy, dominion-ending route pressure

4. `Solom Veyr, The Sealed Judge`
- inspiration:
  - Solomon
- role:
  - wisdom, judgment, hidden seals, impossible bargains
- likely usage:
  - Tower seals, apostolic archives, ending-condition trial choices

5. `Mikhaelor, Spear Of The Upper Gate`
- inspiration:
  - Michael
- role:
  - heavenly war captain, dragon-breaker, final judgment blade
- likely usage:
  - endgame confrontation, Seraphel-linked war route, anti-corruption judgment scenes

### TODO rule

When we are ready to build these figures, each one should get:
- a lore profile
- a story-entry condition
- a faction or higher-being tie
- a moral pressure axis
- an implementation floor band

## Fun Dev Canon Note

For internal/dev flavor only, the guild sometimes carries an impossible testing weapon in its hidden inventory:

- `Edictblade of the Hidden Steward`
  - tied to the rumor that one of the Tower's unseen stewards occasionally walks the lower guild under a false name
  - treated as meta-canon/dev gear for testing, not as a normal progression reward

### Set A Interference Rule

- Any of these NPCs can shift from ally to interferer depending on player stance.
- Interference forms:
  - quest rerouting,
  - supply denial or aid,
  - floor event disruption or rescue.
- Their behavior should be logged and visible in post-encounter summaries.

## First Three Apostolic Veil NPCs (Canon Set B)

These are the first major Church-aligned NPC anchors for implementation.
They should introduce the Apostolic Veil gradually through service, scholarship, and judgment before the player understands how deep the institution truly reaches.

### 1) Father Matthieu Valecourt, "The Lantern Confessor"
- Role: field chaplain, confessor, keeper of last rites for climbers and guild dead.
- Appearance: dark wool cassock under travel leathers, silver reliquary chain, calm face marked by sleepless mercy.
- Public stance: compassionate priest attached to hospice and burial work near the guild.
- Internal wing: `Reformer`
- Personality: warm, grave, patient, difficult to deceive.
- Historical design basis:
  - draws from mendicant preaching orders, hospital chaplaincy, and Catholic confessional culture.
- What he knows:
  - the Tower has broken prior ages before,
  - some Church records were deliberately sealed to prevent panic,
  - certain “miracles” around the Tower are curated rather than spontaneous.
- Favors from player:
  - truthful confession after failure,
  - mercy toward broken climbers,
  - rescuing NPCs when there is no strategic gain.
- Antagonized by player:
  - desecrating the dead,
  - treating people as expendable mechanics,
  - lying about relic use or forbidden bargains.
- Story function:
  - first soft doorway into the Apostolic Veil,
  - can grant sanctuary, funerary protections, and moral testimony,
  - may become a key `Grace`-leaning ally who reveals that not all of the Veil agrees with secrecy.
- First contact plan:
  - after the player's first severe collapse, death-adjacent event, or public rescue,
  - Matthieu approaches with rites, concern, and a warning that the Tower remembers every soul it nearly claims.

### 2) Sister Caliste Verenne, "The Ash Archive"
- Role: archivist-nun, relic cataloger, keeper of sealed ascent records.
- Appearance: immaculate dark habit with gold thread seals, iron key-ring, vellum gloves, eyes that miss almost nothing.
- Public stance: scholarly appraiser of relics and old ascent journals.
- Internal wing: `Preservationist`
- Personality: composed, brilliant, courteous, quietly manipulative.
- Historical design basis:
  - draws from scriptoria, cathedral archives, Church libraries, canon lawyers, and curial record-keeping.
- What she knows:
  - prior climber lineages were recorded and selectively erased,
  - some Tower floors repeat liturgical patterns tied to ancient judgments,
  - the Church has copies of origin texts no kingdom is allowed to see whole.
- Favors from player:
  - returning relics intact,
  - respecting sealed records,
  - choosing order and containment over reckless disclosure.
- Antagonized by player:
  - leaking archive material,
  - selling relic fragments,
  - forcing public revelation without preparation.
- Story function:
  - main route into sealed history and doctrinal records,
  - can unlock high-value lore, tower intel, and “approved” access to archive quests,
  - may pull the player toward `Dominion` if they begin accepting controlled truth over open truth.
- First contact plan:
  - Floors 11-15,
  - a relic or document recovered by the player draws her attention,
  - she offers authenticated interpretation in exchange for custody, silence, or future service.

### 3) Inquisitor Severin Thorne, "The White Ash Judge"
- Role: apostolic investigator, doctrinal prosecutor, hunter of illicit relic rites.
- Appearance: pale battle-cloak over formal black vestments, silver judgment seal, scarred hands, unnervingly steady gaze.
- Public stance: official envoy investigating cults, false miracles, relic corruption, and forbidden ascent circles.
- Internal wing: `Hardline Inquisitor`
- Personality: disciplined, ruthless, austere, never theatrical.
- Historical design basis:
  - draws from ecclesiastical courts, inquisitorial procedure, and Church-aligned legal investigators who operate through testimony, sanction, and authorized force.
- What he knows:
  - the Tower creates heresies as effectively as monsters,
  - Nephari bloodlines and divine bargains can destabilize kingdoms,
  - the Veil would rather quietly eliminate threats than publicly explain them.
- Favors from player:
  - surrendering dangerous relics,
  - exposing cult cells and false saints,
  - cooperating with sanctioned investigations.
- Antagonized by player:
  - repeated use of forbidden power,
  - aiding Ashen demolition cells,
  - sheltering condemned bloodlines or archive thieves.
- Story function:
  - principal early antagonist face of the Apostolic Veil,
  - introduces sanctions, surveillance, confiscation, and doctrinal pressure,
  - can become either a relentless pursuer or a grim conditional ally against worse threats.
- First contact plan:
  - after the player accumulates suspicious relic activity, faction exposure, or Nyxara-leaning choices,
  - Severin appears with records already in hand, demonstrating that the Church has been watching far longer than the player realized.

### Set B Dynamic Rule

- Apostolic Veil NPCs should not all move together.
- Matthieu, Caliste, and Severin can disagree openly or covertly over the player.
- Their shared faction standing should coexist with their personal relationship states:
  - a player may be trusted by Matthieu,
  - tolerated by Caliste,
  - and targeted by Severin at the same time.
- This internal contradiction is essential to making the Church feel historically grounded and politically real.

### Set B Branch Pressure

- Matthieu primarily pressures `Grace`
- Caliste primarily pressures `Dominion`
- Severin can intensify either `Dominion` or `Ruin` depending on whether the player submits, rebels, or weaponizes forbidden truth

### Set B Future Quest Hooks

1. `Matthieu: The Chapel Of Last Names`
  - recover the names of climbers erased from public burial rolls
  - choose whether to return them to grieving families, the archive, or the Tower's dead registry
2. `Caliste: The Sealed Folios`
  - escort or steal fragments of an ascent codex
  - decide who is allowed to read it
3. `Severin: Ashes Under Oath`
  - aid or obstruct an inquisitorial purge of relic smugglers and hidden cultists
  - later reveals some of the condemned may be politically inconvenient innocents

## Lyra Ashstep (Canon Conditional NPC)

Lyra Ashstep is a separate recurring NPC from Set A. She is the player's first example of an in-floor relationship that begins as practical aid and later branches into faction, ending, and trust consequences.

### Identity
- Name: `Lyra Ashstep`
- Title: `Ember Scout`
- Public role: lower-floor route mapper and ash-vent survivor guide
- First contact: conditional Floor 1 in-tower encounter only
- Trigger: the player suffers poison pressure in the normal wave and still pushes forward

### Faction
- Primary tie: `Ashen Oathbreak` adjacent covert courier
- Public stance: independent scout who sells survival lines and safe routes to desperate climbers
- Hidden truth:
  - Lyra is not a full public operative
  - she moves messages, routes, and people through damaged tower arteries for anti-tower cells
  - she distrusts official guild command and despises Aureate attempts to sanctify the Tower

### Why She Helps The Player
- Lyra does not help out of simple kindness.
- She helps because the player's survival under poison pressure marks them as:
  - adaptable,
  - willing to continue under real tower harm,
  - less likely to be a ceremonial climber loyal to tower doctrine.
- Her first aid is therefore an evaluation.
- She is testing whether the player is:
  - useful,
  - manipulable,
  - trustworthy,
  - or dangerous to her hidden network.

### Personality
- calm, alert, pragmatic
- speaks plainly, rarely wastes words
- values competence over rank
- offers help first as a transaction, later as guarded trust

### Personal Agenda
- Maintain secret ash-route corridors beneath early floors.
- Extract trapped climbers, smugglers, and witnesses before the Tower or guild command can erase them.
- Gather proof that the Tower's lower wards deliberately funnel weak climbers into sacrificial kill-zones.
- Decide whether the player is someone she can bring deeper into that truth.

### Branch Quest Direction

Lyra's future questline should be entirely choice-driven.

#### Quest Arc: `Ash Vein Covenant`
- Phase 1:
  - Lyra asks the player to recover a satchel of ember maps from a sealed ash vent route.
- Phase 2:
  - player chooses to:
    - return the satchel unopened,
    - inspect it and keep the contents secret,
    - report it to guild command,
    - sell fragments of it to another interested faction.
- Phase 3:
  - Lyra reveals her hidden network and asks the player to protect a survivor convoy or expose it.

### Ending Influence
- Supporting Lyra consistently:
  - increases anti-tower truth alignment
  - can contribute toward a `Ruin`-leaning ending route or a truth-exposure branch
- Helping her at first, then betraying her:
  - can trigger one of the harsher mixed endings
  - Lyra may later interfere with tower routes or withhold critical intel
- Rejecting her repeatedly:
  - closes her trust path
  - may push the player toward Aureate-controlled information instead

### Runtime Implementation Notes
- Lyra must only appear through conditional in-floor encounters unless a later quest explicitly summons her.
- Accepting her help should be remembered separately from simply meeting her.
- Repeated acceptance should gradually:
  - unlock her NPC license entry,
  - deepen her dialogue,
  - open the `Ash Vein Covenant` chain.
- Repeated refusal should:
  - harden her dialogue,
  - delay or prevent her branch,
  - alter later rescue/intel outcomes.

Current implementation notes:
- First true contact now happens only through the conditional Floor 1 poison encounter.
- First acceptance unlocks:
  - Lyra's NPC license entry in guild records
  - first quest hook: `Lyra's Ember Map Recovery`
- Future work:
  - add multiple trust tiers,
  - add betrayal/reporting branches,
  - connect her path into ending variables.

### Path Guide NPC (Level 15)

- Role: specialization narrative gate (Knight/Berserker final lock).
- Current status: placeholder NPC card exists; full questline pending.

### Future NPC Slots

- Add additional NPCs in same license-card pattern.
- Each new NPC should have:
  - relationship state,
  - side-quest chain,
  - one tower-mechanic influence (direct or indirect).
  - optional faction affiliation (`Aureate Spire` / `Ashen Oathbreak` / independent / Nephari house).

## Side Quest Framework (Epic + System-Relevant)

Each side quest should do at least one:
- affect hidden ending values (`Grace`/`Dominion`/`Ruin`),
- unlock/strengthen ally interventions,
- grant tower-counter tools or unique progression resources.

Planned side quest lines:

1. `Aldric: Ashbound Oath` (Floors 2-12)
  - Rescue arc, trust checks, Floor 10 intercession unlock.
2. `Seraphine: Tenth Circle Debt` (Floors 8-22)
  - Death/revival ethics, resource-for-life tradeoffs.
3. `The Mirror Orphan` (Floors 13-24)
  - Choice between truth exposure vs stability.
4. `The Silent Legion` (Floors 20-35)
  - War relic chain tied to class ideology.
5. `Crownless Choir` (Floors 32-45)
  - Faction allegiance line, strong impact on final scenes.

## Rare Substitute Item (Aldric Alternative)

Design note (intentional scarcity):

- Add one extremely rare item that can replace Aldric's Floor 10 save effect.
- It must not be easy to buy or farm.
- Recommended source model:
  - very low-rate tower drop and/or one-time high-risk side quest reward.

This keeps Aldric meaningful while preserving player agency.

## Decision Flags To Track In Code

Minimum story state keys to add over time:

- `storyValues.grace`
- `storyValues.dominion`
- `storyValues.ruin`
- `npcState.aldric.relation`
- `npcState.aldric.intercessionUnlocked`
- `npcState.pathGuide.specializationStarted`
- `endingLock.route` (set during Arc V)
- `higherBeingFavor.<beingId>` (per-being favor score)
- `higherBeingWrath.<beingId>` (per-being wrath score)
- `npcState.<npcId>.patronTension` (npc-linked divine friction state)
- `factionState.aureateSpire` (standing score and hostility tier)
- `factionState.ashenOathbreak` (standing score and hostility tier)
- `npcState.<npcId>.factionTag`
- `npcState.<npcId>.nephariLineage` (bool or lineage id)
- `npcState.lysMarrowind.relationship`
- `npcState.caelVorn.relationship`
- `npcState.mirethAshvale.relationship`
- `npcState.<npcId>.interferenceTier`

## Implementation Tracker

### Story System

- [ ] Add persistent story value counters (`Grace`, `Dominion`, `Ruin`)
- [ ] Add story-value reward hooks to quests/NPC decisions
- [ ] Add ending lock evaluation helper (Floor 50)
- [ ] Add Higher Being favor/wrath state model and persistence
- [ ] Add first covenant quest chain that can grant Favor
- [ ] Add wrath trigger hooks from antagonized NPC outcomes
- [ ] Add Aureate Spire / Ashen Oathbreak standing model
- [ ] Add Apostolic Veil standing model and internal reformer / preservationist / inquisitor split
- [ ] Add NPC-based faction reveal flow and interference triggers
- [ ] Add Nephari lineage reveal chain (floors 11-25) and consequences
- [ ] Implement NPC Set A profiles (Lys / Cael / Mireth) and encounter triggers
- [ ] Add NPC Set A relationship + interference tier logic
- [ ] Seed first Apostolic Veil NPC set (chaplain / archivist / inquisitor)
- [ ] Add sealed archive access and doctrinal sanction system
- [x] Add runtime climber leaderboard scaffolding + checkpoint update triggers
- [x] Add recurring in-floor NPC encounter scaffolding (Floor 1 starter)

### Aldric Priority

- [ ] Implement `Oathguard Intercession` Floor 10 trigger logic
- [ ] Show intervention in encounter log + summary
- [ ] Add ultra-rare substitute item and source path
- [ ] Tune damage prevention to ~90% of target lethal strike

### Main Story Content

- [ ] Write Floor 1-10 quest scenes and key dialogue beats
- [ ] Write Floor 11-20 scene pack
- [ ] Write Floor 21-30 scene pack
- [ ] Write Floor 31-40 scene pack
- [ ] Write Floor 41-50 ending scene pack

### Endings

- [ ] Implement Radiant Rebirth route checks
- [ ] Implement Crown of Chains route checks
- [ ] Implement Starfall Sovereign route checks
- [ ] Add post-ending state handoff to Floor 51+ mode
