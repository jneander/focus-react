import {useLayoutEffect} from 'react'

export default class FocusRegion {
  constructor(focus, options) {
    this._focus = focus
    this._options = options

    this._focusRegion = null
    this._fallbackRefs = []

    this.containerRef = this.containerRef.bind(this)
    this.fallbackRef = this.fallbackRef.bind(this)
  }

  containerRef(ref) {
    if (this._focusRegion == null) {
      this._focusRegion = this._focus.addRegion(ref, this._options)
    }

    this._focusRegion.setContainer(ref)
    this._fallbackRefs.forEach(({fallbackOrder, ref}) => {
      this._focusRegion.setFallback(ref, {fallbackOrder})
    })
  }

  fallbackRef(ref) {
    this.fallbackRefs(0)(ref)
  }

  fallbackRefs(fallbackOrder) {
    return ref => {
      this._fallbackRefs = this._fallbackRefs.filter(ref => ref.fallbackOrder !== fallbackOrder)
      this._fallbackRefs.push({fallbackOrder, ref})
      if (this._focusRegion != null) {
        this._focusRegion.setFallback(ref, {fallbackOrder})
      }
    }
  }

  useBorrowEffect(ref) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => {
      if (ref.current) {
        this._focusRegion.borrowFocus(ref.current)

        return () => {
          this._focusRegion.releaseFocus()
        }
      }
      // TODO: revisit the use of this ref to avoid hook-related misbehavior
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref.current])
  }

  borrowFocus(ref) {
    this._focusRegion.borrowFocus(ref.current)
  }

  releaseFocus() {
    this._focusRegion.releaseFocus()
  }

  remove() {
    if (this._focusRegion) {
      this._focusRegion.remove()
    }
  }

  reconcile() {
    if (this._focusRegion) {
      this._focusRegion.reconcile()
    }
  }
}
