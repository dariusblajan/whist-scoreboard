import { describe, expect, it } from 'vitest'
import { isValidElement, createElement } from 'react'
import { render } from '@testing-library/react'
import * as icons from './icons.js'

describe('icon re-exports', () => {
  const entries = Object.entries(icons)

  it('exports at least one icon', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  it.each(entries)('%s is a renderable component, not a module object', (name, Icon) => {
    // Regression guard: a bad CJS-default interop hands back
    // { __esModule: true, default: ... } here, which React cannot render.
    expect(Icon).not.toHaveProperty('__esModule')
    expect(['function', 'object']).toContain(typeof Icon)

    const { container } = render(createElement(Icon))
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(isValidElement(createElement(Icon))).toBe(true)
  })
})
