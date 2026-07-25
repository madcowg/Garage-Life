# Balance Validation Report

## Validation scope

- 12 automated engine tests: all passing in the prepared standalone package.
- 30 primary cases: 3 starter cars × 2 build states × 5 bots.
- 500 seasons per case.
- 8 autocross events per season.
- 4 timed runs per event.
- 480,000 baseline runs, plus hazard stress audits.
- Seeded and repeatable.

## Competent affinity-aware bot

| Vehicle | Build | Event win rate | Maintains / 8 events | Cones / run | Mean target margin |
|---|---:|---:|---:|---:|---:|
| miata_nb | stock | 14.9% | 3.00 | 0.03 | -0.52s |
| miata_nb | built | 54.1% | 3.00 | 0.05 | 0.06s |
| integra_gsr | stock | 20.0% | 2.77 | 0.05 | -0.52s |
| integra_gsr | built | 54.4% | 2.76 | 0.07 | -0.02s |
| corvette_c6 | stock | 20.7% | 3.00 | 0.16 | -0.62s |
| corvette_c6 | built | 49.9% | 3.00 | 0.20 | -0.10s |

## Skill and aggression checks

Built random-bot win rates:

- miata_nb: 1.2%
- integra_gsr: 0.6%
- corvette_c6: 0.6%

Built aggression-bot win rates:

- miata_nb: 7.0%
- integra_gsr: 6.3%
- corvette_c6: 7.9%

Random play remains far below the 10% ceiling. Aggression-first play loses decisively to the affinity-aware bot.

## Authenticity correction

The first implementation gave the Corvette a flat control penalty, producing about one cone per run under competent play. That was removed. Vehicle identity now comes from card composition, power response, transition behavior, wear, and chassis-specific reference targets.

## Hazard watch item

A single skipped brake service is strongly consequential but still playable. Compound neglect is effectively noncompetitive. This is the primary number to watch in human playtesting because automatic hazard firing can feel harsher than its mathematical fairness suggests.

## Recommendation

The pure engine is ready for UI integration as a first playable balance pass. Future vehicles and later disciplines should repeat the same test sequence rather than inheriting these autocross numbers.
