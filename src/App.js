//import { render } from '@testing-library/react';
import React from 'react';
import 'semantic-ui-css/semantic.min.css'
//import './App.css';

const google = window.google;

class Locator extends React.Component {
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
    let wizzes = []

    wizzes.push(this.getIconWiz(day))
    wizzes.push(this.getRainWiz(day))
    console.log('day info: ', day);
    console.log('wizzes', wizzes);
    return Math.min(...wizzes);
  }

  getIconWiz(day) {
    const iconWz = {
      'clear-day' : 11, 
      'clear-night': 11,
      'rain': 5,
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
    return 6
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



class Wizometer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      streams: [],
    }
  }

  render() {
    return(
      <div className="wiz">
        <Locator />
      </div>
    )
  }
}

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
