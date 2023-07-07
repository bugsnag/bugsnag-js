import plugin from '../'

import Client from '@bugsnag/core/client'
import Breadcrumb from '@bugsnag/core/breadcrumb'

const lotsOfWhitespace = ' '.repeat(100000)
const lotsOfText = 'a'.repeat(100000)
const veryBigButton = '<button>' + lotsOfWhitespace + lotsOfText + lotsOfWhitespace + lotsOfText + lotsOfWhitespace + '</button>'

describe('plugin: interaction breadcrumbs', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div><button class="button">Click me</button></div>'
  })

  it('should be enabled by default', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toHaveLength(1)
  })

  it('should not be enabled when enabledBreadcrumbTypes=[]', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: [], plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toHaveLength(0)
  })

  it('should be enabled when enabledBreadcrumbTypes=["user"]', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: ['user'], plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toHaveLength(1)
  })

  it('should be enabled when enabledBreadcrumbTypes=null', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toHaveLength(1)
  })

  it("includes the target's text and selector", () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toStrictEqual([
      new Breadcrumb(
        'UI click',
        { targetText: 'Click me', targetSelector: 'BUTTON.button' },
        'user',
        expect.any(Date)
      )
    ])
  })

  it('strips leading and trailing whitespace in target text', () => {
    document.body.innerHTML = `
      <button>

        hello there

      </button>
    `

    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toStrictEqual([
      new Breadcrumb(
        'UI click',
        { targetText: 'hello there', targetSelector: 'BUTTON' },
        'user',
        expect.any(Date)
      )
    ])
  })

  it('includes 140 characters of text', () => {
    document.body.innerHTML = `
      <button>

        ${'a'.repeat(140)}

      </button>
    `

    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toStrictEqual([
      new Breadcrumb(
        'UI click',
        { targetText: 'a'.repeat(140), targetSelector: 'BUTTON' },
        'user',
        expect.any(Date)
      )
    ])
  })

  it('truncates to 135 characters of text + "(...)" when text is too long', () => {
    document.body.innerHTML = `
      <button>

        ${'a'.repeat(141)}

      </button>
    `

    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toStrictEqual([
      new Breadcrumb(
        'UI click',
        { targetText: 'a'.repeat(135) + '(...)', targetSelector: 'BUTTON' },
        'user',
        expect.any(Date)
      )
    ])
  })

  it("doesn't strip whitespace between words", () => {
    document.body.innerHTML = `
      <button>

        a          b          c

      </button>
    `

    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toStrictEqual([
      new Breadcrumb(
        'UI click',
        { targetText: 'a          b          c', targetSelector: 'BUTTON' },
        'user',
        expect.any(Date)
      )
    ])
  })

  it('handles an empty element', () => {
    document.body.innerHTML = '<button></button>'

    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toStrictEqual([
      new Breadcrumb(
        'UI click',
        { targetText: '', targetSelector: 'BUTTON' },
        'user',
        expect.any(Date)
      )
    ])
  })

  it('handles an all-whitespace element', () => {
    document.body.innerHTML = '<button>    \n\t \t \r\n    </button>'

    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toStrictEqual([
      new Breadcrumb(
        'UI click',
        { targetText: '', targetSelector: 'BUTTON' },
        'user',
        expect.any(Date)
      )
    ])
  })

  it('handles very large elements', () => {
    document.body.innerHTML = veryBigButton

    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toStrictEqual([
      new Breadcrumb(
        'UI click',
        { targetText: 'a'.repeat(135) + '(...)', targetSelector: 'BUTTON' },
        'user',
        expect.any(Date)
      )
    ])
  })

  it('can read text from the value of an empty "submit" input', () => {
    document.body.innerHTML = '<input type="submit" value="  some text  ">'

    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('input')!.click()

    expect(c._breadcrumbs).toStrictEqual([
      new Breadcrumb(
        'UI click',
        { targetText: 'some text', targetSelector: 'INPUT' },
        'user',
        expect.any(Date)
      )
    ])
  })

  it('can read text from the value of an empty "button" input', () => {
    document.body.innerHTML = '<input type="button" value="  some text  ">'

    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('input')!.click()

    expect(c._breadcrumbs).toStrictEqual([
      new Breadcrumb(
        'UI click',
        { targetText: 'some text', targetSelector: 'INPUT' },
        'user',
        expect.any(Date)
      )
    ])
  })
})
