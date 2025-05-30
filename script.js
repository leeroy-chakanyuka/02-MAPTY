// DOM Element Selections
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

/*
 * Generate a unique ID using timestamp and random values
 * @returns {string} ID
 */
function genID() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}`;
}

/*
 * Parent class for all workout types
 */
class Workout {
  id = genID(); // so we can find a certain object by ID
  date = new Date();
  distance;
  duration;
  coords;
  description;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; //km
    this.duration = duration; //min
  }

  /*
   * Creates a human-readable description of the workout,
   * this will be used as the marker pop up, user facing
   */
  setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

/*
 * Running workout type
 */
class Running extends Workout {
  #name;
  cadence;
  pace;
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }

  /*
   * Calculate pace in minutes per kilometer
   */
  calcPace() {
    // min per km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

/*
 * Cycling workout type
 * @extends Workout
 */
class Cycling extends Workout {
  #name;
  elevationGain;
  speed;
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.setDescription();
  }

  /*
   * Calculate speed in kilometers per hour
   */
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/*
 * Main application controller
 */
class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 14;

  constructor() {
    this.#getPosition();
    form.addEventListener('submit', this.#newWorkout.bind(this));
    inputType.addEventListener('change', this.#toggleElevationField);
    containerWorkouts.addEventListener('click', this.#moveToPopup.bind(this));

    // Load workouts from localStorage when app starts for data persistance
    this.#getLocalStorage();
  }

  /*
   * Get user's current position using the geolocation API
   */
  #getPosition() {
    navigator.geolocation.getCurrentPosition(
      this.#loadMap.bind(this), //binded so that the function has a this keyword, could have used an arrow function too
      function () {
        alert('WE COULD NOT GET YOUR CURRENT LOCATION');
      }
    );
  }

  /*
   * Initialize map with user's location, we got this from the getPosition Method
   */
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

    // Render workout markers after map is loaded and workouts are retrieved
    this.#workouts.forEach(workout => {
      this.#renderWorkoutMarker(workout);
    });
  }

  /**
   * Display workout form when map is clickedt
   */
  #showForm(e) {
    this.#mapEvent = e;
    form.classList.remove(`hidden`);
    inputDistance.focus();
  }

  /*
   * Hide and reset form after submission
   */
  #hideForm() {
    inputDistance.focus();
    inputCadence.value = '';
    inputDistance.value = '';
    inputDuration.value = '';
    inputElevation.value = '';

    form.style.display = 'none';
    form.classList.add(`hidden`);
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  /*
   * Toggle between cadence and elevation gain input fields
   */
  #toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  /*
   * Process new workout form submission
   */
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

    // add workout to object
    this.#workouts.push(workout);
    console.log(this.#workouts);

    // render workout on map as a marker
    this.#renderWorkoutMarker(workout);

    // render workout on sidebar
    this.#renderWorkout(workout);

    // hide form and clear input fields
    this.#hideForm();

    // set local storage - FIXED: added () to make it a method call
    this.#setLocalStorage();
  }

  /*
   * Add marker to map for workout
   */
  #renderWorkoutMarker(workout) {
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
      .setPopupContent(
        `${workout.type == 'running' ? '🏃‍♀️' : '🚴‍♀️'}  ${workout.description}`
      )
      .openPopup();
  }

  /*
   * Add workout to sidebar list
   */
  #renderWorkout(workout) {
    let icon = workout.type == 'running' ? '🏃‍♀️' : '🚴‍♀️';
    let html = ` <li class="workout workout--${workout.type}" data-id=${workout.id}>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${icon}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;
    if (workout.type === 'running')
      html += `
              <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${Math.round(workout.pace)}</span>
                <span class="workout__unit">min/km</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
              </div>
            </li>
            `;

    if (workout.type === 'cycling')
      html += `
              <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${Math.round(workout.speed)}</span>
                <span class="workout__unit">km/h</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
              </div>
            </li>
            `;

    form.insertAdjacentHTML('afterend', html);
  }

  /*
   * Center map on workout when clicked in sidebar
   */
  #moveToPopup(e) {
    if (!this.#map) return;

    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  /*
   * Save workouts to localStorage
   */
  #setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  /*
   * Load workouts from localStorage
   */
  #getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    // Render workouts in the sidebar list
    this.#workouts.forEach(work => {
      this.#renderWorkout(work);
    });
  }

  /*
   * Reset application state // refresh local storage
   */
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

// Initialize application
const myApp = new App();
