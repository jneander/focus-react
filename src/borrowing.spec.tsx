import {ReactNode, useLayoutEffect, useRef} from 'react'
import {createPortal} from 'react-dom'
import {createContainer, ButtonDriver} from '@jneander/spec-utils-dom'
import {render} from '@testing-library/react'

import {FocusProvider, useFocusRegion} from './context'

describe('Borrowing focus', () => {
  let $container: HTMLElement
  let component: ReturnType<typeof render>

  beforeEach(() => {
    $container = createContainer()
    component = null
  })

  afterEach(() => {
    component.unmount()
    $container.remove()
  })

  function renderContent(content: ReactNode) {
    const element = <FocusProvider>{content}</FocusProvider>

    component = render(element, {container: $container})
  }

  function get(buttonText: string) {
    return ButtonDriver.findWithText(buttonText, document.body)
  }

  context('with two levels of regions and the child borrows from the parent', () => {
    function BorrowerRegion() {
      const focusRegion = useFocusRegion()
      const borrowerRef = useRef(null)

      focusRegion.useBorrowEffect(borrowerRef)

      return (
        <div ref={focusRegion.containerRef}>
          <button ref={borrowerRef}>Borrower Button 1</button>
          <button>Borrower Button 2</button>
        </div>
      )
    }

    interface SpecComponentProps {
      showBorrower: boolean
      showParentButton2?: boolean
      useParentFallback?: boolean
    }

    function SpecComponent({
      showBorrower,
      showParentButton2 = true,
      useParentFallback = true,
    }: SpecComponentProps) {
      const focusRegion = useFocusRegion()

      const fallbackRef = useParentFallback ? focusRegion.fallbackRef : null

      return (
        <div ref={focusRegion.containerRef}>
          <button ref={fallbackRef}>Parent Button 1</button>
          {showParentButton2 && <button>Parent Button 2</button>}

          {showBorrower && <BorrowerRegion />}
        </div>
      )
    }

    it('moves focus to the borrowing element', () => {
      renderContent(<SpecComponent showBorrower={false} />)
      get('Parent Button 2').focus()

      renderContent(<SpecComponent showBorrower={true} />)

      expect(get('Borrower Button 1').focused).to.be.true
    })

    it('releases focus to the previously-active element in the parent', () => {
      renderContent(<SpecComponent showBorrower={false} />)
      get('Parent Button 2').focus()
      renderContent(<SpecComponent showBorrower={true} />)

      renderContent(<SpecComponent showBorrower={false} />)

      expect(get('Parent Button 2').focused).to.be.true
    })

    it('is not affected by changes to focus while in the borrower region', () => {
      renderContent(<SpecComponent showBorrower={false} />)
      get('Parent Button 2').focus()
      renderContent(<SpecComponent showBorrower={true} />)
      get('Borrower Button 2').focus()

      renderContent(<SpecComponent showBorrower={false} />)

      expect(get('Parent Button 2').focused).to.be.true
    })

    context('when the previously-focused element has been removed', () => {
      it('falls back to the parent focus fallback when assigned', () => {
        renderContent(
          <SpecComponent showBorrower={false} showParentButton2={true} useParentFallback={true} />,
        )
        get('Parent Button 2').focus()
        renderContent(
          <SpecComponent showBorrower={true} showParentButton2={true} useParentFallback={true} />,
        )

        renderContent(
          <SpecComponent showBorrower={false} showParentButton2={false} useParentFallback={true} />,
        )

        expect(get('Parent Button 1').focused).to.be.true
      })

      it('loses focus to the document body when no parent focus fallback was assigned', () => {
        renderContent(
          <SpecComponent showBorrower={false} showParentButton2={true} useParentFallback={false} />,
        )
        get('Parent Button 2').focus()
        renderContent(
          <SpecComponent showBorrower={true} showParentButton2={true} useParentFallback={false} />,
        )

        renderContent(
          <SpecComponent
            showBorrower={false}
            showParentButton2={false}
            useParentFallback={false}
          />,
        )

        expect(document.activeElement === document.body).to.be.true
      })
    })
  })

  context('when a portal outside the root focus borrows focus', () => {
    function BorrowerRegion() {
      const containerRef = useRef(null)

      if (containerRef.current == null) {
        containerRef.current = document.body.appendChild(document.createElement('div'))
      }

      useLayoutEffect(() => {
        return () => {
          containerRef.current.remove()
        }
      }, [])

      const focusRegion = useFocusRegion()
      const borrowerRef = useRef(null)

      focusRegion.useBorrowEffect(borrowerRef)

      const element = (
        <div ref={ref => focusRegion.containerRef(ref)}>
          <button ref={borrowerRef}>Borrower Button 1</button>
          <button>Borrower Button 2</button>
        </div>
      )

      return createPortal(element, containerRef.current)
    }

    interface SpecComponentProps {
      showBorrower: boolean
      showParentButton2?: boolean
      useParentFallback?: boolean
    }

    function SpecComponent({
      showBorrower,
      showParentButton2 = true,
      useParentFallback = true,
    }: SpecComponentProps) {
      const focusRegion = useFocusRegion()

      const fallbackRef = useParentFallback ? focusRegion.fallbackRef : null

      return (
        <div ref={focusRegion.containerRef}>
          <button ref={fallbackRef}>Parent Button 1</button>
          {showParentButton2 && <button>Parent Button 2</button>}

          {showBorrower && <BorrowerRegion />}
        </div>
      )
    }

    it('moves focus to the borrowing element', () => {
      renderContent(<SpecComponent showBorrower={false} />)
      get('Parent Button 2').focus()

      renderContent(<SpecComponent showBorrower={true} />)

      expect(get('Borrower Button 1').focused).to.be.true
    })

    it('releases focus to the previously-active element in the parent', () => {
      renderContent(<SpecComponent showBorrower={false} />)
      get('Parent Button 2').focus()
      renderContent(<SpecComponent showBorrower={true} />)

      renderContent(<SpecComponent showBorrower={false} />)

      expect(get('Parent Button 2').focused).to.be.true
    })

    it('is not affected by changes to focus while in the borrower region', () => {
      renderContent(<SpecComponent showBorrower={false} />)
      get('Parent Button 2').focus()
      renderContent(<SpecComponent showBorrower={true} />)
      // Force React to unset and reset the ref.
      renderContent(<SpecComponent showBorrower={true} />)

      get('Borrower Button 2').focus()

      renderContent(<SpecComponent showBorrower={false} />)

      expect(get('Parent Button 2').focused).to.be.true
    })
  })
})
