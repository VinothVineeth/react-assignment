import React, {
  Component
} from 'react'
export default class Appaaa extends Component {

  state = {
    config: {},
    selectedOption: {}
  }

  componentDidMount() {

    fetch('/services/get_configuration.json').then(response => {
      return response.json();
    }).then(config => {

      this.setState({
        config
      }, () => {
        console.log(this.state.config)
      })


    }).catch(err => {
      console.log(err);
      // Do something for an error here
    });

  }


  handleClick = (selectedOption) => {
    this.setState({
      selectedOption
    })
  }

  renderComponent = () => {
    let { selectedOption = {} } = this.state
    let { document_type = 'viswa' } = selectedOption
    return <h1>{document_type}</h1>

  }

  render() {

    let { config: { capture_configuration = [] }, selectedOption } = this.state

    return (
      <>
        <div >
          My App
        </div>


        { !Object.keys(selectedOption).length ? capture_configuration.map((config, i) =>
          (
            <button key={i} onClick={e => this.handleClick(config)} >
              {config.document_type}
            </button>
          )
        ) : this.renderComponent() }







      </>
    )
  }
}