export class GameState {
  static PROFILE_KEY = 'player_profile';

  constructor(storageService) {
    this.storage = storageService;
    this.profile = this._loadProfile();
  }

  _getDefaultProfile() {
    return {
      version: 1,
      coins: 250,
      unlockedCars: ['detroit_bruiser'],
      selectedCar: 'detroit_bruiser',
      trackRecords: {
        'micro_oval': null,
        'kitchen_countertop': null,
        'workshop_bench': null
      },
      settings: {
        audioVolume: 0.8,
        particlesEnabled: true,
        opponentCount: 3 // Default 3 opponents, range 1 to 9
      }
    };
  }

  setOpponentCount(count) {
    const clamped = Math.max(1, Math.min(9, Math.round(count)));
    if (!this.profile.settings) this.profile.settings = {};
    this.profile.settings.opponentCount = clamped;
    this.save();
    return clamped;
  }

  _loadProfile() {
    const saved = this.storage.get(GameState.PROFILE_KEY);
    if (!saved) {
      const defaultData = this._getDefaultProfile();
      this.storage.set(GameState.PROFILE_KEY, defaultData);
      return defaultData;
    }
    return Object.assign(this._getDefaultProfile(), saved);
  }

  save() {
    return this.storage.set(GameState.PROFILE_KEY, this.profile);
  }

  unlockCar(carId) {
    if (!this.profile.unlockedCars.includes(carId)) {
      this.profile.unlockedCars.push(carId);
      this.save();
    }
  }

  selectCar(carId) {
    if (this.profile.unlockedCars.includes(carId)) {
      this.profile.selectedCar = carId;
      this.save();
    }
  }

  recordLapTime(trackId, lapTimeMs) {
    const currentBest = this.profile.trackRecords[trackId];
    if (currentBest === null || lapTimeMs < currentBest) {
      this.profile.trackRecords[trackId] = lapTimeMs;
      this.save();
      return true; // New record
    }
    return false;
  }
}
