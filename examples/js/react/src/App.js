import React, { Component } from 'react'
import './App.css'
import BadButtons from './components/BadButtons'
import Navbar from './components/Navbar'

class App extends Component {
  render () {
    return (
      <div className='App'>
      <Navbar />
        <img width='200' src='bugsnag.png' alt='Bugsnag Logo' />
        <h1>React example</h1>
        <p>
          This is an example of how to include <code>@bugsnag/js</code> and <code>@bugsnag/plugin-react</code> in a React app.
          
        </p>
        <BadButtons />
      </div>
    )
  }
}

export default App
