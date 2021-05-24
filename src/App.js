//import { render } from '@testing-library/react';
import React from 'react';
import 'semantic-ui-css/semantic.min.css'
//import './App.css';

const google = window.google;

class Wizometer extends React.Component {
  constructor(props) {
    super(props);
    this.autocomplete = null;
    this.handlePlaceChange = this.handlePlaceChange.bind(this);
    this.state = {
      lat: '',
      long: '',
      zipcode: '',
      wizometer: 0
    }
  }

  componentDidMount() {
    this.autocomplete = new google.maps.places.Autocomplete(document.getElementById('location-autocomplete'), {
      'fields': ['address_components', 'geometry']
    });
    this.autocomplete.addListener("place_changed", this.handlePlaceChange);
  }

  handlePlaceChange() {
    let state = this.state,
        zipper = '',
        lat = '',
        long = '',
        wiz = '';
    
    const addressObject = this.autocomplete.getPlace();
    lat = addressObject.geometry['location'].lat();
    long = addressObject.geometry['location'].lng();
    for (let i=0; i<addressObject.address_components.length; i++) {
      const adrComp = addressObject.address_components[i];
      if (adrComp.types) {
        if (adrComp.types.includes('postal_code')) {
          zipper = adrComp.long_name;
        } 
        if (adrComp.types.includes('postal_code_suffix')) {
          zipper += '-' + adrComp.long_name;
        }
        if (adrComp.types.includes('postal_code_prefix')) {
          zipper = adrComp.long_name + ' ' + zipper;
        } 
      }
    }
    state.zipcode = zipper.trim();
    state.lat = lat;
    state.long = long;
    state.wizometer = 0;
    this.setState(state);

    // geet weather data and wiz it
    let weatherAPI = `https://api.pirateweather.net/forecast/1etAJHbeFP22Y0LWmF8tS7BMxmQw7D5K6RN1HMha/${lat},${long}`;
    console.log('weather url', weatherAPI);
    fetch(weatherAPI).then(response => {
      if (response.ok) {
        return response.json(); 
      }
      throw response;
    }).then(data => {
      console.log('data', data);
      wiz = this.getWizometer(data.daily.data[0]);
      if (wiz > 0) {
        state.wizometer = wiz;
        this.setState(state);
      }
    })
  }

  getWizometer(day) {
    console.log('day info: ', day);

    let wizzes = []
    wizzes.push(this.getIconWiz(day))
    wizzes.push(this.getRainWiz(day))
    wizzes.push(this.getTempWindWiz(day))

    console.log('wizzes', wizzes);
    return Math.min(...wizzes);
  }

  // going to use apparent temp here because it takes humidity into account
  // @TODO account for seasonality here - a 40-50 day in winter would be an 11 for most climates
  getTempWindWiz(day) {
    console.log('temp wiz---');
    let tempWiz = 11;
    const tempHigh = Math.floor(day.apparentTemperatureHigh),
          tempLow = Math.floor(day.apparentTemperatureLow),
          tempDelta = tempHigh - tempLow,
          // average is 1/3 of the way down from tempHigh because most people care about daylight
          tempAvg = Math.floor(tempHigh - (tempDelta / 3));
    
    // according to https://www.huffingtonpost.com.au/2017/11/27/this-is-the-perfect-temperature-for-being-happy-and-social-study-finds_a_23288718/
    // the perfect outdoor temperature is 72 degrees, so key off that
    if ((tempAvg <= 82) && (tempAvg >= 62)) {
      tempWiz = 11;
    } else {
      let delta = 0;
      if (tempAvg > 82) {
        console.log('too hot');
        // too stinkin' hot
        delta = Math.round((tempAvg - 82) / 10);
      } else {
        delta = Math.round((82 - tempAvg) / 15);
      }
      tempWiz = (11 - delta);
    }

    if (day.windSpeed > 10) {
      console.log('windy: -' + (Math.floor(day.windspeed / 10)));
      tempWiz = tempWiz - (Math.floor(day.windspeed / 10));
    }

    return tempWiz;
  }
  getIconWiz(day) {
    const iconWz = {
      'clear-day' : 11, 
      'clear-night': 11,
      'rain': 6,
      'snow': 9,
      'sleet': 2,
      'wind' : 8,
      'fog': 6, 
      'cloudy' : 7,
      'partly-cloudy-day': 11, 
      'partly-cloudy-night' : 9,
    }
    return iconWz[day.summary] ? iconWz[day.summary] : 0;
  }

  getRainWiz(day) {
    const chanceOfRain = Math.floor(day.precipProbability * 100);
    if (chanceOfRain === 0) {
      return 11
    } else {
      // for every increase of 10 percent chance of rain
      let delta = Math.floor(chanceOfRain / 10);
      // light rain is beter than heavy rain
      if (day.precipIntensityMax > 1) {
        delta *= 0.7
      } else {
        delta *= 0.3
      }
      console.log('rain wiz', Math.floor(11 - delta));
      return Math.floor(11 - delta);
    }
  }

  render() {
    let zipDisp = this.state.zipcode ? this.state.zipcode : 'type an address to begin';
    let wizDisp = this.state.wizometer ? 'Today is a ' + this.state.wizometer : this.state.zipcode ? 'Wizzing' : '';

    return (
      <div>
        <form>
          <input id="location-autocomplete" size = "100" type="text" />
       </form>
       <div>
         {zipDisp}
       </div>
       <div>
         {wizDisp}
       </div>
      </div>
    )
  }
}
/*

function Filter(props) {
  let propValues = Object.keys(props.values).sort();
  
  let options = propValues.map((v) => {
   // console.log('v', v, props.values[v]);
    return(<option key={v} value={v}>{v} ({props.values[v]} streams)</option>);
  });

  return (
    <div>
      <label htmlFor={props.id}>
        {props.label}
      </label>
      <select id={props.id} onChange={props.filterFn}>
        <option value="">Choose one</option>
        {options}

      </select>
    </div>
  );
}
*/

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Wizometer />
      </header>
    </div>
  );
}


export default App;
