import {ButtonDriver, createContainer} from '@jneander/spec-utils-dom'
import {combineRefs} from '@jneander/utils-react'
import {render} from '@testing-library/react'
import {ReactNode, RefCallback} from 'react'

import {FocusProvider, useFocusRegion} from './context'

describe('Focus fallback', () => {
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
    return ButtonDriver.findWithText(buttonText, $container)
  }

  context('within one level of regions', () => {
    context('when the default focus ref has been applied', () => {
      it('moves focus to the default focus element', () => {
        function Region({showButton2}: {showButton2: boolean}) {
          const focusRegion = useFocusRegion()

          return (
            <div ref={focusRegion.containerRef}>
              <button ref={focusRegion.fallbackRef}>Button 1</button>
              {showButton2 && <button>Button 2</button>}
            </div>
          )
        }

        renderContent(<Region showButton2={true} />)
        get('Button 2').focus()

        renderContent(<Region showButton2={false} />)

        expect(get('Button 1').focused).to.be.true
      })
    })

    context('when the default focus ref has not been applied', () => {
      it('loses focus to the document body', () => {
        function Region({showButton2}: {showButton2: boolean}) {
          const focusRegion = useFocusRegion()

          return (
            <div ref={focusRegion.containerRef}>
              <button>Button 1</button>
              {showButton2 && <button>Button 2</button>}
            </div>
          )
        }

        renderContent(<Region showButton2={true} />)
        get('Button 2').focus()

        renderContent(<Region showButton2={false} />)

        expect(document.activeElement === document.body).to.be.true
      })
    })
  })

  context('within two levels of regions', () => {
    interface Props {
      children: ReactNode
      fallbackRef?: RefCallback<HTMLElement>
      name: string
    }

    function RegionWithFallback({children, fallbackRef, name}: Props) {
      const focusRegion = useFocusRegion()
      const containerRef = combineRefs(fallbackRef, focusRegion.containerRef)

      return (
        <div ref={containerRef}>
          <button ref={focusRegion.fallbackRef}>{`${name} Fallback Button`}</button>
          <button>{`Other ${name} Button`}</button>
          {children}
        </div>
      )
    }

    context('when a focused element in the child region is removed', () => {
      it('moves focus to the fallback focus element of the child region when assigned', () => {
        function ChildRegion({showButton2}: {showButton2: boolean}) {
          const focusRegion = useFocusRegion()

          return (
            <div ref={focusRegion.containerRef}>
              <button ref={focusRegion.fallbackRef}>Child Button 1</button>
              {showButton2 && <button>Child Button 2</button>}
            </div>
          )
        }

        renderContent(
          <RegionWithFallback name="Parent">
            <ChildRegion showButton2={true} />
          </RegionWithFallback>,
        )

        const button2 = ButtonDriver.findWithText('Child Button 2', $container)
        button2.focus()

        renderContent(
          <RegionWithFallback name="Parent">
            <ChildRegion showButton2={false} />
          </RegionWithFallback>,
        )

        const button1 = ButtonDriver.findWithText('Child Button 1', $container)
        expect(button1.focused).to.be.true
      })

      it('uses the parent fallback when the child does not have one', () => {
        function ParentRegion({children}: {children: ReactNode}) {
          const focusRegion = useFocusRegion()

          return (
            <div ref={focusRegion.containerRef}>
              <button ref={focusRegion.fallbackRef}>Parent Button 1</button>
              <button>Parent Button 2</button>
              {children}
            </div>
          )
        }

        function ChildRegion({showButton2}: {showButton2: boolean}) {
          const focusRegion = useFocusRegion()

          return (
            <div ref={focusRegion.containerRef}>
              <button>Child Button 1</button>
              {showButton2 && <button>Child Button 2</button>}
            </div>
          )
        }

        renderContent(
          <ParentRegion>
            <ChildRegion showButton2={true} />
          </ParentRegion>,
        )

        const button2 = ButtonDriver.findWithText('Child Button 2', $container)
        button2.focus()

        renderContent(
          <ParentRegion>
            <ChildRegion showButton2={false} />
          </ParentRegion>,
        )

        const button1 = ButtonDriver.findWithText('Parent Button 1', $container)
        expect(button1.focused).to.be.true
      })

      context('when the child region is the fallback of the parent region', () => {
        it('moves focus to the fallback focus element of the child region when assigned', () => {
          function ChildRegion({parentRef}: {parentRef: RefCallback<HTMLElement>}) {
            const focusRegion = useFocusRegion()
            const containerRef = combineRefs(focusRegion.containerRef, parentRef)

            return (
              <div ref={containerRef}>
                <button ref={focusRegion.fallbackRef}>Child Button 1</button>
                <button>Child Button 2</button>
              </div>
            )
          }

          function ParentRegion({showButton2}: {showButton2: boolean}) {
            const focusRegion = useFocusRegion()

            return (
              <div ref={focusRegion.containerRef}>
                <button>Parent Button 1</button>
                {showButton2 && <button>Parent Button 2</button>}

                <ChildRegion parentRef={focusRegion.fallbackRef} />
              </div>
            )
          }

          renderContent(<ParentRegion showButton2={true} />)

          const button2 = ButtonDriver.findWithText('Parent Button 2', $container)
          button2.focus()

          renderContent(<ParentRegion showButton2={false} />)

          const button1 = ButtonDriver.findWithText('Child Button 1', $container)
          expect(button1.focused).to.be.true
        })

        it('loses focus to the document body when the child has no fallback', () => {
          function ChildRegion({parentRef}: {parentRef: RefCallback<HTMLElement>}) {
            const focusRegion = useFocusRegion()
            const containerRef = combineRefs(focusRegion.containerRef, parentRef)

            return (
              <div ref={containerRef}>
                <button>Child Button 1</button>
                <button>Child Button 2</button>
              </div>
            )
          }

          function ParentRegion({showButton2}: {showButton2: boolean}) {
            const focusRegion = useFocusRegion()

            return (
              <div ref={focusRegion.containerRef}>
                <button>Parent Button 1</button>
                {showButton2 && <button>Parent Button 2</button>}

                <ChildRegion parentRef={focusRegion.fallbackRef} />
              </div>
            )
          }

          renderContent(<ParentRegion showButton2={true} />)

          const button2 = ButtonDriver.findWithText('Parent Button 2', $container)
          button2.focus()

          renderContent(<ParentRegion showButton2={false} />)

          expect(document.body === document.activeElement).to.be.true
        })
      })
    })
  })

  context('when using multiple fallbacks', () => {
    it('moves focus to the lowest-order fallback', () => {
      function Region({showOther}: {showOther: boolean}) {
        const focusRegion = useFocusRegion()

        return (
          <div ref={focusRegion.containerRef}>
            <button ref={focusRegion.fallbackRefs(1)}>Fallback 1</button>
            <button ref={focusRegion.fallbackRefs(2)}>Fallback 2</button>
            {showOther && <button>Other</button>}
          </div>
        )
      }

      renderContent(<Region showOther={true} />)
      get('Other').focus()

      renderContent(<Region showOther={false} />)

      expect(get('Fallback 1').focused).to.be.true
    })

    it('uses the next-lowest fallback when the lowest has been removed', () => {
      function Region({showFallback1, showOther}: {showFallback1: boolean; showOther: boolean}) {
        const focusRegion = useFocusRegion()

        return (
          <div ref={focusRegion.containerRef}>
            {showFallback1 && <button ref={focusRegion.fallbackRefs(1)}>Fallback 1</button>}
            <button ref={focusRegion.fallbackRefs(2)}>Fallback 2</button>
            {showOther && <button>Other</button>}
          </div>
        )
      }

      renderContent(<Region showFallback1={true} showOther={true} />)
      get('Other').focus()

      renderContent(<Region showFallback1={false} showOther={false} />)

      expect(get('Fallback 2').focused).to.be.true
    })

    it('loses focus to the document body when all fallback elements have been removed', () => {
      function Region({showButtons}: {showButtons: boolean}) {
        const focusRegion = useFocusRegion()

        return (
          <div ref={focusRegion.containerRef}>
            {showButtons && <button ref={focusRegion.fallbackRefs(1)}>Fallback 1</button>}
            {showButtons && <button ref={focusRegion.fallbackRefs(0)}>Fallback 2</button>}
            {showButtons && <button>Other</button>}
          </div>
        )
      }

      renderContent(<Region showButtons={true} />)
      get('Other').focus()

      renderContent(<Region showButtons={false} />)

      expect(document.activeElement === document.body).to.be.true
    })
  })
})
