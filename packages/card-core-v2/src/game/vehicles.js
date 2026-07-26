export const VEHICLES = Object.freeze({
  miata_nb: { id: 'miata_nb', name: 'Mazda MX-5 Miata NB', status: 'starter', handlingProfile: { controlBonus: 0, powerBonus: 0, transitionBonus: 0.08 }, autocrossTargetOffset: 12.72, replacements: [{ remove: 'clean-launch', add: 'momentum-dance' }, { remove: 'smooth-inputs', add: 'momentum-dance' }] },
  integra_gsr: { id: 'integra_gsr', name: 'Acura Integra GS-R', status: 'starter', handlingProfile: { controlBonus: 0, powerBonus: 0, transitionBonus: 0 }, autocrossTargetOffset: 11.04, replacements: [{ remove: 'clean-launch', add: 'vtec-window' }, { remove: 'smooth-inputs', add: 'neutral-balance' }] },
  corvette_c6: { id: 'corvette_c6', name: 'Chevrolet Corvette C6', status: 'starter', handlingProfile: { controlBonus: 0, powerBonus: 0.1, transitionBonus: -0.06 }, autocrossTargetOffset: 11.82, replacements: [{ remove: 'balance-throttle', add: 'big-power' }, { remove: 'rotate-and-exit', add: 'big-power' }] },
  // Secret reward car (App.jsx handleSellCar / the Lou-Fanaz name easter
  // egg) — otherwise a plain stat-only vehicle (bone-stock beater, that's
  // the joke), except for its one cheat: swaps a single Smooth Inputs for
  // Cheat Code (cards.js), the secret car's bypass-the-segment card. Target
  // offset sits with the starters, checked against simulate-progression.mjs.
  beater_van: { id: 'beater_van', name: 'The Titty Twister', status: 'unlockable', handlingProfile: { controlBonus: 0, powerBonus: -0.08, transitionBonus: 0.04 }, autocrossTargetOffset: 10.2, replacements: [{ remove: 'smooth-inputs', add: 'cheat-code' }] },
  nissan_180sx: { id: 'nissan_180sx', name: 'Nissan 180SX', status: 'planned', replacements: [] },
  honda_civic_sir: { id: 'honda_civic_sir', name: 'Honda Civic SiR', status: 'planned', replacements: [] },
  subaru_wrx: { id: 'subaru_wrx', name: 'Subaru Impreza WRX', status: 'planned', replacements: [] },
  honda_s2000: { id: 'honda_s2000', name: 'Honda S2000', status: 'planned', replacements: [] },

  // JDM Legends — real handling identities, sprite art in. Each is stronger
  // than the starters in a specific way (raw power, AWD composure, chassis
  // balance) at the cost of a harder autocrossTargetOffset; none beats the
  // Miata's transitionBonus (0.08) stock, so it stays king of tight corners
  // even against this roster. Every non-Miata bonus here also sets up future
  // race types (drag/circuit) where straight-line power and top-end grip
  // matter far more than they do in a short autocross course.
  toyota_supra_mk4: { id: 'toyota_supra_mk4', name: 'Toyota Supra Mk4', status: 'unlockable', handlingProfile: { controlBonus: 0, powerBonus: 0.14, transitionBonus: -0.06 }, autocrossTargetOffset: 11.70, replacements: [] },
  nissan_skyline_r34: { id: 'nissan_skyline_r34', name: 'Nissan Skyline GT-R R34', status: 'unlockable', handlingProfile: { controlBonus: 0.5, powerBonus: 0.08, transitionBonus: -0.04 }, autocrossTargetOffset: 11.12, replacements: [] },
  mazda_rx7_fd: { id: 'mazda_rx7_fd', name: 'Mazda RX-7 FD', status: 'unlockable', handlingProfile: { controlBonus: -0.3, powerBonus: 0.02, transitionBonus: 0.05 }, autocrossTargetOffset: 12.02, replacements: [] },
  mitsubishi_evo_vi: { id: 'mitsubishi_evo_vi', name: 'Mitsubishi Lancer Evo VI', status: 'unlockable', handlingProfile: { controlBonus: 0.6, powerBonus: 0.04, transitionBonus: 0.02 }, autocrossTargetOffset: 11.68, replacements: [] },
  honda_nsx_na1: { id: 'honda_nsx_na1', name: 'Honda NSX (NA1)', status: 'unlockable', handlingProfile: { controlBonus: 0.4, powerBonus: 0.05, transitionBonus: 0.06 }, autocrossTargetOffset: 12.67, replacements: [] },

  // BMW Legends — future upgrade tier (data.js CARS tier: "legend"). Full
  // handling identities defined now so flipping `status` to 'unlockable'
  // later (alongside the CARS tier) is the only step left.
  bmw_m3_e36: { id: 'bmw_m3_e36', name: 'BMW M3 (E36)', status: 'planned', handlingProfile: { controlBonus: 0.2, powerBonus: 0.03, transitionBonus: 0.03 }, autocrossTargetOffset: 11.8, replacements: [] },
  bmw_m3_e46: { id: 'bmw_m3_e46', name: 'BMW M3 (E46)', status: 'planned', handlingProfile: { controlBonus: 0.4, powerBonus: 0.06, transitionBonus: 0.05 }, autocrossTargetOffset: 12.64, replacements: [] },
  bmw_m5_e39: { id: 'bmw_m5_e39', name: 'BMW M5 (E39)', status: 'planned', handlingProfile: { controlBonus: 0.1, powerBonus: 0.12, transitionBonus: -0.05 }, autocrossTargetOffset: 11.60, replacements: [] },
  bmw_m3_e90: { id: 'bmw_m3_e90', name: 'BMW M3 (E90)', status: 'planned', handlingProfile: { controlBonus: 0.3, powerBonus: 0.09, transitionBonus: 0.01 }, autocrossTargetOffset: 12.32, replacements: [] },
});

export function getVehicle(vehicleId) {
  const vehicle = VEHICLES[vehicleId];
  if (!vehicle) throw new Error(`Unknown vehicle: ${vehicleId}`);
  return vehicle;
}
