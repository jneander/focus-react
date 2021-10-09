import React from 'react'
import {createContainer, ButtonDriver} from '@jneander/spec-utils-dom'
import {render} from '@jneander/spec-utils-react'
import {combineRefs} from '@jneander/utils-react'

import {FocusProvider, useFocusRegion} from '.'

describe('Focus fallback', () => {
  let $container
  let component

  beforeEach(() => {
    $container = createContainer()
    component = null
  })

  afterEach(() => {
    component.unmount()
    $container.remove()
  })

  async function renderContent(content) {
    const element = <FocusProvider>{content}</FocusProvider>

    component = await render(element, {$container})
  }

  async function waitForReconciliation() {
    await new Promise(requestAnimationFrame)
  }

  function get(buttonText) {
    return ButtonDriver.findWithText(buttonText, $container)
  }

  context('within one level of regions', () => {
    context('when the default focus ref has been applied', () => {
      it('moves focus to the default focus element', async () => {
        function Region({showButton2}) {
          const focusRegion = useFocusRegion()

          return (
            <div ref={focusRegion.containerRef}>
              <button ref={focusRegion.fallbackRef}>Button 1</button>
              {showButton2 && <button>Button 2</button>}
            </div>
          )
        }

        await renderContent(<Region showButton2={true} />)
        get('Button 2').focus()

        await renderContent(<Region showButton2={false} />)
        await waitForReconciliation()

        expect(get('Button 1').focused).to.be.true
      })
    })

    context('when the default focus ref has not been applied', () => {
      it('loses focus to the document body', async () => {
        function Region({showButton2}) {
          const focusRegion = useFocusRegion()

          return (
            <div ref={focusRegion.containerRef}>
              <button>Button 1</button>
              {showButton2 && <button>Button 2</button>}
            </div>
          )
        }

        await renderContent(<Region showButton2={true} />)
        get('Button 2').focus()

        await renderContent(<Region showButton2={false} />)
        await waitForReconciliation()

        expect(document.activeElement === document.body).to.be.true
      })
    })
  })

  context('within two levels of regions', () => {
    function RegionWithFallback({children, fallbackRef, name}) {
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
      it('moves focus to the fallback focus element of the child region when assigned', async () => {
        function ChildRegion({showButton2}) {
          const focusRegion = useFocusRegion()

          return (
            <div ref={focusRegion.containerRef}>
              <button ref={focusRegion.fallbackRef}>Child Button 1</button>
              {showButton2 && <button>Child Button 2</button>}
            </div>
          )
        }

        await renderContent(
          <RegionWithFallback name="Parent">
            <ChildRegion showButton2={true} />
          </RegionWithFallback>
        )

        const button2 = ButtonDriver.findWithText('Child Button 2', $container)
        button2.focus()

        await renderContent(
          <RegionWithFallback name="Parent">
            <ChildRegion showButton2={false} />
          </RegionWithFallback>
        )
        await waitForReconciliation()

        const button1 = ButtonDriver.findWithText('Child Button 1', $container)
        expect(button1.focused).to.be.true
      })

      it('uses the parent fallback when the child does not have one', async () => {
        function ParentRegion({children}) {
          const focusRegion = useFocusRegion()

          return (
            <div ref={focusRegion.containerRef}>
              <button ref={focusRegion.fallbackRef}>Parent Button 1</button>
              <button>Parent Button 2</button>
              {children}
            </div>
          )
        }

        function ChildRegion({showButton2}) {
          const focusRegion = useFocusRegion()

          return (
            <div ref={focusRegion.containerRef}>
              <button>Child Button 1</button>
              {showButton2 && <button>Child Button 2</button>}
            </div>
          )
        }

        await renderContent(
          <ParentRegion>
            <ChildRegion showButton2={true} />
          </ParentRegion>
        )

        const button2 = ButtonDriver.findWithText('Child Button 2', $container)
        button2.focus()

        await renderContent(
          <ParentRegion>
            <ChildRegion showButton2={false} />
          </ParentRegion>
        )
        await waitForReconciliation()

        const button1 = ButtonDriver.findWithText('Parent Button 1', $container)
        expect(button1.focused).to.be.true
      })

      context('when the child region is the fallback of the parent region', () => {
        it('moves focus to the fallback focus element of the child region when assigned', async () => {
          function ChildRegion({parentRef}) {
            const focusRegion = useFocusRegion()
            const containerRef = combineRefs(focusRegion.containerRef, parentRef)

            return (
              <div ref={containerRef}>
                <button ref={focusRegion.fallbackRef}>Child Button 1</button>
                <button>Child Button 2</button>
              </div>
            )
          }

          function ParentRegion({showButton2}) {
            const focusRegion = useFocusRegion()

            return (
              <div ref={focusRegion.containerRef}>
                <button>Parent Button 1</button>
                {showButton2 && <button>Parent Button 2</button>}

                <ChildRegion parentRef={focusRegion.fallbackRef} />
              </div>
            )
          }

          await renderContent(
            <ParentRegion showButton2={true}>
              <ChildRegion />
            </ParentRegion>
          )

          const button2 = ButtonDriver.findWithText('Parent Button 2', $container)
          button2.focus()

          await renderContent(
            <ParentRegion showButton2={false}>
              <ChildRegion />
            </ParentRegion>
          )
          await waitForReconciliation()

          const button1 = ButtonDriver.findWithText('Child Button 1', $container)
          expect(button1.focused).to.be.true
        })

        it('loses focus to the document body when the child has no fallback', async () => {
          function ChildRegion({parentRef}) {
            const focusRegion = useFocusRegion()
            const containerRef = combineRefs(focusRegion.containerRef, parentRef)

            return (
              <div ref={containerRef}>
                <button>Child Button 1</button>
                <button>Child Button 2</button>
              </div>
            )
          }

          function ParentRegion({showButton2}) {
            const focusRegion = useFocusRegion()

            return (
              <div ref={focusRegion.containerRef}>
                <button>Parent Button 1</button>
                {showButton2 && <button>Parent Button 2</button>}

                <ChildRegion parentRef={focusRegion.fallbackRef} />
              </div>
            )
          }

          await renderContent(
            <ParentRegion showButton2={true}>
              <ChildRegion />
            </ParentRegion>
          )

          const button2 = ButtonDriver.findWithText('Parent Button 2', $container)
          button2.focus()

          await renderContent(
            <ParentRegion showButton2={false}>
              <ChildRegion />
            </ParentRegion>
          )
          await waitForReconciliation()

          expect(document.body === document.activeElement).to.be.true
        })
      })
    })
  })

  context('when using multiple fallbacks', () => {
    it('moves focus to the lowest-order fallback', async () => {
      function Region({showOther}) {
        const focusRegion = useFocusRegion()

        return (
          <div ref={focusRegion.containerRef}>
            <button ref={focusRegion.fallbackRefs(1)}>Fallback 1</button>
            <button ref={focusRegion.fallbackRefs(2)}>Fallback 2</button>
            {showOther && <button>Other</button>}
          </div>
        )
      }

      await renderContent(<Region showOther={true} />)
      get('Other').focus()

      await renderContent(<Region showOther={false} />)
      await waitForReconciliation()

      expect(get('Fallback 1').focused).to.be.true
    })

    it('uses the next-lowest fallback when the lowest has been removed', async () => {
      function Region({showFallback1, showOther}) {
        const focusRegion = useFocusRegion()

        return (
          <div ref={focusRegion.containerRef}>
            {showFallback1 && <button ref={focusRegion.fallbackRefs(1)}>Fallback 1</button>}
            <button ref={focusRegion.fallbackRefs(2)}>Fallback 2</button>
            {showOther && <button>Other</button>}
          </div>
        )
      }

      await renderContent(<Region showFallback1={true} showOther={true} />)
      get('Other').focus()

      await renderContent(<Region showFallback1={false} showOther={false} />)
      await waitForReconciliation()

      expect(get('Fallback 2').focused).to.be.true
    })

    it('loses focus to the document body when all fallback elements have been removed', async () => {
      function Region({showButtons}) {
        const focusRegion = useFocusRegion()

        return (
          <div ref={focusRegion.containerRef}>
            {showButtons && <button ref={focusRegion.fallbackRefs(1)}>Fallback 1</button>}
            {showButtons && <button ref={focusRegion.fallbackRefs(0)}>Fallback 2</button>}
            {showButtons && <button>Other</button>}
          </div>
        )
      }

      await renderContent(<Region showButtons={true} />)
      get('Other').focus()

      await renderContent(<Region showButtons={false} />)
      await waitForReconciliation()

      expect(document.activeElement === document.body).to.be.true
    })
  })
})
