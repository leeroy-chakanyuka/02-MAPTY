'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// (1) this function uses the geolocation API to retrieve the current coords based
// on your location then it punches that into leaflet so we can display a map
let map;
//if the geolocation object even exists
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    //function if successfully generated position object
    function (position) {
      const { latitude } = position.coords; //destructure the object and retrieve lat and long based on location
      const { longitude } = position.coords;

      const coords = [latitude, longitude];

      //returns the map object
      map = L.map('map').setView(coords, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        // !! change the map later
        //can change the map style here
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      L.marker(coords)
        .addTo(map)
        .bindPopup('A pretty CSS popup.<br> Easily customizable.')
        .openPopup();

      // (2) this function creates a marker
      // every time you click the map renders a marker there
      map.on('click', function (mapEvent) {
        console.log(mapEvent);
        const { lat, lng } = mapEvent.latlng;
        console.log(lat, lng);
        //
        //adding the marker
        L.marker([lat, lng])
          .addTo(map)
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
      });
    },
    //else function
    function () {
      alert('could not access your location');
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
}
