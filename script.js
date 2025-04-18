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
  type = 'running';

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
  type = 'cycling';

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
  #workouts = [];

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
  }

  #toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  #newWorkout(e) {
    e.preventDefault();

    let workout;
    const { lat, lng } = this.#mapEvent.latlng;
    const validateData = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositives = (...inputs) => inputs.every(inp => inp > 0);

    // get data from form

    const typeWorkout = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    // if running == running object

    if (typeWorkout == `running`) {
      const cadence = +inputCadence.value;
      if (
        !validateData(distance, duration, cadence) ||
        !allPositives(distance, duration, cadence)
      ) {
        return alert('One of the inputs is not a valid number');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if cycling == cycling object
    console.log(`in show form`);
    if (typeWorkout == `cycling`) {
      const evelevationGain = +inputElevation.value;
      if (
        !validateData(distance, duration, evelevationGain) ||
        !allPositives(distance, duration)
      ) {
        return alert('One of the inputs is not a valid number');
      }
      workout = new Cycling([lat, lng], distance, duration, evelevationGain);
    }

    // add workout to obkect
    this.#workouts.push(workout);
    console.log(this.#workouts);
    // render workout on map as a marker
    this.#renderWorkoutMarker(workout);
    // render workout on sidebar

    // hide form and clear input fields

    // display marker

    inputDistance.focus();
    inputCadence.value = '';
    inputDistance.value = '';
    inputDuration.value = '';
    inputElevation.value = '';
  }

  #renderWorkoutMarker(workout) {
    let msg;
    if (workout.type == `running`) {
      msg = `🏃‍♀️ ${
        workout.type.charAt(0).toUpperCase() + workout.type.slice(1)
      } on ${workout.date}`;
    }

    if (workout.type == 'cycling') {
      msg = `🚴‍♀️ ${
        workout.type.charAt(0).toUpperCase() + workout.type.slice(1)
      } on ${workout.date}`;
    }

    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          minWidth: 100,
          maxWidth: 250,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(msg)
      .openPopup();
  }

  #renderWorkout(workout) {
    const html = ` <li class="workout workout--${workout.type}" data-id=${workout.id}>
          <h2 class="workout__title">Running on April 14</h2>
          <div class="workout__details">
            <span class="workout__icon">🏃‍♂️</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;
  }
}

const myApp = new App();
