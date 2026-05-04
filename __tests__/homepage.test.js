import { render, screen } from '@testing-library/react'
import Home from '../app/page'

describe('Homepage', () => {
  it('renders without crashing', () => {
    render(<Home />)
    const headings = screen.getAllByText(/Unlimited Legal Support/i)
    expect(headings.length).toBeGreaterThan(0)
  })

  it('displays updated contact information', () => {
    render(<Home />)
    const phone = screen.getByText(/\+27 68 127 6038/)
    expect(phone).toBeInTheDocument()
  })

  it('has the correct email address', () => {
    render(<Home />)
    const email = screen.getByText(/info@infinitylegal.co.za/)
    expect(email).toBeInTheDocument()
  })

  it('renders pricing information', () => {
    render(<Home />)
    const pricing = screen.getAllByText(/R99\/month/)
    expect(pricing.length).toBeGreaterThan(0)
  })
})
