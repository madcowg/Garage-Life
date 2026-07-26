// ============================================================================
// CAR SPRITE ASSETS — sourced from two provided packs:
//  - the JDM unlockable roster (flat cars/<id>-front.png / <id>-rear.png)
//  - the USDM starter pack (nested cars/<id>/garage-*.png / race-*.png),
//    which also has "garage" 3/4-view sprites for a future car-select/garage
//    screen, unused for now — only race-rear feeds the live RoadView.
// Paths are prefixed with Vite's BASE_URL (not a hardcoded "/") because this
// site deploys under /Garage-Life/, not domain root — a bare
// "/garage-life-assets/..." path would 404 on Pages.
// ============================================================================

const BASE = import.meta.env.BASE_URL;

export const CAR_SPRITES = {
  // JDM unlockable roster
  nissan180sx:      { rear: `${BASE}garage-life-assets/cars/nissan180sx-rear.png`, front: `${BASE}garage-life-assets/cars/nissan180sx-front.png` },
  toyotaSupraMk4:   { rear: `${BASE}garage-life-assets/cars/toyotaSupraMk4-rear.png`, front: `${BASE}garage-life-assets/cars/toyotaSupraMk4-front.png` },
  hondaCivicSir:    { rear: `${BASE}garage-life-assets/cars/hondaCivicSir-rear.png`, front: `${BASE}garage-life-assets/cars/hondaCivicSir-front.png` },
  mazdaRx7Fd:       { rear: `${BASE}garage-life-assets/cars/mazdaRx7Fd-rear.png`, front: `${BASE}garage-life-assets/cars/mazdaRx7Fd-front.png` },
  mitsubishiEvo6:   { rear: `${BASE}garage-life-assets/cars/mitsubishiEvo6-rear.png`, front: `${BASE}garage-life-assets/cars/mitsubishiEvo6-front.png` },
  nissanSkylineR34: { rear: `${BASE}garage-life-assets/cars/nissanSkylineR34-rear.png`, front: `${BASE}garage-life-assets/cars/nissanSkylineR34-front.png` },
  subaruImprezaWrx: { rear: `${BASE}garage-life-assets/cars/subaruImprezaWrx-rear.png`, front: `${BASE}garage-life-assets/cars/subaruImprezaWrx-front.png` },
  hondaS2000:       { rear: `${BASE}garage-life-assets/cars/hondaS2000-rear.png`, front: `${BASE}garage-life-assets/cars/hondaS2000-front.png` },
  hondaNsxNa1:      { rear: `${BASE}garage-life-assets/cars/hondaNsxNa1-rear.png`, front: `${BASE}garage-life-assets/cars/hondaNsxNa1-front.png` },

  // BMW Legends — future upgrade tier (see data.js CARS comment). Paths
  // wired now so dropping the cropped PNGs in is the only step left once
  // that tier is switched on.
  bmwM3E36: { rear: `${BASE}garage-life-assets/cars/bmwM3E36-rear.png`, front: `${BASE}garage-life-assets/cars/bmwM3E36-front.png` },
  bmwM3E46: { rear: `${BASE}garage-life-assets/cars/bmwM3E46-rear.png`, front: `${BASE}garage-life-assets/cars/bmwM3E46-front.png` },
  bmwM5E39: { rear: `${BASE}garage-life-assets/cars/bmwM5E39-rear.png`, front: `${BASE}garage-life-assets/cars/bmwM5E39-front.png` },
  bmwM3E90: { rear: `${BASE}garage-life-assets/cars/bmwM3E90-rear.png`, front: `${BASE}garage-life-assets/cars/bmwM3E90-front.png` },

  // USDM starters
  mazdaMiataNa:      { rear: `${BASE}garage-life-assets/cars/mazdaMiataNa/race-rear.png`, front: `${BASE}garage-life-assets/cars/mazdaMiataNa/race-front.png`, garageRear: `${BASE}garage-life-assets/cars/mazdaMiataNa/garage-rear.png`, garageFront: `${BASE}garage-life-assets/cars/mazdaMiataNa/garage-front.png` },
  mazdaMiataNb:      { rear: `${BASE}garage-life-assets/cars/mazdaMiataNb/race-rear.png`, front: `${BASE}garage-life-assets/cars/mazdaMiataNb/race-front.png`, garageRear: `${BASE}garage-life-assets/cars/mazdaMiataNb/garage-rear.png`, garageFront: `${BASE}garage-life-assets/cars/mazdaMiataNb/garage-front.png` },
  acuraIntegraDc2Gsr: { rear: `${BASE}garage-life-assets/cars/acuraIntegraDc2Gsr/race-rear.png`, front: `${BASE}garage-life-assets/cars/acuraIntegraDc2Gsr/race-front.png`, garageRear: `${BASE}garage-life-assets/cars/acuraIntegraDc2Gsr/garage-rear.png`, garageFront: `${BASE}garage-life-assets/cars/acuraIntegraDc2Gsr/garage-front.png` },
  chevroletCorvetteC6: { rear: `${BASE}garage-life-assets/cars/chevroletCorvetteC6/race-rear.png`, front: `${BASE}garage-life-assets/cars/chevroletCorvetteC6/race-front.png`, garageRear: `${BASE}garage-life-assets/cars/chevroletCorvetteC6/garage-rear.png`, garageFront: `${BASE}garage-life-assets/cars/chevroletCorvetteC6/garage-front.png` },
};
