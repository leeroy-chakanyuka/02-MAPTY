const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
function genID() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}`;
}
class Workout {
  id = genID(); // so we can find a certain object by ID
  date = new Date();
  distance;
  duration;
  coords;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; //km
    this.duration = duration; //min
  }
}

class Running extends Workout {
  #name;
  #cadence;
  #pace;

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.#cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    // min per km
    this.#pace = this.duration / this.distance;
    return this.#pace;
  }
}

class Cycling extends Workout {
  #name;
  #elevationGain;
  #speed;

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.#elevationGain = elevationGain;
    this.calcSpeed();
  }

  calcSpeed() {
    // km/h
    this.#speed = this.distance / (this.duration / 60);
    return this.#speed;
  }
}

class App {
  #map;
  #mapEvent;

  constructor() {
    this.#getPosition();
    form.addEventListener('submit', this.#newWorkout.bind(this));
    inputType.addEventListener('change', this.#toggleElevationField);
  }

  #getPosition() {
    navigator.geolocation.getCurrentPosition(
      this.#loadMap.bind(this),
      function () {
        alert('WE COULD NOT GET YOUR CURRENT LOCATION');
      }
    );
  }

  #loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    console.log(coords);
    this.#map = L.map('map').setView(coords, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(coords)
      .addTo(this.#map)
      .bindPopup('A pretty CSS popup.<br> Easily customizable.')
      .openPopup();

    this.#map.on('click', this.#showForm.bind(this));
  }

  #showForm(e) {
    this.#mapEvent = e;
    form.classList.remove(`hidden`);
    inputDistance.focus();
    console.log(e);
    console.log(this.#mapEvent);
  }

  #toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  #newWorkout(e) {
    e.preventDefault();

    inputDistance.focus();
    inputCadence.value = '';
    inputDistance.value = '';
    inputDuration.value = '';
    inputElevation.value = '';

    const { lat, lng } = this.#mapEvent.latlng;

    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          minWidth: 100,
          maxWidth: 250,
          autoClose: false,
          closeOnClick: false,
          className: `running-popup`,
        })
      )
      .setPopupContent(`work out`)
      .openPopup();
  }
}

const myApp = new App();
