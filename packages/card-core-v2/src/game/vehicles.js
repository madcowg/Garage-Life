export const VEHICLES = Object.freeze({
  miata_nb: { id: 'miata_nb', name: 'Mazda MX-5 Miata NB', status: 'starter', handlingProfile: { controlBonus: 0, powerBonus: 0, transitionBonus: 0.08 }, autocrossTargetOffset: 12.72, replacements: [{ remove: 'clean-launch', add: 'momentum-dance' }, { remove: 'smooth-inputs', add: 'momentum-dance' }] },
  integra_gsr: { id: 'integra_gsr', name: 'Acura Integra GS-R', status: 'starter', handlingProfile: { controlBonus: 0, powerBonus: 0, transitionBonus: 0 }, autocrossTargetOffset: 11.04, replacements: [{ remove: 'clean-launch', add: 'vtec-window' }, { remove: 'smooth-inputs', add: 'neutral-balance' }] },
  corvette_c6: { id: 'corvette_c6', name: 'Chevrolet Corvette C6', status: 'starter', handlingProfile: { controlBonus: 0, powerBonus: 0.1, transitionBonus: -0.06 }, autocrossTargetOffset: 11.82, replacements: [{ remove: 'balance-throttle', add: 'big-power' }, { remove: 'rotate-and-exit', add: 'big-power' }] },
  // Secret reward car (App.jsx handleSellCar) — plain stat-only vehicle, no
  // identity cards (it's a bone-stock beater, that's the joke). Target
  // offset sits with the starters, checked against simulate-progression.mjs.
  beater_van: { id: 'beater_van', name: 'The Getaway Van', status: 'unlockable', handlingProfile: { controlBonus: 0, powerBonus: -0.08, transitionBonus: 0.04 }, autocrossTargetOffset: 10.2, replacements: [] },
  nissan_180sx: { id: 'nissan_180sx', name: 'Nissan 180SX', status: 'planned', replacements: [] },
  toyota_supra_mk4: { id: 'toyota_supra_mk4', name: 'Toyota Supra MKIV', status: 'planned', replacements: [] },
  honda_civic_sir: { id: 'honda_civic_sir', name: 'Honda Civic SiR', status: 'planned', replacements: [] },
  mazda_rx7_fd: { id: 'mazda_rx7_fd', name: 'Mazda RX-7 FD', status: 'planned', replacements: [] },
  mitsubishi_evo_vi: { id: 'mitsubishi_evo_vi', name: 'Mitsubishi Lancer Evo VI', status: 'planned', replacements: [] },
  nissan_skyline_r34: { id: 'nissan_skyline_r34', name: 'Nissan Skyline GT-R R34', status: 'planned', replacements: [] },
  subaru_wrx: { id: 'subaru_wrx', name: 'Subaru Impreza WRX', status: 'planned', replacements: [] },
  honda_s2000: { id: 'honda_s2000', name: 'Honda S2000', status: 'planned', replacements: [] },
});

export function getVehicle(vehicleId) {
  const vehicle = VEHICLES[vehicleId];
  if (!vehicle) throw new Error(`Unknown vehicle: ${vehicleId}`);
  return vehicle;
}
