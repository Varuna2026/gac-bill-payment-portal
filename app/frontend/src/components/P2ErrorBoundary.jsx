import { Component } from 'react'

export default class P2ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error) { console.error('P2 UI runtime error:', error) }
  render() {
    if (this.state.error) return <div className="notice error">P2 screen error: {this.state.error.message || 'Unexpected UI error'}. Please use the menu to reopen this screen.</div>
    return this.props.children
  }
}
